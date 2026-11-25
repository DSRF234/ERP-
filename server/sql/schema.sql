-- 星野优选 ERP · 数据库结构
-- 库名：erp_xingye
-- 说明：一单多品拆明细表；库存按「货品编码 + 仓库」唯一

CREATE DATABASE IF NOT EXISTS erp_xingye
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE erp_xingye;

-- ---------------- 账号 ----------------
CREATE TABLE IF NOT EXISTS users (
  account     VARCHAR(32)  PRIMARY KEY COMMENT '登录账号',
  password    VARCHAR(64)  NOT NULL COMMENT '密码',
  name        VARCHAR(32)  NOT NULL COMMENT '姓名',
  post        VARCHAR(32)  DEFAULT '' COMMENT '职位',
  dept        VARCHAR(32)  DEFAULT '' COMMENT '部门',
  phone       VARCHAR(20)  DEFAULT '',
  status      VARCHAR(8)   DEFAULT '启用',
  last_login  VARCHAR(24)  DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账号';

-- ---------------- 订单 ----------------
CREATE TABLE IF NOT EXISTS orders (
  no              VARCHAR(32) PRIMARY KEY COMMENT '平台单号',
  platform        VARCHAR(16)  DEFAULT '' COMMENT '平台',
  shop            VARCHAR(32)  DEFAULT '' COMMENT '店铺',
  receiver        VARCHAR(32)  DEFAULT '',
  phone           VARCHAR(24)  DEFAULT '',
  address         VARCHAR(255) DEFAULT '',
  note            VARCHAR(255) DEFAULT '',
  carrier         VARCHAR(16)  DEFAULT '' COMMENT '快递公司',
  express_no      VARCHAR(40)  DEFAULT '' COMMENT '运单号',
  outbound_no     VARCHAR(40)  DEFAULT '' COMMENT '出库单号',
  amount          DECIMAL(12,2) DEFAULT 0 COMMENT '订单金额',
  settle          DECIMAL(12,2) DEFAULT 0 COMMENT '平台结算金额',
  actual          DECIMAL(12,2) DEFAULT 0 COMMENT '实际到账金额',
  warehouse       VARCHAR(16)  DEFAULT '' COMMENT '发货仓',
  pay_time        VARCHAR(24)  DEFAULT '',
  order_time      VARCHAR(24)  DEFAULT '' COMMENT '下单时间',
  deadline        VARCHAR(24)  DEFAULT '' COMMENT '最晚发货时间',
  shipped_at      VARCHAR(24)  DEFAULT '',
  done_at         VARCHAR(24)  DEFAULT '',
  approved_at     VARCHAR(24)  DEFAULT '',
  platform_goods  VARCHAR(255) DEFAULT '',
  status          VARCHAR(16)  DEFAULT 'review' COMMENT 'review/pending/shipped/done',
  after_status    VARCHAR(8)   DEFAULT NULL COMMENT '已完结/售后中/已退款',
  finance_pushed  TINYINT(1)   DEFAULT 0,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status),
  KEY idx_after (after_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单';

CREATE TABLE IF NOT EXISTS order_goods (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_no  VARCHAR(32) NOT NULL,
  name      VARCHAR(120) DEFAULT '',
  spec      VARCHAR(64)  DEFAULT '',
  qty       INT          DEFAULT 1,
  sku       VARCHAR(40)  DEFAULT '',
  KEY idx_order (order_no),
  KEY idx_sku (sku),
  CONSTRAINT fk_og_order FOREIGN KEY (order_no) REFERENCES orders(no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品明细';

-- ---------------- 售后 ----------------
CREATE TABLE IF NOT EXISTS aftersales (
  ticket          VARCHAR(32) PRIMARY KEY,
  order_no        VARCHAR(32) DEFAULT '' COMMENT '关联订单号',
  channel         VARCHAR(16) DEFAULT '',
  apply_type      VARCHAR(16) DEFAULT '',
  type            VARCHAR(16) DEFAULT '',
  reason          VARCHAR(120) DEFAULT '',
  apply_time      VARCHAR(24) DEFAULT '',
  sla             VARCHAR(24) DEFAULT '',
  logistics       VARCHAR(24) DEFAULT '',
  express_no      VARCHAR(40) DEFAULT '',
  goods_text      VARCHAR(120) DEFAULT '',
  sku             VARCHAR(40) DEFAULT '',
  qty             INT DEFAULT 1,
  order_time      VARCHAR(24) DEFAULT '',
  order_amount    DECIMAL(12,2) DEFAULT 0,
  amount          DECIMAL(12,2) DEFAULT 0 COMMENT '退款金额',
  customer_name   VARCHAR(32) DEFAULT '',
  customer_phone  VARCHAR(24) DEFAULT '',
  customer_addr   VARCHAR(255) DEFAULT '',
  message         VARCHAR(500) DEFAULT '',
  status          VARCHAR(8) DEFAULT 'wait' COMMENT 'wait/doing/done',
  queue           VARCHAR(16) DEFAULT '',
  result          VARCHAR(16) DEFAULT '',
  duty            VARCHAR(32) DEFAULT '',
  audit_remark    VARCHAR(255) DEFAULT '',
  auditor         VARCHAR(32) DEFAULT '',
  audit_time      VARCHAR(24) DEFAULT '',
  who             VARCHAR(32) DEFAULT '',
  finished_at     VARCHAR(24) DEFAULT '',
  work_order      VARCHAR(32) DEFAULT '',
  refund_way      VARCHAR(32) DEFAULT '',
  address_sync    VARCHAR(255) DEFAULT '',
  KEY idx_status (status),
  KEY idx_order (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后工单';

-- ---------------- 采购 ----------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  no               VARCHAR(32) PRIMARY KEY,
  buyer            VARCHAR(32) DEFAULT '',
  creator          VARCHAR(32) DEFAULT '',
  supplier         VARCHAR(64) DEFAULT '',
  warehouse        VARCHAR(16) DEFAULT '',
  date             VARCHAR(24) DEFAULT '',
  express_no       VARCHAR(40) DEFAULT '',
  logistics        VARCHAR(32) DEFAULT '',
  category         VARCHAR(16) DEFAULT '',
  freight          DECIMAL(12,2) DEFAULT 0,
  amount           DECIMAL(12,2) DEFAULT 0 COMMENT '采购金额',
  status           VARCHAR(16) DEFAULT '待审核',
  approved_at      VARCHAR(24) DEFAULT '',
  stocked_at       VARCHAR(24) DEFAULT '',
  payable_checked  TINYINT(1) DEFAULT 0,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购单';

CREATE TABLE IF NOT EXISTS purchase_items (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  purchase_no  VARCHAR(32) NOT NULL,
  code         VARCHAR(40) DEFAULT '' COMMENT '货品编码，与库存对应',
  name         VARCHAR(120) DEFAULT '',
  spec         VARCHAR(64) DEFAULT '',
  unit         VARCHAR(8) DEFAULT '',
  price        DECIMAL(12,2) DEFAULT 0,
  qty          INT DEFAULT 0,
  KEY idx_purchase (purchase_no),
  KEY idx_code (code),
  CONSTRAINT fk_pi_purchase FOREIGN KEY (purchase_no) REFERENCES purchase_orders(no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='采购货品明细';

-- ---------------- 库存 ----------------
CREATE TABLE IF NOT EXISTS stock_items (
  code         VARCHAR(40) NOT NULL COMMENT '货品编码',
  warehouse    VARCHAR(16) NOT NULL COMMENT '仓库',
  name         VARCHAR(120) DEFAULT '',
  spec         VARCHAR(64) DEFAULT '',
  category     VARCHAR(16) DEFAULT '',
  supplier     VARCHAR(64) DEFAULT '',
  batch        VARCHAR(32) DEFAULT '',
  unit         VARCHAR(8) DEFAULT '件',
  in_no        VARCHAR(40) DEFAULT '' COMMENT '入库单号',
  in_qty       INT DEFAULT 0,
  out_qty      INT DEFAULT 0,
  left_qty     INT DEFAULT 0 COMMENT '剩余数量',
  warn_value   INT DEFAULT 0,
  warn_days    INT DEFAULT 0,
  warn_unit    VARCHAR(8) DEFAULT '月',
  expiry       VARCHAR(24) DEFAULT '',
  last_ref     VARCHAR(40) DEFAULT '' COMMENT '最近来源采购单',
  last_ref_qty INT DEFAULT 0,
  last_ref_at  VARCHAR(24) DEFAULT '',
  in_date      VARCHAR(24) DEFAULT '',
  out_no       VARCHAR(40) DEFAULT '',
  out_date     VARCHAR(24) DEFAULT '',
  PRIMARY KEY (code, warehouse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存（按货品编码+仓库唯一）';

-- ---------------- 库存流水 ----------------
CREATE TABLE IF NOT EXISTS stock_moves (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(40) NOT NULL,
  warehouse  VARCHAR(16) NOT NULL,
  type       VARCHAR(16) NOT NULL COMMENT 'in/out',
  qty        INT NOT NULL,
  ref_no     VARCHAR(40) DEFAULT '' COMMENT '来源单号（采购单/订单）',
  moved_at   VARCHAR(24) DEFAULT '',
  KEY idx_code (code, warehouse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存出入库流水';
