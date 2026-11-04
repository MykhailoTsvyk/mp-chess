UPDATE games
SET ended_at = to_timestamp(substring(id FROM '_(\d+)$')::bigint / 1000.0)
WHERE ended_at IS NULL
  AND status IN ('finished', 'draw', 'aborted')
  AND id ~ '_\d+$';
