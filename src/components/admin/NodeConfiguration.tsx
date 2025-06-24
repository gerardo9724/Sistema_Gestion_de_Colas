import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image, Eye, Monitor, Volume2, VolumeX, Palette, Clock, Settings, Save, TestTube, EyeOff, Type, Play, Pause } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { carouselService } from '../../services/carouselService';

export default function NodeConfiguration() {
  const { state, loadInitialData, saveCompleteNodeConfiguration } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state for carousel images
  const [imageFormData, setImageFormData] = useState({
    name: '',
    url: '',
    description: '',
  });

  // CRITICAL: Initialize configuration from independent Firebase table
  const [nodeConfig, setNodeConfig] = useState({
    // Display Settings
    autoRotationInterval: 5000,
    showQueueInfo: true,
    showCompanyLogo: true,
    maxTicketsDisplayed: 6,
    showDateTime: true,
    showConnectionStatus: true,
    showHeader: true,
    showCarousel: true, // NEW: Carousel visibility
    compactMode: false,
    
    // Audio Settings
    enableAudio: true,
    audioVolume: 0.8,
    selectedVoice: 'auto-female',
    speechRate: 0.75,
    
    // Visual Settings
    backgroundColor: '#F1F5F9',
    headerColor: '#3B82F6',
    textColor: '#1F2937',
    accentColor: '#10B981',
    
    // Animation Settings
    enableAnimations: true,
    highlightDuration: 10000,
    transitionDuration: 1000,
    
    // Content Settings
    showImageDescriptions: true,
    showImageIndicators: true,
    pauseOnHover: false,
    
    // NEW: Carousel Text Settings
    carouselTitle: 'Publicidad',
    enableScrollingText: false,
    scrollingSpeed: 5,
  });

  // CRITICAL: Sync configuration with independent Firebase table
  useEffect(() => {
    console.log('🔄 NodeConfiguration: Syncing with independent Firebase table...');
    
    if (state.nodeConfiguration) {
      console.log('📊 Loading configuration from independent Firebase table:', state.nodeConfiguration);
      
      const syncedConfig = {
        // Display Settings
        autoRotationInterval: state.nodeConfiguration.autoRotationInterval,
        showQueueInfo: state.nodeConfiguration.showQueueInfo,
        showCompanyLogo: state.nodeConfiguration.showCompanyLogo,
        maxTicketsDisplayed: state.nodeConfiguration.maxTicketsDisplayed,
        showDateTime: state.nodeConfiguration.showDateTime,
        showConnectionStatus: state.nodeConfiguration.showConnectionStatus,
        showHeader: state.nodeConfiguration.showHeader ?? true,
        showCarousel: state.nodeConfiguration.showCarousel ?? true, // NEW: Carousel visibility
        compactMode: state.nodeConfiguration.compactMode,
        
        // Audio Settings
        enableAudio: state.nodeConfiguration.enableAudio,
        audioVolume: state.nodeConfiguration.audioVolume,
        selectedVoice: state.nodeConfiguration.selectedVoice,
        speechRate: state.nodeConfiguration.speechRate,
        
        // Visual Settings
        backgroundColor: state.nodeConfiguration.backgroundColor,
        headerColor: state.nodeConfiguration.headerColor,
        textColor: state.nodeConfiguration.textColor,
        accentColor: state.nodeConfiguration.accentColor,
        
        // Animation Settings
        enableAnimations: state.nodeConfiguration.enableAnimations,
        highlightDuration: state.nodeConfiguration.highlightDuration,
        transitionDuration: state.nodeConfiguration.transitionDuration,
        
        // Content Settings
        showImageDescriptions: state.nodeConfiguration.showImageDescriptions,
        showImageIndicators: state.nodeConfiguration.showImageIndicators,
        pauseOnHover: state.nodeConfiguration.pauseOnHover,
        
        // NEW: Carousel Text Settings
        carouselTitle: state.nodeConfiguration.carouselTitle || 'Publicidad',
        enableScrollingText: state.nodeConfiguration.enableScrollingText ?? false,
        scrollingSpeed: state.nodeConfiguration.scrollingSpeed || 5,
      };

      console.log('✅ Configuration synced from independent Firebase table:', syncedConfig);
      setNodeConfig(syncedConfig);
    } else {
      console.log('⚠️ No configuration found in independent Firebase table, using defaults');
    }
  }, [state.nodeConfiguration]);

  // Voice options with specific voice names
  const voiceOptions = [
    // Female voices
    { value: 'auto-female', label: '👩 Voz Femenina Automática', type: 'female' },
    { value: 'Microsoft Helena - Spanish (Spain)', label: '👩 Helena (España)', type: 'female' },
    { value: 'Microsoft Sabina - Spanish (Mexico)', label: '👩 Sabina (México)', type: 'female' },
    { value: 'Google español', label: '👩 Google Español', type: 'female' },
    { value: 'Mónica', label: '👩 Mónica', type: 'female' },
    { value: 'Paulina', label: '👩 Paulina', type: 'female' },
    { value: 'Esperanza', label: '👩 Esperanza', type: 'female' },
    { value: 'Marisol', label: '👩 Marisol', type: 'female' },
    
    // Male voices
    { value: 'auto-male', label: '👨 Voz Masculina Automática', type: 'male' },
    { value: 'Microsoft Pablo - Spanish (Spain)', label: '👨 Pablo (España)', type: 'male' },
    { value: 'Microsoft Raul - Spanish (Mexico)', label: '👨 Raúl (México)', type: 'male' },
    { value: 'Google español (España)', label: '👨 Google Español', type: 'male' },
    { value: 'Jorge', label: '👨 Jorge', type: 'male' },
    { value: 'Juan', label: '👨 Juan', type: 'male' },
    { value: 'Carlos', label: '👨 Carlos', type: 'male' },
    { value: 'Diego', label: '👨 Diego', type: 'male' },
    { value: 'Andrés', label: '👨 Andrés', type: 'male' },
    { value: 'Miguel', label: '👨 Miguel', type: 'male' },
  ];

  const resetImageForm = () => {
    setImageFormData({
      name: '',
      url: '',
      description: '',
    });
    setError('');
  };

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFormData.name.trim() || !imageFormData.url.trim()) {
      setError('Nombre y URL son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await carouselService.createCarouselImage({
        name: imageFormData.name.trim(),
        url: imageFormData.url.trim(),
        description: imageFormData.description.trim() || undefined,
      });

      setShowCreateModal(false);
      resetImageForm();
      await loadInitialData();
      setSuccess('Imagen agregada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error creating carousel image:', error);
      setError('Error al agregar imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      return;
    }

    setIsLoading(true);

    try {
      await carouselService.deleteCarouselImage(imageId);
      await loadInitialData();
      setSuccess('Imagen eliminada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      setError('Error al eliminar imagen');
    } finally {
      setIsLoading(false);
    }
  };

  // CRITICAL: Save to independent Firebase table
  const handleSaveConfiguration = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('💾 GUARDANDO CONFIGURACIÓN EN TABLA INDEPENDIENTE DE FIREBASE...');
      console.log('📊 Configuración completa a guardar:', nodeConfig);

      // CRITICAL: Save to independent nodeConfigurations table
      await saveCompleteNodeConfiguration(nodeConfig);
      
      console.log('✅ CONFIGURACIÓN GUARDADA EXITOSAMENTE EN TABLA INDEPENDIENTE');
      
      setSuccess('✅ Configuración guardada exitosamente en tabla independiente de Firebase. Los cambios se aplicarán automáticamente al módulo Nodo.');
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (error) {
      console.error('❌ ERROR CRÍTICO AL GUARDAR EN TABLA INDEPENDIENTE:', error);
      setError(`❌ Error crítico al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewImage = (imageUrl: string, imageName: string) => {
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Vista Previa - ${imageName}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
              .container { max-width: 100%; text-align: center; }
              img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #333; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${imageName}</h1>
              <img src="${imageUrl}" alt="${imageName}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4='" />
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  const testAudioAnnouncement = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      
      const text = `Ticket número 999. Favor dirigirse con el empleado de atención.`;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Wait for voices to load
      const setVoiceAndSpeak = () => {
        const voices = speechSynthesis.getVoices();
        
        let selectedVoiceObj = null;
        
        // If specific voice is selected, try to find it
        if (nodeConfig.selectedVoice !== 'auto-male' && nodeConfig.selectedVoice !== 'auto-female') {
          selectedVoiceObj = voices.find(voice => 
            voice.name.toLowerCase().includes(nodeConfig.selectedVoice.toLowerCase())
          );
        }
        
        // If no specific voice found, use auto selection
        if (!selectedVoiceObj) {
          const isAutoMale = nodeConfig.selectedVoice === 'auto-male' || 
                           nodeConfig.selectedVoice.includes('Pablo') || 
                           nodeConfig.selectedVoice.includes('Raul') ||
                           nodeConfig.selectedVoice.includes('Jorge') ||
                           nodeConfig.selectedVoice.includes('Juan') ||
                           nodeConfig.selectedVoice.includes('Carlos') ||
                           nodeConfig.selectedVoice.includes('Diego') ||
                           nodeConfig.selectedVoice.includes('Andrés') ||
                           nodeConfig.selectedVoice.includes('Miguel');
          
          if (isAutoMale) {
            // Find male voice
            const maleVoices = ['Pablo', 'Raul', 'Jorge', 'Juan', 'Carlos', 'Diego', 'Andrés', 'Miguel'];
            for (const maleName of maleVoices) {
              selectedVoiceObj = voices.find(voice => 
                voice.lang.includes('es') && 
                voice.name.toLowerCase().includes(maleName.toLowerCase())
              );
              if (selectedVoiceObj) break;
            }
          } else {
            // Find female voice
            const femaleVoices = ['Helena', 'Sabina', 'Mónica', 'Paulina', 'Esperanza', 'Marisol'];
            for (const femaleName of femaleVoices) {
              selectedVoiceObj = voices.find(voice => 
                voice.lang.includes('es') && 
                voice.name.toLowerCase().includes(femaleName.toLowerCase())
              );
              if (selectedVoiceObj) break;
            }
          }
        }
        
        // Final fallback to any Spanish voice
        if (!selectedVoiceObj) {
          selectedVoiceObj = voices.find(voice => voice.lang.includes('es'));
        }

        if (selectedVoiceObj) {
          utterance.voice = selectedVoiceObj;
        }
        
        utterance.lang = 'es-ES';
        utterance.rate = nodeConfig.speechRate;
        utterance.pitch = 0.9;
        utterance.volume = nodeConfig.audioVolume;
        
        speechSynthesis.speak(utterance);
        setSuccess(`🔊 Prueba de audio reproducida con: ${selectedVoiceObj?.name || 'voz por defecto'}`);
        setTimeout(() => setSuccess(''), 3000);
      };

      // Check if voices are already loaded
      if (speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        // Wait for voices to load
        speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
      }
    } else {
      setError('Síntesis de voz no disponible en este navegador');
    }
  };

  // NEW: Test scrolling text preview
  const testScrollingText = () => {
    const previewWindow = window.open('', '_blank', 'width=600,height=200');
    if (previewWindow) {
      const animationDuration = Math.max(5, 15 - nodeConfig.scrollingSpeed);
      previewWindow.document.write(`
        <html>
          <head>
            <title>Vista Previa - Texto Desplazante</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #f0f0f0; 
                font-family: Arial, sans-serif; 
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
              }
              .container { 
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 500px;
                overflow: hidden;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: ${nodeConfig.textColor};
                text-align: center;
                margin-bottom: 20px;
              }
              .scrolling-container {
                overflow: hidden;
                whitespace: nowrap;
                border: 2px solid #ddd;
                padding: 10px;
                border-radius: 5px;
                background: #f9f9f9;
              }
              .scrolling-text {
                display: inline-block;
                animation: scroll-right-to-left ${animationDuration}s linear infinite;
                font-size: 18px;
                font-weight: bold;
                color: ${nodeConfig.accentColor};
              }
              @keyframes scroll-right-to-left {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
              }
              .info {
                margin-top: 15px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">Vista Previa del Texto Desplazante</div>
              <div class="scrolling-container">
                <div class="scrolling-text">${nodeConfig.carouselTitle}</div>
              </div>
              <div class="info">
                <strong>Velocidad:</strong> ${nodeConfig.scrollingSpeed}/10 
                (${animationDuration}s por ciclo)
              </div>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  // CRITICAL: Direct state update function with immediate persistence
  const updateNodeConfig = (updates: Partial<typeof nodeConfig>) => {
    console.log('🔧 Actualizando configuración local:', updates);
    
    setNodeConfig(prev => {
      const newConfig = { ...prev, ...updates };
      console.log('📊 Nueva configuración local:', newConfig);
      return newConfig;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-green-500 p-3 rounded-lg">
            <Monitor size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Configuración Nodo</h2>
            <p className="text-gray-600">Configuración independiente con tabla dedicada en Firebase</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Database Status Information */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-800 font-semibold mb-2">🗄️ Estado de la Tabla Independiente:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700">
            <div>
              <strong>Tabla:</strong> nodeConfigurations
            </div>
            <div>
              <strong>ID:</strong> {state.nodeConfiguration?.id || 'Pendiente'}
            </div>
            <div>
              <strong>Estado:</strong> {state.nodeConfiguration ? 'Conectado' : 'Creando...'}
            </div>
            <div>
              <strong>Última actualización:</strong> {state.nodeConfiguration?.updatedAt?.toLocaleTimeString() || 'N/A'}
            </div>
          </div>
          <p className="text-blue-600 text-xs mt-2">
            💾 <strong>Tabla Independiente:</strong> Todos los datos se guardan en la tabla dedicada "nodeConfigurations" en Firebase Firestore
          </p>
        </div>

        {/* Configuration Status */}
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-purple-800 font-semibold mb-2">📊 Configuración Actual:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-purple-700">
            <div>
              <strong>Intervalo:</strong> {nodeConfig.autoRotationInterval}ms
            </div>
            <div>
              <strong>Audio:</strong> {nodeConfig.enableAudio ? 'ON' : 'OFF'}
            </div>
            <div>
              <strong>Voz:</strong> {nodeConfig.selectedVoice.includes('auto') ? nodeConfig.selectedVoice.replace('auto-', '').toUpperCase() : nodeConfig.selectedVoice.split(' ')[0]}
            </div>
            <div>
              <strong>Volumen:</strong> {Math.round(nodeConfig.audioVolume * 100)}%
            </div>
            <div>
              <strong>Max Tickets:</strong> {nodeConfig.maxTicketsDisplayed}
            </div>
            <div>
              <strong>Animaciones:</strong> {nodeConfig.enableAnimations ? 'ON' : 'OFF'}
            </div>
            <div>
              <strong>Header:</strong> {nodeConfig.showHeader ? 'VISIBLE' : 'OCULTO'}
            </div>
            <div>
              <strong>Carrusel:</strong> {nodeConfig.showCarousel ? 'VISIBLE' : 'OCULTO'}
            </div>
          </div>
        </div>

        {/* Simplified Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Content Management */}
          <div className="space-y-6">
            
            {/* NEW: Carousel Text Configuration */}
            <div className="border border-indigo-200 rounded-xl p-6 bg-indigo-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-indigo-500 p-2 rounded-lg">
                  <Type size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-indigo-800">Configuración de Texto del Carrusel</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-indigo-700 mb-2">
                    Título del Carrusel
                  </label>
                  <input
                    type="text"
                    value={nodeConfig.carouselTitle}
                    onChange={(e) => updateNodeConfig({ carouselTitle: e.target.value })}
                    className="w-full p-3 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Publicidad, Promociones, Ofertas Especiales"
                  />
                  <p className="text-xs text-indigo-600 mt-1">
                    Este texto aparecerá como título del carrusel de publicidad
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.enableScrollingText}
                      onChange={(e) => updateNodeConfig({ enableScrollingText: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div className="flex items-center space-x-2">
                      {nodeConfig.enableScrollingText ? <Play size={16} className="text-indigo-600" /> : <Pause size={16} className="text-gray-500" />}
                      <span className="text-indigo-700 font-medium">
                        {nodeConfig.enableScrollingText ? 'Texto Desplazante Activo' : 'Texto Estático'}
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-indigo-600 mt-1 ml-8">
                    {nodeConfig.enableScrollingText 
                      ? 'El texto se desplazará de derecha a izquierda continuamente'
                      : 'El texto se mostrará estático sin animación'
                    }
                  </p>
                </div>

                {nodeConfig.enableScrollingText && (
                  <div>
                    <label className="block text-sm font-medium text-indigo-700 mb-2">
                      Velocidad de Desplazamiento: {nodeConfig.scrollingSpeed}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={nodeConfig.scrollingSpeed}
                      onChange={(e) => updateNodeConfig({ scrollingSpeed: parseInt(e.target.value) })}
                      className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-indigo-600 mt-1">
                      <span>Lento</span>
                      <span>Rápido</span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">
                      Duración del ciclo: {Math.max(5, 15 - nodeConfig.scrollingSpeed)} segundos
                    </p>
                  </div>
                )}

                <button
                  onClick={testScrollingText}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye size={16} />
                  <span>Vista Previa del Texto</span>
                </button>
              </div>
            </div>

            {/* Carousel Images Management */}
            <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Image size={20} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-800">Gestión de Imágenes</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {state.carouselImages.map((image) => (
                  <div key={image.id} className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={() => handlePreviewImage(image.url, image.name)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded transition-colors"
                          title="Vista previa"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1 truncate">{image.name}</h4>
                      {image.description && (
                        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{image.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{image.uploadedAt.toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          image.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {image.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {state.carouselImages.length === 0 && (
                  <div className="text-center py-8">
                    <Image size={48} className="mx-auto text-blue-300 mb-3" />
                    <p className="text-blue-600 text-sm">No hay imágenes configuradas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Display Settings */}
            <div className="border border-green-200 rounded-xl p-6 bg-green-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Settings size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-800">Configuración de Pantalla</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    <Clock size={16} className="inline mr-1" />
                    Intervalo de Rotación: {nodeConfig.autoRotationInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="3000"
                    max="30000"
                    step="1000"
                    value={nodeConfig.autoRotationInterval}
                    onChange={(e) => updateNodeConfig({ autoRotationInterval: parseInt(e.target.value) })}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>3s</span>
                    <span>30s</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Máximo de Tickets: {nodeConfig.maxTicketsDisplayed}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={nodeConfig.maxTicketsDisplayed}
                    onChange={(e) => updateNodeConfig({ maxTicketsDisplayed: parseInt(e.target.value) })}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>4</span>
                    <span>12</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showQueueInfo}
                      onChange={(e) => updateNodeConfig({ showQueueInfo: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700 text-sm">Info de cola</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showCompanyLogo}
                      onChange={(e) => updateNodeConfig({ showCompanyLogo: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700 text-sm">Logo empresa</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showDateTime}
                      onChange={(e) => updateNodeConfig({ showDateTime: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700 text-sm">Fecha y hora</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.enableAnimations}
                      onChange={(e) => updateNodeConfig({ enableAnimations: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700 text-sm">Animaciones</span>
                  </label>
                </div>

                {/* Header Visibility Option */}
                <div className="border-t border-green-300 pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showHeader}
                      onChange={(e) => updateNodeConfig({ showHeader: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      {nodeConfig.showHeader ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-red-500" />}
                      <span className="text-green-700 font-medium">
                        {nodeConfig.showHeader ? 'Mostrar Header' : 'Ocultar Header'}
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-green-600 mt-1 ml-8">
                    {nodeConfig.showHeader 
                      ? 'El header con navegación, hora y estado será visible'
                      : 'Modo pantalla completa sin header (más espacio para contenido)'
                    }
                  </p>
                </div>

                {/* NEW: Carousel Visibility Option */}
                <div className="border-t border-green-300 pt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showCarousel}
                      onChange={(e) => updateNodeConfig({ showCarousel: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      {nodeConfig.showCarousel ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-red-500" />}
                      <span className="text-green-700 font-medium">
                        {nodeConfig.showCarousel ? 'Mostrar Carrusel de Publicidad' : 'Ocultar Carrusel de Publicidad'}
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-green-600 mt-1 ml-8">
                    {nodeConfig.showCarousel 
                      ? 'El carrusel de publicidad será visible en la mitad derecha de la pantalla'
                      : 'Los tickets ocuparán toda la pantalla (modo pantalla completa para cola)'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Audio & Visual Settings */}
          <div className="space-y-6">
            
            {/* Audio Settings */}
            <div className="border border-orange-200 rounded-xl p-6 bg-orange-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-orange-500 p-2 rounded-lg">
                  {nodeConfig.enableAudio ? <Volume2 size={20} className="text-white" /> : <VolumeX size={20} className="text-white" />}
                </div>
                <h3 className="text-lg font-bold text-orange-800">Configuración de Audio</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.enableAudio}
                      onChange={(e) => updateNodeConfig({ enableAudio: e.target.checked })}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-orange-700 font-medium">Habilitar anuncios de audio</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-2">
                    Seleccionar Voz
                  </label>
                  <select
                    value={nodeConfig.selectedVoice}
                    onChange={(e) => updateNodeConfig({ selectedVoice: e.target.value })}
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <optgroup label="🎭 Voces Automáticas">
                      <option value="auto-female">👩 Voz Femenina Automática</option>
                      <option value="auto-male">👨 Voz Masculina Automática</option>
                    </optgroup>
                    <optgroup label="👩 Voces Femeninas">
                      {voiceOptions.filter(v => v.type === 'female' && !v.value.startsWith('auto')).map((voice) => (
                        <option key={voice.value} value={voice.value}>
                          {voice.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="👨 Voces Masculinas">
                      {voiceOptions.filter(v => v.type === 'male' && !v.value.startsWith('auto')).map((voice) => (
                        <option key={voice.value} value={voice.value}>
                          {voice.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-2">
                    <Volume2 size={16} className="inline mr-1" />
                    Volumen: {Math.round(nodeConfig.audioVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={nodeConfig.audioVolume}
                    onChange={(e) => updateNodeConfig({ audioVolume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-2">
                    Velocidad: {nodeConfig.speechRate}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={nodeConfig.speechRate}
                    onChange={(e) => updateNodeConfig({ speechRate: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={testAudioAnnouncement}
                  className="w-full bg-orange-400 hover:bg-orange-500 text-white py-2 px-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <TestTube size={16} />
                  <span>Probar Audio</span>
                </button>
              </div>
            </div>

            {/* Visual Customization */}
            <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Palette size={20} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-purple-800">Personalización Visual</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color del Encabezado
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={nodeConfig.headerColor}
                        onChange={(e) => updateNodeConfig({ headerColor: e.target.value })}
                        className="w-10 h-8 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={nodeConfig.headerColor}
                        onChange={(e) => updateNodeConfig({ headerColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color de Texto
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={nodeConfig.textColor}
                        onChange={(e) => updateNodeConfig({ textColor: e.target.value })}
                        className="w-10 h-8 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={nodeConfig.textColor}
                        onChange={(e) => updateNodeConfig({ textColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color de Acento
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={nodeConfig.accentColor}
                        onChange={(e) => updateNodeConfig({ accentColor: e.target.value })}
                        className="w-10 h-8 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={nodeConfig.accentColor}
                        onChange={(e) => updateNodeConfig({ accentColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color de Fondo
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={nodeConfig.backgroundColor}
                        onChange={(e) => updateNodeConfig({ backgroundColor: e.target.value })}
                        className="w-10 h-8 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={nodeConfig.backgroundColor}
                        onChange={(e) => updateNodeConfig({ backgroundColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Duración de Resaltado: {nodeConfig.highlightDuration / 1000}s
                  </label>
                  <input
                    type="range"
                    min="5000"
                    max="30000"
                    step="1000"
                    value={nodeConfig.highlightDuration}
                    onChange={(e) => updateNodeConfig({ highlightDuration: parseInt(e.target.value) })}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showImageDescriptions}
                      onChange={(e) => updateNodeConfig({ showImageDescriptions: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-purple-700 text-sm">Descripciones</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeConfig.showImageIndicators}
                      onChange={(e) => updateNodeConfig({ showImageIndicators: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-purple-700 text-sm">Indicadores</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Configuration Button - CRITICAL INDEPENDENT TABLE SAVE */}
        <div className="mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              <strong>🗄️ Tabla Independiente:</strong> Al presionar "Guardar" toda la configuración se almacena en la tabla dedicada "nodeConfigurations" en Firebase Firestore.
              Los cambios se aplicarán automáticamente en el módulo Nodo sin necesidad de recargar.
            </p>
          </div>
          
          <button
            onClick={handleSaveConfiguration}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-4 px-12 rounded-lg font-bold text-lg transition-colors flex items-center justify-center space-x-3 mx-auto shadow-lg"
          >
            <Save size={24} />
            <span>{isLoading ? 'Guardando en Tabla Independiente...' : '🗄️ Guardar en Tabla Independiente'}</span>
          </button>
          
          <p className="text-gray-500 text-sm mt-2">
            Todos los cambios se guardan en la tabla dedicada "nodeConfigurations" y se sincronizan automáticamente
          </p>
        </div>
      </div>

      {/* Create Image Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Agregar Nueva Imagen</h3>
            
            <form onSubmit={handleCreateImage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Imagen
                </label>
                <input
                  type="text"
                  value={imageFormData.name}
                  onChange={(e) => setImageFormData({ ...imageFormData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Promoción Especial"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de la Imagen
                </label>
                <input
                  type="url"
                  value={imageFormData.url}
                  onChange={(e) => setImageFormData({ ...imageFormData, url: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa URLs de Pexels, Unsplash o cualquier imagen pública
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={imageFormData.description}
                  onChange={(e) => setImageFormData({ ...imageFormData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descripción de la imagen o promoción"
                />
              </div>

              {/* Preview */}
              {imageFormData.url && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Vista Previa:</p>
                  <img
                    src={imageFormData.url}
                    alt="Vista previa"
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetImageForm();
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}