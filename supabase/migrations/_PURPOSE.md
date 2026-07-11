# Numbered SQL migrations
Source of truth for schema + RLS policies. See docs/DATABASE_SCHEMA.md for
the spec these implement. Every table's RLS is enabled in the same
migration that creates the table -- never created 'temporarily' without it.
