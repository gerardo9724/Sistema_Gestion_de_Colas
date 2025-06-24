import React, { useState, useEffect, useRef } from 'react';
import { Save, Eye, EyeOff, Monitor, Volume2, VolumeX, Palette, Settings, RotateCcw, Type, Plus, Trash2, Upload, Image as ImageIcon, Edit } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { carouselService } from '../../services/carouselService';
import type { CarouselImage } from '../../types';

export default function NodeConfiguration() {
  const { state, updateNodeConfiguration, saveCompleteNodeConfiguration, loadInitialData } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [imageFormData, setImageFormData] = useState({
    name: '',
    url: '',
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state with all configuration options
  const [config, setConfig] = useState({
    // Display Settings
    autoRotationInterval: 5000,
    showQueueInfo: true,
    showCompanyLogo: true,
    showCompanyName: true,
    maxTicketsDisplayed: 6,
    showDateTime: true,
    showConnectionStatus: true,
    showHeader: true,
    showCarousel: true,
    showStatusBar: true,
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
        showCompanyName: state.nodeConfiguration.showCompanyName ?? true,
        maxTicketsDisplayed: state.nodeConfiguration.maxTicketsDisplayed || 6,
        showDateTime: state.nodeConfiguration.showDateTime ?? true,
        showConnectionStatus: state.nodeConfiguration.showConnectionStatus ?? true,
        showHeader: state.nodeConfiguration.showHeader ?? true,
        showCarousel: state.nodeConfiguration.showCarousel ?? true,
        showStatusBar: state.nodeConfiguration.showStatusBar ?? true,
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
        showCompanyName: true,
        maxTicketsDisplayed: 6,
        showDateTime: true,
        showConnectionStatus: true,
        showHeader: true,
        showCarousel: true,
        showStatusBar: true,
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

  // Image management functions
  const resetImageForm = () => {
    setImageFormData({
      name: '',
      url: '',
      description: '',
    });
    setEditingImage(null);
    setError('');
  };

  const handleAddImage = () => {
    resetImageForm();
    setShowImageModal(true);
  };

  const handleEditImage = (image: CarouselImage) => {
    setEditingImage(image);
    setImageFormData({
      name: image.name,
      url: image.url,
      description: image.description || '',
    });
    setShowImageModal(true);
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
      console.error('Error deleting image:', error);
      setError('Error al eliminar imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFormData.name.trim() || !imageFormData.url.trim()) {
      setError('Nombre y URL son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (editingImage) {
        // Update existing image (Note: carouselService doesn't have update method, so we'll delete and recreate)
        await carouselService.deleteCarouselImage(editingImage.id);
      }
      
      await carouselService.createCarouselImage({
        name: imageFormData.name.trim(),
        url: imageFormData.url.trim(),
        description: imageFormData.description.trim() || undefined,
      });

      await loadInitialData();
      setShowImageModal(false);
      resetImageForm();
      setSuccess(editingImage ? 'Imagen actualizada exitosamente' : 'Imagen agregada exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving image:', error);
      setError('Error al guardar imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 5MB permitido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageFormData(prev => ({ ...prev, url: result }));
      setError('');
    };
    reader.readAsDataURL(file);
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
                      checked={config.showCompanyName}
                      onChange={(e) => setConfig({ ...config, showCompanyName: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Type size={16} className="text-green-600" />
                      <span className="text-green-700 font-medium">Mostrar Nombre de Empresa</span>
                    </div>
                  </label>
                  <p className="text-xs text-green-600 ml-8">El nombre de la empresa será visible en el header del módulo nodo</p>

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

        {/* NEW: Carousel Images Management Section */}
        <div className="mt-8 border border-indigo-200 rounded-xl p-6 bg-indigo-50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <ImageIcon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-indigo-800">Gestión de Imágenes del Carrusel</h3>
            </div>
            <button
              onClick={handleAddImage}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Agregar Imagen</span>
            </button>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.carouselImages.map((image, index) => (
              <div key={image.id} className="bg-white rounded-lg border border-indigo-200 overflow-hidden shadow-sm">
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-indigo-500 text-white px-2 py-1 rounded text-xs font-medium">
                    #{index + 1}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-indigo-900 mb-1 truncate">{image.name}</h4>
                  {image.description && (
                    <p className="text-sm text-indigo-700 mb-3 line-clamp-2">{image.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      image.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {image.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditImage(image)}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded transition-colors"
                        title="Editar imagen"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteImage(image.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-colors"
                        title="Eliminar imagen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {state.carouselImages.length === 0 && (
              <div className="col-span-full text-center py-12">
                <ImageIcon size={64} className="mx-auto text-indigo-300 mb-4" />
                <p className="text-xl text-indigo-500 font-semibold mb-2">No hay imágenes en el carrusel</p>
                <p className="text-indigo-400">Agrega imágenes para mostrar publicidad en el módulo nodo</p>
              </div>
            )}
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {editingImage ? 'Editar Imagen' : 'Agregar Nueva Imagen'}
            </h3>
            
            <form onSubmit={handleSaveImage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Imagen
                </label>
                <input
                  type="text"
                  value={imageFormData.name}
                  onChange={(e) => setImageFormData({ ...imageFormData, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ej: Promoción de Verano"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puedes usar URLs de Pexels, Unsplash o subir tu propia imagen
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Imagen desde Archivo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors"
                >
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <span className="text-gray-600">Haz clic para subir una imagen</span>
                  <p className="text-xs text-gray-500 mt-1">Máximo 5MB - JPG, PNG, GIF</p>
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={imageFormData.description}
                  onChange={(e) => setImageFormData({ ...imageFormData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descripción de la imagen o promoción"
                />
              </div>

              {/* Image Preview */}
              {imageFormData.url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vista Previa
                  </label>
                  <div className="border border-gray-300 rounded-lg p-2">
                    <img
                      src={imageFormData.url}
                      alt="Vista previa"
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
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
                    setShowImageModal(false);
                    resetImageForm();
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Guardando...' : editingImage ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}