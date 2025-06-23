/*
  # Datos de demostración para el sistema de gestión de colas

  1. Limpieza de datos existentes
    - Limpia datos en orden correcto para evitar violaciones de foreign key
    - Primero elimina referencias, luego los registros principales

  2. Datos de demostración
    - Empleados con diferentes estados y estadísticas
    - Usuarios con credenciales de prueba
    - Imágenes del carrusel para publicidad
    - Tickets de ejemplo en diferentes estados
    - Subcategorías de servicios

  3. Credenciales de prueba
    - admin / admin123 (administrador)
    - ana.garcia / emp123 (empleado)
    - carlos.lopez / emp123 (empleado)
*/

-- Limpiar datos existentes en orden correcto para evitar violaciones de foreign key
DO $$
BEGIN
  -- Primero limpiar las referencias de foreign keys
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    UPDATE employees SET current_ticket_id = NULL WHERE current_ticket_id IS NOT NULL;
  END IF;
  
  -- Luego limpiar las tablas en orden correcto
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ticket_calls') THEN
    DELETE FROM ticket_calls;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
    DELETE FROM tickets;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    DELETE FROM users;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
    DELETE FROM employees;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carousel_images') THEN
    DELETE FROM carousel_images;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_subcategories') THEN
    DELETE FROM service_subcategories;
  END IF;
END $$;

-- Insertar empleados de demostración
INSERT INTO employees (id, name, position, is_active, total_tickets_served, total_tickets_cancelled, is_paused, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Ana García', 'Agente de Ventas', true, 23, 2, false, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Carlos López', 'Especialista en Seguros', true, 18, 1, false, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003', 'María Rodríguez', 'Agente de Atención', false, 15, 0, false, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active,
  total_tickets_served = EXCLUDED.total_tickets_served,
  total_tickets_cancelled = EXCLUDED.total_tickets_cancelled,
  is_paused = EXCLUDED.is_paused,
  updated_at = now();

-- Insertar usuarios de demostración con contraseñas hasheadas
-- Contraseñas: admin123 -> YWRtaW4xMjNzYWx0X2tleV8yMDI0, emp123 -> ZW1wMTIzc2FsdF9rZXlfMjAyNA==
INSERT INTO users (id, name, username, password_hash, user_type, employee_id, is_active, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'Administrador Principal', 'admin', 'YWRtaW4xMjNzYWx0X2tleV8yMDI0', 'administrador', null, true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440011', 'Ana García', 'ana.garcia', 'ZW1wMTIzc2FsdF9rZXlfMjAyNA==', 'empleado', '550e8400-e29b-41d4-a716-446655440001', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440012', 'Carlos López', 'carlos.lopez', 'ZW1wMTIzc2FsdF9rZXlfMjAyNA==', 'empleado', '550e8400-e29b-41d4-a716-446655440002', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440013', 'Botonera Principal', null, null, 'botonera', null, true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440014', 'Nodo Visualización', null, null, 'nodo', null, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  user_type = EXCLUDED.user_type,
  employee_id = EXCLUDED.employee_id,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insertar algunas imágenes de carrusel de demostración
INSERT INTO carousel_images (name, url, description, is_active, display_order, uploaded_at) VALUES
  ('Promoción Seguros', 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=800', 'Promociones especiales en seguros', true, 1, now()),
  ('Ofertas Especiales', 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=800', 'Ofertas limitadas por tiempo', true, 2, now()),
  ('Nuevos Productos', 'https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&w=800', 'Conoce nuestros nuevos productos', true, 3, now()),
  ('Servicios Premium', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800', 'Servicios premium para clientes VIP', true, 4, now())
ON CONFLICT DO NOTHING;

-- Insertar algunos tickets de demostración
DO $$
DECLARE
  ticket1_id uuid := gen_random_uuid();
  ticket2_id uuid := gen_random_uuid();
  ticket3_id uuid := gen_random_uuid();
  ticket4_id uuid := gen_random_uuid();
  ticket5_id uuid := gen_random_uuid();
BEGIN
  -- Insertar tickets con IDs específicos para poder referenciarlos
  INSERT INTO tickets (id, ticket_number, service_type, service_subtype, status, queue_position, created_at, served_by, served_at, completed_at, wait_time, service_time, total_time, updated_at) VALUES
    (ticket1_id, 1, 'compra', null, 'completed', 1, now() - interval '1 hour', '550e8400-e29b-41d4-a716-446655440001', now() - interval '55 minutes', now() - interval '50 minutes', 300, 300, 600, now()),
    (ticket2_id, 2, 'seguro', null, 'completed', 1, now() - interval '45 minutes', '550e8400-e29b-41d4-a716-446655440002', now() - interval '40 minutes', now() - interval '35 minutes', 300, 420, 720, now()),
    (ticket3_id, 3, 'compra', null, 'being_served', 1, now() - interval '30 minutes', '550e8400-e29b-41d4-a716-446655440001', now() - interval '15 minutes', null, 900, null, null, now()),
    (ticket4_id, 4, 'seguro', null, 'waiting', 1, now() - interval '20 minutes', null, null, null, null, null, null, now()),
    (ticket5_id, 5, 'compra', null, 'waiting', 2, now() - interval '10 minutes', null, null, null, null, null, null, now())
  ON CONFLICT DO NOTHING;
  
  -- Actualizar empleado con ticket actual (después de insertar los tickets)
  UPDATE employees 
  SET current_ticket_id = ticket3_id,
      updated_at = now()
  WHERE id = '550e8400-e29b-41d4-a716-446655440001';
END $$;

-- Insertar subcategorías de servicios de demostración
DO $$
DECLARE
  comp_category_id uuid;
  seg_category_id uuid;
  cons_category_id uuid;
BEGIN
  -- Obtener IDs de las categorías existentes
  SELECT id INTO comp_category_id FROM service_categories WHERE identifier = 'COMP' LIMIT 1;
  SELECT id INTO seg_category_id FROM service_categories WHERE identifier = 'SEG' LIMIT 1;
  SELECT id INTO cons_category_id FROM service_categories WHERE identifier = 'CONS' LIMIT 1;
  
  -- Insertar subcategorías solo si las categorías existen
  IF comp_category_id IS NOT NULL THEN
    INSERT INTO service_subcategories (service_category_id, name, identifier, is_active, display_order, created_at, updated_at) VALUES
      (comp_category_id, 'Medicamentos', 'MEDICAMENTOS', true, 1, now(), now()),
      (comp_category_id, 'Productos de Salud', 'SALUD', true, 2, now(), now())
    ON CONFLICT (service_category_id, identifier) DO UPDATE SET
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      display_order = EXCLUDED.display_order,
      updated_at = now();
  END IF;
  
  IF seg_category_id IS NOT NULL THEN
    INSERT INTO service_subcategories (service_category_id, name, identifier, is_active, display_order, created_at, updated_at) VALUES
      (seg_category_id, 'Carnet de Identidad', 'CARNET', true, 1, now(), now()),
      (seg_category_id, 'Documentos', 'DOCUMENTOS', true, 2, now(), now())
    ON CONFLICT (service_category_id, identifier) DO UPDATE SET
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      display_order = EXCLUDED.display_order,
      updated_at = now();
  END IF;
  
  IF cons_category_id IS NOT NULL THEN
    INSERT INTO service_subcategories (service_category_id, name, identifier, is_active, display_order, created_at, updated_at) VALUES
      (cons_category_id, 'Información General', 'INFO', true, 1, now(), now()),
      (cons_category_id, 'Soporte Técnico', 'SOPORTE', true, 2, now(), now())
    ON CONFLICT (service_category_id, identifier) DO UPDATE SET
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active,
      display_order = EXCLUDED.display_order,
      updated_at = now();
  END IF;
END $$;

-- Insertar algunas llamadas de tickets de demostración
DO $$
DECLARE
  ticket3_id uuid;
BEGIN
  -- Obtener el ID del ticket que está siendo atendido
  SELECT id INTO ticket3_id FROM tickets WHERE ticket_number = 3 AND status = 'being_served' LIMIT 1;
  
  IF ticket3_id IS NOT NULL THEN
    INSERT INTO ticket_calls (ticket_id, employee_id, called_at, announcement_text) VALUES
      (ticket3_id, '550e8400-e29b-41d4-a716-446655440001', now() - interval '15 minutes', 'Ticket número 003, favor dirigirse con Ana García')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;