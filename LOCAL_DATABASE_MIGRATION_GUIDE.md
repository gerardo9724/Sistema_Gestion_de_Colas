# 🚀 Guía de Desarrollo: Sistema Modular de Colas con Base de Datos Local

## 📋 Visión General

Este documento proporciona una guía detallada para desarrollar el sistema modular de gestión de colas utilizando una base de datos local en lugar de Firebase. El sistema se desarrollará en fases, siguiendo una arquitectura modular donde cada componente se comunica a través de una base de datos compartida.

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO CORE                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Gestión de    │  │   Sistema de    │  │  Dashboard  │ │
│  │   Empresas      │  │   Licencias     │  │ Superusuario│ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
        ┌───────────▼───┐ ┌───▼───┐ ┌───▼────────┐
        │   SUCURSAL A  │ │SUCUR B│ │ SUCURSAL C │
        │               │ │       │ │            │
        │ ┌───┐ ┌─────┐ │ │┌─────┐│ │ ┌────────┐ │
        │ │BOT│ │NODO │ │ ││NODO ││ │ │EMPLEADO│ │
        │ └───┘ └─────┘ │ │└─────┘│ │ └────────┘ │
        │ ┌─────────────┐│ │      │ │            │
        │ │  EMPLEADO   ││ │      │ │            │
        │ └─────────────┘│ │      │ │            │
        └───────────────┘ └──────┘ └────────────┘
```

## 🛠️ Stack Tecnológico

- **Frontend**: React con TypeScript, Tailwind CSS
- **Backend**: Node.js con Express (para el módulo CORE)
- **Base de Datos**: PostgreSQL (local) con Supabase
- **ORM**: Prisma o TypeORM
- **Comunicación en Tiempo Real**: WebSockets
- **Autenticación**: JWT
- **Contenedorización**: Docker (opcional)

## 🗓️ Plan de Desarrollo por Fases

### 🏗️ FASE 1: CONFIGURACIÓN INICIAL (Semana 1)

#### Objetivos:
- Configurar la base de datos local
- Establecer la estructura del proyecto
- Definir esquemas y migraciones

#### Tareas Detalladas:

1. **Configuración de Base de Datos Local**
   ```bash
   # Instalar Supabase CLI (si no está instalado)
   npm install -g supabase

   # Inicializar proyecto Supabase
   supabase init

   # Iniciar Supabase localmente
   supabase start
   ```

2. **Crear Esquema de Base de Datos**
   - Crear archivo de migración para las tablas principales:
     - `companies` (empresas)
     - `branches` (sucursales)
     - `stations` (estaciones)
     - `employees` (empleados)
     - `users` (usuarios)
     - `tickets` (tickets)
     - `service_categories` (categorías de servicio)
     - `licenses` (licencias)

3. **Configurar Estructura del Proyecto**
   ```bash
   # Crear estructura de directorios
   mkdir -p {core,botonera,nodo,empleado,admin,shared}
   mkdir -p shared/{types,utils,components,hooks}
   ```

### 🔐 FASE 2: SISTEMA DE LICENCIAS Y CORE (Semanas 2-3)

#### Objetivos:
- Desarrollar el sistema de generación y validación de licencias
- Implementar APIs básicas del CORE
- Crear dashboard de superusuario

#### Tareas Detalladas:

1. **Sistema de Licencias**
   - Crear servicio de generación de licencias con encriptación
   - Implementar validador de licencias
   - Desarrollar middleware de validación

2. **APIs del CORE**
   - Implementar endpoints para gestión de empresas
   - Crear APIs para gestión de sucursales
   - Desarrollar endpoints para estaciones

3. **Dashboard de Superusuario**
   - Crear interfaz para gestión de empresas
   - Implementar panel de licencias
   - Desarrollar vista de monitoreo global

### 🧩 FASE 3: ADAPTACIÓN DE MÓDULOS (Semanas 4-6)

#### Objetivos:
- Adaptar los módulos existentes para usar la base de datos local
- Implementar comunicación entre módulos
- Configurar validación de licencias en cada módulo

#### Tareas Detalladas:

1. **Módulo Botonera**
   - Adaptar para usar Supabase en lugar de Firebase
   - Implementar identificación de estación
   - Integrar validación de licencias

2. **Módulo Nodo**
   - Migrar a Supabase para datos en tiempo real
   - Adaptar para mostrar solo tickets de su sucursal
   - Implementar configuración desde CORE

3. **Módulo Empleado**
   - Adaptar autenticación para usar Supabase
   - Migrar gestión de tickets a la nueva estructura
   - Implementar filtrado por sucursal

4. **Módulo Admin**
   - Adaptar para administración local
   - Implementar gestión de usuarios y permisos
   - Migrar reportes y estadísticas

### 🔄 FASE 4: COMUNICACIÓN EN TIEMPO REAL (Semana 7)

#### Objetivos:
- Implementar sistema de comunicación en tiempo real
- Configurar suscripciones a cambios en la base de datos
- Desarrollar sistema de notificaciones

#### Tareas Detalladas:

1. **Implementar WebSockets**
   - Configurar servidor WebSocket en el CORE
   - Implementar cliente WebSocket en cada módulo
   - Crear sistema de autenticación para WebSockets

2. **Suscripciones a Cambios**
   - Utilizar Supabase Realtime para suscripciones
   - Configurar filtros por sucursal
   - Implementar manejo de desconexiones

3. **Sistema de Notificaciones**
   - Desarrollar servicio de notificaciones
   - Implementar anuncios de audio en Nodo
   - Crear alertas visuales en todos los módulos

### 🔍 FASE 5: MULTI-SUCURSAL Y CONFIGURACIÓN (Semanas 8-9)

#### Objetivos:
- Implementar funcionalidad multi-sucursal completa
- Desarrollar sistema de configuración por estación
- Crear sistema de perfiles de usuario

#### Tareas Detalladas:

1. **Funcionalidad Multi-Sucursal**
   - Implementar filtrado de datos por sucursal
   - Desarrollar selector de sucursal en módulos admin
   - Crear sistema de permisos por sucursal

2. **Configuración por Estación**
   - Desarrollar sistema de perfiles de estación
   - Implementar configuración específica por tipo
   - Crear sistema de sincronización de configuración

3. **Perfiles de Usuario**
   - Implementar roles y permisos
   - Desarrollar asignación de usuarios a sucursales
   - Crear sistema de especialización de empleados

### 🧪 FASE 6: PRUEBAS Y OPTIMIZACIÓN (Semana 10)

#### Objetivos:
- Implementar pruebas unitarias y de integración
- Optimizar rendimiento
- Mejorar experiencia de usuario

#### Tareas Detalladas:

1. **Pruebas**
   - Desarrollar pruebas unitarias para servicios críticos
   - Implementar pruebas de integración para flujos principales
   - Crear pruebas end-to-end para escenarios completos

2. **Optimización**
   - Mejorar rendimiento de consultas a la base de datos
   - Implementar caché para datos frecuentes
   - Optimizar carga inicial de aplicaciones

3. **Experiencia de Usuario**
   - Mejorar tiempos de respuesta
   - Implementar feedback visual para acciones
   - Crear guías contextuales para usuarios

### 📚 FASE 7: DOCUMENTACIÓN Y DESPLIEGUE (Semanas 11-12)

#### Objetivos:
- Crear documentación técnica y de usuario
- Preparar sistema para despliegue
- Implementar sistema de respaldo y recuperación

#### Tareas Detalladas:

1. **Documentación**
   - Crear documentación de APIs
   - Desarrollar manuales de usuario por módulo
   - Implementar guías de instalación y configuración

2. **Preparación para Despliegue**
   - Configurar entorno de producción
   - Implementar scripts de despliegue
   - Crear proceso de migración de datos

3. **Respaldo y Recuperación**
   - Desarrollar sistema de respaldo automático
   - Implementar proceso de restauración
   - Crear plan de continuidad

## 🗄️ Esquema de Base de Datos

### Tablas Principales

#### Companies (Empresas)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_id TEXT UNIQUE,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Licenciamiento
    license_key TEXT UNIQUE,
    license_expires_at TIMESTAMP WITH TIME ZONE,
    license_type TEXT,
    
    -- Límites
    max_branches INTEGER DEFAULT 1,
    max_employees INTEGER DEFAULT 10,
    max_stations INTEGER DEFAULT 5,
    
    -- Configuración
    configuration JSONB DEFAULT '{}',
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);
```

#### Branches (Sucursales)
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    manager_name TEXT,
    
    is_active BOOLEAN DEFAULT true,
    timezone TEXT DEFAULT 'America/Mexico_City',
    business_hours JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(company_id, code)
);
```

#### Stations (Estaciones)
```sql
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    station_code TEXT NOT NULL,
    station_type TEXT NOT NULL CHECK (station_type IN ('botonera', 'nodo', 'empleado')),
    name TEXT NOT NULL,
    description TEXT,
    
    hardware_id TEXT,
    ip_address TEXT,
    location TEXT,
    
    configuration JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(branch_id, station_code)
);
```

#### Employees (Empleados)
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id),
    company_id UUID REFERENCES companies(id),
    
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    current_ticket_id UUID,
    total_tickets_served INTEGER DEFAULT 0,
    total_tickets_cancelled INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT false,
    
    specializations JSONB DEFAULT '[]',
    allowed_stations JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Users (Usuarios)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('botonera', 'nodo', 'empleado', 'administrador')),
    employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Tickets (Tickets)
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    station_id UUID REFERENCES stations(id),
    
    number INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    service_subtype TEXT,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'being_served', 'completed', 'cancelled')),
    queue_position INTEGER,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    served_by UUID REFERENCES employees(id),
    cancelled_by UUID REFERENCES employees(id),
    
    wait_time INTEGER,
    service_time INTEGER,
    total_time INTEGER,
    
    cancellation_reason TEXT,
    cancellation_comment TEXT,
    
    -- Derivación
    derived_from UUID REFERENCES employees(id),
    derived_to UUID REFERENCES employees(id),
    derived_at TIMESTAMP WITH TIME ZONE,
    derivation_reason TEXT,
    
    -- Cola
    queue_type TEXT CHECK (queue_type IN ('general', 'personal')),
    assigned_to_employee UUID REFERENCES employees(id),
    
    -- Metadatos
    customer_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);
```

## 🔐 Sistema de Licencias

### Estructura de Licencia
```typescript
interface License {
  id: string;
  companyId: string;
  licenseKey: string;
  licenseType: 'trial' | 'basic' | 'professional' | 'enterprise';
  
  // Validez
  issuedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  
  // Límites
  maxBranches: number;
  maxEmployees: number;
  maxStations: number;
  
  // Características
  features: {
    multiCompany: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
  };
  
  // Módulos habilitados
  enabledModules: {
    core: boolean;
    botonera: boolean;
    nodo: boolean;
    empleado: boolean;
    admin: boolean;
  };
}
```

## 🔄 Migración de Firebase a Base de Datos Local

### Estrategia de Migración

1. **Mapeo de Colecciones a Tablas**
   - Cada colección de Firebase se mapea a una tabla en PostgreSQL
   - Los documentos se convierten en filas
   - Los campos anidados se convierten en columnas JSONB

2. **Adaptación de Consultas**
   - Reemplazar consultas de Firebase por consultas SQL
   - Utilizar Supabase Client para operaciones CRUD
   - Implementar paginación y filtrado eficiente

3. **Migración de Autenticación**
   - Implementar sistema de autenticación basado en JWT
   - Crear tabla de usuarios con contraseñas hasheadas
   - Desarrollar middleware de autenticación

4. **Tiempo Real**
   - Utilizar Supabase Realtime para suscripciones
   - Implementar WebSockets para notificaciones instantáneas
   - Crear sistema de caché para optimizar rendimiento

### Ejemplo de Migración de Servicio

#### Antes (Firebase)
```typescript
// Servicio de tickets con Firebase
export const ticketService = {
  async createTicket(serviceType: string): Promise<Ticket> {
    const ticketNumber = await this.getNextTicketNumber();
    
    const ticketRef = await addDoc(collection(db, 'tickets'), {
      number: ticketNumber,
      serviceType,
      status: 'waiting',
      createdAt: serverTimestamp()
    });
    
    return {
      id: ticketRef.id,
      number: ticketNumber,
      serviceType,
      status: 'waiting',
      createdAt: new Date()
    };
  },
  
  // Más métodos...
}
```

#### Después (Supabase)
```typescript
// Servicio de tickets con Supabase
export const ticketService = {
  async createTicket(serviceType: string, branchId: string): Promise<Ticket> {
    const ticketNumber = await this.getNextTicketNumber(branchId);
    
    const { data, error } = await supabase
      .from('tickets')
      .insert({
        number: ticketNumber,
        service_type: serviceType,
        status: 'waiting',
        branch_id: branchId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      number: data.number,
      serviceType: data.service_type,
      status: data.status,
      branchId: data.branch_id,
      createdAt: new Date(data.created_at)
    };
  },
  
  // Más métodos...
}
```

## 📊 Monitoreo y Métricas

### Métricas a Implementar

1. **Métricas de Rendimiento**
   - Tiempo de respuesta de APIs
   - Tiempo de carga de aplicaciones
   - Uso de recursos del servidor

2. **Métricas de Negocio**
   - Tickets generados por hora/día
   - Tiempo promedio de atención
   - Tasa de cancelación de tickets
   - Eficiencia de empleados

3. **Métricas de Licencias**
   - Uso de recursos vs. límites
   - Tiempo restante de licencias
   - Validaciones de licencia por día

### Herramientas de Monitoreo

1. **Monitoreo de Base de Datos**
   - Uso de pgAdmin o similar para monitoreo de PostgreSQL
   - Implementación de índices para optimizar consultas
   - Configuración de alertas para problemas de rendimiento

2. **Monitoreo de Aplicación**
   - Implementación de logging estructurado
   - Uso de herramientas como Sentry para errores
   - Desarrollo de dashboard de estado del sistema

## 🚀 Despliegue

### Opciones de Despliegue

1. **Despliegue Local**
   - Configuración para servidor local
   - Instrucciones para instalación en red local
   - Requerimientos de hardware y software

2. **Despliegue en Nube**
   - Configuración para proveedores cloud
   - Instrucciones para escalabilidad
   - Opciones de alta disponibilidad

### Requisitos de Sistema

1. **Servidor**
   - CPU: 4+ cores
   - RAM: 8GB+ (recomendado 16GB)
   - Almacenamiento: 100GB+ SSD
   - SO: Linux (Ubuntu/Debian recomendado)

2. **Clientes**
   - Navegadores modernos (Chrome, Firefox, Edge)
   - Conexión estable a la red
   - Resolución mínima: 1280x720

## 📝 Conclusión

Esta guía proporciona un plan detallado para desarrollar el sistema modular de gestión de colas utilizando una base de datos local PostgreSQL con Supabase en lugar de Firebase. Siguiendo estas fases y tareas, podrás transformar el sistema actual en una plataforma modular, multi-sucursal y escalable con un sistema de licencias robusto.

El enfoque modular permitirá una mayor flexibilidad, mantenibilidad y escalabilidad, mientras que la base de datos local proporcionará mayor control sobre los datos y mejor rendimiento en entornos de red local.