import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, Ticket, ServiceCategory, PrintSettings, User, Employee, CarouselImage, ComputerProfile, SystemSettings, NodeConfiguration } from '../types';
import { ticketService } from '../services/ticketService';
import { serviceService } from '../services/serviceService';
import { employeeService } from '../services/employeeService';
import { userService } from '../services/userService';
import { carouselService } from '../services/carouselService';
import { computerProfileService, getComputerIdentifier } from '../services/computerProfileService';
import { systemSettingsService } from '../services/systemSettingsService';
import { nodeConfigurationService } from '../services/nodeConfigurationService';
import { printService } from '../services/printService';
import { testFirebaseConnection } from '../services/firebase';

// Initial state
const initialState: AppState = {
  tickets: [],
  serviceCategories: [],
  employees: [],
  users: [],
  computerProfiles: [],
  systemSettings: null,
  nodeConfiguration: null, // NEW: Independent node configuration
  carouselImages: [],
  ticketTemplates: [],
  cancellationReasons: [],
  currentUser: null,
  currentEmployee: null,
  currentComputerProfile: null,
  isAuthenticated: false,
  isFirebaseConnected: false,
  isLoading: false,
  error: null,
  lastTicketCall: null,
  printSettings: {
    enablePrint: true,
    paperSize: 'thermal_80mm',
    copies: 1,
    autoClose: true,
    testMode: false,
  },
};

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FIREBASE_CONNECTED'; payload: boolean }
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'SET_SERVICE_CATEGORIES'; payload: ServiceCategory[] }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_COMPUTER_PROFILES'; payload: ComputerProfile[] }
  | { type: 'SET_SYSTEM_SETTINGS'; payload: SystemSettings | null }
  | { type: 'SET_NODE_CONFIGURATION'; payload: NodeConfiguration | null } // NEW
  | { type: 'SET_CAROUSEL_IMAGES'; payload: CarouselImage[] }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_CURRENT_EMPLOYEE'; payload: Employee | null }
  | { type: 'SET_CURRENT_COMPUTER_PROFILE'; payload: ComputerProfile | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_PRINT_SETTINGS'; payload: Partial<PrintSettings> }
  | { type: 'LOAD_INITIAL_DATA' }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ALL_DATA' };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_FIREBASE_CONNECTED':
      return { ...state, isFirebaseConnected: action.payload };
    
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload };
    
    case 'SET_SERVICE_CATEGORIES':
      return { ...state, serviceCategories: action.payload };
    
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'SET_COMPUTER_PROFILES':
      return { ...state, computerProfiles: action.payload };
    
    case 'SET_SYSTEM_SETTINGS':
      return { ...state, systemSettings: action.payload };
    
    case 'SET_NODE_CONFIGURATION': // NEW
      return { ...state, nodeConfiguration: action.payload };
    
    case 'SET_CAROUSEL_IMAGES':
      return { ...state, carouselImages: action.payload };
    
    case 'ADD_TICKET':
      return { ...state, tickets: [action.payload, ...state.tickets] };
    
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    
    case 'SET_CURRENT_EMPLOYEE':
      return { ...state, currentEmployee: action.payload };
    
    case 'SET_CURRENT_COMPUTER_PROFILE':
      return { ...state, currentComputerProfile: action.payload };
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    case 'SET_PRINT_SETTINGS':
      return { 
        ...state, 
        printSettings: { ...state.printSettings, ...action.payload } 
      };
    
    case 'LOGOUT':
      return {
        ...state,
        currentUser: null,
        currentEmployee: null,
        isAuthenticated: false,
      };
    
    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        isFirebaseConnected: state.isFirebaseConnected,
        printSettings: state.printSettings,
        currentComputerProfile: state.currentComputerProfile,
        systemSettings: state.systemSettings,
        nodeConfiguration: state.nodeConfiguration, // NEW
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  createTicket: (serviceType: string, serviceSubtype?: string) => Promise<Ticket>;
  loadInitialData: () => Promise<void>;
  checkComputerProfile: () => Promise<void>;
  updateSystemSettings: (updates: Partial<SystemSettings>) => Promise<void>;
  updateNodeConfiguration: (updates: Partial<NodeConfiguration>) => Promise<void>; // NEW
  saveCompleteNodeConfiguration: (config: Partial<NodeConfiguration>) => Promise<void>; // NEW
  updatePrintSettings: (settings: Partial<PrintSettings>) => void;
  testPrint: () => Promise<boolean>;
  previewTicket: (ticket: Ticket) => void;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Test Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testFirebaseConnection();
      dispatch({ type: 'SET_FIREBASE_CONNECTED', payload: isConnected });
    };
    
    checkConnection();
  }, []);

  // Check computer profile on mount
  useEffect(() => {
    if (state.isFirebaseConnected) {
      checkComputerProfile();
    }
  }, [state.isFirebaseConnected]);

  // Set up real-time listeners when connected
  useEffect(() => {
    if (!state.isFirebaseConnected) return;

    console.log('Setting up real-time listeners...');

    // Subscribe to tickets
    const unsubscribeTickets = ticketService.subscribeToTickets((tickets) => {
      dispatch({ type: 'SET_TICKETS', payload: tickets });
    });

    // Subscribe to service categories
    const unsubscribeServices = serviceService.subscribeToServiceCategories((categories) => {
      dispatch({ type: 'SET_SERVICE_CATEGORIES', payload: categories });
    });

    // Subscribe to employees
    const unsubscribeEmployees = employeeService.subscribeToEmployees((employees) => {
      dispatch({ type: 'SET_EMPLOYEES', payload: employees });
    });

    // Subscribe to users
    const unsubscribeUsers = userService.subscribeToUsers((users) => {
      dispatch({ type: 'SET_USERS', payload: users });
    });

    // Subscribe to computer profiles
    const unsubscribeComputerProfiles = computerProfileService.subscribeToComputerProfiles((profiles) => {
      dispatch({ type: 'SET_COMPUTER_PROFILES', payload: profiles });
    });

    // Subscribe to system settings
    const unsubscribeSystemSettings = systemSettingsService.subscribeToSystemSettings((settings) => {
      dispatch({ type: 'SET_SYSTEM_SETTINGS', payload: settings });
    });

    // NEW: Subscribe to node configuration
    const unsubscribeNodeConfiguration = nodeConfigurationService.subscribeToNodeConfiguration((config) => {
      dispatch({ type: 'SET_NODE_CONFIGURATION', payload: config });
    });

    // Subscribe to carousel images
    const unsubscribeCarousel = carouselService.subscribeToCarouselImages((images) => {
      dispatch({ type: 'SET_CAROUSEL_IMAGES', payload: images });
    });

    return () => {
      console.log('Cleaning up real-time listeners...');
      unsubscribeTickets();
      unsubscribeServices();
      unsubscribeEmployees();
      unsubscribeUsers();
      unsubscribeComputerProfiles();
      unsubscribeSystemSettings();
      unsubscribeNodeConfiguration(); // NEW
      unsubscribeCarousel();
    };
  }, [state.isFirebaseConnected]);

  // Check computer profile and auto-assign if configured
  const checkComputerProfile = async () => {
    if (!state.isFirebaseConnected) return;

    try {
      const computerIdentifier = getComputerIdentifier();
      const profile = await computerProfileService.getProfileByComputerIdentifier(computerIdentifier);
      
      if (profile) {
        dispatch({ type: 'SET_CURRENT_COMPUTER_PROFILE', payload: profile });
        
        // Auto-assign user based on profile type
        if (profile.profileType === 'botonera') {
          const botoneraUser = {
            id: 'botonera-auto',
            name: profile.profileName,
            type: 'botonera' as const,
            isActive: true,
            createdAt: new Date(),
          };
          dispatch({ type: 'SET_CURRENT_USER', payload: botoneraUser });
        } else if (profile.profileType === 'nodo') {
          const nodoUser = {
            id: 'nodo-auto',
            name: profile.profileName,
            type: 'nodo' as const,
            isActive: true,
            createdAt: new Date(),
          };
          dispatch({ type: 'SET_CURRENT_USER', payload: nodoUser });
        } else if (profile.profileType === 'empleado' && profile.assignedUserId) {
          // For employee profiles, we need to load the actual user
          const users = await userService.getAllUsers();
          const assignedUser = users.find(u => u.id === profile.assignedUserId);
          if (assignedUser) {
            const tempUser = {
              ...assignedUser,
              id: `temp-${assignedUser.type}`,
            };
            dispatch({ type: 'SET_CURRENT_USER', payload: tempUser });
          }
        }
      }
    } catch (error) {
      console.error('Error checking computer profile:', error);
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    if (!state.isFirebaseConnected) {
      dispatch({ type: 'SET_ERROR', payload: 'No connection to Firebase' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('Loading initial data...');
      
      const [tickets, serviceCategories, employees, users, computerProfiles, systemSettings, nodeConfiguration, carouselImages] = await Promise.all([
        ticketService.getAllTickets(),
        serviceService.getAllServiceCategories(),
        employeeService.getAllEmployees(),
        userService.getAllUsers(),
        computerProfileService.getAllComputerProfiles(),
        systemSettingsService.getSystemSettings(),
        nodeConfigurationService.getNodeConfiguration(), // NEW
        carouselService.getAllCarouselImages(),
      ]);

      dispatch({ type: 'SET_TICKETS', payload: tickets });
      dispatch({ type: 'SET_SERVICE_CATEGORIES', payload: serviceCategories });
      dispatch({ type: 'SET_EMPLOYEES', payload: employees });
      dispatch({ type: 'SET_USERS', payload: users });
      dispatch({ type: 'SET_COMPUTER_PROFILES', payload: computerProfiles });
      dispatch({ type: 'SET_SYSTEM_SETTINGS', payload: systemSettings });
      dispatch({ type: 'SET_NODE_CONFIGURATION', payload: nodeConfiguration }); // NEW
      dispatch({ type: 'SET_CAROUSEL_IMAGES', payload: carouselImages });

      console.log('Initial data loaded successfully');
    } catch (error) {
      console.error('Error loading initial data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update system settings
  const updateSystemSettings = async (updates: Partial<SystemSettings>) => {
    if (!state.systemSettings) {
      throw new Error('No system settings found');
    }

    try {
      await systemSettingsService.updateSystemSettings(state.systemSettings.id, updates);
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  };

  // NEW: Update node configuration
  const updateNodeConfiguration = async (updates: Partial<NodeConfiguration>) => {
    try {
      const existingConfig = state.nodeConfiguration;
      if (existingConfig) {
        await nodeConfigurationService.updateNodeConfiguration(existingConfig.id, updates);
      } else {
        // Create new configuration if none exists
        await nodeConfigurationService.createDefaultConfiguration();
      }
    } catch (error) {
      console.error('Error updating node configuration:', error);
      throw error;
    }
  };

  // NEW: Save complete node configuration
  const saveCompleteNodeConfiguration = async (config: Partial<NodeConfiguration>) => {
    try {
      await nodeConfigurationService.saveCompleteConfiguration(config);
    } catch (error) {
      console.error('Error saving complete node configuration:', error);
      throw error;
    }
  };

  // Create ticket function with automatic printing
  const createTicket = async (serviceType: string, serviceSubtype?: string): Promise<Ticket> => {
    if (!state.isFirebaseConnected) {
      throw new Error('No connection to Firebase');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const newTicket = await ticketService.createTicket(serviceType, serviceSubtype);
      dispatch({ type: 'ADD_TICKET', payload: newTicket });

      // Auto-print ticket if enabled
      if (state.printSettings.enablePrint) {
        try {
          const printSuccess = await printService.printTicket(
            newTicket,
            state.serviceCategories,
            {
              enablePrint: true,
              paperSize: state.printSettings.paperSize,
              copies: state.printSettings.copies,
              autoClose: state.printSettings.autoClose,
            },
            state.systemSettings || undefined
          );

          if (printSuccess) {
            console.log(`Ticket ${newTicket.number} printed successfully`);
          } else {
            console.warn(`Failed to print ticket ${newTicket.number}`);
          }
        } catch (printError) {
          console.error('Print error:', printError);
          // Don't throw print errors, just log them
        }
      }

      return newTicket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create ticket' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update print settings
  const updatePrintSettings = (settings: Partial<PrintSettings>) => {
    dispatch({ type: 'SET_PRINT_SETTINGS', payload: settings });
  };

  // Test print functionality
  const testPrint = async (): Promise<boolean> => {
    try {
      return await printService.testPrint();
    } catch (error) {
      console.error('Test print failed:', error);
      return false;
    }
  };

  // Preview ticket
  const previewTicket = (ticket: Ticket) => {
    printService.previewTicket(
      ticket,
      state.serviceCategories,
      state.systemSettings || undefined
    );
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      createTicket,
      loadInitialData,
      checkComputerProfile,
      updateSystemSettings,
      updateNodeConfiguration, // NEW
      saveCompleteNodeConfiguration, // NEW
      updatePrintSettings,
      testPrint,
      previewTicket,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}