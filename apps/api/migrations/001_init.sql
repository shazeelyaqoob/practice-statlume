-- Statlume schema. All DATETIME values are UTC. Money is DECIMAL(10,2).

CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(190) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer',
  is_demo       TINYINT(1) NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE refresh_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  family_id   CHAR(36) NOT NULL,
  expires_at  DATETIME NOT NULL,
  revoked_at  DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  KEY idx_refresh_tokens_user (user_id),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE customers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email       VARCHAR(190) NOT NULL,
  first_name  VARCHAR(60) NOT NULL,
  last_name   VARCHAR(60) NOT NULL,
  city        VARCHAR(80) NOT NULL,
  created_at  DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_customers_email (email)
);

CREATE TABLE products (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(120) NOT NULL,
  category    VARCHAR(60) NOT NULL,
  created_at  DATETIME NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE product_variants (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED NOT NULL,
  title       VARCHAR(80) NOT NULL,
  sku         VARCHAR(40) NOT NULL,
  price       DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_variants_sku (sku),
  KEY idx_variants_product (product_id),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id)
);

CREATE TABLE orders (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id  INT UNSIGNED NOT NULL,
  channel      ENUM('online', 'mobile', 'social') NOT NULL,
  status       ENUM('paid', 'refunded', 'cancelled') NOT NULL,
  subtotal     DECIMAL(10, 2) NOT NULL,
  discount     DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total        DECIMAL(10, 2) NOT NULL,
  created_at   DATETIME NOT NULL,
  PRIMARY KEY (id),
  -- Used by "first order per customer" (new vs returning).
  KEY idx_orders_customer_created (customer_id, created_at),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
);

CREATE TABLE order_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    INT UNSIGNED NOT NULL,
  variant_id  INT UNSIGNED NOT NULL,
  quantity    SMALLINT UNSIGNED NOT NULL,
  unit_price  DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_items_order (order_id),
  KEY idx_items_variant (variant_id),
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
);

CREATE TABLE refunds (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    INT UNSIGNED NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  created_at  DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_refunds_order (order_id),
  CONSTRAINT fk_refunds_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
);
