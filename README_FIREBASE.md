# Firebase Firestore - Estructura de Base de Datos

Este documento describe la estructura completa de la base de datos Firebase Firestore para el Sistema de Gestión de Colas.

## 📋 Colecciones Principales

### 1. **users** - Usuarios del Sistema
Almacena todos los usuarios que pueden acceder al sistema.

```typescript
{
  id: string
  name: string
  username?: string | null
  password?: string | null // Hash de la contraseña
  type: 'botonera' | 'nodo' | 'empleado' | 'administrador'
  employeeId?: string | null // Referencia al empleado
  isActive: boolean
  lastLogin?: Date | null
  createdAt: Date
  updatedAt?: Date
}
```

### 2. **employees** - Empleados
Información de los empleados que atienden tickets.

```typescript
{
  id: string
  name: string
  position: string
  isActive: boolean
  currentTicket?: string | null // ID del ticket actual
  totalTicketsServed: number
  totalTicketsCancelled: number
  isPaused: boolean
  userId?: string | null // Referencia al usuario
  workSchedule?: object // Horarios de trabajo
  createdAt: Date
  updatedAt?: Date
}
```

### 3. **serviceCategories** - Categorías de Servicios
Servicios principales que ofrece el sistema.

```typescript
{
  id: string
  name: string
  identifier: string // Código único (ej: COMP, SEG, CONS)
  description?: string | null
  isActive: boolean
  displayOrder: number
  icon?: string | null // Icono de Lucide React
  color?: string | null // Color hexadecimal
  createdAt: Date
  updatedAt?: Date
}
```

### 4. **serviceSubcategories** - Subcategorías
Subcategorías dentro de cada servicio principal.

```typescript
{
  id: string
  serviceCategoryId: string // Referencia a la categoría padre
  name: string
  identifier: string
  description?: string | null
  isActive: boolean
  displayOrder: number
  estimatedTime?: number | null // Tiempo estimado en minutos
  createdAt: Date
  updatedAt?: Date
}
```

### 5. **tickets** - Tickets del Sistema
Tickets generados por los usuarios.

```typescript
{
  id: string
  number: number // Número secuencial
  type: string // Tipo de servicio
  subtype?: string | null // Subtipo de servicio
  status: 'waiting' | 'being_served' | 'completed' | 'cancelled'
  queuePosition?: number | null
  priority: 'normal' | 'high' | 'urgent'
  
  // Timestamps
  createdAt: Date
  servedAt?: Date | null
  completedAt?: Date | null
  cancelledAt?: Date | null
  
  // Referencias
  servedBy?: string | null // ID del empleado
  cancelledBy?: string | null
  createdByUserId?: string | null
  
  // Tiempos en segundos
  waitTime?: number | null
  serviceTime?: number | null
  totalTime?: number | null
  
  // Cancelación
  cancellationReason?: string | null
  cancellationComment?: string | null
  
  // Info del cliente
  customerInfo?: object | null
  
  updatedAt?: Date
}
```

### 6. **carouselImages** - Imágenes Publicitarias
Imágenes para el carrusel de publicidad.

```typescript
{
  id: string
  name: string
  url: string
  description?: string | null
  isActive: boolean
  displayOrder: number
  displayDuration?: number | null // Duración en segundos
  uploadedAt: Date
  createdBy?: string | null
}
```

### 7. **ticketTemplates** - Plantillas de Tickets
Plantillas HTML para la impresión de tickets.

```typescript
{
  id: string
  name: string
  template: string // HTML de la plantilla
  isDefault: boolean
  isActive: boolean
  description?: string | null
  paperSize: 'thermal_58mm' | 'thermal_80mm' | 'a4' | 'letter'
  createdAt: Date
  updatedAt?: Date
  createdBy?: string | null
}
```

### 8. **cancellationReasons** - Motivos de Cancelación
Motivos predefinidos para cancelar tickets.

```typescript
{
  id: string
  name: string
  description?: string | null
  isActive: boolean
  displayOrder: number
  requiresComment: boolean
  createdAt: Date
}
```

### 9. **systemSettings** - Configuración del Sistema
Configuración global del sistema (documento único con ID 'main').

```typescript
{
  id: 'main'
  
  // Impresión
  printTickets: boolean
  printerName?: string | null
  selectedTicketTemplate: string
  
  // Empresa
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail?: string | null
  companyWebsite?: string | null
  companyLogo?: string | null
  
  // Cola
  maxQueueSize?: number | null
  autoAssignTickets: boolean
  ticketExpirationTime?: number | null
  
  // Notificaciones
  enableAudioNotifications: boolean
  enableVisualNotifications: boolean
  notificationVolume: number
  
  // Horarios
  businessHours?: object
  
  // Localización
  language: 'es' | 'en' | 'pt'
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  
  updatedAt: Date
  updatedBy?: string | null
}
```

### 10. **ticketCalls** - Llamadas de Tickets
Registro de llamadas a tickets para el sistema de audio.

```typescript
{
  id: string
  ticketId: string
  employeeId: string
  calledAt: Date
  announcementText?: string | null
  isAcknowledged: boolean
  acknowledgedAt?: Date | null
}
```

### 11. **statistics** - Estadísticas
Estadísticas diarias del sistema (ID formato: YYYY-MM-DD).

```typescript
{
  id: string // YYYY-MM-DD
  date: Date
  
  // Contadores
  totalTickets: number
  completedTickets: number
  cancelledTickets: number
  activeTickets: number
  
  // Tiempos promedio
  averageWaitTime: number
  averageServiceTime: number
  averageTotalTime: number
  
  // Por empleado
  employeeStats: object
  
  // Por servicio
  serviceStats: object
  
  // Por hora
  hourlyStats: object
  
  // Cancelaciones
  cancellationReasons: object
  
  createdAt: Date
  updatedAt: Date
}
```

### 12. **activityLogs** - Logs de Actividad
Registro de todas las actividades del sistema.

```typescript
{
  id: string
  timestamp: Date
  userId?: string | null
  employeeId?: string | null
  action: string
  entityType: 'ticket' | 'employee' | 'user' | 'service' | 'system'
  entityId?: string | null
  details?: any
  ipAddress?: string | null
  userAgent?: string | null
}
```

## 🔐 Reglas de Seguridad

Las reglas de seguridad de Firestore están definidas en el archivo `firestoreCollections.ts` y incluyen:

- **Usuarios**: Lectura para autenticados, escritura para admins o el propio usuario
- **Empleados**: Lectura para autenticados, escritura para admins
- **Servicios**: Lectura pública, escritura para admins
- **Tickets**: Lectura para autenticados, creación pública, actualización para empleados/admins
- **Configuración**: Solo admins
- **Estadísticas**: Lectura para autenticados, escritura para admins

## 📊 Índices Recomendados

Los índices están definidos en `FIRESTORE_INDEXES` e incluyen:

- Tickets por estado y fecha
- Tickets por empleado y estado
- Servicios por orden de visualización
- Usuarios por tipo y estado
- Estadísticas por fecha
- Logs por timestamp y tipo

## 🚀 Inicialización

Para inicializar la base de datos:

```typescript
import { setupFirestore } from './services/firestoreSetup'

// Configurar Firestore con datos de demostración
await setupFirestore()
```

## 🔄 Sincronización en Tiempo Real

El sistema incluye sincronización en tiempo real para:

- Tickets (creación, actualización, cancelación)
- Estado de empleados
- Llamadas de tickets
- Estadísticas en vivo

## 📱 Uso en la Aplicación

Cada colección tiene su servicio correspondiente en `firestoreService.ts`:

- `usersService`
- `employeesService`
- `serviceCategoriesService`
- `ticketsService`
- `carouselImagesService`
- `ticketTemplatesService`
- `cancellationReasonsService`
- `systemSettingsService`

## 🛠️ Herramientas de Desarrollo

- `verifyFirestoreSetup()`: Verificar configuración
- `clearAllCollections()`: Limpiar todas las colecciones (solo desarrollo)
- `testFirestoreConnection()`: Probar conexión

## 📋 Datos de Demostración

El sistema incluye datos de demostración:

- 3 empleados de ejemplo
- 5 usuarios (admin, empleados, botonera, nodo)
- 3 categorías de servicios con subcategorías
- 4 imágenes de carrusel
- 6 motivos de cancelación
- Configuración inicial del sistema

## 🔧 Configuración de Firebase

Asegúrate de tener configurado Firebase en `src/lib/firebase.ts` con las credenciales correctas:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
}
```