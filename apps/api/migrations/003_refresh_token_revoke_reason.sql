-- Why a refresh token stopped working. The short grace window for two tabs
-- refreshing at once must only apply to normal rotation, never to a token that
-- was revoked by logout or by reuse detection.
ALTER TABLE refresh_tokens
  ADD COLUMN revoke_reason ENUM('rotated', 'logout', 'reuse') NULL AFTER revoked_at;

UPDATE refresh_tokens SET revoke_reason = 'rotated' WHERE revoked_at IS NOT NULL;
