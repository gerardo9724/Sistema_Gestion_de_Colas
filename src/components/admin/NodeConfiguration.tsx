import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, TestTube, Eye, EyeOff, Volume2, VolumeX, Palette, Monitor, Settings, BarChart3 } from 'lucide-react';
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
      setConfig({
        autoRotationInterval: state.nodeConfiguration.autoRotationInterval,
        showQueueInfo: state.nodeConfiguration.showQueueInfo,
        showCompanyLogo: state.nodeConfiguration.showCompanyLogo,
        maxTicketsDisplayed: state.nodeConfiguration.maxTicketsDisplayed,
        showDateTime: state.nodeConfiguration.showDateTime,
        showConnectionStatus: state.nodeConfiguration.showConnectionStatus,
        showHeader: state.nodeConfiguration.showHeader,
        showCarousel: state.nodeConfiguration.showCarousel,
        showStatusBar: state.nodeConfiguration.showStatusBar, // NEW: Load status bar setting
        compactMode: state.nodeConfiguration.compactMode,
        enableAudio: state.nodeConfiguration.enableAudio,
        audioVolume: state.nodeConfiguration.audioVolume,
        selectedVoice: state.nodeConfiguration.selectedVoice,
        speechRate: state.nodeConfiguration.speechRate,
        backgroundColor: state.nodeConfiguration.backgroundColor,
        headerColor: state.nodeConfiguration.headerColor,
        textColor: state.nodeConfiguration.textColor,
        accentColor: state.nodeConfiguration.accentColor,
        enableAnimations: state.nodeConfiguration.enableAnimations,
        highlightDuration: state.nodeConfiguration.highlightDuration,
        transitionDuration: state.nodeConfiguration.transitionDuration,
        showImageDescriptions: state.nodeConfiguration.showImageDescriptions,
        showImageIndicators: state.nodeConfiguration.showImageIndicators,
        pauseOnHover: state.nodeConfiguration.pauseOnHover,
        carouselTitle: state.nodeConfiguration.carouselTitle,
        enableScrollingText: state.nodeConfiguration.enableScrollingText,
        scrollingSpeed: state.nodeConfiguration.scrollingSpeed,
      });
    }
  }, [state.nodeConfiguration]);

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('💾 Saving complete node configuration...');
      await saveCompleteNodeConfiguration(config);
      setSuccess('Configuración guardada exitosamente');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que deseas restablecer la configuración a los valores predeterminados?')) {
      setConfig({
        autoRotationInterval: 5000,
        showQueueInfo: true,
        showCompanyLogo: true,
        maxTicketsDisplayed: 6,
        showDateTime: true,
        showConnectionStatus: true,
        showHeader: true,
        showCarousel: true,
        showStatusBar: true, // NEW: Reset status bar to default
        compactMode: false,
        enableAudio: true,
        audioVolume: 0.8,
        selectedVoice: 'auto-female',
        speechRate: 0.75,
        backgroundColor: '#F1F5F9',
        headerColor: '#3B82F6',
        textColor: '#1F2937',
        accentColor: '#10B981',
        enableAnimations: true,
        highlightDuration: 10000,
        transitionDuration: 1000,
        showImageDescriptions: true,
        showImageIndicators: true,
        pauseOnHover: false,
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
            <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Monitor size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-800">Configuración de Pantalla</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Intervalo de Rotación del Carrusel (ms)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="30000"
                    step="1000"
                    value={config.autoRotationInterval}
                    onChange={(e) => setConfig({ ...config, autoRotationInterval: parseInt(e.target.value) || 5000 })}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Máximo de Tickets Mostrados
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={config.maxTicketsDisplayed}
                    onChange={(e) => setConfig({ ...config, maxTicketsDisplayed: parseInt(e.target.value) || 6 })}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showHeader}
                      onChange={(e) => setConfig({ ...config, showHeader: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Mostrar encabezado</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCarousel}
                      onChange={(e) => setConfig({ ...config, showCarousel: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Mostrar carrusel publicitario</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showStatusBar}
                      onChange={(e) => setConfig({ ...config, showStatusBar: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Mostrar barra de estado</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showQueueInfo}
                      onChange={(e) => setConfig({ ...config, showQueueInfo: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Mostrar información de cola</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showDateTime}
                      onChange={(e) => setConfig({ ...config, showDateTime: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Mostrar fecha y hora</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showConnectionStatus}
                      onChange={(e) => setConfig({ ...config, showConnectionStatus: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Mostrar estado de conexión</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.compactMode}
                      onChange={(e) => setConfig({ ...config, compactMode: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Modo compacto</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Carousel Text Settings */}
            <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <Settings size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-800">Configuración de Texto del Carrusel</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Título del Carrusel
                  </label>
                  <input
                    type="text"
                    value={config.carouselTitle}
                    onChange={(e) => setConfig({ ...config, carouselTitle: e.target.value })}
                    className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ej: Publicidad, Promociones, Ofertas"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableScrollingText}
                      onChange={(e) => setConfig({ ...config, enableScrollingText: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-purple-700">Habilitar texto deslizante</span>
                  </label>
                </div>

                {config.enableScrollingText && (
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-2">
                      Velocidad de Desplazamiento (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.scrollingSpeed}
                      onChange={(e) => setConfig({ ...config, scrollingSpeed: parseInt(e.target.value) })}
                      className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-purple-600 mt-1">
                      <span>Lento</span>
                      <span>Velocidad: {config.scrollingSpeed}</span>
                      <span>Rápido</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audio and Visual Settings */}
          <div className="space-y-6">
            {/* Audio Settings */}
            <div className="border border-green-200 rounded-xl p-6 bg-green-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  {config.enableAudio ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-white" />}
                </div>
                <h3 className="text-xl font-bold text-green-800">Configuración de Audio</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableAudio}
                      onChange={(e) => setConfig({ ...config, enableAudio: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700 font-medium">Habilitar anuncios de audio</span>
                  </label>
                </div>

                {config.enableAudio && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Volumen de Audio
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.audioVolume}
                        onChange={(e) => setConfig({ ...config, audioVolume: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-green-600 mt-1">
                        <span>Silencio</span>
                        <span>{Math.round(config.audioVolume * 100)}%</span>
                        <span>Máximo</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Voz Seleccionada
                      </label>
                      <select
                        value={config.selectedVoice}
                        onChange={(e) => setConfig({ ...config, selectedVoice: e.target.value })}
                        className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {voiceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Velocidad de Habla
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={config.speechRate}
                        onChange={(e) => setConfig({ ...config, speechRate: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-green-600 mt-1">
                        <span>Lento</span>
                        <span>{config.speechRate}x</span>
                        <span>Rápido</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Visual Settings */}
            <div className="border border-orange-200 rounded-xl p-6 bg-orange-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Palette size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-800">Configuración Visual</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Color de Fondo
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="w-12 h-10 border border-orange-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                        className="flex-1 p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Color del Encabezado
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.headerColor}
                        onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                        className="w-12 h-10 border border-orange-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.headerColor}
                        onChange={(e) => setConfig({ ...config, headerColor: e.target.value })}
                        className="flex-1 p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Color del Texto
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.textColor}
                        onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                        className="w-12 h-10 border border-orange-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.textColor}
                        onChange={(e) => setConfig({ ...config, textColor: e.target.value })}
                        className="flex-1 p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Color de Acento
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="w-12 h-10 border border-orange-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="flex-1 p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableAnimations}
                      onChange={(e) => setConfig({ ...config, enableAnimations: e.target.checked })}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-orange-700">Habilitar animaciones</span>
                  </label>

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

                {config.enableAnimations && (
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Duración de Resaltado (ms)
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="30000"
                      step="1000"
                      value={config.highlightDuration}
                      onChange={(e) => setConfig({ ...config, highlightDuration: parseInt(e.target.value) || 10000 })}
                      className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}