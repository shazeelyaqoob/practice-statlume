-- Indexes for the report queries. Measured on 500,000 orders, see docs/INDEX_STORY.md.

-- Orders list: newest 25 orders in a date range. With this index MySQL reads
-- the 25 rows backwards from the index and stops. No sort. 63 ms -> 1.2 ms.
CREATE INDEX idx_orders_created ON orders (created_at);

-- Revenue and order totals per day: filter on status and date, read total.
-- Covering: every column the query needs is in the index, so MySQL never
-- touches the table rows. Last 30 days: 194 ms -> 81 ms.
CREATE INDEX idx_orders_status_created_total ON orders (status, created_at, total);
