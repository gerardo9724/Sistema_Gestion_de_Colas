# 🚀 Pasos Detallados para Desarrollo de Partes Restantes

## 📋 Estado Actual del Proyecto

### ✅ Lo que YA tenemos implementado:
- Sistema base de gestión de colas funcional
- Módulos: Botonera, Nodo, Empleado, Administrador
- Base de datos Firebase configurada
- Autenticación y usuarios
- Sistema de tickets completo
- Interfaz de usuario responsive
- Gestión de empleados y servicios
- Sistema de derivación de tickets
- Configuración de nodos
- Impresión de tickets

### 🔄 Lo que necesitamos TRANSFORMAR para el sistema modular:

## 🎯 FASE 1: REESTRUCTURACIÓN MODULAR (Semanas 1-2)

### Paso 1.1: Crear Estructura de Monorepo
```bash
# Crear nueva estructura de directorios
mkdir sistema-colas-modular
cd sistema-colas-modular

# Crear workspaces para cada módulo
mkdir -p {core-module,botonera-module,nodo-module,empleado-module,admin-module,shared}
mkdir -p shared/{database,types,services,utils,components}
mkdir -p license-system
mkdir -p deployment
```

### Paso 1.2: Configurar Package.json Principal
```json
{
  "name": "sistema-colas-modular",
  "private": true,
  "workspaces": [
    "core-module",
    "botonera-module", 
    "nodo-module",
    "empleado-module",
    "admin-module",
    "shared/*",
    "license-system"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:core\" \"npm run dev:botonera\" \"npm run dev:nodo\" \"npm run dev:empleado\" \"npm run dev:admin\"",
    "dev:core": "npm run dev --workspace=core-module",
    "dev:botonera": "npm run dev --workspace=botonera-module",
    "dev:nodo": "npm run dev --workspace=nodo-module",
    "dev:empleado": "npm run dev --workspace=empleado-module",
    "dev:admin": "npm run dev --workspace=admin-module",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

### Paso 1.3: Migrar Tipos Compartidos
```typescript
// shared/types/core.ts - Extraer de src/types/index.ts actual
export interface Company {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  licenseKey?: string;
  licenseExpiresAt?: Date;
  maxBranches: number;
  maxEmployees: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerName?: string;
  isActive: boolean;
  timezone: string;
  businessHours?: BusinessHours;
  configuration?: BranchConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface Station {
  id: string;
  branchId: string;
  stationCode: string;
  stationType: 'botonera' | 'nodo' | 'empleado';
  name: string;
  description?: string;
  hardwareId?: string;
  ipAddress?: string;
  location?: string;
  configuration?: StationConfiguration;
  isActive: boolean;
  lastHeartbeat?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Extender tipos existentes
export interface Ticket extends BaseTicket {
  companyId: string;
  branchId: string;
  stationId?: string;
  customerInfo?: CustomerInfo;
  metadata?: TicketMetadata;
}

export interface Employee extends BaseEmployee {
  companyId: string;
  branchId: string;
  stationId?: string;
  specializations: string[];
  allowedStations: string[];
  maxPersonalQueue: number;
  autoAcceptDerivations: boolean;
}
```

## 🏗️ FASE 2: DESARROLLO DEL MÓDULO CORE (Semanas 3-5)

### Paso 2.1: Crear Base del Módulo CORE
```bash
cd core-module
npm init -y
npm install express cors helmet morgan compression
npm install @types/express @types/cors @types/node typescript ts-node nodemon -D
```

### Paso 2.2: Estructura del CORE
```
core-module/
├── src/
│   ├── controllers/
│   │   ├── CompanyController.ts
│   │   ├── BranchController.ts
│   │   ├── StationController.ts
│   │   └── LicenseController.ts
│   ├── services/
│   │   ├── CompanyService.ts
│   │   ├── BranchService.ts
│   │   ├── StationService.ts
│   │   └── LicenseService.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── license.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── companies.ts
│   │   ├── branches.ts
│   │   ├── stations.ts
│   │   └── licenses.ts
│   ├── database/
│   │   ├── connection.ts
│   │   └── migrations/
│   ├── utils/
│   │   ├── encryption.ts
│   │   └── validation.ts
│   └── app.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── CompanyManagement/
│   │   │   ├── BranchManagement/
│   │   │   ├── StationManagement/
│   │   │   └── LicenseManagement/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   └── package.json
└── package.json
```

### Paso 2.3: Implementar APIs del CORE

#### CompanyController.ts
```typescript
import { Request, Response } from 'express';
import { CompanyService } from '../services/CompanyService';
import { LicenseService } from '../services/LicenseService';

export class CompanyController {
  private companyService = new CompanyService();
  private licenseService = new LicenseService();

  async createCompany(req: Request, res: Response) {
    try {
      const companyData = req.body;
      
      // Crear empresa
      const company = await this.companyService.create(companyData);
      
      // Generar licencia inicial
      const license = await this.licenseService.generateLicense({
        companyId: company.id,
        licenseType: companyData.licenseType || 'trial',
        duration: companyData.licenseType === 'trial' ? 30 : 365
      });
      
      res.status(201).json({
        company,
        license: {
          key: license.licenseKey,
          expiresAt: license.expiresAt
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCompanies(req: Request, res: Response) {
    try {
      const companies = await this.companyService.getAll();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const company = await this.companyService.update(id, updateData);
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.companyService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### Paso 2.4: Sistema de Licencias

#### LicenseService.ts
```typescript
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class LicenseService {
  private secretKey = process.env.LICENSE_SECRET || 'default-secret';

  async generateLicense(data: GenerateLicenseRequest): Promise<License> {
    const licenseData = {
      companyId: data.companyId,
      licenseType: data.licenseType,
      features: this.getFeaturesForType(data.licenseType),
      limits: this.getLimitsForType(data.licenseType),
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000)
    };

    const licenseKey = this.encryptLicense(licenseData);
    
    // Guardar en base de datos
    const license = await this.saveLicense({
      ...licenseData,
      licenseKey
    });

    return license;
  }

  async validateLicense(licenseKey: string): Promise<LicenseValidationResult> {
    try {
      // Verificar en base de datos primero
      const license = await this.getLicenseByKey(licenseKey);
      
      if (!license || !license.isActive) {
        return { isValid: false, reason: 'License not found or inactive' };
      }

      // Verificar expiración
      if (new Date() > license.expiresAt) {
        return { isValid: false, reason: 'License expired' };
      }

      // Desencriptar y validar integridad
      const decryptedData = this.decryptLicense(licenseKey);
      
      return {
        isValid: true,
        data: decryptedData,
        license
      };
    } catch (error) {
      return { isValid: false, reason: 'Invalid license format' };
    }
  }

  private encryptLicense(data: any): string {
    const payload = JSON.stringify(data);
    const token = jwt.sign(payload, this.secretKey, { algorithm: 'HS256' });
    
    // Encriptar el token
    const cipher = crypto.createCipher('aes-256-cbc', this.secretKey);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }

  private decryptLicense(licenseKey: string): any {
    // Desencriptar
    const decipher = crypto.createDecipher('aes-256-cbc', this.secretKey);
    let decrypted = decipher.update(licenseKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Verificar JWT
    const payload = jwt.verify(decrypted, this.secretKey);
    return JSON.parse(payload as string);
  }

  private getFeaturesForType(type: string) {
    const features = {
      trial: {
        multiCompany: false,
        advancedReports: false,
        apiAccess: false,
        customBranding: false
      },
      basic: {
        multiCompany: false,
        advancedReports: true,
        apiAccess: false,
        customBranding: false
      },
      professional: {
        multiCompany: false,
        advancedReports: true,
        apiAccess: true,
        customBranding: true
      },
      enterprise: {
        multiCompany: true,
        advancedReports: true,
        apiAccess: true,
        customBranding: true
      }
    };
    
    return features[type] || features.trial;
  }

  private getLimitsForType(type: string) {
    const limits = {
      trial: { maxBranches: 1, maxEmployees: 3, maxStations: 5 },
      basic: { maxBranches: 1, maxEmployees: 10, maxStations: 15 },
      professional: { maxBranches: 5, maxEmployees: 50, maxStations: 100 },
      enterprise: { maxBranches: -1, maxEmployees: -1, maxStations: -1 }
    };
    
    return limits[type] || limits.trial;
  }
}
```

## 🔧 FASE 3: MIGRACIÓN DE MÓDULOS EXISTENTES (Semanas 6-8)

### Paso 3.1: Migrar Módulo Botonera

#### Estructura del Módulo Botonera
```
botonera-module/
├── src/
│   ├── components/
│   │   ├── ServiceSelector/
│   │   ├── TicketGeneration/
│   │   └── StationConfig/
│   ├── services/
│   │   ├── CoreApiService.ts
│   │   ├── TicketService.ts
│   │   └── LicenseService.ts
│   ├── hooks/
│   │   ├── useStationConfig.ts
│   │   ├── useLicenseValidation.ts
│   │   └── useTicketGeneration.ts
│   ├── utils/
│   │   └── stationIdentification.ts
│   └── App.tsx
└── package.json
```

#### CoreApiService.ts
```typescript
export class CoreApiService {
  private baseUrl: string;
  private licenseKey: string;
  private stationId: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_CORE_API_URL || 'http://localhost:3000';
    this.licenseKey = localStorage.getItem('licenseKey') || '';
    this.stationId = this.getStationId();
  }

  async validateLicense(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/licenses/validate`, {
        headers: {
          'X-License-Key': this.licenseKey,
          'X-Station-Id': this.stationId,
          'X-Module-Type': 'botonera'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('License validation failed:', error);
      return false;
    }
  }

  async getStationConfiguration(): Promise<StationConfiguration> {
    const response = await fetch(`${this.baseUrl}/api/v1/stations/${this.stationId}/configuration`, {
      headers: {
        'X-License-Key': this.licenseKey,
        'X-Module-Type': 'botonera'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get station configuration');
    }
    
    return response.json();
  }

  async createTicket(ticketData: CreateTicketRequest): Promise<Ticket> {
    const response = await fetch(`${this.baseUrl}/api/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': this.licenseKey,
        'X-Station-Id': this.stationId,
        'X-Module-Type': 'botonera'
      },
      body: JSON.stringify({
        ...ticketData,
        stationId: this.stationId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }
    
    return response.json();
  }

  async sendHeartbeat(): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/stations/${this.stationId}/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': this.licenseKey,
        'X-Module-Type': 'botonera'
      },
      body: JSON.stringify({
        timestamp: new Date(),
        status: 'online',
        metrics: {
          activeUsers: 1,
          lastActivity: new Date()
        }
      })
    });
  }

  private getStationId(): string {
    let stationId = localStorage.getItem('stationId');
    
    if (!stationId) {
      // Generar ID único basado en características del navegador/dispositivo
      const fingerprint = this.generateFingerprint();
      stationId = `botonera-${fingerprint}`;
      localStorage.setItem('stationId', stationId);
    }
    
    return stationId;
  }

  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Station fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Crear hash simple
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }
}
```

### Paso 3.2: Migrar Módulo Empleado

#### Estructura del Módulo Empleado
```
empleado-module/
├── src/
│   ├── components/
│   │   ├── TicketManagement/
│   │   ├── QueueDisplay/
│   │   ├── EmployeeProfile/
│   │   └── StationConfig/
│   ├── services/
│   │   ├── CoreApiService.ts
│   │   ├── TicketService.ts
│   │   └── EmployeeService.ts
│   ├── hooks/
│   │   ├── useEmployeeAuth.ts
│   │   ├── useTicketQueue.ts
│   │   └── useStationConfig.ts
│   └── App.tsx
└── package.json
```

#### useEmployeeAuth.ts
```typescript
export const useEmployeeAuth = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [station, setStation] = useState<Station | null>(null);
  const coreApi = new CoreApiService();

  useEffect(() => {
    // Verificar autenticación al cargar
    checkAuthentication();
    
    // Verificar licencia
    validateLicense();
    
    // Obtener configuración de estación
    loadStationConfig();
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('employeeToken');
    if (token) {
      try {
        const employeeData = await coreApi.validateEmployeeToken(token);
        setEmployee(employeeData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('employeeToken');
      }
    }
  };

  const validateLicense = async () => {
    const isValid = await coreApi.validateLicense();
    if (!isValid) {
      // Mostrar mensaje de licencia inválida
      throw new Error('Invalid license');
    }
  };

  const loadStationConfig = async () => {
    try {
      const stationConfig = await coreApi.getStationConfiguration();
      setStation(stationConfig);
    } catch (error) {
      console.error('Failed to load station configuration:', error);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const result = await coreApi.employeeLogin(username, password);
      
      if (result.success) {
        localStorage.setItem('employeeToken', result.token);
        setEmployee(result.employee);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('employeeToken');
    setEmployee(null);
    setIsAuthenticated(false);
  };

  return {
    employee,
    isAuthenticated,
    station,
    login,
    logout
  };
};
```

### Paso 3.3: Migrar Módulo Nodo

#### Estructura del Módulo Nodo
```
nodo-module/
├── src/
│   ├── components/
│   │   ├── QueueDisplay/
│   │   ├── CarouselDisplay/
│   │   ├── AudioManager/
│   │   └── StatusBar/
│   ├── services/
│   │   ├── CoreApiService.ts
│   │   ├── TicketService.ts
│   │   └── AudioService.ts
│   ├── hooks/
│   │   ├── useRealTimeUpdates.ts
│   │   ├── useAudioAnnouncements.ts
│   │   └── useNodeConfiguration.ts
│   └── App.tsx
└── package.json
```

#### useRealTimeUpdates.ts
```typescript
export const useRealTimeUpdates = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const coreApi = new CoreApiService();

  useEffect(() => {
    // Establecer conexión WebSocket con el CORE
    const ws = new WebSocket(`${coreApi.getWebSocketUrl()}/nodo`);
    
    ws.onopen = () => {
      setIsConnected(true);
      
      // Autenticar conexión
      ws.send(JSON.stringify({
        type: 'auth',
        licenseKey: coreApi.getLicenseKey(),
        stationId: coreApi.getStationId(),
        moduleType: 'nodo'
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'tickets_update':
          setTickets(message.data);
          break;
        case 'employees_update':
          setEmployees(message.data);
          break;
        case 'ticket_called':
          // Trigger audio announcement
          handleTicketCalled(message.data);
          break;
        case 'configuration_update':
          // Reload configuration
          window.location.reload();
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Intentar reconectar después de 5 segundos
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleTicketCalled = (ticketData: any) => {
    // Implementar lógica de anuncio de audio
    const audioService = new AudioService();
    audioService.announceTicket(ticketData);
  };

  return {
    tickets,
    employees,
    isConnected
  };
};
```

## 🔄 FASE 4: INTEGRACIÓN Y COMUNICACIÓN (Semanas 9-10)

### Paso 4.1: Implementar WebSocket para Tiempo Real

#### WebSocketService.ts (en CORE)
```typescript
import { WebSocketServer } from 'ws';
import { Server } from 'http';

export class WebSocketService {
  private wss: WebSocketServer;
  private connections = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.removeConnection(ws);
      });
    });
  }

  private async handleMessage(ws: any, data: any) {
    switch (data.type) {
      case 'auth':
        await this.authenticateConnection(ws, data);
        break;
      case 'subscribe':
        this.subscribeToUpdates(ws, data);
        break;
    }
  }

  private async authenticateConnection(ws: any, data: any) {
    try {
      // Validar licencia
      const licenseService = new LicenseService();
      const validation = await licenseService.validateLicense(data.licenseKey);
      
      if (!validation.isValid) {
        ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid license' }));
        ws.close();
        return;
      }

      // Registrar conexión
      this.connections.set(ws, {
        stationId: data.stationId,
        moduleType: data.moduleType,
        branchId: data.branchId,
        authenticated: true
      });

      ws.send(JSON.stringify({ type: 'auth_success' }));
      
      // Enviar datos iniciales
      this.sendInitialData(ws);
      
    } catch (error) {
      ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication failed' }));
      ws.close();
    }
  }

  public broadcastToModules(moduleType: string, message: any, branchId?: string) {
    this.connections.forEach((connectionInfo, ws) => {
      if (connectionInfo.moduleType === moduleType && 
          (!branchId || connectionInfo.branchId === branchId)) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  public broadcastTicketUpdate(ticket: Ticket) {
    const message = {
      type: 'ticket_update',
      data: ticket
    };

    // Enviar a todos los módulos de la misma sucursal
    this.broadcastToModules('nodo', message, ticket.branchId);
    this.broadcastToModules('empleado', message, ticket.branchId);
    this.broadcastToModules('admin', message, ticket.branchId);
  }

  public broadcastTicketCalled(ticket: Ticket, employee: Employee) {
    const message = {
      type: 'ticket_called',
      data: {
        ticket,
        employee,
        timestamp: new Date()
      }
    };

    // Enviar principalmente a nodos para anuncios de audio
    this.broadcastToModules('nodo', message, ticket.branchId);
  }
}
```

### Paso 4.2: Middleware de Validación de Licencias

#### licenseMiddleware.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/LicenseService';

interface AuthenticatedRequest extends Request {
  license?: any;
  station?: any;
  moduleType?: string;
}

export const validateLicenseMiddleware = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const licenseKey = req.headers['x-license-key'] as string;
    const stationId = req.headers['x-station-id'] as string;
    const moduleType = req.headers['x-module-type'] as string;

    if (!licenseKey) {
      return res.status(401).json({ 
        error: 'License key required',
        code: 'LICENSE_REQUIRED'
      });
    }

    const licenseService = new LicenseService();
    const validation = await licenseService.validateLicense(licenseKey);

    if (!validation.isValid) {
      return res.status(403).json({ 
        error: validation.reason,
        code: 'LICENSE_INVALID'
      });
    }

    // Verificar límites de la licencia
    const limitsCheck = await licenseService.checkLimits(validation.license);
    if (!limitsCheck.withinLimits) {
      return res.status(403).json({
        error: 'License limits exceeded',
        code: 'LICENSE_LIMITS_EXCEEDED',
        details: limitsCheck.violations
      });
    }

    // Verificar que el módulo esté habilitado
    if (!validation.license.enabledModules[moduleType]) {
      return res.status(403).json({
        error: `Module ${moduleType} not enabled in license`,
        code: 'MODULE_NOT_ENABLED'
      });
    }

    // Agregar información a la request
    req.license = validation.license;
    req.moduleType = moduleType;
    
    if (stationId) {
      req.station = await getStationInfo(stationId);
    }

    next();
  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({ 
      error: 'License validation failed',
      code: 'VALIDATION_ERROR'
    });
  }
};

// Middleware específico para cada módulo
export const validateBotoneraAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.moduleType !== 'botonera') {
    return res.status(403).json({ error: 'Access denied for this module type' });
  }
  next();
};

export const validateEmpleadoAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.moduleType !== 'empleado') {
    return res.status(403).json({ error: 'Access denied for this module type' });
  }
  next();
};

export const validateNodoAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.moduleType !== 'nodo') {
    return res.status(403).json({ error: 'Access denied for this module type' });
  }
  next();
};
```

## 🗄️ FASE 5: MIGRACIÓN DE BASE DE DATOS (Semanas 11-12)

### Paso 5.1: Crear Migraciones para Multi-Sucursal

#### 001_add_multi_company_support.sql
```sql
-- Crear tabla de empresas
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
    license_type VARCHAR(50),
    
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

-- Crear tabla de sucursales
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    manager_name VARCHAR(255),
    
    is_active BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    business_hours JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company_id, code)
);

-- Crear tabla de estaciones
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    station_code VARCHAR(50) NOT NULL,
    station_type VARCHAR(20) NOT NULL CHECK (station_type IN ('botonera', 'nodo', 'empleado')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    hardware_id VARCHAR(255),
    ip_address INET,
    location VARCHAR(255),
    
    configuration JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    last_heartbeat TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(branch_id, station_code)
);

-- Crear tabla de licencias
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    license_key VARCHAR(255) UNIQUE NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    features JSONB NOT NULL DEFAULT '{}',
    
    max_branches INTEGER NOT NULL,
    max_employees INTEGER NOT NULL,
    max_stations INTEGER NOT NULL,
    max_concurrent_users INTEGER DEFAULT 100,
    
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    created_by VARCHAR(255),
    notes TEXT,
    
    last_validated_at TIMESTAMP,
    validation_count INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX idx_companies_license_key ON companies(license_key);
CREATE INDEX idx_branches_company_id ON branches(company_id);
CREATE INDEX idx_stations_branch_id ON stations(branch_id);
CREATE INDEX idx_stations_type ON stations(station_type);
CREATE INDEX idx_licenses_company_id ON licenses(company_id);
CREATE INDEX idx_licenses_expires_at ON licenses(expires_at);
```

### Paso 5.2: Migrar Datos Existentes

#### 002_migrate_existing_data.sql
```sql
-- Crear empresa por defecto para datos existentes
INSERT INTO companies (
    id,
    name,
    legal_name,
    license_type,
    max_branches,
    max_employees,
    max_stations,
    is_active
) VALUES (
    gen_random_uuid(),
    'Empresa Principal',
    'Empresa Principal S.A.',
    'professional',
    5,
    50,
    100,
    true
) ON CONFLICT DO NOTHING;

-- Crear sucursal por defecto
INSERT INTO branches (
    id,
    company_id,
    name,
    code,
    is_active
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM companies LIMIT 1),
    'Sucursal Principal',
    'MAIN',
    true
) ON CONFLICT DO NOTHING;

-- Agregar campos a tablas existentes
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES stations(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]';

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES stations(id);

ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Actualizar datos existentes
UPDATE employees SET 
    company_id = (SELECT id FROM companies LIMIT 1),
    branch_id = (SELECT id FROM branches LIMIT 1)
WHERE company_id IS NULL;

UPDATE tickets SET 
    company_id = (SELECT id FROM companies LIMIT 1),
    branch_id = (SELECT id FROM branches LIMIT 1)
WHERE company_id IS NULL;

UPDATE service_categories SET 
    company_id = (SELECT id FROM companies LIMIT 1),
    branch_id = (SELECT id FROM branches LIMIT 1)
WHERE company_id IS NULL;
```

## 🚀 FASE 6: DESPLIEGUE Y CONFIGURACIÓN (Semanas 13-14)

### Paso 6.1: Configurar Docker para Producción

#### docker-compose.prod.yml
```yaml
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
    restart: unless-stopped

  # Base de datos principal
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    restart: unless-stopped

  # Cache Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Módulo CORE
  core-module:
    build:
      context: ./core-module
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - LICENSE_SECRET=${LICENSE_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Módulo Botonera
  botonera-module:
    build:
      context: ./botonera-module
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REACT_APP_CORE_API_URL=https://your-domain.com/api
    restart: unless-stopped

  # Módulo Nodo
  nodo-module:
    build:
      context: ./nodo-module
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REACT_APP_CORE_API_URL=https://your-domain.com/api
    restart: unless-stopped

  # Módulo Empleado
  empleado-module:
    build:
      context: ./empleado-module
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REACT_APP_CORE_API_URL=https://your-domain.com/api
    restart: unless-stopped

  # Módulo Admin
  admin-module:
    build:
      context: ./admin-module
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - REACT_APP_CORE_API_URL=https://your-domain.com/api
    restart: unless-stopped

  # Monitoreo
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  grafana_data:
```

### Paso 6.2: Configurar Nginx para Routing

#### nginx.conf
```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;
    error_log   /var/log/nginx/error.log;

    sendfile        on;
    keepalive_timeout  65;
    gzip  on;

    # Límites de tamaño
    client_max_body_size 10M;

    # Configuración SSL
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Redirección HTTP a HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$host$request_uri;
    }

    # Servidor principal
    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # API del CORE
        location /api/ {
            proxy_pass http://core-module:3000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSockets
        location /ws/ {
            proxy_pass http://core-module:3000/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }

        # Dashboard CORE
        location /core/ {
            proxy_pass http://core-module:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Botonera
        location /botonera/ {
            proxy_pass http://botonera-module:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Nodo
        location /nodo/ {
            proxy_pass http://nodo-module:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Empleado
        location /empleado/ {
            proxy_pass http://empleado-module:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Admin
        location /admin/ {
            proxy_pass http://admin-module:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Monitoreo
        location /monitoring/ {
            proxy_pass http://grafana:3000/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            auth_basic "Restricted Access";
            auth_basic_user_file /etc/nginx/monitoring.htpasswd;
        }

        # Raíz - Redirección al CORE
        location / {
            return 301 /core/;
        }
    }
}
```

## 📊 FASE 7: MONITOREO Y MÉTRICAS (Semana 14)

### Paso 7.1: Configurar Prometheus

#### prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'core-module'
    static_configs:
      - targets: ['core-module:3000']

  - job_name: 'botonera-module'
    static_configs:
      - targets: ['botonera-module:3000']

  - job_name: 'nodo-module'
    static_configs:
      - targets: ['nodo-module:3000']

  - job_name: 'empleado-module'
    static_configs:
      - targets: ['empleado-module:3000']

  - job_name: 'admin-module'
    static_configs:
      - targets: ['admin-module:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Paso 7.2: Implementar Métricas en Módulos

#### metrics.ts (en cada módulo)
```typescript
import client from 'prom-client';

// Crear registro de métricas
const register = new client.Registry();

// Añadir métricas por defecto
client.collectDefaultMetrics({ register });

// Métricas personalizadas
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 5, 15, 50, 100, 500]
});

const ticketsCreatedCounter = new client.Counter({
  name: 'tickets_created_total',
  help: 'Total number of tickets created'
});

const activeEmployeesGauge = new client.Gauge({
  name: 'active_employees',
  help: 'Number of active employees'
});

const queueSizeGauge = new client.Gauge({
  name: 'queue_size',
  help: 'Number of tickets in queue'
});

const averageWaitTimeGauge = new client.Gauge({
  name: 'average_wait_time_seconds',
  help: 'Average wait time in seconds'
});

// Registrar métricas
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(ticketsCreatedCounter);
register.registerMetric(activeEmployeesGauge);
register.registerMetric(queueSizeGauge);
register.registerMetric(averageWaitTimeGauge);

export {
  register,
  httpRequestDurationMicroseconds,
  ticketsCreatedCounter,
  activeEmployeesGauge,
  queueSizeGauge,
  averageWaitTimeGauge
};
```

## 🧪 FASE 8: TESTING Y CALIDAD (Continuo)

### Paso 8.1: Configurar Testing

#### jest.config.js (en cada módulo)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Paso 8.2: Pruebas Unitarias para Servicios Críticos

#### LicenseService.test.ts
```typescript
import { LicenseService } from '../services/LicenseService';

describe('LicenseService', () => {
  let licenseService: LicenseService;
  
  beforeEach(() => {
    process.env.LICENSE_SECRET = 'test-secret';
    licenseService = new LicenseService();
  });
  
  test('should generate a valid license', async () => {
    const licenseData = {
      companyId: 'test-company',
      licenseType: 'trial',
      duration: 30
    };
    
    const license = await licenseService.generateLicense(licenseData);
    
    expect(license).toBeDefined();
    expect(license.licenseKey).toBeDefined();
    expect(license.expiresAt).toBeDefined();
    expect(license.licenseType).toBe('trial');
  });
  
  test('should validate a valid license', async () => {
    const licenseData = {
      companyId: 'test-company',
      licenseType: 'trial',
      duration: 30
    };
    
    const license = await licenseService.generateLicense(licenseData);
    const validation = await licenseService.validateLicense(license.licenseKey);
    
    expect(validation.isValid).toBe(true);
    expect(validation.data).toBeDefined();
    expect(validation.data.companyId).toBe('test-company');
  });
  
  test('should reject an expired license', async () => {
    // Mock para simular una licencia expirada
    jest.spyOn(licenseService as any, 'getLicenseByKey').mockResolvedValue({
      isActive: true,
      expiresAt: new Date(Date.now() - 86400000) // Ayer
    });
    
    const validation = await licenseService.validateLicense('expired-key');
    
    expect(validation.isValid).toBe(false);
    expect(validation.reason).toBe('License expired');
  });
});
```

## 📚 FASE 9: DOCUMENTACIÓN Y CAPACITACIÓN (Semana 14)

### Paso 9.1: Crear Documentación Técnica

#### API_DOCUMENTATION.md
```markdown
# API Documentation - Sistema Modular de Colas

## Autenticación y Licencias

### Validar Licencia
```http
GET /api/v1/licenses/validate
```

**Headers:**
- `X-License-Key`: Clave de licencia
- `X-Station-Id`: ID de la estación
- `X-Module-Type`: Tipo de módulo ('botonera', 'nodo', 'empleado', 'admin', 'core')

**Respuesta Exitosa:**
```json
{
  "isValid": true,
  "license": {
    "companyId": "uuid",
    "licenseType": "professional",
    "features": {
      "multiCompany": false,
      "advancedReports": true,
      "apiAccess": true,
      "customBranding": true
    },
    "limits": {
      "maxBranches": 5,
      "maxEmployees": 50,
      "maxStations": 100
    },
    "expiresAt": "2023-12-31T23:59:59Z"
  }
}
```

**Respuesta de Error:**
```json
{
  "isValid": false,
  "reason": "License expired",
  "code": "LICENSE_EXPIRED"
}
```

### Autenticar Usuario
```http
POST /api/v1/auth/login
```

**Headers:**
- `X-License-Key`: Clave de licencia
- `X-Station-Id`: ID de la estación
- `X-Module-Type`: Tipo de módulo

**Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "role": "admin"
  }
}
```

## Gestión de Empresas

### Crear Empresa
```http
POST /api/v1/companies
```

**Headers:**
- `Authorization`: Bearer token
- `X-License-Key`: Clave de licencia (superadmin)

**Body:**
```json
{
  "name": "Empresa Demo",
  "legalName": "Empresa Demo S.A.",
  "taxId": "ABC123456",
  "address": "Calle Principal 123",
  "phone": "+1234567890",
  "email": "contacto@empresa.com",
  "licenseType": "professional",
  "duration": 365
}
```

**Respuesta Exitosa:**
```json
{
  "company": {
    "id": "uuid",
    "name": "Empresa Demo",
    "legalName": "Empresa Demo S.A.",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00Z"
  },
  "license": {
    "key": "license-key",
    "expiresAt": "2024-01-01T00:00:00Z"
  }
}
```

## Gestión de Sucursales

### Crear Sucursal
```http
POST /api/v1/companies/:companyId/branches
```

**Headers:**
- `Authorization`: Bearer token
- `X-License-Key`: Clave de licencia

**Body:**
```json
{
  "name": "Sucursal Norte",
  "code": "NORTE",
  "address": "Av. Norte 456",
  "phone": "+1234567891",
  "managerName": "Juan Pérez",
  "timezone": "America/Mexico_City",
  "businessHours": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" }
  }
}
```

**Respuesta Exitosa:**
```json
{
  "id": "uuid",
  "companyId": "uuid",
  "name": "Sucursal Norte",
  "code": "NORTE",
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

## Gestión de Estaciones

### Registrar Estación
```http
POST /api/v1/branches/:branchId/stations
```

**Headers:**
- `Authorization`: Bearer token
- `X-License-Key`: Clave de licencia

**Body:**
```json
{
  "stationCode": "BOT-001",
  "stationType": "botonera",
  "name": "Botonera Principal",
  "description": "Botonera en entrada principal",
  "location": "Recepción",
  "configuration": {
    "theme": "light",
    "services": ["COMP", "SEG", "CONS"]
  }
}
```

**Respuesta Exitosa:**
```json
{
  "id": "uuid",
  "branchId": "uuid",
  "stationCode": "BOT-001",
  "stationType": "botonera",
  "name": "Botonera Principal",
  "isActive": true,
  "createdAt": "2023-01-01T00:00:00Z"
}
```

## Gestión de Tickets

### Crear Ticket
```http
POST /api/v1/tickets
```

**Headers:**
- `X-License-Key`: Clave de licencia
- `X-Station-Id`: ID de la estación
- `X-Module-Type`: Tipo de módulo

**Body:**
```json
{
  "serviceType": "COMP",
  "serviceSubtype": "MEDICAMENTOS",
  "priority": "normal",
  "customerInfo": {
    "name": "Cliente Anónimo",
    "phone": ""
  }
}
```

**Respuesta Exitosa:**
```json
{
  "id": "uuid",
  "number": 123,
  "serviceType": "COMP",
  "serviceSubtype": "MEDICAMENTOS",
  "status": "waiting",
  "queuePosition": 5,
  "createdAt": "2023-01-01T12:30:00Z",
  "branchId": "uuid",
  "companyId": "uuid"
}
```

## WebSockets

### Conexión WebSocket
```
ws://your-domain.com/ws
```

**Mensaje de Autenticación:**
```json
{
  "type": "auth",
  "licenseKey": "your-license-key",
  "stationId": "station-id",
  "moduleType": "nodo",
  "branchId": "branch-id"
}
```

**Tipos de Mensajes:**
- `auth_success`: Autenticación exitosa
- `auth_error`: Error de autenticación
- `tickets_update`: Actualización de tickets
- `employees_update`: Actualización de empleados
- `ticket_called`: Ticket llamado para atención
- `configuration_update`: Actualización de configuración
```

### Paso 9.2: Crear Guías de Usuario

#### GUIA_INSTALACION.md
```markdown
# Guía de Instalación - Sistema Modular de Colas

## Requisitos Previos

### Hardware Recomendado
- **Servidor CORE:**
  - CPU: 4 cores o superior
  - RAM: 8GB mínimo
  - Almacenamiento: 100GB SSD
  - Red: 1Gbps

- **Estaciones:**
  - CPU: 2 cores o superior
  - RAM: 4GB mínimo
  - Almacenamiento: 50GB
  - Red: 100Mbps

### Software Requerido
- Docker y Docker Compose
- Nginx (para producción)
- PostgreSQL 15+
- Node.js 18+ (para desarrollo)

## Instalación en Producción

### 1. Clonar Repositorio
```bash
git clone https://github.com/your-repo/sistema-colas-modular.git
cd sistema-colas-modular
```

### 2. Configurar Variables de Entorno
Crear archivo `.env` en la raíz del proyecto:

```
# Base de datos
POSTGRES_DB=colas_system
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Seguridad
JWT_SECRET=your-jwt-secret
LICENSE_SECRET=your-license-secret

# Configuración
NODE_ENV=production
DOMAIN=your-domain.com

# Monitoreo
GRAFANA_PASSWORD=your-grafana-password
```

### 3. Configurar SSL
Colocar certificados SSL en `./nginx/ssl/`:
- `fullchain.pem`
- `privkey.pem`

### 4. Iniciar Sistema
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Crear Superusuario
```bash
docker-compose -f docker-compose.prod.yml exec core-module npm run create-superuser
```

### 6. Acceder al Sistema
- **CORE:** https://your-domain.com/core/
- **Botonera:** https://your-domain.com/botonera/
- **Nodo:** https://your-domain.com/nodo/
- **Empleado:** https://your-domain.com/empleado/
- **Admin:** https://your-domain.com/admin/
- **Monitoreo:** https://your-domain.com/monitoring/

## Configuración Inicial

### 1. Crear Empresa
Acceder al CORE y crear la primera empresa:
- Nombre
- Datos fiscales
- Tipo de licencia

### 2. Crear Sucursal
Dentro de la empresa, crear al menos una sucursal:
- Nombre
- Código
- Ubicación
- Horarios

### 3. Registrar Estaciones
Para cada tipo de estación:
- Código único
- Tipo (botonera, nodo, empleado)
- Ubicación física
- Configuración específica

### 4. Configurar Servicios
- Categorías de servicios
- Subcategorías
- Asignación a sucursales

### 5. Crear Empleados
- Datos personales
- Asignación a sucursal
- Especialidades
- Credenciales

## Actualización del Sistema

### Actualizar a Nueva Versión
```bash
git pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

## Backup y Restauración

### Backup de Base de Datos
```bash
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres colas_system > backup_$(date +%Y%m%d).sql
```

### Restaurar Base de Datos
```bash
cat backup_20230101.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres colas_system
```
```

## 🎯 RESUMEN DE PASOS CRÍTICOS

1. **Reestructuración Modular**
   - Crear estructura de monorepo
   - Migrar tipos compartidos
   - Configurar comunicación entre módulos

2. **Desarrollo del CORE**
   - Implementar sistema de licencias
   - Crear APIs para gestión de empresas/sucursales
   - Desarrollar dashboard de superusuario

3. **Migración de Módulos**
   - Adaptar módulos existentes al nuevo sistema
   - Implementar validación de licencias
   - Configurar comunicación con CORE

4. **Base de Datos Multi-Sucursal**
   - Crear nuevas tablas
   - Modificar tablas existentes
   - Migrar datos actuales

5. **Despliegue y Configuración**
   - Configurar Docker para producción
   - Implementar Nginx para routing
   - Configurar monitoreo y métricas

6. **Testing y Documentación**
   - Implementar pruebas unitarias y de integración
   - Crear documentación técnica y de usuario
   - Preparar guías de instalación y configuración