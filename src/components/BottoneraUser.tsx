import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Users, Clock, Pill, CreditCard, MessageCircle, ClipboardList, Banknote, FileText, Wifi, WifiOff, Printer, Settings, Building } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import PrintSettingsPanel from './PrintSettingsPanel';
import type { Ticket } from '../types';

export default function BottoneraUser() {
  const { state, dispatch, createTicket, loadInitialData } = useApp();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSubservice, setSelectedSubservice] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [lastTicket, setLastTicket] = useState<Ticket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintSettings, setShowPrintSettings] = useState(false);

  // Load initial data when component mounts
  useEffect(() => {
    if (state.isFirebaseConnected && state.serviceCategories.length === 0) {
      loadInitialData();
    }
  }, [state.isFirebaseConnected, state.serviceCategories.length, loadInitialData]);

  const handleServiceSelection = (serviceId: string) => {
    const service = state.serviceCategories.find(s => s.id === serviceId);
    if (service && service.subcategories.length > 0) {
      setSelectedService(serviceId);
    } else {
      // If no subcategories, generate ticket directly
      handleGenerateTicket(service?.identifier.toLowerCase() || serviceId);
    }
  };

  const handleSubserviceSelection = (subserviceId: string) => {
    setSelectedSubservice(subserviceId);
  };

  const handleGenerateTicket = async (serviceType?: string, subserviceType?: string) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const service = selectedService ? state.serviceCategories.find(s => s.id === selectedService) : null;
      const subservice = selectedSubservice ? service?.subcategories.find(s => s.id === selectedSubservice) : null;
      
      const ticketType = serviceType || service?.identifier.toLowerCase() || 'general';
      const ticketSubtype = subserviceType || subservice?.identifier.toLowerCase();
      
      // Only use subservice if service has subcategories
      const shouldUseSubservice = service && service.subcategories.length > 0 && subservice;
      
      // Create ticket in Firebase (this will also trigger printing if enabled)
      const newTicket = await createTicket(ticketType, shouldUseSubservice ? ticketSubtype : undefined);
      
      // Prepare ticket for display
      const displayTicket = {
        ...newTicket,
        serviceName: service?.name || ticketType,
        subserviceName: shouldUseSubservice ? subservice?.name : undefined,
      };
      
      setLastTicket(displayTicket);
      setShowTicket(true);
      
      // Auto-hide ticket after 8 seconds and reset to main screen
      setTimeout(() => {
        setShowTicket(false);
        setSelectedService(null);
        setSelectedSubservice(null);
        setLastTicket(null);
      }, 8000);
      
    } catch (error) {
      console.error('Error generating ticket:', error);
      alert('Error al generar el ticket. Por favor, intenta nuevamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
  };

  const handleScreenClick = () => {
    if (showTicket) {
      setShowTicket(false);
      setSelectedService(null);
      setSelectedSubservice(null);
      setLastTicket(null);
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('compra') || name.includes('medicamento') || name.includes('farmacia')) {
      return Pill;
    }
    if (name.includes('seguro') || name.includes('carnet') || name.includes('identificacion')) {
      return CreditCard;
    }
    if (name.includes('consulta')) return MessageCircle;
    if (name.includes('reclamo')) return ClipboardList;
    if (name.includes('pago')) return Banknote;
    return FileText;
  };

  const getServiceColor = (index: number) => {
    const colors = [
      'bg-blue-500 hover:bg-blue-600 from-blue-400 to-blue-600',
      'bg-green-500 hover:bg-green-600 from-green-400 to-green-600',
      'bg-purple-500 hover:bg-purple-600 from-purple-400 to-purple-600',
      'bg-orange-500 hover:bg-orange-600 from-orange-400 to-orange-600',
      'bg-red-500 hover:bg-red-600 from-red-400 to-red-600',
      'bg-indigo-500 hover:bg-indigo-600 from-indigo-400 to-indigo-600',
    ];
    return colors[index % colors.length];
  };

  const waitingTicketsCount = state.tickets.filter(t => t.status === 'waiting').length;
  const companyName = state.systemSettings?.companyName || 'Sistema de Gestión de Colas';
  const companyLogo = state.systemSettings?.companyLogo;

  // Show ticket confirmation screen
  if (showTicket && lastTicket) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6"
        onClick={handleScreenClick}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
          <div className="mb-8">
            <CheckCircle size={100} className="text-green-500 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-800 mb-4">¡Ticket Generado!</h2>
            {state.printSettings.enablePrint && (
              <div className="flex items-center justify-center space-x-2 text-blue-600 mb-4">
                <Printer size={20} />
                <span className="text-sm font-medium">Ticket enviado a impresora</span>
              </div>
            )}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 p-8 rounded-2xl mb-8">
            <div className="text-7xl font-bold text-gray-800 mb-4">
              #{lastTicket.number.toString().padStart(3, '0')}
            </div>
            <div className="text-2xl font-semibold text-gray-700 mb-2">
              {(lastTicket as any).serviceName}
            </div>
            {(lastTicket as any).subserviceName && (
              <div className="text-lg font-medium text-gray-600 mb-3">
                {(lastTicket as any).subserviceName}
              </div>
            )}
            <div className="text-sm text-gray-500 mb-4">
              {lastTicket.createdAt.toLocaleTimeString()}
            </div>
            
            {/* Queue Information */}
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <div className="flex items-center justify-center space-x-4 text-blue-700">
                <div className="flex items-center space-x-2">
                  <Users size={20} />
                  <span className="font-semibold">Posición en cola: {lastTicket.queuePosition}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={20} />
                  <span className="font-semibold">{waitingTicketsCount} tickets esperando</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 text-xl mb-4">
            Por favor, espere su turno en la sala de espera
          </p>
          <p className="text-gray-500 text-sm">
            Toque la pantalla para generar otro ticket
          </p>
        </div>
      </div>
    );
  }

  // Show subservices selection screen
  if (selectedService) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => setSelectedService(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              <span>Volver a servicios</span>
            </button>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {state.serviceCategories.find(s => s.id === selectedService)?.name}
              </h2>
              <p className="text-gray-600">Selecciona una opción específica:</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.serviceCategories
              .find(s => s.id === selectedService)
              ?.subcategories.map((subservice, index) => {
                const IconComponent = getServiceIcon(subservice.name);
                return (
                  <button
                    key={subservice.id}
                    onClick={() => {
                      setSelectedSubservice(subservice.id);
                      handleGenerateTicket();
                    }}
                    disabled={isGenerating}
                    className={`bg-gradient-to-br ${getServiceColor(index)} hover:scale-105 transform transition-all duration-300 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                    
                    <div className="relative z-10 flex flex-col items-center space-y-4">
                      <div className="mb-2">
                        <IconComponent size={48} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-center">
                        {subservice.name}
                      </h3>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-xl font-semibold text-gray-800">Generando ticket...</p>
              {state.printSettings.enablePrint && (
                <p className="text-sm text-gray-600 mt-2">Preparando impresión...</p>
              )}
            </div>
          </div>
        )}

        {/* Print Settings Panel */}
        {showPrintSettings && (
          <PrintSettingsPanel onClose={() => setShowPrintSettings(false)} />
        )}
      </div>
    );
  }

  // Main welcome screen with service categories
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header with back button and settings */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors bg-white rounded-lg px-4 py-2 shadow-md"
          >
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="bg-white rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center space-x-2">
                {state.isFirebaseConnected ? (
                  <>
                    <Wifi size={16} className="text-green-500" />
                    <span className="text-sm text-green-700 font-medium">Conectado</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-red-500" />
                    <span className="text-sm text-red-600 font-medium">Sin conexión</span>
                  </>
                )}
              </div>
            </div>

            {/* Print Settings Button */}
            <button
              onClick={() => setShowPrintSettings(true)}
              className="bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-shadow"
              title="Configuración de impresión"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Welcome Content */}
        <div className="mt-24 text-center">
          {/* Company Logo and Branding */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-2xl mb-6">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Logo de la empresa"
                  className="w-24 h-24 object-contain rounded-full"
                />
              ) : (
                <Building size={64} className="text-white" />
              )}
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold text-gray-800 mb-6">
              Bienvenid@s a
            </h1>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-8">
              {companyName}
            </h2>
            <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Seleccione el servicio que desea solicitar para generar su ticket de atención
            </p>
          </div>

          {/* Service Categories Grid */}
          <div className="mb-12">
            {state.serviceCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {state.serviceCategories.map((service, index) => {
                  const IconComponent = getServiceIcon(service.name);
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelection(service.id)}
                      disabled={isGenerating}
                      className={`bg-gradient-to-br ${getServiceColor(index)} hover:scale-105 transform transition-all duration-300 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -ml-12 -mb-12"></div>
                      
                      <div className="relative z-10 flex flex-col items-center space-y-6">
                        <div className="mb-2">
                          <IconComponent size={64} className="text-white" />
                        </div>
                        <h3 className="text-3xl font-bold text-center">
                          {service.name}
                        </h3>
                        <div className="text-lg opacity-90 text-center">
                          {service.subcategories.length > 0 
                            ? `${service.subcategories.length} opciones disponibles`
                            : 'Servicio directo'
                          }
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                {state.isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                    <p className="text-xl text-gray-600">Cargando servicios...</p>
                  </div>
                ) : !state.isFirebaseConnected ? (
                  <div className="flex flex-col items-center space-y-4">
                    <WifiOff size={64} className="text-red-400" />
                    <p className="text-2xl text-red-600">Sin conexión a Firebase</p>
                    <p className="text-gray-500">Verifica tu conexión a internet</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <FileText size={64} className="text-gray-400" />
                    <p className="text-2xl text-gray-500">No hay servicios configurados</p>
                    <p className="text-gray-400">Contacta al administrador para configurar los servicios</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Queue Information */}
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl p-6 shadow-lg max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-4 text-gray-700">
              <div className="flex items-center space-x-2">
                <Users size={24} className="text-blue-500" />
                <span className="text-lg font-semibold">Tickets en cola: {waitingTicketsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-xl font-semibold text-gray-800">Generando ticket...</p>
              {state.printSettings.enablePrint && (
                <p className="text-sm text-gray-600 mt-2">Preparando impresión...</p>
              )}
            </div>
          </div>
        )}

        {/* Print Settings Panel */}
        {showPrintSettings && (
          <PrintSettingsPanel onClose={() => setShowPrintSettings(false)} />
        )}
      </div>
    </div>
  );
}