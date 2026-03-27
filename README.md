# Tablón de Anuncios

Aplicación web para publicar y consultar anuncios de la congregación Sarrià-Les Corts. Acceso por invitación con magic link, sin contraseñas.

**Producción:** https://tablon-anuncios-nine.vercel.app

---

## Tech stack

- **React 19 + TypeScript + Vite**
- **TailwindCSS**
- **Supabase** — Auth (magic link) + PostgreSQL + Edge Functions
- **Vercel** — hosting
- **@dnd-kit** — drag & drop en el panel de administración
- **lucide-react** — iconos

---

## Autenticación y roles

El acceso es por invitación. No hay registro público. Un administrador invita a los usuarios desde el panel.

| Rol | Acceso |
|-----|--------|
| `admin` | Panel completo + gestión de usuarios |
| `editor` | Panel de contenido (tablón + anuncios) |
| `publicador` | Solo lectura del tablón |

El login es mediante **magic link** enviado al email. No hay contraseñas.

---

## Desarrollo local

### Requisitos
- Node.js LTS
- Cuenta en [Supabase](https://supabase.com)

### Instalación

```bash
npm install
```

### Variables de entorno

Copia `.env.example` a `.env` y rellena:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### Arrancar

```bash
npm run dev
# http://localhost:5173
```

---

## Configuración de Supabase

### Base de datos

Ejecuta `supabase-setup.sql` en el SQL Editor de Supabase para crear las tablas `grid_items` y `announcements`.

La tabla `profiles` se crea con la migración `create_profiles_table`.

### Auth

En **Authentication > URL Configuration**:
- **Site URL**: `https://tablon-anuncios-nine.vercel.app`
- **Redirect URLs**: añadir `https://tablon-anuncios-nine.vercel.app` y `http://localhost:5173`

### Edge Function

La función `invite-user` está en `supabase/functions/invite-user/`. Se despliega con:

```bash
supabase functions deploy invite-user
```

O directamente desde el MCP de Supabase.

### Primer usuario admin

Créalo manualmente desde Supabase Dashboard (Authentication > Users > Invite user) y luego en la tabla `profiles`:

```sql
INSERT INTO profiles (id, email, display_name, role, is_active)
VALUES ('<user-id>', 'tu@email.com', 'Tu Nombre', 'admin', true);
```

---

## Estructura del proyecto

```
src/
├── components/
│   ├── admin/          # AdminPanel, UsersPanel, GridItemForm, AnnouncementForm
│   ├── Header.tsx
│   ├── Grid.tsx
│   ├── LoginPage.tsx
│   └── Menu.tsx
├── context/
│   ├── AuthContext.tsx  # Sesión + perfil + rol
│   └── AppContext.tsx   # Grid items + anuncios
├── lib/supabase/
│   ├── client.ts       # supabase (auth) + supabaseAnon (lecturas públicas)
│   ├── auth.ts
│   ├── database.ts
│   └── profiles.ts
└── types.ts
supabase/
└── functions/
    └── invite-user/    # Edge Function: invitar usuarios
```

---

## Despliegue

La app se despliega automáticamente en Vercel al hacer push a `master`. Asegúrate de tener configuradas las variables de entorno en el proyecto de Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Maintainer

- **erpallaga** — https://github.com/erpallaga/tablon-anuncios
