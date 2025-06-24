import React, { useState, useRef } from 'react';
import { Save, Upload, X, Eye, TestTube, Palette, Settings, Monitor, Volume2, Image, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function NodeConfiguration() {
  const { state, updateNodeConfiguration, saveCompleteNodeConfiguration } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current configuration or use defaults
  const currentConfig = state.nodeConfiguration || {
    // Display Settings
    autoRotationInterval: 5000,
    showQueueInfo: true,
    showCompanyLogo: true,
    maxTicketsDisplayed: 6,
    showDateTime: true,
    showConnectionStatus: true,
    showHeader: true,
    showCarousel: true,
    showFooter: true, // NEW: Default to show footer
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
  };

  // Form state
  const [formData, setFormData] = useState({
    // Display Settings
    autoRotationInterval: currentConfig.autoRotationInterval,
    showQueueInfo: currentConfig.showQueueInfo,
    showCompanyLogo: currentConfig.showCompanyLogo,
    maxTicketsDisplayed: currentConfig.maxTicketsDisplayed,
    showDateTime: currentConfig.showDateTime,
    showConnectionStatus: currentConfig.showConnectionStatus,
    showHeader: currentConfig.showHeader,
    showCarousel: currentConfig.showCarousel,
    showFooter: currentConfig.showFooter ?? true, // NEW: Footer visibility
    compactMode: currentConfig.compactMode,
    
    // Audio Settings
    enableAudio: currentConfig.enableAudio,
    audioVolume: currentConfig.audioVolume,
    selectedVoice: currentConfig.selectedVoice,
    speechRate: currentConfig.speechRate,
    
    // Visual Settings
    backgroundColor: currentConfig.backgroundColor,
    headerColor: currentConfig.headerColor,
    textColor: currentConfig.textColor,
    accentColor: currentConfig.accentColor,
    
    // Animation Settings
    enableAnimations: currentConfig.enableAnimations,
    highlightDuration: currentConfig.highlightDuration,
    transitionDuration: currentConfig.transitionDuration,
    
    // Content Settings
    showImageDescriptions: currentConfig.showImageDescriptions,
    showImageIndicators: currentConfig.showImageIndicators,
    pauseOnHover: currentConfig.pauseOnHover,
    
    // Carousel Text Settings
    carouselTitle: currentConfig.carouselTitle,
    enableScrollingText: currentConfig.enableScrollingText,
    scrollingSpeed: currentConfig.scrollingSpeed,
  });

  React.useEffect(() => {
    if (state.nodeConfiguration) {
      setFormData({
        autoRotationInterval: state.nodeConfiguration.autoRotationInterval,
        showQueueInfo: state.nodeConfiguration.showQueueInfo,
        showCompanyLogo: state.nodeConfiguration.showCompanyLogo,
        maxTicketsDisplayed: state.nodeConfiguration.maxTicketsDisplayed,
        showDateTime: state.nodeConfiguration.showDateTime,
        showConnectionStatus: state.nodeConfiguration.showConnectionStatus,
        showHeader: state.nodeConfiguration.showHeader,
        showCarousel: state.nodeConfiguration.showCarousel,
        showFooter: state.nodeConfiguration.showFooter ?? true, // NEW: Footer visibility
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

  const handleSave = async (section: 'display' | 'audio' | 'visual' | 'animation' | 'content' | 'all') => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (section === 'all') {
        await saveCompleteNodeConfiguration(formData);
        setSuccess('Configuración completa guardada exitosamente');
      } else {
        let updates: any = {};

        switch (section) {
          case 'display':
            updates = {
              autoRotationInterval: formData.autoRotationInterval,
              showQueueInfo: formData.showQueueInfo,
              showCompanyLogo: formData.showCompanyLogo,
              maxTicketsDisplayed: formData.maxTicketsDisplayed,
              showDateTime: formData.showDateTime,
              showConnectionStatus: formData.showConnectionStatus,
              showHeader: formData.showHeader,
              showCarousel: formData.showCarousel,
              showFooter: formData.showFooter, // NEW: Include footer visibility
              compactMode: formData.compactMode,
            };
            break;
          case 'audio':
            updates = {
              enableAudio: formData.enableAudio,
              audioVolume: formData.audioVolume,
              selectedVoice: formData.selectedVoice,
              speechRate: formData.speechRate,
            };
            break;
          case 'visual':
            updates = {
              backgroundColor: formData.backgroundColor,
              headerColor: formData.headerColor,
              textColor: formData.textColor,
              accentColor: formData.accentColor,
            };
            break;
          case 'animation':
            updates = {
              enableAnimations: formData.enableAnimations,
              highlightDuration: formData.highlightDuration,
              transitionDuration: formData.transitionDuration,
            };
            break;
          case 'content':
            updates = {
              showImageDescriptions: formData.showImageDescriptions,
              showImageIndicators: formData.showImageIndicators,
              pauseOnHover: formData.pauseOnHover,
              carouselTitle: formData.carouselTitle,
              enableScrollingText: formData.enableScrollingText,
              scrollingSpeed: formData.scrollingSpeed,
            };
            break;
        }

        await updateNodeConfiguration(updates);
        setSuccess(`Configuración de ${section} guardada exitosamente`);
      }
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Error al guardar configuración');
    } finally {
      setIsLoading(false);
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
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Configuración del Módulo Nodo</h2>

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
          {/* Display Configuration */}
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
                    <Clock size={16} className="inline mr-2" />
                    Intervalo de Rotación: {formData.autoRotationInterval / 1000}s
                  </label>
                  <input
                    type="range"
                    min="3000"
                    max="30000"
                    step="1000"
                    value={formData.autoRotationInterval}
                    onChange={(e) => setFormData({ ...formData, autoRotationInterval: parseInt(e.target.value) })}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>3s</span>
                    <span>30s</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Máximo de Tickets: {formData.maxTicketsDisplayed}
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    value={formData.maxTicketsDisplayed}
                    onChange={(e) => setFormData({ ...formData, maxTicketsDisplayed: parseInt(e.target.value) })}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-blue-600 mt-1">
                    <span>4</span>
                    <span>12</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showQueueInfo}
                        onChange={(e) => setFormData({ ...formData, showQueueInfo: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-blue-700">Info de cola</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCompanyLogo}
                        onChange={(e) => setFormData({ ...formData, showCompanyLogo: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-blue-700">Logo empresa</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showDateTime}
                        onChange={(e) => setFormData({ ...formData, showDateTime: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-blue-700">Fecha y hora</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableAnimations}
                        onChange={(e) => setFormData({ ...formData, enableAnimations: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-blue-700">Animaciones</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showHeader}
                        onChange={(e) => setFormData({ ...formData, showHeader: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Eye size={16} className="text-blue-600" />
                      <span className="text-blue-700 font-medium">Mostrar Header</span>
                    </label>
                    <p className="text-xs text-blue-600 ml-8">El header con navegación, hora y estado será visible</p>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCarousel}
                        onChange={(e) => setFormData({ ...formData, showCarousel: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Eye size={16} className="text-blue-600" />
                      <span className="text-blue-700 font-medium">Mostrar Carrusel de Publicidad</span>
                    </label>
                    <p className="text-xs text-blue-600 ml-8">El carrusel de publicidad será visible en la mitad derecha de la pantalla</p>
                  </div>

                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showFooter}
                        onChange={(e) => setFormData({ ...formData, showFooter: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Eye size={16} className="text-blue-600" />
                      <span className="text-blue-700 font-medium">Mostrar Footer</span>
                    </label>
                    <p className="text-xs text-blue-600 ml-8">La barra de estado con estadísticas será visible en la parte inferior</p>
                  </div>
                </div>

                <button
                  onClick={() => handleSave('display')}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audio Configuration */}
          <div className="space-y-6">
            <div className="border border-green-200 rounded-xl p-6 bg-green-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Volume2 size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800">Configuración de Audio</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={formData.enableAudio}
                      onChange={(e) => setFormData({ ...formData, enableAudio: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-green-700 font-medium">Habilitar anuncios de audio</span>
                  </label>
                </div>

                {formData.enableAudio && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Volumen: {Math.round(formData.audioVolume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.audioVolume}
                        onChange={(e) => setFormData({ ...formData, audioVolume: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Velocidad de Habla: {formData.speechRate}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={formData.speechRate}
                        onChange={(e) => setFormData({ ...formData, speechRate: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        Voz Seleccionada
                      </label>
                      <select
                        value={formData.selectedVoice}
                        onChange={(e) => setFormData({ ...formData, selectedVoice: e.target.value })}
                        className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        {voiceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <button
                  onClick={() => handleSave('audio')}
                  disabled={isLoading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Customization */}
        <div className="mt-8 border border-purple-200 rounded-xl p-6 bg-purple-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Palette size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-purple-800">Personalización Visual</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Color de Fondo
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
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
                  value={formData.headerColor}
                  onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                  className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.headerColor}
                  onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
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
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
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
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="w-12 h-10 border border-purple-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  className="flex-1 p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSave('visual')}
            disabled={isLoading}
            className="mt-6 w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>

        {/* Content Configuration */}
        <div className="mt-8 border border-orange-200 rounded-xl p-6 bg-orange-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-orange-500 p-2 rounded-lg">
              <Image size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-orange-800">Configuración de Contenido</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-2">
                  Título del Carrusel
                </label>
                <input
                  type="text"
                  value={formData.carouselTitle}
                  onChange={(e) => setFormData({ ...formData, carouselTitle: e.target.value })}
                  className="w-full p-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Publicidad"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enableScrollingText}
                    onChange={(e) => setFormData({ ...formData, enableScrollingText: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-orange-700">Habilitar texto deslizante</span>
                </label>
              </div>

              {formData.enableScrollingText && (
                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-2">
                    Velocidad de Desplazamiento: {formData.scrollingSpeed}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.scrollingSpeed}
                    onChange={(e) => setFormData({ ...formData, scrollingSpeed: parseInt(e.target.value) })}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-orange-600 mt-1">
                    <span>Lento</span>
                    <span>Rápido</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showImageDescriptions}
                    onChange={(e) => setFormData({ ...formData, showImageDescriptions: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-orange-700">Mostrar descripciones de imágenes</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showImageIndicators}
                    onChange={(e) => setFormData({ ...formData, showImageIndicators: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-orange-700">Mostrar indicadores de imagen</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.pauseOnHover}
                    onChange={(e) => setFormData({ ...formData, pauseOnHover: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-orange-700">Pausar al pasar el mouse</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSave('content')}
            disabled={isLoading}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>

        {/* Save All Configuration */}
        <div className="mt-8 text-center">
          <button
            onClick={() => handleSave('all')}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-4 px-8 rounded-xl font-bold text-lg transition-colors flex items-center justify-center space-x-3 mx-auto"
          >
            <Settings size={24} />
            <span>{isLoading ? 'Guardando Configuración Completa...' : 'Guardar Toda la Configuración'}</span>
          </button>
          <p className="text-gray-600 text-sm mt-2">
            Guarda todas las configuraciones de una vez y aplica los cambios al módulo Nodo
          </p>
        </div>
      </div>
    </div>
  );
}