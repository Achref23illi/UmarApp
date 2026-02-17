-- Admin audit log table for traceability of moderation and content operations.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_created
  ON public.admin_audit_logs (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity
  ON public.admin_audit_logs (entity_type, entity_id, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read only their own admin logs (for super admin tooling if needed).
DROP POLICY IF EXISTS "Admins can read own audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read own audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (auth.uid() = admin_user_id);

-- Writes are expected from backend service role; no INSERT policy required for authenticated users.
