import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Monitor, Volume2, VolumeX, Palette, Settings, RotateCcw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function NodeConfiguration() {
  const { state, updateNodeConfiguration, saveCompleteNodeConfiguration } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state with all configuration options
  const [config, setConfig] = useState({
    // Display Settings
    autoRotationInterval: 5000,
    showQueueInfo: true,
    showCompanyLogo: true,
    maxTicketsDisplayed: 6,
    showDateTime: true,
    showConnectionStatus: true,
    showHeader: true,
    showCarousel: true,
    showStatusBar: true, // NEW: Status bar visibility
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
    
    // Carousel Text Settings
    carouselTitle: 'Publicidad',
    enableScrollingText: false,
    scrollingSpeed: 5,
  });

  // Load configuration from state when available
  useEffect(() => {
    if (state.nodeConfiguration) {
      console.log('📊 Loading node configuration from state:', state.nodeConfiguration);
      setConfig({
        // Display Settings
        autoRotationInterval: state.nodeConfiguration.autoRotationInterval || 5000,
        showQueueInfo: state.nodeConfiguration.showQueueInfo ?? true,
        showCompanyLogo: state.nodeConfiguration.showCompanyLogo ?? true,
        maxTicketsDisplayed: state.nodeConfiguration.maxTicketsDisplayed || 6,
        showDateTime: state.nodeConfiguration.showDateTime ?? true,
        showConnectionStatus: state.nodeConfiguration.showConnectionStatus ?? true,
        showHeader: state.nodeConfiguration.showHeader ?? true,
        showCarousel: state.nodeConfiguration.showCarousel ?? true,
        showStatusBar: state.nodeConfiguration.showStatusBar ?? true, // NEW: Load status bar setting
        compactMode: state.nodeConfiguration.compactMode ?? false,
        
        // Audio Settings
        enableAudio: state.nodeConfiguration.enableAudio ?? true,
        audioVolume: state.nodeConfiguration.audioVolume || 0.8,
        selectedVoice: state.nodeConfiguration.selectedVoice || 'auto-female',
        speechRate: state.nodeConfiguration.speechRate || 0.75,
        
        // Visual Settings
        backgroundColor: state.nodeConfiguration.backgroundColor || '#F1F5F9',
        headerColor: state.nodeConfiguration.headerColor || '#3B82F6',
        textColor: state.nodeConfiguration.textColor || '#1F2937',
        accentColor: state.nodeConfiguration.accentColor || '#10B981',
        
        // Animation Settings
        enableAnimations: state.nodeConfiguration.enableAnimations ?? true,
        highlightDuration: state.nodeConfiguration.highlightDuration || 10000,
        transitionDuration: state.nodeConfiguration.transitionDuration || 1000,
        
        // Content Settings
        showImageDescriptions: state.nodeConfiguration.showImageDescriptions ?? true,
        showImageIndicators: state.nodeConfiguration.showImageIndicators ?? true,
        pauseOnHover: state.nodeConfiguration.pauseOnHover ?? false,
        
        // Carousel Text Settings
        carouselTitle: state.nodeConfiguration.carouselTitle || 'Publicidad',
        enableScrollingText: state.nodeConfiguration.enableScrollingText ?? false,
        scrollingSpeed: state.nodeConfiguration.scrollingSpeed || 5,
      });
    }
  }, [state.nodeConfiguration]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('💾 Saving complete node configuration:', config);
      await saveCompleteNodeConfiguration(config);
      setSuccess('Configuración guardada exitosamente');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ Error saving node configuration:', error);
      setError('Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que deseas restablecer toda la configuración a los valores predeterminados?')) {
      setConfig({
        // Display Settings
        autoRotationInterval: 5000,
        showQueueInfo: true,
        showCompanyLogo: true,
        maxTicketsDisplayed: 6,
        showDateTime: true,
        showConnectionStatus: true,
        showHeader: true,
        showCarousel: true,
        showStatusBar: true, // NEW: Default status bar to visible
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
        
        // Carousel Text Settings
        carouselTitle: 'Publicidad',
        enableScrollingText: false,
        scrollingSpeed: 5,
      });
    }
  };

  const voiceOptions = [
    { value: 'auto-female', label: 'Automático (Femenino)' },
    { value: 'auto-male', label: 'Automático (Masculino)' },
    { value: 'Helena', label: 'Helena (Femenino)' },
    { value: 'Sabina', label: 'Sabina (Femenino)' },
    { value: 'Pablo', label: 'Pablo (Masculino)' },
    { value: 'Raul', label: 'Raul (Masculino)' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Configuración del Módulo Nodo</h2>
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <RotateCcw size={16} />
              <span>Restablecer</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Display Settings */}
          <div className="space-y-6">
            <div className="border border-green-200 rounded-xl p-6 bg-green-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Monitor size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800">Configuración de Pantalla</h3>
              </div>

              <div className="space-y-4">
                {/* Carousel Rotation Interval */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Intervalo de Rotación: {Math.round(config.autoRotationInterval / 1000)}s
                  </label>
                  <input
                    type="range"
                    min="3000"
                    max="30000"
                    step="1000"
                    value={config.autoRotationInterval}
                    onChange={(e) => setConfig({ ...config, autoRotationInterval: parseInt(e.target.value) })}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>3s</span>
                    <span>30s</span>
                  </div>
                </div>

                {/* Maximum Tickets Displayed */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Máximo de Tickets: {config.maxTicketsDisplayed}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="1"
                    value={config.maxTicketsDisplayed}
                    onChange={(e) => setConfig({ ...config, maxTicketsDisplayed: parseInt(e.target.value) })}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-green-600 mt-1">
                    <span>4</span>
                    <span>12</span>
                  </div>
                </div>

                {/* Display Options */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showQueueInfo}
                      onChange={(e) => setConfig({ ...config, showQueueInfo: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700">Info de cola</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCompanyLogo}
                      onChange={(e) => setConfig({ ...config, showCompanyLogo: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700">Logo empresa</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showDateTime}
                      onChange={(e) => setConfig({ ...config, showDateTime: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700">Fecha y hora</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableAnimations}
                      onChange={(e) => setConfig({ ...config, enableAnimations: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700">Animaciones</span>
                  </label>
                </div>

                {/* Header and Layout Options */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showHeader}
                      onChange={(e) => setConfig({ ...config, showHeader: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Eye size={16} className="text-green-600" />
                      <span className="text-green-700 font-medium">Mostrar Header</span>
                    </div>
                  </label>
                  <p className="text-xs text-green-600 ml-8">El header con navegación, hora y estado será visible</p>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCarousel}
                      onChange={(e) => setConfig({ ...config, showCarousel: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Eye size={16} className="text-green-600" />
                      <span className="text-green-700 font-medium">Mostrar Carrusel de Publicidad</span>
                    </div>
                  </label>
                  <p className="text-xs text-green-600 ml-8">El carrusel de publicidad será visible en la mitad derecha de la pantalla</p>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showStatusBar}
                      onChange={(e) => setConfig({ ...config, showStatusBar: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Eye size={16} className="text-green-600" />
                      <span className="text-green-700 font-medium">Mostrar Status Bar</span>
                    </div>
                  </label>
                  <p className="text-xs text-green-600 ml-8">La barra de estado inferior con estadísticas será visible</p>
                </div>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Volume2 size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-800">Configuración de Audio</h3>
              </div>

              <div className="space-y-4">
                {/* Enable Audio */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableAudio}
                    onChange={(e) => setConfig({ ...config, enableAudio: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-blue-700 font-medium">Habilitar anuncios de audio</span>
                </label>

                {config.enableAudio && (
                  <>
                    {/* Audio Volume */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Volumen: {Math.round(config.audioVolume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.audioVolume}
                        onChange={(e) => setConfig({ ...config, audioVolume: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Voice Selection */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Voz del Sistema
                      </label>
                      <select
                        value={config.selectedVoice}
                        onChange={(e) => setConfig({ ...config, selectedVoice: e.target.value })}
                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {voiceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Speech Rate */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Velocidad de Habla: {config.speechRate}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={config.speechRate}
                        onChange={(e) => setConfig({ ...config, speechRate: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-blue-600 mt-1">
                        <span>Lento</span>
                        <span>Rápido</span>
                      </div>
                    </div>

                    {/* Highlight Duration */}
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Duración de Resaltado: {Math.round(config.highlightDuration / 1000)}s
                      </label>
                      <input
                        type="range"
                        min="5000"
                        max="20000"
                        step="1000"
                        value={config.highlightDuration}
                        onChange={(e) => setConfig({ ...config, highlightDuration: parseInt(e.target.value) })}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-blue-600 mt-1">
                        <span>5s</span>
                        <span>20s</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Visual Settings */}
          <div className="space-y-6">
            <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Palette size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-800">Personalización Visual</h3>
              </div>

              <div className="space-y-4">
                {/* Color Settings */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color de Fondo
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color del Header
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.headerColor}
                        onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                        className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.headerColor}
                        onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Color del Texto
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                        className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.textColor}
                        onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
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
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel Settings */}
            <div className="border border-orange-200 rounded-xl p-6 bg-orange-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Settings size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-800">Configuración del Carrusel</h3>
              </div>

              <div className="space-y-4">
                {/* Carousel Title */}
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-2">
                    Título del Carrusel
                  </label>
                  <input
                    type="text"
                    value={config.carouselTitle}
                    onChange={(e) => setConfig({ ...config, carouselTitle: e.target.value })}
                    className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: Publicidad, Promociones, Ofertas"
                  />
                </div>

                {/* Scrolling Text Settings */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableScrollingText}
                      onChange={(e) => setConfig({ ...config, enableScrollingText: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-orange-700 font-medium">Habilitar texto deslizante</span>
                  </label>

                  {config.enableScrollingText && (
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-2">
                        Velocidad de Desplazamiento: {config.scrollingSpeed}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={config.scrollingSpeed}
                        onChange={(e) => setConfig({ ...config, scrollingSpeed: parseInt(e.target.value) })}
                        className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-orange-600 mt-1">
                        <span>Lento</span>
                        <span>Rápido</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Display Options */}
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showImageDescriptions}
                      onChange={(e) => setConfig({ ...config, showImageDescriptions: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-orange-700">Mostrar descripciones de imágenes</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showImageIndicators}
                      onChange={(e) => setConfig({ ...config, showImageIndicators: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-orange-700">Mostrar indicadores de imagen</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 text-lg"
          >
            <Save size={20} />
            <span>{isLoading ? 'Guardando Configuración...' : 'Guardar Toda la Configuración'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}