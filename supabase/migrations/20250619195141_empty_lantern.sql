/*
  # Queue Management System Database Schema

  1. New Tables
    - `employees` - Employee management and statistics
    - `users` - Authentication and user management
    - `service_categories` - Main service types
    - `service_subcategories` - Service subcategories
    - `tickets` - Core queue management
    - `carousel_images` - Advertisement images
    - `ticket_templates` - Customizable ticket templates
    - `cancellation_reasons` - Predefined cancellation reasons
    - `system_settings` - Application configuration
    - `ticket_calls` - Audio announcement log

  2. Security
    - Enable RLS on all tables
    - Add policies for different user types
    - Secure access based on user roles

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for queue operations
*/

-- Employees table
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  is_active boolean DEFAULT true,
  current_ticket_id uuid,
  total_tickets_served integer DEFAULT 0,
  total_tickets_cancelled integer DEFAULT 0,
  is_paused boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  username text UNIQUE,
  password_hash text,
  user_type text NOT NULL CHECK (user_type IN ('botonera', 'nodo', 'empleado', 'administrador')),
  employee_id uuid REFERENCES employees(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service categories
CREATE TABLE service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  identifier text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service subcategories
CREATE TABLE service_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category_id uuid NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  identifier text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_category_id, identifier)
);

-- Tickets table
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number integer NOT NULL,
  service_type text NOT NULL,
  service_subtype text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'being_served', 'completed', 'cancelled')),
  queue_position integer,
  created_at timestamptz DEFAULT now(),
  served_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  served_by uuid REFERENCES employees(id),
  cancelled_by uuid REFERENCES employees(id),
  wait_time integer,
  service_time integer,
  total_time integer,
  cancellation_reason text,
  cancellation_comment text,
  created_by_user_id uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key for current_ticket_id after tickets table exists
ALTER TABLE employees 
ADD CONSTRAINT employees_current_ticket_fk 
FOREIGN KEY (current_ticket_id) REFERENCES tickets(id);

-- Carousel images
CREATE TABLE carousel_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Ticket templates
CREATE TABLE ticket_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_html text NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Cancellation reasons
CREATE TABLE cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- System settings
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Ticket calls
CREATE TABLE ticket_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id),
  employee_id uuid NOT NULL REFERENCES employees(id),
  called_at timestamptz DEFAULT now(),
  announcement_text text
);

-- Create indexes
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_served_by ON tickets(served_by);
CREATE INDEX idx_tickets_service_type ON tickets(service_type);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_service_categories_identifier ON service_categories(identifier);
CREATE INDEX idx_service_subcategories_category_id ON service_subcategories(service_category_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_calls ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (simplified)
CREATE POLICY "Enable read access for authenticated users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON service_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON service_subcategories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON carousel_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON ticket_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON cancellation_reasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for authenticated users" ON ticket_calls FOR SELECT TO authenticated USING (true);

-- Insert policies for specific operations
CREATE POLICY "Enable insert for authenticated users" ON tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON tickets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ticket_calls FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default data
INSERT INTO cancellation_reasons (name, description, display_order) VALUES
  ('Cliente no se presentó', 'El cliente no se presentó después de ser llamado múltiples veces', 1),
  ('Documentación incompleta', 'El cliente no cuenta con la documentación necesaria para el trámite', 2),
  ('Servicio no disponible', 'El servicio solicitado no está disponible en este momento', 3),
  ('Cliente desistió', 'El cliente decidió no continuar con el trámite', 4),
  ('Error del sistema', 'Problemas técnicos que impiden completar el servicio', 5),
  ('Otro', 'Otro motivo no especificado en las opciones anteriores', 6);

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('company_name', 'Sistema de Gestión de Colas', 'string', 'Nombre de la empresa'),
  ('company_address', 'Av. Principal 123, Ciudad', 'string', 'Dirección de la empresa'),
  ('company_phone', '+1 (555) 123-4567', 'string', 'Teléfono de la empresa'),
  ('print_tickets', 'true', 'boolean', 'Habilitar impresión automática de tickets'),
  ('selected_ticket_template', '', 'string', 'ID de la plantilla de ticket seleccionada'),
  ('auto_assign_tickets', 'true', 'boolean', 'Asignación automática de tickets a empleados'),
  ('max_wait_time_alert', '1800', 'number', 'Tiempo máximo de espera antes de alerta (segundos)');

INSERT INTO service_categories (name, identifier, display_order) VALUES
  ('Compra', 'COMP', 1),
  ('Seguro', 'SEG', 2),
  ('Consulta', 'CONS', 3);

-- Default ticket template
INSERT INTO ticket_templates (name, template_html, is_default, is_active) VALUES
  ('Plantilla Predeterminada', '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket #{TICKET_NUMBER}</title>
  <style>
    @page { size: 72mm auto; margin: 0; }
    body { font-family: "Courier New", monospace; font-size: 11px; line-height: 1.3; margin: 0; padding: 8px; width: 64mm; background: white; text-align: center; }
    .header { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .company-name { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
    .company-info { font-size: 9px; margin-bottom: 2px; }
    .ticket-number { font-size: 22px; font-weight: bold; margin: 12px 0; border: 2px solid #000; padding: 8px; }
    .service-info { margin: 8px 0; }
    .service-name { font-size: 13px; font-weight: bold; margin-bottom: 4px; }
    .queue-info { background: #f0f0f0; padding: 6px; margin: 8px 0; border: 1px solid #ccc; }
    .footer { border-top: 2px dashed #000; padding-top: 8px; margin-top: 12px; font-size: 9px; }
    .instructions { margin-top: 8px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{COMPANY_NAME}</div>
    <div class="company-info">{COMPANY_ADDRESS}</div>
    <div class="company-info">{COMPANY_PHONE}</div>
  </div>
  <div class="ticket-number">TICKET #{TICKET_NUMBER}</div>
  <div class="service-info">
    <div class="service-name">{SERVICE_NAME}</div>
    {SUBSERVICE_SECTION}
  </div>
  <div class="queue-info">
    <div><strong>Posición en cola:</strong> {QUEUE_POSITION}</div>
    <div><strong>Fecha:</strong> {DATE}</div>
    <div><strong>Hora:</strong> {TIME}</div>
  </div>
  <div class="instructions">
    <p><strong>INSTRUCCIONES:</strong></p>
    <p>• Conserve este ticket hasta ser atendido</p>
    <p>• Espere su turno en la sala de espera</p>
    <p>• Esté atento al llamado de su número</p>
  </div>
  <div class="footer">
    <div>¡Gracias por su visita!</div>
    <div>Sistema de Gestión de Colas</div>
  </div>
</body>
</html>', true, true);