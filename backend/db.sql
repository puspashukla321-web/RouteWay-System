-- RouteWay database schema
CREATE DATABASE IF NOT EXISTS routeway;
USE routeway;

-- Admin users who manage routes/stops/fares
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Physical stops (e.g. Ratnapark, Koteshwor)
CREATE TABLE IF NOT EXISTS stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routes / vehicles (e.g. "Route 5 - Sajha Yatayat")
CREATE TABLE IF NOT EXISTS routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  vehicle_name VARCHAR(150) NOT NULL,
  operator VARCHAR(150) NULL,
  distance_km DECIMAL(6,2) NULL,
  duration_minutes INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ordered stops belonging to a route. stop_order defines direction.
CREATE TABLE IF NOT EXISTS route_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  stop_id INT NOT NULL,
  stop_order INT NOT NULL,
  eta_minutes_from_start INT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
  UNIQUE KEY unique_route_stop_order (route_id, stop_order)
);

-- Fare per route (kept simple: one flat fare per route; can be extended to per-segment)
CREATE TABLE IF NOT EXISTS fares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  fare_amount DECIMAL(6,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NPR',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_route_fare (route_id)
);

-- User-submitted feedback (e.g. "this fare is outdated")
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NULL,
  from_stop VARCHAR(150) NULL,
  to_stop VARCHAR(150) NULL,
  message TEXT NOT NULL,
  status ENUM('new','reviewed','resolved') DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL
);

-- ---------- Seed data ----------

INSERT INTO stops (name) VALUES
  ('Ratnapark'), ('Sundhara'), ('Koteshwor'), ('Baneshwor'), ('Airport'), ('Kalanki'), ('Balaju')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes) VALUES
  ('Route 5', 'Sajha Yatayat', 'Sajha Yatayat Co-operative', 8.30, 25),
  ('Route 2', 'Mahanagar Yatayat', 'Mahanagar Yatayat Pvt. Ltd.', 13.30, 40)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  vehicle_name = VALUES(vehicle_name),
  operator = VALUES(operator),
  distance_km = VALUES(distance_km),
  duration_minutes = VALUES(duration_minutes);

-- Route 5: Ratnapark -> Sundhara -> Baneshwor -> Koteshwor
INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 1 AS route_id, 'Ratnapark' AS stop_name, 1 AS stop_order, 0 AS eta
  UNION ALL SELECT 1, 'Sundhara', 2, 5
  UNION ALL SELECT 1, 'Baneshwor', 3, 15
  UNION ALL SELECT 1, 'Koteshwor', 4, 25
) v
JOIN routes r ON r.id = v.route_id
JOIN stops s ON s.name = v.stop_name
ON DUPLICATE KEY UPDATE
  stop_id = VALUES(stop_id),
  eta_minutes_from_start = VALUES(eta_minutes_from_start);

-- Route 2: Kalanki -> Ratnapark -> Baneshwor -> Airport
INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 2 AS route_id, 'Kalanki' AS stop_name, 1 AS stop_order, 0 AS eta
  UNION ALL SELECT 2, 'Ratnapark', 2, 20
  UNION ALL SELECT 2, 'Baneshwor', 3, 30
  UNION ALL SELECT 2, 'Airport', 4, 40
) v
JOIN routes r ON r.id = v.route_id
JOIN stops s ON s.name = v.stop_name
ON DUPLICATE KEY UPDATE
  stop_id = VALUES(stop_id),
  eta_minutes_from_start = VALUES(eta_minutes_from_start);

INSERT INTO fares (route_id, fare_amount) VALUES (1, 25.00), (2, 30.00)
ON DUPLICATE KEY UPDATE
  fare_amount = VALUES(fare_amount),
  currency = VALUES(currency);

-- Default admin: username "admin", password "admin123" (bcrypt hash generated at seed time via seed script)
