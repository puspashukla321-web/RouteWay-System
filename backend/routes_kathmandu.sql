-- Enhanced RouteWay schema with GPS tracking and comprehensive Kathmandu routes
USE routeway;

-- Add GPS tracking table for real-time bus locations
CREATE TABLE IF NOT EXISTS bus_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  bus_id VARCHAR(50) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(10,8) NOT NULL,
  speed_kmh DECIMAL(5,2) NULL,
  heading DECIMAL(6,2) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_route_updated (route_id, updated_at)
);

-- Clear existing data and add comprehensive Kathmandu stops with GPS coordinates
TRUNCATE TABLE route_stops;
TRUNCATE TABLE fares;
TRUNCATE TABLE routes;
TRUNCATE TABLE stops;

-- Kathmandu Major Stops with GPS coordinates
INSERT INTO stops (name, latitude, longitude) VALUES
  ('Ratnapark', 27.7172, 85.3240),
  ('Sundhara', 27.7158, 85.3288),
  ('Asan Tole', 27.7166, 85.3245),
  ('New Bus Park', 27.7089, 85.3315),
  ('Koteshwor', 27.6778, 85.3385),
  ('Baneshwor', 27.6895, 85.3455),
  ('Putalisadak', 27.7265, 85.3142),
  ('Kalanki', 27.7489, 85.2640),
  ('Balaju', 27.7542, 85.2823),
  ('Tribhuwan Airport', 27.6963, 85.3616),
  ('Bhaktapur Gate', 27.6745, 85.4289),
  ('Kathmandu Durbar Square', 27.7245, 85.3271),
  ('Boudhanath', 27.7210, 85.3614),
  ('Pashupati', 27.7206, 85.3693),
  ('Chabahil', 27.7289, 85.3641),
  ('Gaushala', 27.7148, 85.3520),
  ('Thapathali', 27.6989, 85.3011),
  ('Durbarmarg', 27.7337, 85.3123),
  ('Naxal', 27.7389, 85.3289),
  ('Budhanilkantha', 27.7689, 85.3406),
  ('Maharajgunj', 27.7634, 85.3217),
  ('Soaltee Crossing', 27.7560, 85.2903),
  ('Jamal', 27.7411, 85.3447),
  ('Lazimpat', 27.7363, 85.3349),
  ('Thamel', 27.7161, 85.3049),
  ('Jyoti Nagar', 27.7065, 85.2853),
  ('Shantinagar', 27.6948, 85.3189);

-- Route 1: City Center Express (Ratnapark - Koteshwor - Bhaktapur)
INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes, is_active) VALUES
  ('Route 1: City Express', 'Sajha Yatayat 1001', 'Sajha Yatayat Co-operative', 18.5, 45, TRUE);

INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start) 
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 'Route 1: City Express' AS route_name, 1 AS stop_order, 'Ratnapark' AS stop_name, 0 AS eta
  UNION ALL SELECT 'Route 1: City Express', 2, 'Sundhara', 8
  UNION ALL SELECT 'Route 1: City Express', 3, 'Asan Tole', 10
  UNION ALL SELECT 'Route 1: City Express', 4, 'Gaushala', 15
  UNION ALL SELECT 'Route 1: City Express', 5, 'Chabahil', 22
  UNION ALL SELECT 'Route 1: City Express', 6, 'Boudhanath', 28
  UNION ALL SELECT 'Route 1: City Express', 7, 'Koteshwor', 35
  UNION ALL SELECT 'Route 1: City Express', 8, 'Bhaktapur Gate', 45
) v
JOIN routes r ON r.name = v.route_name
LEFT JOIN stops s ON s.name = v.stop_name;

INSERT INTO fares (route_id, fare_amount, currency) 
SELECT r.id, 30, 'NPR' FROM routes r WHERE r.name = 'Route 1: City Express';

-- Route 2: Airport Express (Kalanki - Ratnapark - Airport)
INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes, is_active) VALUES
  ('Route 2: Airport Link', 'Mahanagar Express 2001', 'Mahanagar Yatayat Pvt. Ltd.', 16.8, 40, TRUE);

INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 'Route 2: Airport Link' AS route_name, 1 AS stop_order, 'Kalanki' AS stop_name, 0 AS eta
  UNION ALL SELECT 'Route 2: Airport Link', 2, 'Balaju', 8
  UNION ALL SELECT 'Route 2: Airport Link', 3, 'Soaltee Crossing', 15
  UNION ALL SELECT 'Route 2: Airport Link', 4, 'Thapathali', 22
  UNION ALL SELECT 'Route 2: Airport Link', 5, 'Ratnapark', 28
  UNION ALL SELECT 'Route 2: Airport Link', 6, 'Koteshwor', 35
  UNION ALL SELECT 'Route 2: Airport Link', 7, 'Tribhuwan Airport', 40
) v
JOIN routes r ON r.name = v.route_name
LEFT JOIN stops s ON s.name = v.stop_name;

INSERT INTO fares (route_id, fare_amount, currency)
SELECT r.id, 50, 'NPR' FROM routes r WHERE r.name = 'Route 2: Airport Link';

-- Route 3: Thamel Tourist Circuit
INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes, is_active) VALUES
  ('Route 3: Tourist Loop', 'City Shuttle 3001', 'City Transport Services', 12.4, 35, TRUE);

INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 'Route 3: Tourist Loop' AS route_name, 1 AS stop_order, 'Thamel' AS stop_name, 0 AS eta
  UNION ALL SELECT 'Route 3: Tourist Loop', 2, 'Naxal', 8
  UNION ALL SELECT 'Route 3: Tourist Loop', 3, 'Kathmandu Durbar Square', 12
  UNION ALL SELECT 'Route 3: Tourist Loop', 4, 'Durbarmarg', 18
  UNION ALL SELECT 'Route 3: Tourist Loop', 5, 'Putalisadak', 22
  UNION ALL SELECT 'Route 3: Tourist Loop', 6, 'Boudhanath', 28
  UNION ALL SELECT 'Route 3: Tourist Loop', 7, 'Pashupati', 35
) v
JOIN routes r ON r.name = v.route_name
LEFT JOIN stops s ON s.name = v.stop_name;

INSERT INTO fares (route_id, fare_amount, currency)
SELECT r.id, 25, 'NPR' FROM routes r WHERE r.name = 'Route 3: Tourist Loop';

-- Route 4: North Kathmandu Link
INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes, is_active) VALUES
  ('Route 4: North Express', 'Sajha Yatayat 4001', 'Sajha Yatayat Co-operative', 9.2, 25, TRUE);

INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 'Route 4: North Express' AS route_name, 1 AS stop_order, 'Budhanilkantha' AS stop_name, 0 AS eta
  UNION ALL SELECT 'Route 4: North Express', 2, 'Maharajgunj', 5
  UNION ALL SELECT 'Route 4: North Express', 3, 'Naxal', 12
  UNION ALL SELECT 'Route 4: North Express', 4, 'Kathmandu Durbar Square', 18
  UNION ALL SELECT 'Route 4: North Express', 5, 'Putalisadak', 25
) v
JOIN routes r ON r.name = v.route_name
LEFT JOIN stops s ON s.name = v.stop_name;

INSERT INTO fares (route_id, fare_amount, currency)
SELECT r.id, 20, 'NPR' FROM routes r WHERE r.name = 'Route 4: North Express';

-- Route 5: East Loop (Jamal - Lazimpat - Chabahil)
INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes, is_active) VALUES
  ('Route 5: East Loop', 'Metro Bus 5001', 'Metro Transport Co.', 14.5, 38, TRUE);

INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 'Route 5: East Loop' AS route_name, 1 AS stop_order, 'Jamal' AS stop_name, 0 AS eta
  UNION ALL SELECT 'Route 5: East Loop', 2, 'Lazimpat', 5
  UNION ALL SELECT 'Route 5: East Loop', 3, 'Sundhara', 10
  UNION ALL SELECT 'Route 5: East Loop', 4, 'New Bus Park', 15
  UNION ALL SELECT 'Route 5: East Loop', 5, 'Gaushala', 20
  UNION ALL SELECT 'Route 5: East Loop', 6, 'Chabahil', 28
  UNION ALL SELECT 'Route 5: East Loop', 7, 'Boudhanath', 35
  UNION ALL SELECT 'Route 5: East Loop', 8, 'Pashupati', 38
) v
JOIN routes r ON r.name = v.route_name
LEFT JOIN stops s ON s.name = v.stop_name;

INSERT INTO fares (route_id, fare_amount, currency)
SELECT r.id, 28, 'NPR' FROM routes r WHERE r.name = 'Route 5: East Loop';

-- Route 6: West Line (Kalanki - Soaltee - Jyoti Nagar)
INSERT INTO routes (name, vehicle_name, operator, distance_km, duration_minutes, is_active) VALUES
  ('Route 6: West Line', 'Sajha Yatayat 6001', 'Sajha Yatayat Co-operative', 11.8, 32, TRUE);

INSERT INTO route_stops (route_id, stop_id, stop_order, eta_minutes_from_start)
SELECT r.id, s.id, v.stop_order, v.eta
FROM (
  SELECT 'Route 6: West Line' AS route_name, 1 AS stop_order, 'Kalanki' AS stop_name, 0 AS eta
  UNION ALL SELECT 'Route 6: West Line', 2, 'Soaltee Crossing', 7
  UNION ALL SELECT 'Route 6: West Line', 3, 'Balaju', 12
  UNION ALL SELECT 'Route 6: West Line', 4, 'Jyoti Nagar', 18
  UNION ALL SELECT 'Route 6: West Line', 5, 'Thapathali', 25
  UNION ALL SELECT 'Route 6: West Line', 6, 'Ratnapark', 32
) v
JOIN routes r ON r.name = v.route_name
LEFT JOIN stops s ON s.name = v.stop_name;

INSERT INTO fares (route_id, fare_amount, currency)
SELECT r.id, 22, 'NPR' FROM routes r WHERE r.name = 'Route 6: West Line';

-- Add initial bus locations (for demonstration)
INSERT INTO bus_locations (route_id, bus_id, latitude, longitude, speed_kmh, heading) 
SELECT r.id, CONCAT('BUS-', r.id, '-001'), 
  (SELECT latitude FROM stops WHERE name = 'Ratnapark' LIMIT 1),
  (SELECT longitude FROM stops WHERE name = 'Ratnapark' LIMIT 1),
  0, NULL
FROM routes r;
