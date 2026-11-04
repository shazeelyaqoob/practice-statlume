-- Throwaway database for the index benchmark (pnpm --filter @statlume/api bench).
CREATE DATABASE IF NOT EXISTS statlume_bench;
GRANT ALL PRIVILEGES ON statlume_bench.* TO 'statlume'@'%';
FLUSH PRIVILEGES;
