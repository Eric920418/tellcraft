-- 006: Add Event Storming document column to bdd_sessions
-- Phase 0 Event Storming 產出的 es.md 文檔內容

ALTER TABLE bdd_sessions ADD COLUMN IF NOT EXISTS es_document_content TEXT DEFAULT NULL;
