// Edge Function: extract-assignments
//
// Disparada por un Database Webhook (INSERT en grid_items). Si el elemento está
// marcado como cuadrante RSC (extract_assignments = true), extrae las asignaciones
// del PDF/imagen con la API de Anthropic (visión + structured outputs, doble pasada),
// valida el resultado de forma determinista y notifica por email (Resend) con un
// .ics adjunto a cada usuario registrado con asignaciones.
//
// Ver docs/automatizacion-asignaciones.md para la arquitectura completa.
//
// Secrets requeridos (supabase secrets set):
//   ANTHROPIC_API_KEY
//   BREVO_API_KEY (o RESEND_API_KEY; si están ambos, se usa Brevo)
//   EMAIL_FROM (remitente; en Brevo debe ser una dirección verificada como
//     "sender" en la cuenta — puede ser un Gmail personal, sin dominio propio)
// Opcionales:
//   EMAIL_FROM_NAME (default: "Tablón de Anuncios")
//   ANTHROPIC_MODEL_PASS_A (default: claude-haiku-4-5)
//   ANTHROPIC_MODEL_PASS_B (default: claude-sonnet-4-6; debe ser un modelo
//     DISTINTO al de la pasada A para que los sesgos de lectura sean independientes)
//   WEBHOOK_SECRET (si se define, el webhook debe enviar el header x-webhook-secret)
//   ASSIGNMENT_DURATION_MINUTES (default: 60)
//   NOTIFICATION_ALLOWLIST (emails separados por comas; si se define, solo esos
//     usuarios reciben notificaciones — modo beta. La extracción y la tabla
//     extracted_assignments se completan igualmente para todos.)

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const SPANISH_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const SPANISH_WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

interface Profile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  aliases: string[];
}

interface ExtractedEntry {
  date: number;
  weekday: string;
  time: string;
  location: string;
  name_literal: string;
  name_roster: string;
  cancelled: boolean;
}

interface Extraction {
  month: number;
  year: number;
  assignments: ExtractedEntry[];
}

interface AssignmentRow {
  grid_item_id: string;
  profile_id: string | null;
  assignment_date: string;
  assignment_time: string;
  location: string | null;
  name_literal: string;
  status: 'validated' | 'needs_review' | 'unmatched';
  review_reason: string | null;
}

// Normaliza nombres para comparación: minúsculas, sin acentos, espacios colapsados
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTime(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})[:.](\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

// Identidad de una asignación entre pasadas: fecha + hora + nombre. El lugar se
// compara aparte: una discrepancia de lugar no invalida la asignación (persona y
// fecha verificadas), solo deja el lugar sin confirmar.
function entryKey(e: ExtractedEntry): string {
  return [e.date, normalizeTime(e.time) ?? e.time, normalize(e.name_literal)].join('|');
}

// Distancia de edición (Levenshtein) para asimilar erratas de nombres:
// "Erik Pallares" / "Eric Pelleres" → "Eric Pallarés"
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return m + n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[n];
}

function buildSchema(rosterNames: string[]) {
  return {
    type: 'object',
    properties: {
      month: { type: 'integer', description: 'Mes del cuadrante (1-12)' },
      year: { type: 'integer', description: 'Año del cuadrante, p. ej. 2026' },
      assignments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            date: { type: 'integer', description: 'Día del mes (1-31)' },
            weekday: {
              type: 'string',
              enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
              description: 'Columna del calendario en la que está la celda',
            },
            time: { type: 'string', description: 'Hora de la reunión, formato HH:MM' },
            location: { type: 'string', description: 'Lugar de la reunión tal como aparece' },
            name_literal: {
              type: 'string',
              description: 'Nombre del conductor exactamente como se lee en el documento',
            },
            name_roster: {
              type: 'string',
              enum: [...rosterNames, 'NO_ROSTER'],
              description: 'El nombre de la lista que corresponde al conductor, o NO_ROSTER si ninguno corresponde claramente',
            },
            cancelled: {
              type: 'boolean',
              description: 'true si la celda indica "Se cancela" (sin conductor)',
            },
          },
          required: ['date', 'weekday', 'time', 'location', 'name_literal', 'name_roster', 'cancelled'],
          additionalProperties: false,
        },
      },
    },
    required: ['month', 'year', 'assignments'],
    additionalProperties: false,
  };
}

const EXTRACTION_PROMPT = `Este documento es un cuadrante mensual de "Reuniones para el Servicio del Campo" (RSC) de una congregación. Es un calendario mensual en forma de tabla: las columnas son los días de la semana (lunes a domingo) y cada celda es un día del mes. Dentro de cada celda del día puede haber una o varias reuniones; cada reunión tiene una hora (p. ej. 10:00, 17:00), un lugar (p. ej. "SR Violant d'Hongria", "Plaça Prat de la Riba", "Zoom") y el nombre del conductor asignado.

Extrae TODAS las reuniones del mes, celda por celda, fila por fila. Para cada reunión:
- Lee la hora, el lugar y el nombre del conductor que aparecen juntos en esa celda.
- name_literal es el nombre EXACTAMENTE como está escrito.
- name_roster es el nombre equivalente de la lista permitida; si ninguno corresponde con claridad, usa NO_ROSTER. No adivines.
- Si una reunión aparece como "Se cancela", inclúyela con cancelled=true y name_literal vacío.

Método de trabajo, síguelo estrictamente:
1. Localiza la cuadrícula del calendario y sus columnas (lunes a domingo).
2. Recorre las semanas fila por fila y, dentro de cada semana, las celdas columna por columna.
3. Para cada celda, determina el día del mes por el NÚMERO escrito en esa celda (no por conteo), y el día de la semana por la COLUMNA en la que está. Ambos deben ser coherentes; si no lo son, revisa tu lectura de esa celda antes de continuar.
4. Asocia cada hora/lugar/conductor únicamente con el contenido de SU celda. No arrastres nombres de celdas vecinas.
5. Con el LUGAR, cópialo letra a letra de la celda. NO asumas que es el lugar más frecuente del cuadrante: algunas reuniones se celebran en lugares distintos al habitual y es un error grave uniformarlos.

Sé exhaustivo: no omitas ninguna reunión ni inventes ninguna. Si una celda no tiene reuniones, no produzcas nada para ella.`;

async function extractOnce(
  anthropic: Anthropic,
  model: string,
  fileBlock: Record<string, unknown>,
  rosterNames: string[],
): Promise<Extraction> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 16000,
    output_config: {
      format: { type: 'json_schema', schema: buildSchema(rosterNames) },
    },
    messages: [
      {
        role: 'user',
        content: [fileBlock, { type: 'text', text: EXTRACTION_PROMPT }] as never,
      },
    ],
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error('La extracción superó el límite de tokens de salida');
  }
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('La respuesta del modelo no contiene texto');
  }
  return JSON.parse(textBlock.text) as Extraction;
}

// Genera un calendario .ics con un evento por asignación (hora local flotante)
function buildIcs(
  assignments: { date: string; time: string; location: string | null }[],
  durationMinutes: number,
): string {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tablon de Anuncios//Asignaciones RSC//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const a of assignments) {
    const [h, m] = a.time.split(':').map(Number);
    const start = a.date.replace(/-/g, '') + 'T' + `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    const endMinutes = h * 60 + m + durationMinutes;
    const end = a.date.replace(/-/g, '') + 'T' +
      `${String(Math.floor(endMinutes / 60) % 24).padStart(2, '0')}${String(endMinutes % 60).padStart(2, '0')}00`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${crypto.randomUUID()}@tablon-anuncios`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'SUMMARY:Reunión para el servicio del campo (conductor)',
      ...(a.location ? [`LOCATION:${esc(a.location)}`] : []),
      'DESCRIPTION:Asignación como conductor de la reunión para el servicio del campo.',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

type SendEmail = (
  to: string,
  subject: string,
  html: string,
  icsContent?: string,
  icsFilename?: string,
) => Promise<void>;

// Proveedor de email: Brevo (gratis, sin dominio propio — basta verificar la
// dirección remitente en la cuenta) o Resend (requiere dominio verificado para
// enviar a terceros). Si ambos secrets existen, se usa Brevo.
function makeSendEmail(): SendEmail {
  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('EMAIL_FROM');
  const fromName = Deno.env.get('EMAIL_FROM_NAME') ?? 'Tablón de Anuncios';

  if (brevoKey) {
    if (!fromEmail) throw new Error('Con BREVO_API_KEY es obligatorio definir EMAIL_FROM (remitente verificado en Brevo)');
    return async (to, subject, html, icsContent, icsFilename) => {
      const body: Record<string, unknown> = {
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      };
      if (icsContent && icsFilename) {
        body.attachment = [{ name: icsFilename, content: encodeBase64(new TextEncoder().encode(icsContent)) }];
      }
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
    };
  }

  if (resendKey) {
    const from = fromEmail ? `${fromName} <${fromEmail}>` : 'Tablón de Anuncios <onboarding@resend.dev>';
    return async (to, subject, html, icsContent, icsFilename) => {
      const body: Record<string, unknown> = { from, to: [to], subject, html };
      if (icsContent && icsFilename) {
        body.attachments = [{ filename: icsFilename, content: encodeBase64(new TextEncoder().encode(icsContent)) }];
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    };
  }

  throw new Error('Falta BREVO_API_KEY o RESEND_API_KEY');
}

// Supabase expone EdgeRuntime.waitUntil para seguir ejecutando después de
// responder. Es imprescindible aquí: el Database Webhook corta la conexión a
// los pocos segundos, pero la doble pasada del LLM + emails tarda 20-60 s.
declare const EdgeRuntime: { waitUntil?: (p: Promise<unknown>) => void } | undefined;

Deno.serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    if (webhookSecret && req.headers.get('x-webhook-secret') !== webhookSecret) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const payload = await req.json();
    const record = payload?.record;
    if (payload?.type !== 'INSERT' || payload?.table !== 'grid_items' || !record) {
      return new Response(JSON.stringify({ skipped: 'evento no aplicable' }), { status: 200 });
    }
    if (record.extract_assignments !== true) {
      return new Response(JSON.stringify({ skipped: 'extract_assignments=false' }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Idempotencia: si ya hay resultados para este documento, no repetir
    const { data: existing } = await supabase
      .from('extracted_assignments')
      .select('id')
      .eq('grid_item_id', record.id)
      .limit(1);
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ skipped: 'ya procesado' }), { status: 200 });
    }

    // Responder ya al webhook y procesar en segundo plano
    const task = processRecord(supabase, record).catch((err) => {
      console.error('extract-assignments error en segundo plano:', err);
    });
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(task);
    } else {
      await task; // ejecución local sin EdgeRuntime
    }
    return new Response(JSON.stringify({ accepted: true, grid_item_id: record.id }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('extract-assignments error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

// deno-lint-ignore no-explicit-any
type AnyRow = Record<string, any>;

async function processRecord(
  // Sin tipos generados de la BD, el cliente se usa sin genéricos
  // deno-lint-ignore no-explicit-any
  supabase: any,
  record: AnyRow,
): Promise<void> {
    // ── Roster de usuarios registrados ──────────────────────────────────────
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, aliases')
      .eq('is_active', true);
    if (profilesError) throw profilesError;

    const roster = (profiles ?? []) as Profile[];
    // Cada display_name y cada alias es un nombre válido del enum; en código se
    // resuelve a su perfil. Nombres normalizados ambiguos se marcan para revisión.
    const nameToProfiles = new Map<string, Set<string>>();
    const rosterNames: string[] = [];
    for (const p of roster) {
      for (const name of [p.display_name, ...(p.aliases ?? [])]) {
        if (!name?.trim()) continue;
        rosterNames.push(name);
        const key = normalize(name);
        if (!nameToProfiles.has(key)) nameToProfiles.set(key, new Set());
        nameToProfiles.get(key)!.add(p.id);
      }
    }
    if (rosterNames.length === 0) {
      console.warn('extract-assignments: no hay perfiles activos en el roster');
      return;
    }

    // ── Descarga del archivo ────────────────────────────────────────────────
    const fileRes = await fetch(record.pdf_url);
    if (!fileRes.ok) throw new Error(`No se pudo descargar el archivo (${fileRes.status})`);
    const contentType = fileRes.headers.get('content-type') ?? '';
    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    if (fileBytes.byteLength > 25 * 1024 * 1024) throw new Error('Archivo demasiado grande (>25MB)');
    const fileB64 = encodeBase64(fileBytes);

    let fileBlock: Record<string, unknown>;
    const isPdf = record.file_type === 'pdf' || contentType.includes('pdf') || record.pdf_url.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      fileBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileB64 } };
    } else {
      const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const mediaType = supported.find((t) => contentType.includes(t.split('/')[1]))
        ?? (record.pdf_url.toLowerCase().match(/\.jpe?g($|\?)/) ? 'image/jpeg'
          : record.pdf_url.toLowerCase().match(/\.png($|\?)/) ? 'image/png'
          : record.pdf_url.toLowerCase().match(/\.webp($|\?)/) ? 'image/webp'
          : null);
      if (!mediaType) throw new Error(`Tipo de imagen no soportado para análisis: ${contentType}`);
      fileBlock = { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileB64 } };
    }

    // ── Doble pasada de extracción con DOS MODELOS DISTINTOS ────────────────
    // Un mismo modelo puede repetir el mismo sesgo de lectura en las dos pasadas
    // (p. ej. desplazar una columna toda la tabla, un error internamente coherente
    // que la validación fecha↔día no puede detectar). Dos modelos diferentes no
    // comparten sesgos: solo se valida lo que ambos leen igual, celda a celda.
    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const modelA = Deno.env.get('ANTHROPIC_MODEL_PASS_A')
      ?? Deno.env.get('ANTHROPIC_MODEL')
      ?? 'claude-haiku-4-5';
    const modelB = Deno.env.get('ANTHROPIC_MODEL_PASS_B') ?? 'claude-sonnet-4-6';
    const [passA, passB] = await Promise.all([
      extractOnce(anthropic, modelA, fileBlock, rosterNames),
      extractOnce(anthropic, modelB, fileBlock, rosterNames),
    ]);

    // ── Validación determinista ─────────────────────────────────────────────
    const rows: AssignmentRow[] = [];
    const activeA = passA.assignments.filter((e) => !e.cancelled && e.name_literal.trim() !== '');
    const activeB = passB.assignments.filter((e) => !e.cancelled && e.name_literal.trim() !== '');

    const monthsAgree = passA.month === passB.month && passA.year === passB.year;
    const { month, year } = passA;
    const monthValid = month >= 1 && month <= 12 && year >= 2020 && year <= 2100;

    const keysB = new Set(activeB.map(entryKey));
    const locationByKeyB = new Map(activeB.map((e) => [entryKey(e), normalize(e.location ?? '')]));
    const seenKeys = new Set<string>();

    const toDateString = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Asimilación de erratas: busca el nombre del roster más cercano por
    // distancia de edición. Solo asimila con distancia ≤ 2 y perfil único.
    const fuzzyResolve = (normLit: string): { profileId: string | null; ambiguous: boolean } => {
      let best = Infinity;
      const bestProfiles = new Set<string>();
      for (const [name, ids] of nameToProfiles) {
        const d = levenshtein(normLit, name);
        if (d < best) {
          best = d;
          bestProfiles.clear();
          ids.forEach((id) => bestProfiles.add(id));
        } else if (d === best) {
          ids.forEach((id) => bestProfiles.add(id));
        }
      }
      if (best <= 2 && bestProfiles.size === 1) return { profileId: [...bestProfiles][0], ambiguous: false };
      if (best <= 2 && bestProfiles.size > 1) return { profileId: null, ambiguous: true };
      return { profileId: null, ambiguous: false };
    };

    for (const e of activeA) {
      const key = entryKey(e);
      if (seenKeys.has(key)) continue; // duplicado exacto dentro de la misma pasada
      seenKeys.add(key);

      const time = normalizeTime(e.time);

      // Lugar: solo se da por bueno si ambas pasadas leyeron el mismo. Si
      // discrepan, la asignación sigue siendo válida (persona/fecha/hora
      // verificadas) pero el lugar queda sin confirmar (null → el email
      // remite al cuadrante).
      const locationB = locationByKeyB.get(key);
      const locationAgreed = locationB === undefined || normalize(e.location ?? '') === locationB;

      const baseRow = {
        grid_item_id: record.id as string,
        assignment_date: toDateString(Math.min(Math.max(e.date, 1), 31)),
        assignment_time: time ?? e.time,
        location: locationAgreed ? (e.location?.trim() || null) : null,
        name_literal: e.name_literal.trim(),
      };

      const problems: string[] = [];

      if (!monthsAgree || !monthValid) {
        problems.push('Las dos pasadas no coinciden en mes/año del cuadrante');
      }
      if (!keysB.has(key)) {
        problems.push('Discrepancia entre las dos pasadas de extracción');
      }
      if (!time) {
        problems.push(`Hora no válida: "${e.time}"`);
      }

      // Fecha real y coherencia con el día de la semana leído de la columna
      const dateObj = new Date(Date.UTC(year, month - 1, e.date));
      if (dateObj.getUTCMonth() !== month - 1 || dateObj.getUTCDate() !== e.date) {
        problems.push(`El día ${e.date} no existe en ${SPANISH_MONTHS[month - 1] ?? month}`);
      } else if (SPANISH_WEEKDAYS[dateObj.getUTCDay()] !== e.weekday) {
        problems.push(`El día ${e.date} no cae en ${e.weekday}`);
      }

      // Resolución nombre → perfil:
      // 1) coincidencia exacta (display_name o alias, normalizados)
      // 2) asimilación de erratas por distancia de edición ≤ 2 (Erik/Erick/Pelleres…)
      // 3) mapeo del modelo (name_roster) reforzado con proximidad ≤ 3
      // 4) si nada aplica → 'unmatched': persona no registrada, se ignora sin avisar
      let profileId: string | null = null;
      let unmatched = false;
      const normLit = normalize(e.name_literal);
      const literalIds = nameToProfiles.get(normLit);
      if (literalIds && literalIds.size === 1) {
        profileId = [...literalIds][0];
      } else if (literalIds && literalIds.size > 1) {
        problems.push(`Nombre ambiguo en el roster: "${e.name_literal}"`);
      } else {
        const fuzzy = fuzzyResolve(normLit);
        if (fuzzy.ambiguous) {
          problems.push(`Nombre ambiguo en el roster (por similitud): "${e.name_literal}"`);
        } else if (fuzzy.profileId) {
          profileId = fuzzy.profileId;
        } else if (e.name_roster !== 'NO_ROSTER') {
          const rosterIds = nameToProfiles.get(normalize(e.name_roster));
          if (rosterIds && rosterIds.size === 1 && levenshtein(normLit, normalize(e.name_roster)) <= 3) {
            profileId = [...rosterIds][0];
          } else {
            unmatched = true;
          }
        } else {
          unmatched = true;
        }
      }

      rows.push({
        ...baseRow,
        profile_id: profileId,
        status: problems.length > 0 ? 'needs_review' : unmatched ? 'unmatched' : 'validated',
        review_reason: problems.length > 0
          ? problems.join('; ')
          : unmatched ? `"${e.name_literal}" no está registrado en la app` : null,
      });
    }

    // Entradas que solo aparecen en la pasada B → también a revisión
    const keysA = seenKeys;
    for (const e of activeB) {
      const key = entryKey(e);
      if (keysA.has(key)) continue;
      keysA.add(key);
      rows.push({
        grid_item_id: record.id as string,
        profile_id: null,
        assignment_date: toDateString(Math.min(Math.max(e.date, 1), 31)),
        assignment_time: normalizeTime(e.time) ?? e.time,
        location: e.location?.trim() || null,
        name_literal: e.name_literal.trim(),
        status: 'needs_review',
        review_reason: 'Solo detectada en la segunda pasada de extracción',
      });
    }

    if (rows.length === 0) {
      console.warn('extract-assignments: no se extrajo ninguna asignación');
      return;
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('extracted_assignments')
      .insert(rows)
      .select('id, profile_id, assignment_date, assignment_time, location, name_literal, status, review_reason');
    if (insertError) throw insertError;
    const inserted = (insertedData ?? []) as (AssignmentRow & { id: string })[];

    // ── Notificaciones ──────────────────────────────────────────────────────
    const sendEmail = makeSendEmail();
    const durationMinutes = parseInt(Deno.env.get('ASSIGNMENT_DURATION_MINUTES') ?? '60', 10);
    const monthLabel = `${SPANISH_MONTHS[month - 1] ?? month} ${year}`;
    const profileById = new Map(roster.map((p) => [p.id, p]));

    const validated = inserted.filter((r) => r.status === 'validated' && r.profile_id);
    const byProfile = new Map<string, typeof validated>();
    for (const r of validated) {
      if (!byProfile.has(r.profile_id!)) byProfile.set(r.profile_id!, []);
      byProfile.get(r.profile_id!)!.push(r);
    }

    // Modo beta: si hay allowlist, solo se notifica a esos emails. El resto de
    // asignaciones validadas se quedan en 'validated' (sin notified_at), de modo
    // que al quitar la allowlist un reprocesado no duplicaría avisos ya enviados.
    const allowlist = (Deno.env.get('NOTIFICATION_ALLOWLIST') ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let notifiedCount = 0;
    let skippedByAllowlist = 0;
    const notifyErrors: string[] = [];
    for (const [profileId, userRows] of byProfile) {
      const profile = profileById.get(profileId);
      if (!profile?.email) continue;
      if (allowlist.length > 0 && !allowlist.includes(profile.email.toLowerCase())) {
        skippedByAllowlist += userRows.length;
        continue;
      }
      userRows.sort((a, b) => (a.assignment_date + a.assignment_time).localeCompare(b.assignment_date + b.assignment_time));

      const listHtml = userRows
        .map((r) => {
          const d = new Date(r.assignment_date + 'T00:00:00Z');
          const dateLabel = `${SPANISH_WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}`;
          return `<li><strong>${dateLabel} · ${r.assignment_time}</strong> — ${r.location ?? 'lugar: consulta el cuadrante'}</li>`;
        })
        .join('');
      const html = `
        <p>Hola ${profile.display_name}:</p>
        <p>Se ha publicado el cuadrante <strong>"${record.title}"</strong> y tienes
        ${userRows.length === 1 ? 'una asignación' : `${userRows.length} asignaciones`} como conductor en ${monthLabel}:</p>
        <ul>${listHtml}</ul>
        <p>En el archivo adjunto tienes los eventos para añadirlos a tu calendario con un clic.</p>
        <p style="color:#888;font-size:12px">Mensaje automático del Tablón de Anuncios. Si ves algún error, avisa al responsable.</p>`;

      const ics = buildIcs(
        userRows.map((r) => ({ date: r.assignment_date, time: r.assignment_time, location: r.location })),
        durationMinutes,
      );

      try {
        await sendEmail(
          profile.email,
          `Tus asignaciones de ${monthLabel}`,
          html, ics, `asignaciones-${year}-${String(month).padStart(2, '0')}.ics`,
        );
        await supabase
          .from('extracted_assignments')
          .update({ status: 'notified', notified_at: new Date().toISOString() })
          .in('id', userRows.map((r) => r.id));
        notifiedCount += userRows.length;
      } catch (err) {
        notifyErrors.push(`${profile.email}: ${String(err)}`);
      }
    }

    // Aviso a editores si hay algo que revisar
    const needsReview = inserted.filter((r) => r.status === 'needs_review');
    if (needsReview.length > 0 || notifyErrors.length > 0) {
      const editors = roster.filter((p) => (p.role === 'admin' || p.role === 'editor') && p.email);
      const reviewHtml = `
        <p>El análisis del cuadrante <strong>"${record.title}"</strong> (${monthLabel}) ha terminado con avisos.</p>
        ${needsReview.length > 0 ? `<p>Asignaciones que requieren revisión (no se ha notificado a nadie por ellas):</p>
        <ul>${needsReview.map((r) => `<li>${r.assignment_date} ${r.assignment_time} — ${r.name_literal || '(sin nombre)'}: ${r.review_reason}</li>`).join('')}</ul>` : ''}
        ${notifyErrors.length > 0 ? `<p>Errores de envío:</p><ul>${notifyErrors.map((e) => `<li>${e}</li>`).join('')}</ul>` : ''}
        <p>Resumen: ${validated.length} validadas, ${notifiedCount} notificadas${skippedByAllowlist > 0 ? ` (${skippedByAllowlist} omitidas por el modo beta)` : ''}, ${needsReview.length} en revisión.</p>`;
      for (const editor of editors) {
        try {
          await sendEmail(editor.email, `Revisión necesaria: cuadrante "${record.title}"`, reviewHtml);
        } catch (err) {
          console.error(`Error avisando a ${editor.email}:`, err);
        }
      }
    }

    console.log('extract-assignments resultado:', JSON.stringify({
      grid_item_id: record.id,
      extracted: rows.length,
      validated: validated.length,
      notified: notifiedCount,
      skipped_by_allowlist: skippedByAllowlist,
      needs_review: needsReview.length,
      unmatched: inserted.filter((r) => r.status === 'unmatched').length,
    }));
}
