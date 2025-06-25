// Tipos principales del sistema
export interface Ticket {
  id: string;
  number: number;
  serviceType: string;
  serviceSubtype?: string;
  status: 'waiting' | 'being_served' | 'completed' | 'cancelled';
  queuePosition: number;
  createdAt: Date;
  servedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  servedBy?: string;
  cancelledBy?: string;
  waitTime?: number;
  serviceTime?: number;
  totalTime?: number;
  cancellationReason?: string;
  cancellationComment?: string;
  // UPDATED: Enhanced derivation workflow fields
  derivedFrom?: string; // ID of employee who derived this ticket
  derivedTo?: string; // ID of employee this ticket was derived to
  derivedAt?: Date; // When the ticket was derived
  derivationReason?: string; // Reason for derivation
  queueType?: 'general' | 'personal'; // Type of queue (general or personal to employee)
  assignedToEmployee?: string; // For personal queues - which employee this is assigned to
  priority?: 'normal' | 'high' | 'urgent'; // Priority level
}

export interface ServiceCategory {
  id: string;
  name: string;
  identifier: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  icon?: string;
  color?: string;
  createdAt: Date;
  subcategories: ServiceSubcategory[];
}

export interface ServiceSubcategory {
  id: string;
  serviceCategoryId: string;
  name: string;
  identifier: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  estimatedTime?: number;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  isActive: boolean;
  currentTicketId?: string;
  totalTicketsServed: number;
  totalTicketsCancelled: number;
  isPaused: boolean;
  userId?: string;
  createdAt: Date;
  // Enhanced personal queue management
  personalQueueCount?: number; // Number of tickets in personal queue
  maxPersonalQueueSize?: number; // Maximum tickets allowed in personal queue
  autoAcceptDerivations?: boolean; // Auto-accept derived tickets
}

export interface User {
  id: string;
  name: string;
  username?: string;
  password?: string;
  type: 'botonera' | 'nodo' | 'empleado' | 'administrador';
  employeeId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ComputerProfile {
  id: string;
  computerIdentifier: string;
  profileType: 'botonera' | 'nodo' | 'empleado';
  profileName: string;
  isActive: boolean;
  assignedUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  id: string;
  printTickets: boolean;
  printerName?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyLogo?: string;
  selectedTicketTemplate: string;
  autoAssignTickets: boolean;
  enableAudioNotifications: boolean;
  enableVisualNotifications: boolean;
  notificationVolume: number;
  language: 'es' | 'en' | 'pt';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  nodeConfiguration?: string; // JSON string for node configuration
  updatedAt: Date;
}

// UPDATED: Independent Node Configuration Interface with ticket colors
export interface NodeConfiguration {
  id: string;
  
  // Display Settings
  autoRotationInterval: number; // milliseconds
  showQueueInfo: boolean;
  showCompanyLogo: boolean;
  showCompanyName: boolean; // Option to show/hide company name in header
  maxTicketsDisplayed: number;
  showDateTime: boolean;
  showConnectionStatus: boolean;
  showHeader: boolean; // Option to show/hide header
  showCarousel: boolean; // Option to show/hide carousel
  showStatusBar: boolean; // Option to show/hide status bar
  compactMode: boolean;
  
  // Audio Settings
  enableAudio: boolean;
  audioVolume: number; // 0.0 to 1.0
  selectedVoice: string;
  speechRate: number; // 0.5 to 1.5
  
  // Visual Settings
  backgroundColor: string; // hex color
  headerColor: string; // hex color
  textColor: string; // hex color
  accentColor: string; // hex color
  
  // NEW: Ticket Color Settings
  ticketBeingServedColor: string; // hex color for tickets being served
  ticketCompletedColor: string; // hex color for completed tickets
  
  // Animation Settings
  enableAnimations: boolean;
  highlightDuration: number; // milliseconds
  transitionDuration: number; // milliseconds
  
  // Content Settings
  showImageDescriptions: boolean;
  showImageIndicators: boolean;
  pauseOnHover: boolean;
  
  // Carousel Text Settings
  carouselTitle: string; // Customizable carousel title
  enableScrollingText: boolean; // Enable scrolling text animation
  scrollingSpeed: number; // Speed of scrolling animation (1-10)
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface CarouselImage {
  id: string;
  name: string;
  url: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  displayDuration?: number;
  uploadedAt: Date;
  createdBy?: string;
}

export interface TicketTemplate {
  id: string;
  name: string;
  template: string;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
  paperSize: 'thermal_58mm' | 'thermal_80mm' | 'a4' | 'letter';
  createdAt: Date;
  createdBy?: string;
}

export interface CancellationReason {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  requiresComment: boolean;
  createdAt: Date;
}

export interface PrintSettings {
  enablePrint: boolean;
  printerName?: string;
  paperSize: 'thermal_58mm' | 'thermal_80mm' | 'a4' | 'letter';
  copies: number;
  autoClose: boolean;
  testMode: boolean;
}

// ENHANCED: Ticket Derivation Interface with better tracking
export interface TicketDerivation {
  id: string;
  ticketId: string;
  fromEmployeeId: string;
  toEmployeeId?: string; // undefined if derived to general queue
  derivationType: 'to_employee' | 'to_general_queue';
  reason?: string;
  comment?: string;
  newServiceType?: string;
  derivedAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'auto_assigned';
}

export interface AppState {
  tickets: Ticket[];
  serviceCategories: ServiceCategory[];
  employees: Employee[];
  users: User[];
  computerProfiles: ComputerProfile[];
  systemSettings: SystemSettings | null;
  nodeConfiguration: NodeConfiguration | null; // Independent node configuration
  carouselImages: CarouselImage[];
  ticketTemplates: TicketTemplate[];
  cancellationReasons: CancellationReason[];
  ticketDerivations: TicketDerivation[]; // Track derivations
  currentUser: User | null;
  currentEmployee: Employee | null;
  currentComputerProfile: ComputerProfile | null;
  isAuthenticated: boolean;
  isFirebaseConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastTicketCall: {
    ticketId: string;
    ticketNumber: number;
    employeeName: string;
    calledAt: Date;
  } | null;
  printSettings: PrintSettings;
}