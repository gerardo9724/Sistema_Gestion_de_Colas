import React, { useState, useRef } from 'react';
import { Save, Upload, X, Eye, TestTube, Printer, Building, Palette, Settings } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function SystemConfigurations() {
  const { state, updateSystemSettings, testPrint, previewTicket, loadInitialData } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Print Configuration
    printTickets: state.systemSettings?.printTickets ?? true,
    paperSize: 'thermal_80mm' as 'thermal_58mm' | 'thermal_80mm' | 'a4' | 'letter',
    copies: 1,
    autoClose: true,
    testMode: false,
    selectedTemplate: 'default',

    // Company Information
    companyName: state.systemSettings?.companyName || 'Sistema de Gestión de Colas',
    companyAddress: state.systemSettings?.companyAddress || 'Av. Principal 123, Ciudad',
    companyPhone: state.systemSettings?.companyPhone || '+1 (555) 123-4567',
    companyEmail: state.systemSettings?.companyEmail || '',
    companyWebsite: state.systemSettings?.companyWebsite || '',
    companyLogo: state.systemSettings?.companyLogo || '',

    // Design Customization
    headerColor: '#3B82F6',
    textColor: '#1F2937',
    backgroundColor: '#F9FAFB',
  });

  React.useEffect(() => {
    if (state.systemSettings) {
      setFormData(prev => ({
        ...prev,
        printTickets: state.systemSettings?.printTickets ?? true,
        companyName: state.systemSettings?.companyName || 'Sistema de Gestión de Colas',
        companyAddress: state.systemSettings?.companyAddress || 'Av. Principal 123, Ciudad',
        companyPhone: state.systemSettings?.companyPhone || '+1 (555) 123-4567',
        companyEmail: state.systemSettings?.companyEmail || '',
        companyWebsite: state.systemSettings?.companyWebsite || '',
        companyLogo: state.systemSettings?.companyLogo || '',
      }));
    }
  }, [state.systemSettings]);

  const handleSave = async (section: 'print' | 'company' | 'design') => {
    if (!state.systemSettings) {
      setError('No se encontraron configuraciones del sistema');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let updates: any = {};

      switch (section) {
        case 'print':
          updates = {
            printTickets: formData.printTickets,
          };
          break;
        case 'company':
          updates = {
            companyName: formData.companyName,
            companyAddress: formData.companyAddress,
            companyPhone: formData.companyPhone,
            companyEmail: formData.companyEmail || undefined,
            companyWebsite: formData.companyWebsite || undefined,
            companyLogo: formData.companyLogo || undefined,
          };
          break;
        case 'design':
          // For now, we'll store design settings in the system settings
          // In a real implementation, you might want a separate design configuration
          updates = {
            // Store design settings as JSON or separate fields
          };
          break;
      }

      await updateSystemSettings(updates);
      await loadInitialData(); // Reload data to reflect changes
      setSuccess(`Configuración de ${section === 'print' ? 'impresión' : section === 'company' ? 'empresa' : 'diseño'} guardada exitosamente`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 2MB permitido');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, companyLogo: result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, companyLogo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTestPrint = async () => {
    setIsLoading(true);
    try {
      const success = await testPrint();
      if (success) {
        setSuccess('Prueba de impresión enviada exitosamente');
      } else {
        setError('Error en la prueba de impresión');
      }
    } catch (error) {
      setError('Error al probar impresión');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewTicket = () => {
    const sampleTicket = {
      id: 'preview',
      number: 999,
      serviceType: 'compra',
      serviceSubtype: 'medicamentos',
      status: 'waiting' as const,
      queuePosition: 1,
      createdAt: new Date(),
    };

    previewTicket(sampleTicket);
  };

  const paperSizeOptions = [
    { value: 'thermal_58mm', label: '58mm (Térmico pequeño)' },
    { value: 'thermal_80mm', label: '72-80mm (Térmico estándar)' },
    { value: 'a4', label: 'A4 (Papel estándar)' },
    { value: 'letter', label: 'Carta (8.5" x 11")' },
  ];

  const templateOptions = [
    { value: 'default', label: 'Plantilla Básica (Sin instrucciones)' },
    { value: 'minimal', label: 'Plantilla Minimalista' },
    { value: 'detailed', label: 'Plantilla Detallada (Con instrucciones)' },
    { value: 'corporate', label: 'Plantilla Corporativa' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Configuraciones del Sistema</h2>

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
          {/* Print Configuration */}
          <div className="space-y-6">
            <div className="border border-blue-200 rounded-xl p-6 bg-blue-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Printer size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-800">Configuración de Impresión</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.printTickets}
                      onChange={(e) => setFormData({ ...formData, printTickets: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700 font-medium">Habilitar impresión automática</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Tamaño de Papel
                  </label>
                  <select
                    value={formData.paperSize}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      paperSize: e.target.value as 'thermal_58mm' | 'thermal_80mm' | 'a4' | 'letter'
                    })}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paperSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Número de Copias
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.copies}
                    onChange={(e) => setFormData({ ...formData, copies: parseInt(e.target.value) || 1 })}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Plantilla de Ticket
                  </label>
                  <select
                    value={formData.selectedTemplate}
                    onChange={(e) => setFormData({ ...formData, selectedTemplate: e.target.value })}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {templateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    • <strong>Básica:</strong> Solo información esencial del ticket<br/>
                    • <strong>Detallada:</strong> Incluye instrucciones importantes para el cliente
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoClose}
                      onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Cerrar ventana automáticamente</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.testMode}
                      onChange={(e) => setFormData({ ...formData, testMode: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-blue-700">Modo de prueba (solo vista previa)</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleTestPrint}
                    disabled={isLoading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <TestTube size={16} />
                    <span>Probar</span>
                  </button>

                  <button
                    onClick={handlePreviewTicket}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye size={16} />
                    <span>Vista Previa</span>
                  </button>
                </div>

                <button
                  onClick={() => handleSave('print')}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Company Information & Branding */}
          <div className="space-y-6">
            <div className="border border-green-200 rounded-xl p-6 bg-green-50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-500 p-2 rounded-lg">
                  <Building size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800">Diseño y Branding</h3>
              </div>

              <div className="space-y-4">
                {/* Company Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Nombre de la Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nombre de tu empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Dirección de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                      className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Email (Opcional)
                    </label>
                    <input
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                      className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="contacto@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">
                      Sitio Web (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.companyWebsite}
                      onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                      className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://www.empresa.com"
                    />
                  </div>
                </div>

                {/* Logo Management */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Logo de la Empresa
                  </label>
                  
                  {formData.companyLogo ? (
                    <div className="border border-green-300 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-green-700">Logo Actual:</span>
                        <button
                          onClick={handleRemoveLogo}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar logo"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <img
                        src={formData.companyLogo}
                        alt="Logo de la empresa"
                        className="max-w-full h-24 object-contain mx-auto border border-gray-200 rounded"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center bg-white">
                      <Upload size={32} className="mx-auto text-green-400 mb-2" />
                      <p className="text-green-600 text-sm">No hay logo configurado</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Upload size={16} />
                      <span>Subir Logo</span>
                    </button>
                  </div>
                  
                  <p className="text-xs text-green-600 mt-2">
                    El logo se mostrará en el encabezado del sistema y en los tickets impresos
                  </p>
                </div>

                <button
                  onClick={() => handleSave('company')}
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

        {/* Design Customization */}
        <div className="mt-8 border border-purple-200 rounded-xl p-6 bg-purple-50">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-500 p-2 rounded-lg">
              <Palette size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-purple-800">Personalización de Colores</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                <Settings size={16} className="inline mr-2" />
                Color del Encabezado
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
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                T Color del Texto
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
                  placeholder="#1F2937"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                📄 Color de Fondo
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
                  placeholder="#F9FAFB"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSave('design')}
            disabled={isLoading}
            className="mt-6 w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <Save size={16} />
            <span>{isLoading ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}