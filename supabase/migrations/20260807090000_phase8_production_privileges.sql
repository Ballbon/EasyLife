-- Older hosted projects may retain legacy default grants that expose new
-- public tables to the anonymous API role. Application data is authenticated-only.
revoke all privileges on all tables in schema public from anon, public;
revoke all privileges on all sequences in schema public from anon, public;

alter default privileges in schema public
  revoke all privileges on tables from anon, public;
alter default privileges in schema public
  revoke all privileges on sequences from anon, public;
