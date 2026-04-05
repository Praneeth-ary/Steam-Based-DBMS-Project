-- Simulated install: NULL = show Download, set = show Play
-- Safe to skip if the backend already ran ensureSchema (adds this column idempotently).
USE gdps;
ALTER TABLE user_library
  ADD COLUMN download_completed_at DATETIME NULL AFTER last_played;
