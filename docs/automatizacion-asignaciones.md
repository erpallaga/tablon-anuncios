# Automatización de notificaciones de asignaciones

Propuesta de arquitectura para detectar automáticamente las asignaciones de cada usuario
cuando se sube un nuevo cuadrante (PDF o JPG) y notificarle por email con evento de calendario.

## Alcance acordado (v1)

| Decisión | Elección |
|---|---|
| Formato de documento | Cuadrante mensual RSC ("Reuniones para el Servicio del Campo"), en PDF **y** fotografía JPG |
| Destinatarios | Solo usuarios registrados en la app (tabla `profiles`) |
| Canal de notificación | Email con adjunto `.ics` (el usuario lo añade a su calendario con un clic) |
| Revisión humana | Automático **con validaciones**: solo se notifica si todas las comprobaciones deterministas pasan; si algo no cuadra, se marca para revisión y se avisa al editor |
| Coste objetivo | ~0 €/mes: Supabase free tier + Resend free tier + ~0,03 $ por documento de API de Anthropic |

Fuera de alcance en v1: otros formatos de cuadrante (acomodadores, limpieza…), evento directo
en Google Calendar (requiere OAuth por usuario), UI de revisión completa en el panel de admin
(en v1 basta un email al editor cuando algo necesita revisión).

## Por qué fallaban los intentos anteriores

El PDF de referencia (`RSC_SLC_Julio_26_v0.pdf`) tiene capa de texto, pero la extracción plana
destruye la geometría de la tabla: salen primero todas las horas y después los bloques de
lugar+nombre desordenados. Un LLM al que se le pregunta "¿aparece Fulano y qué días?" sobre ese
texto tiene que adivinar la correspondencia celda↔fecha, y ahí alucina.

La solución no es un modelo más grande, sino acotar lo que hace el LLM y hacer determinista todo lo demás:

1. **Visión, no texto**: el modelo ve el documento renderizado como imagen (la API de Anthropic
   hace esto de forma nativa con PDFs, y las fotos JPG entran igual). La estructura visual de la
   tabla se conserva.
2. **Extracción completa, no búsqueda**: se le pide extraer *todo* el cuadrante a JSON, no buscar
   un nombre. Extraer la tabla entera es una tarea perceptual mucho más fiable.
3. **Vocabulario cerrado**: el esquema JSON estricto (structured outputs) restringe el campo de
   nombre a un `enum` construido con el roster real de la congregación. El modelo no puede
   inventar un nombre.
4. **Doble pasada con dos modelos distintos** (Haiku 4.5 + Sonnet 4.6 por defecto): solo las
   asignaciones idénticas en ambas se dan por buenas. Se usan modelos *diferentes* a propósito:
   un mismo modelo puede repetir el mismo sesgo de lectura en dos pasadas (p. ej. desplazar toda
   la tabla una columna, un error internamente coherente que la validación fecha↔día no puede
   detectar); dos modelos distintos no comparten sesgos, así que su coincidencia celda a celda
   es evidencia fuerte. Donde discrepan → revisión, nunca notificación.
5. **Matching y validación en código**: la correspondencia nombre→usuario→email y todas las
   comprobaciones (fechas, días de semana, duplicados) se hacen en TypeScript, no en el LLM.

## Arquitectura

```
Editor sube PDF/JPG (flujo actual: bucket `pdfs` + INSERT en grid_items)
        │
        ▼
Database Webhook de Supabase (INSERT en grid_items)
        │
        ▼
Edge Function `extract-assignments`
        │
        ├─ 1. Descarga el archivo del bucket
        ├─ 2. Carga el roster: profiles activos (display_name + aliases)
        ├─ 3. Llama a la API de Anthropic (visión + structured outputs) — 2 pasadas
        ├─ 4. Valida: coincidencia entre pasadas, fechas, días de semana, roster
        ├─ 5. Persiste en tabla `extracted_assignments`
        │
        ├─ 6a. Todo OK → email por usuario vía Resend con .ics adjunto
        └─ 6b. Algo falla → estado needs_review + email al editor
```

### Componentes

**1. Trigger — Database Webhook**
Webhook de Supabase sobre `INSERT` en `grid_items` que invoca la Edge Function. No requiere
cambios en el frontend: el flujo de subida actual ya crea la fila. Un campo opcional
`extract_assignments boolean` en `grid_items` (checkbox en `GridItemForm`) permite al editor
marcar qué documentos son cuadrantes y evitar gastar llamadas en documentos que no lo son.

**2. Edge Function `supabase/functions/extract-assignments/`**
Deno, misma estructura que `invite-user`. Secrets necesarios: `ANTHROPIC_API_KEY`,
`RESEND_API_KEY` (via `supabase secrets set`).

**3. Llamada al LLM**
- Modelos: pasada A `claude-haiku-4-5` (1 $/M entrada, 5 $/M salida) y pasada B
  `claude-sonnet-4-6` (3 $/M entrada, 15 $/M salida). Un cuadrante ≈ 5K tokens de entrada
  + 2K de salida ⇒ ~0,015 $ (Haiku) + ~0,045 $ (Sonnet) ≈ **0,06 $ por documento**.
  Ambos modelos son configurables por variable de entorno; deben ser distintos entre sí
  para que la verificación cruzada sea real.
- Entrada: bloque `document` (PDF base64) o `image` (JPG base64) + prompt con mes/año esperados.
- Salida forzada con `output_config.format` (json_schema estricto):

```jsonc
{
  "month": 7, "year": 2026,
  "assignments": [
    {
      "date": 4,                    // día del mes
      "time": "10:00",
      "location": "SR Violant d'Hongria",
      "name_literal": "Eric Pallarés",   // texto tal cual se lee en el documento
      "name_roster": "Eric Pallarés",    // enum: [nombres del roster] + "NO_ROSTER"
      "cancelled": false
    }
  ]
}
```

El doble campo de nombre es deliberado: `name_roster` está restringido por enum (no puede
alucinar), y `name_literal` captura lo que realmente se ve. Si en código la normalización de
`name_literal` (minúsculas, sin acentos) no coincide con `name_roster`, la asignación pasa a
revisión en vez de notificarse.

**4. Validaciones deterministas (en código, bloquean el envío)**
- Las dos pasadas producen conjuntos de asignaciones idénticos (la validación principal).
- `month`/`year` coinciden con lo esperado (del título del documento o del formulario).
- Toda fecha existe en ese mes y su posición en la tabla es coherente con el día de la semana.
- `name_literal` ≈ `name_roster` tras normalizar.
- Sin duplicados exactos (misma fecha+hora+nombre).
- Las celdas "Se cancela" no generan asignación.

Resultado por asignación en `extracted_assignments.status`:
`validated` → se notifica; `needs_review` → email al editor con el detalle de qué falló.

**5. Notificación — Resend + .ics**
- Un email por usuario y documento, con todas sus asignaciones del mes y un único `.ics` adjunto
  con un `VEVENT` por asignación (título, fecha, hora, lugar). El `.ics` se genera como texto
  plano en la propia función, sin dependencias.
- Resend free tier: 3.000 emails/mes, 100/día — de sobra. Requiere verificar un dominio propio
  o usar el dominio de pruebas de Resend.
- Idempotencia: `extracted_assignments.notified_at` evita reenvíos si el webhook se re-dispara
  (p. ej. al editar el grid item). Se recomienda disparar solo en INSERT, no en UPDATE.

### Cambios de base de datos

```sql
-- Alias para el matching de nombres (el nombre en el cuadrante puede no
-- coincidir con display_name: "Javi" vs "Javier", segundos apellidos, etc.)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

ALTER TABLE grid_items ADD COLUMN IF NOT EXISTS extract_assignments BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS extracted_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_item_id UUID REFERENCES grid_items(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  assignment_date DATE NOT NULL,
  assignment_time TEXT NOT NULL,
  location TEXT,
  name_literal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | validated | needs_review | notified
  review_reason TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Por qué no n8n / Zapier

- **n8n self-hosted** necesita un servidor encendido 24/7 (coste) y mantenimiento; n8n Cloud
  parte de ~20 €/mes. **Zapier** free se queda en 100 tareas/mes y los pasos de IA consumen
  tareas extra.
- El trigger natural (subida a Supabase) ya vive en Supabase, y las Edge Functions del free tier
  (500K invocaciones/mes) cubren esto sin infraestructura nueva. Añadir un orquestador externo
  solo añadiría coste y un punto más de fallo.

## Estimación de coste mensual

| Concepto | Coste |
|---|---|
| Supabase (Edge Function + webhook + tabla) | 0 € (free tier actual) |
| Resend (emails) | 0 € (≪ 3.000/mes) |
| API Anthropic (Haiku + Sonnet, doble pasada, ~5-10 docs/mes) | ~0,30–0,60 $ |
| **Total** | **< 1 $/mes** |

## Fases de implementación

1. **Fase 1 (v1, este documento)**: migración SQL + Edge Function `extract-assignments` +
   webhook + emails con .ics. Gestión de aliases por SQL directo.
2. **Fase 2**: en el AdminPanel, editor de aliases en `UsersPanel` y vista de asignaciones
   extraídas con botón "reenviar" / "aprobar los needs_review".
3. **Fase 3**: soporte de más formatos de cuadrante — un "perfil de extracción" por tipo de
   documento (prompt + esquema + validaciones propios), seleccionable al subir el archivo.

## Despliegue (Fase 1)

La Fase 1 está implementada en este repositorio:

- `supabase-assignments-setup.sql` — migración (columnas `profiles.aliases` y
  `grid_items.extract_assignments`, tabla `extracted_assignments` con RLS).
- `supabase/functions/extract-assignments/` — Edge Function completa.
- Frontend — checkbox "📅 Cuadrante RSC de asignaciones" al crear un elemento.

Pasos para activarla:

1. **Migración SQL**: ejecutar `supabase-assignments-setup.sql` en el SQL Editor de Supabase.

2. **Secrets de la función**:
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase secrets set RESEND_API_KEY=re_...
   supabase secrets set WEBHOOK_SECRET=<cadena aleatoria larga>
   # Opcionales:
   # supabase secrets set ANTHROPIC_MODEL_PASS_A=claude-haiku-4-5
   # supabase secrets set ANTHROPIC_MODEL_PASS_B=claude-sonnet-4-6
   # supabase secrets set RESEND_FROM="Tablón <avisos@tudominio.com>"
   # supabase secrets set ASSIGNMENT_DURATION_MINUTES=60
   ```
   La API key de Anthropic se crea en console.anthropic.com (requiere cargar un
   mínimo de saldo; el consumo real será de céntimos). La de Resend en resend.com
   (gratis hasta 3.000 emails/mes; para enviar a cualquier destinatario hay que
   verificar un dominio propio — con el dominio de pruebas solo se puede enviar
   al propio email de la cuenta).

3. **Desplegar la función**:
   ```bash
   supabase functions deploy extract-assignments --no-verify-jwt
   ```
   (`--no-verify-jwt` porque la llama el webhook, no un usuario; la protección
   es el header `x-webhook-secret`.)

4. **Crear el webhook**: en el panel de Supabase → Database → Webhooks → Create:
   - Tabla: `grid_items`, evento: **solo INSERT**
   - Tipo: HTTP Request, método POST
   - URL: `https://<project>.supabase.co/functions/v1/extract-assignments`
   - Headers: `x-webhook-secret: <el mismo WEBHOOK_SECRET>`
   - Timeout: el máximo disponible (la extracción con doble pasada tarda 20-60 s).

5. **Alias de usuarios** (opcional pero recomendado): si el nombre que aparece en
   los cuadrantes no coincide con el `display_name` del usuario, añadir alias:
   ```sql
   UPDATE profiles SET aliases = ARRAY['Javi Gavidia']
   WHERE display_name = 'Javier Gavidia';
   ```

6. **Prueba con verdad conocida (obligatoria antes de confiar en el sistema)**:
   subir un cuadrante cuyas asignaciones se conozcan con certeza (p. ej. el del mes
   en curso) y comparar fila a fila la tabla `extracted_assignments` con el documento
   real — no solo las propias asignaciones, todas. Repetir con una foto JPG del mismo
   cuadrante. Solo activar el flujo para la congregación cuando la extracción cuadre
   al 100 % en estas pruebas. Los logs de la función están en Supabase →
   Edge Functions → extract-assignments → Logs.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Desplazamiento sistemático de columna (asociar un nombre al día contiguo, error internamente coherente) | Doble pasada con **dos modelos distintos**: un sesgo de lectura tendría que repetirse igual en dos modelos independientes. Discrepancia → `needs_review` |
| Foto JPG torcida/con sombras reduce la fiabilidad | La doble pasada + enum del roster convierten los errores en `needs_review`, nunca en notificaciones falsas |
| Dos personas con el mismo nombre en el roster | El matching exige unicidad; si un nombre del roster es ambiguo → `needs_review` |
| Cambio de maquetación del cuadrante en el futuro | Las validaciones (recuento, fechas) fallan en bloque → aviso al editor, no notificaciones erróneas |
| Webhook re-disparado / documento re-subido | Idempotencia por `grid_item_id` + `notified_at` |
