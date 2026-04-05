-- Run against existing gdps DB: adds Publisher role and user.publisher_id
USE gdps;

ALTER TABLE users
  MODIFY COLUMN role ENUM('Admin','Developer','Publisher','Consumer') NOT NULL DEFAULT 'Consumer';

ALTER TABLE users
  ADD COLUMN publisher_id INT UNSIGNED NULL AFTER developer_id,
  ADD UNIQUE KEY uq_users_publisher_id (publisher_id),
  ADD CONSTRAINT fk_users_publisher FOREIGN KEY (publisher_id)
    REFERENCES publishers (publisher_id) ON DELETE SET NULL ON UPDATE CASCADE;
