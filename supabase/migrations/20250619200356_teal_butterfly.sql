/*
  # Agregar usuarios de demostración

  1. Usuarios de demostración
    - Administrador: admin / admin123
    - Empleado: ana.garcia / emp123
    - Empleado: carlos.lopez / emp123

  2. Empleados de demostración
    - Ana García - Agente de Ventas
    - Carlos López - Especialista en Seguros
    - María Rodríguez - Agente de Atención

  3. Configuración
    - Contraseñas hasheadas usando base64 simple
    - Usuarios activos por defecto
    - Vinculación entre usuarios y empleados
*/

-- Insertar empleados de demostración
INSERT INTO employees (id, name, position, is_active, total_tickets_served, total_tickets_cancelled, is_paused) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Ana García', 'Agente de Ventas', true, 23, 2, false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Carlos López', 'Especialista en Seguros', true, 18, 1, false),
  ('550e8400-e29b-41d4-a716-446655440003', 'María Rodríguez', 'Agente de Atención', false, 15, 0, false)
ON CONFLICT (id) DO NOTHING;

-- Insertar usuarios de demostración con contraseñas hasheadas
-- Contraseñas: admin123 -> YWRtaW4xMjNzYWx0X2tleV8yMDI0, emp123 -> ZW1wMTIzc2FsdF9rZXlfMjAyNA==
INSERT INTO users (id, name, username, password_hash, user_type, employee_id, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Administrador Principal', 'admin', 'YWRtaW4xMjNzYWx0X2tleV8yMDI0', 'administrador', null, true),
  ('550e8400-e29b-41d4-a716-446655440011', 'Ana García', 'ana.garcia', 'ZW1wMTIzc2FsdF9rZXlfMjAyNA==', 'empleado', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440012', 'Carlos López', 'carlos.lopez', 'ZW1wMTIzc2FsdF9rZXlfMjAyNA==', 'empleado', '550e8400-e29b-41d4-a716-446655440002', true),
  ('550e8400-e29b-41d4-a716-446655440013', 'Botonera Principal', null, null, 'botonera', null, true),
  ('550e8400-e29b-41d4-a716-446655440014', 'Nodo Visualización', null, null, 'nodo', null, true)
ON CONFLICT (id) DO NOTHING;

-- Insertar algunas imágenes de carrusel de demostración
INSERT INTO carousel_images (name, url, description, is_active, display_order) VALUES
  ('Promoción Seguros', 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=800', 'Promociones especiales en seguros', true, 1),
  ('Ofertas Especiales', 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=800', 'Ofertas limitadas por tiempo', true, 2),
  ('Nuevos Productos', 'https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&w=800', 'Conoce nuestros nuevos productos', true, 3),
  ('Servicios Premium', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800', 'Servicios premium para clientes VIP', true, 4)
ON CONFLICT DO NOTHING;

-- Insertar algunos tickets de demostración
INSERT INTO tickets (ticket_number, service_type, service_subtype, status, queue_position, created_at, served_by, served_at, completed_at, wait_time, service_time, total_time) VALUES
  (1, 'compra', null, 'completed', 1, now() - interval '1 hour', '550e8400-e29b-41d4-a716-446655440001', now() - interval '55 minutes', now() - interval '50 minutes', 300, 300, 600),
  (2, 'seguro', null, 'completed', 1, now() - interval '45 minutes', '550e8400-e29b-41d4-a716-446655440002', now() - interval '40 minutes', now() - interval '35 minutes', 300, 420, 720),
  (3, 'compra', null, 'being_served', 1, now() - interval '30 minutes', '550e8400-e29b-41d4-a716-446655440001', now() - interval '15 minutes', null, 900, null, null),
  (4, 'seguro', null, 'waiting', 1, now() - interval '20 minutes', null, null, null, null, null, null),
  (5, 'compra', null, 'waiting', 2, now() - interval '10 minutes', null, null, null, null, null, null)
ON CONFLICT DO NOTHING;

-- Actualizar empleados con tickets actuales
UPDATE employees 
SET current_ticket_id = (SELECT id FROM tickets WHERE ticket_number = 3 LIMIT 1)
WHERE id = '550e8400-e29b-41d4-a716-446655440001';