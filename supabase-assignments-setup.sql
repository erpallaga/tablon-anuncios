-- Automatización de asignaciones (Fase 1) — ejecutar en el SQL Editor de Supabase
-- Ver docs/automatizacion-asignaciones.md

-- Alias para el matching de nombres del cuadrante con usuarios
-- ("Javi Gavidia" en el PDF vs display_name "Javier Gavidia")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

-- Marca qué documentos son cuadrantes RSC y deben analizarse al subirse
ALTER TABLE grid_items ADD COLUMN IF NOT EXISTS extract_assignments BOOLEAN NOT NULL DEFAULT false;

-- Resultado de cada extracción
CREATE TABLE IF NOT EXISTS extracted_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grid_item_id UUID NOT NULL REFERENCES grid_items(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assignment_date DATE NOT NULL,
  assignment_time TEXT NOT NULL,
  location TEXT,
  name_literal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'validated', 'needs_review', 'notified', 'unmatched')),
  review_reason TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migración para bases existentes: añadir el estado 'unmatched' (persona del
-- cuadrante que no está registrada en la app; se ignora sin avisar a editores)
ALTER TABLE extracted_assignments DROP CONSTRAINT IF EXISTS extracted_assignments_status_check;
ALTER TABLE extracted_assignments ADD CONSTRAINT extracted_assignments_status_check
  CHECK (status IN ('pending', 'validated', 'needs_review', 'notified', 'unmatched'));

CREATE INDEX IF NOT EXISTS idx_extracted_assignments_grid_item
  ON extracted_assignments(grid_item_id);
CREATE INDEX IF NOT EXISTS idx_extracted_assignments_profile
  ON extracted_assignments(profile_id);

-- RLS: solo lectura para admin/editor (la Edge Function escribe con service role,
-- que ignora RLS)
ALTER TABLE extracted_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editors can read extracted assignments" ON extracted_assignments;
CREATE POLICY "Editors can read extracted assignments" ON extracted_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'editor')
        AND p.is_active = true
    )
  );

-- Webhook que dispara el análisis (alternativa por SQL al panel de Supabase:
-- Database → Webhooks → Create). Crear un webhook sobre INSERT en grid_items
-- que llame a la Edge Function extract-assignments:
--
--   URL:    https://<project>.supabase.co/functions/v1/extract-assignments
--   Método: POST
--   Headers: Content-Type: application/json
--            x-webhook-secret: <WEBHOOK_SECRET>   (mismo valor que el secret de la función)
