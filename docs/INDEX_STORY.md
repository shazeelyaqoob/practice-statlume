# The index story

Real measurements from Statlume's own queries on 500,000 orders. Run it yourself:

```bash
pnpm --filter @statlume/api bench
```

The script seeds a separate `statlume_bench` database, times each query 7 times (median), and prints `EXPLAIN ANALYZE` for every case. Setup: MySQL 8.4.13 in Docker on a Windows 11 laptop. Numbers move a little between runs. The shape does not.

## Query 1: the Orders page (newest 25 orders in a date range)

```sql
SELECT o.id FROM orders o
WHERE o.created_at >= CONVERT_TZ('2026-10-05 00:00:00', 'America/New_York', 'UTC')
  AND o.created_at <  CONVERT_TZ('2026-11-04 00:00:00', 'America/New_York', 'UTC')
ORDER BY o.created_at DESC, o.id DESC
LIMIT 25;
```

| Index                | Median time | What MySQL did                                                         |
| -------------------- | ----------- | ---------------------------------------------------------------------- |
| none                 | 63.2 ms     | Scanned all 500,000 rows, kept 44,149, sorted them, returned 25        |
| `orders(created_at)` | **1.2 ms**  | Walked the index backwards from the end date, read 25 entries, stopped |

Before:

```
-> Limit: 25 row(s)  (actual time=83.3..83.3 rows=25)
    -> Sort: o.created_at DESC, o.id DESC, limit input to 25 row(s) per chunk
        -> Filter: (o.created_at >= ...) and (o.created_at < ...)  (actual rows=44149)
            -> Covering index scan on o using idx_orders_customer_created  (rows=498576)
```

After:

```
-> Limit: 25 row(s)  (actual time=0.482..0.488 rows=25)
    -> Covering index range scan on o using idx_orders_created
       over ('2026-10-05 04:00:00' <= created_at < '2026-11-04 05:00:00') (reverse)
```

Why it works: the index is already sorted by `created_at`, so "newest first" is free. MySQL reads the index from the end, and `LIMIT 25` lets it stop after 25 rows. There is no sort step left. The InnoDB primary key (`id`) is stored in every secondary index, so `ORDER BY created_at, id` is covered too.

## Query 2: the Overview chart (net revenue per day)

```sql
SELECT DATE(CONVERT_TZ(o.created_at, 'UTC', 'America/New_York')) AS bucket,
       COUNT(*) AS orders,
       SUM(o.total - COALESCE(r.amount, 0)) AS revenue
FROM orders o
LEFT JOIN (SELECT order_id, SUM(amount) AS amount FROM refunds GROUP BY order_id) r
       ON r.order_id = o.id
WHERE o.status IN ('paid', 'refunded')
  AND o.created_at >= CONVERT_TZ(?, 'America/New_York', 'UTC')
  AND o.created_at <  CONVERT_TZ(?, 'America/New_York', 'UTC')
GROUP BY bucket ORDER BY bucket;
```

| Index                               | Last 30 days | Last 12 months |
| ----------------------------------- | ------------ | -------------- |
| none                                | 194.4 ms     | 589.3 ms       |
| `orders(created_at)`                | 112.1 ms     | 595.8 ms       |
| `orders(status, created_at)`        | 123.6 ms     | 781.2 ms       |
| `orders(status, created_at, total)` | **81.1 ms**  | 635.1 ms       |

The winner for 30 days is the **covering** index `(status, created_at, total)`. Every column the query reads from `orders` is inside the index (`id` comes free as the primary key), so MySQL never opens the table rows:

```
-> Covering index range scan on o using idx_bench
   over (status = 'paid' AND '2026-10-05 04:00:00' <= created_at < '2026-11-04 05:00:00')
     OR (status = 'refunded' AND ...)
```

`(status, created_at)` without `total` is slower than `(created_at)` alone: it finds the right rows, then has to jump to the table row for every one of them to read `total`.

### Why 12 months does not get faster

The demo data covers 12 months, so "last 12 months" matches about 99% of the table. When a query needs almost every row, reading the table in order is as fast as it gets, and with `(status, created_at)` the extra index lookups made it slower. The time goes on work done once per row: the time zone conversion and the group-by.

No index fixes that. The fix would be a summary table, `daily_sales(store_date, orders, revenue)`, updated when an order is written. A year of data is then 365 rows instead of 500,000. That is the next step if the data grows. It is left out on purpose so the reports stay readable as plain SQL over the raw tables.

## Two rules that made the indexes usable at all

1. **Never wrap the column in a function in `WHERE`.** `DATE(CONVERT_TZ(created_at, ...)) BETWEEN ...` would hide `created_at` from every index. Statlume converts the two range ends instead (`created_at >= CONVERT_TZ(:from_midnight, store_tz, 'UTC')`), so the column is compared to constants. `EXPLAIN` shows those as `<cache>(convert_tz(...))`: worked out once, not per row.
2. **`IN (...)` instead of `<> 'cancelled'`.** Both mean the same here, but `status IN ('paid', 'refunded')` gives MySQL two clean ranges to scan in the `(status, ...)` index.

## What shipped

`apps/api/migrations/002_orders_report_indexes.sql` adds both indexes:

```sql
CREATE INDEX idx_orders_created ON orders (created_at);
CREATE INDEX idx_orders_status_created_total ON orders (status, created_at, total);
```

The cost: two more indexes to update on every new order. For a reporting app that reads far more than it writes, that is the right trade.
