# 📋 Especificaciones Técnicas - Sistema Modular de Colas

## 🏗️ Arquitectura del Sistema

### Arquitectura General
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

### Stack Tecnológico

#### Frontend
- **Framework**: React 18+ con TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand o Redux Toolkit
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library

#### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js o Fastify
- **Language**: TypeScript
- **API**: REST + WebSockets (Socket.io)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI

#### Base de Datos
- **Primary**: PostgreSQL 15+
- **Cache**: Redis
- **ORM**: Prisma o TypeORM
- **Migrations**: Prisma Migrate
- **Backup**: pg_dump automatizado

#### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack
- **Deployment**: Docker Swarm o Kubernetes

## 🗄️ Esquema de Base de Datos Detallado

### Tablas Principales

#### 1. Companies (Empresas)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50) UNIQUE,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Licenciamiento
    license_key VARCHAR(255) UNIQUE,
    license_expires_at TIMESTAMP,
    license_type VARCHAR(50), -- 'trial', 'basic', 'professional', 'enterprise'
    
    -- Límites
    max_branches INTEGER DEFAULT 1,
    max_employees INTEGER DEFAULT 10,
    max_stations INTEGER DEFAULT 5,
    
    -- Configuración
    configuration JSONB DEFAULT '{}',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);
```

#### 2. Branches (Sucursales)
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL, -- Código único por empresa
    address TEXT,
    phone VARCHAR(20),
    manager_name VARCHAR(255),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Configuración operativa
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    business_hours JSONB DEFAULT '{}', -- Horarios de operación
    
    -- Configuración específica
    configuration JSONB DEFAULT '{}',
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, code)
);
```

#### 3. Stations (Estaciones/Dispositivos)
```sql
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    -- Identificación
    station_code VARCHAR(50) NOT NULL,
    station_type VARCHAR(20) NOT NULL CHECK (station_type IN ('botonera', 'nodo', 'empleado')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hardware
    hardware_id VARCHAR(255), -- ID único del hardware/MAC address
    ip_address INET,
    location VARCHAR(255), -- Ubicación física
    
    -- Configuración
    configuration JSONB DEFAULT '{}',
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(branch_id, station_code)
);
```

#### 4. Licenses (Licencias)
```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Licencia
    license_key VARCHAR(255) UNIQUE NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    
    -- Características habilitadas
    features JSONB NOT NULL DEFAULT '{}',
    
    -- Límites
    max_branches INTEGER NOT NULL,
    max_employees INTEGER NOT NULL,
    max_stations INTEGER NOT NULL,
    max_concurrent_users INTEGER DEFAULT 100,
    
    -- Validez
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadatos
    created_by VARCHAR(255), -- Quien emitió la licencia
    notes TEXT,
    
    -- Uso
    last_validated_at TIMESTAMP,
    validation_count INTEGER DEFAULT 0
);
```

### Modificaciones a Tablas Existentes

#### Employees (Empleados)
```sql
ALTER TABLE employees ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE employees ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE employees ADD COLUMN station_id UUID REFERENCES stations(id);
ALTER TABLE employees ADD COLUMN specializations JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN allowed_stations JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN max_personal_queue INTEGER DEFAULT 5;
ALTER TABLE employees ADD COLUMN auto_accept_derivations BOOLEAN DEFAULT true;
```

#### Tickets (Tickets)
```sql
ALTER TABLE tickets ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE tickets ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE tickets ADD COLUMN station_id UUID REFERENCES stations(id);
ALTER TABLE tickets ADD COLUMN customer_info JSONB DEFAULT '{}';
ALTER TABLE tickets ADD COLUMN metadata JSONB DEFAULT '{}';
```

#### Service Categories (Categorías de Servicio)
```sql
ALTER TABLE service_categories ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE service_categories ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE service_categories ADD COLUMN allowed_stations JSONB DEFAULT '[]';
```

### Nuevas Tablas Especializadas

#### Station Configurations (Configuraciones de Estación)
```sql
CREATE TABLE station_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    
    -- Configuración específica por tipo
    botonera_config JSONB,
    nodo_config JSONB,
    empleado_config JSONB,
    
    -- Servicios permitidos
    allowed_services JSONB DEFAULT '[]',
    
    -- Restricciones
    restrictions JSONB DEFAULT '{}',
    
    -- Versión de configuración
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Employee Specializations (Especializaciones de Empleados)
```sql
CREATE TABLE employee_specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    service_type VARCHAR(100) NOT NULL,
    specialization_level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'intermediate', 'expert'
    
    certified_at TIMESTAMP,
    expires_at TIMESTAMP,
    certified_by UUID REFERENCES employees(id),
    
    can_train_others BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### System Logs (Logs del Sistema)
```sql
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contexto
    company_id UUID REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    station_id UUID REFERENCES stations(id),
    user_id UUID,
    
    -- Log
    level VARCHAR(20) NOT NULL, -- 'info', 'warn', 'error', 'debug'
    category VARCHAR(50) NOT NULL, -- 'auth', 'ticket', 'system', etc.
    action VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔐 Sistema de Licencias

### Estructura de Licencia
```typescript
interface LicenseData {
  // Identificación
  companyId: string;
  licenseKey: string;
  licenseType: 'trial' | 'basic' | 'professional' | 'enterprise';
  
  // Validez
  issuedAt: Date;
  expiresAt: Date;
  
  // Límites
  maxBranches: number;
  maxEmployees: number;
  maxStations: number;
  maxConcurrentUsers: number;
  
  // Características
  features: {
    multiCompany: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    backupRestore: boolean;
    auditLogs: boolean;
    sso: boolean;
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

### Tipos de Licencia

#### Trial (30 días)
```json
{
  "licenseType": "trial",
  "maxBranches": 1,
  "maxEmployees": 3,
  "maxStations": 5,
  "maxConcurrentUsers": 10,
  "features": {
    "multiCompany": false,
    "advancedReports": false,
    "apiAccess": false,
    "customBranding": false,
    "prioritySupport": false,
    "backupRestore": false,
    "auditLogs": false,
    "sso": false
  }
}
```

#### Basic
```json
{
  "licenseType": "basic",
  "maxBranches": 1,
  "maxEmployees": 10,
  "maxStations": 15,
  "maxConcurrentUsers": 50,
  "features": {
    "multiCompany": false,
    "advancedReports": true,
    "apiAccess": false,
    "customBranding": false,
    "prioritySupport": false,
    "backupRestore": true,
    "auditLogs": false,
    "sso": false
  }
}
```

#### Professional
```json
{
  "licenseType": "professional",
  "maxBranches": 5,
  "maxEmployees": 50,
  "maxStations": 100,
  "maxConcurrentUsers": 200,
  "features": {
    "multiCompany": false,
    "advancedReports": true,
    "apiAccess": true,
    "customBranding": true,
    "prioritySupport": true,
    "backupRestore": true,
    "auditLogs": true,
    "sso": false
  }
}
```

#### Enterprise
```json
{
  "licenseType": "enterprise",
  "maxBranches": -1,
  "maxEmployees": -1,
  "maxStations": -1,
  "maxConcurrentUsers": -1,
  "features": {
    "multiCompany": true,
    "advancedReports": true,
    "apiAccess": true,
    "customBranding": true,
    "prioritySupport": true,
    "backupRestore": true,
    "auditLogs": true,
    "sso": true
  }
}
```

## 🔌 APIs entre Módulos

### Core API Endpoints

#### Gestión de Empresas
```typescript
// GET /api/v1/companies
// POST /api/v1/companies
// PUT /api/v1/companies/:id
// DELETE /api/v1/companies/:id

interface CreateCompanyRequest {
  name: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  licenseType: 'trial' | 'basic' | 'professional' | 'enterprise';
}
```

#### Gestión de Sucursales
```typescript
// GET /api/v1/companies/:companyId/branches
// POST /api/v1/companies/:companyId/branches
// PUT /api/v1/branches/:id
// DELETE /api/v1/branches/:id

interface CreateBranchRequest {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerName?: string;
  timezone?: string;
  businessHours?: BusinessHours;
  configuration?: BranchConfiguration;
}
```

#### Gestión de Estaciones
```typescript
// GET /api/v1/branches/:branchId/stations
// POST /api/v1/branches/:branchId/stations
// PUT /api/v1/stations/:id
// DELETE /api/v1/stations/:id

interface RegisterStationRequest {
  stationCode: string;
  stationType: 'botonera' | 'nodo' | 'empleado';
  name: string;
  description?: string;
  hardwareId?: string;
  location?: string;
  configuration?: StationConfiguration;
}
```

### Module Communication Protocol

#### Heartbeat
```typescript
// POST /api/v1/stations/:stationId/heartbeat
interface HeartbeatRequest {
  timestamp: Date;
  status: 'online' | 'offline' | 'error';
  metrics?: {
    cpuUsage: number;
    memoryUsage: number;
    activeUsers: number;
  };
}
```

#### Configuration Sync
```typescript
// GET /api/v1/stations/:stationId/configuration
interface ConfigurationResponse {
  stationConfiguration: StationConfiguration;
  branchConfiguration: BranchConfiguration;
  companyConfiguration: CompanyConfiguration;
  lastUpdated: Date;
}
```

## 🚀 Configuración de Despliegue

### Docker Compose para Desarrollo
```yaml
version: '3.8'

services:
  # Base de datos
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: colas_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d

  # Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Módulo CORE
  core-module:
    build:
      context: ./core-module
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:dev_password@postgres:5432/colas_system
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev_jwt_secret
      - LICENSE_SECRET=dev_license_secret
    volumes:
      - ./core-module:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  # Módulo Botonera
  botonera-module:
    build:
      context: ./botonera-module
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - CORE_API_URL=http://core-module:3000
      - STATION_TYPE=botonera
    volumes:
      - ./botonera-module:/app
      - /app/node_modules
    depends_on:
      - core-module

  # Módulo Nodo
  nodo-module:
    build:
      context: ./nodo-module
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=development
      - CORE_API_URL=http://core-module:3000
      - STATION_TYPE=nodo
    volumes:
      - ./nodo-module:/app
      - /app/node_modules
    depends_on:
      - core-module

  # Módulo Empleado
  empleado-module:
    build:
      context: ./empleado-module
      dockerfile: Dockerfile.dev
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=development
      - CORE_API_URL=http://core-module:3000
      - STATION_TYPE=empleado
    volumes:
      - ./empleado-module:/app
      - /app/node_modules
    depends_on:
      - core-module

  # Módulo Admin
  admin-module:
    build:
      context: ./admin-module
      dockerfile: Dockerfile.dev
    ports:
      - "3004:3000"
    environment:
      - NODE_ENV=development
      - CORE_API_URL=http://core-module:3000
      - STATION_TYPE=admin
    volumes:
      - ./admin-module:/app
      - /app/node_modules
    depends_on:
      - core-module

volumes:
  postgres_data:
  redis_data:
```

### Configuración de Producción
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Proxy reverso
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - core-module

  # Base de datos con replicación
  postgres-primary:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: colas_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: ${REPLICATION_PASSWORD}
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
      - ./database/postgresql.conf:/etc/postgresql/postgresql.conf

  # Monitoreo
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_primary_data:
  grafana_data:
```

## 📊 Monitoreo y Métricas

### Métricas de Sistema
- CPU y memoria por módulo
- Latencia de APIs
- Throughput de requests
- Errores por minuto
- Conexiones de base de datos

### Métricas de Negocio
- Tickets generados por hora
- Tiempo promedio de atención
- Empleados activos
- Estaciones conectadas
- Satisfacción del cliente

### Alertas
- Caída de módulos
- Latencia alta (>500ms)
- Errores críticos
- Licencias próximas a vencer
- Uso excesivo de recursos

---

**NOTA**: Estas especificaciones técnicas deben revisarse y ajustarse según los requisitos específicos del proyecto y las limitaciones de infraestructura disponible.