DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN PASSWORD 'postgrest_local_pwd' NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'organograma_api') THEN
    CREATE ROLE organograma_api NOLOGIN;
  END IF;
END;
$$;

GRANT organograma_api TO authenticator;
GRANT USAGE ON SCHEMA public TO organograma_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO organograma_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO organograma_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO organograma_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO organograma_api;

REVOKE ALL ON public.app_auth FROM organograma_api;
