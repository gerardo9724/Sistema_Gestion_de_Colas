import React, { useState } from 'react';
import { X, Printer, TestTube, Eye, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { PrintSettings } from '../types';

interface PrintSettingsPanelProps {
  onClose: () => void;
}

export default function PrintSettingsPanel({ onClose }: PrintSettingsPanelProps) {
  const { state, updatePrintSettings, testPrint, previewTicket } = useApp();
  const [localSettings, setLocalSettings] = useState<PrintSettings>(state.printSettings);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleSaveSettings = () => {
    updatePrintSettings(localSettings);
    onClose();
  };

  const handleTestPrint = async () => {
    setIsTestingPrint(true);
    setTestResult(null);

    try {
      const success = await testPrint();
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTestingPrint(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Printer size={28} className="text-blue-500" />
            <span>Configuración de Impresión</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Print Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800">Estado de Impresión</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${localSettings.enablePrint ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${localSettings.enablePrint ? 'text-green-700' : 'text-red-700'}`}>
                {localSettings.enablePrint ? 'Habilitada' : 'Deshabilitada'}
              </span>
            </div>
          </div>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.enablePrint}
              onChange={(e) => setLocalSettings({ ...localSettings, enablePrint: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Habilitar impresión automática de tickets</span>
          </label>
        </div>

        {/* Print Settings */}
        {localSettings.enablePrint && (
          <div className="space-y-6">
            {/* Paper Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño de Papel
              </label>
              <select
                value={localSettings.paperSize}
                onChange={(e) => setLocalSettings({ 
                  ...localSettings, 
                  paperSize: e.target.value as PrintSettings['paperSize']
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paperSizeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Recomendado: 72-80mm para impresoras térmicas estándar
              </p>
            </div>

            {/* Number of Copies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Copias
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={localSettings.copies}
                onChange={(e) => setLocalSettings({ 
                  ...localSettings, 
                  copies: parseInt(e.target.value) || 1
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Auto Close */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoClose}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoClose: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Cerrar ventana de impresión automáticamente</span>
              </label>
            </div>

            {/* Test Mode */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.testMode}
                  onChange={(e) => setLocalSettings({ ...localSettings, testMode: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Modo de prueba (solo vista previa)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">
                En modo de prueba, los tickets se muestran en pantalla sin imprimir
              </p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            testResult === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {testResult === 'success' ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <AlertCircle size={20} className="text-red-600" />
              )}
              <span className={`font-medium ${
                testResult === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult === 'success' 
                  ? 'Prueba de impresión exitosa' 
                  : 'Error en la prueba de impresión'
                }
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 space-y-3">
          {/* Test and Preview Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTestPrint}
              disabled={isTestingPrint || !localSettings.enablePrint}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              {isTestingPrint ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Probando...</span>
                </>
              ) : (
                <>
                  <TestTube size={16} />
                  <span>Probar</span>
                </>
              )}
            </button>

            <button
              onClick={handlePreviewTicket}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Eye size={16} />
              <span>Vista Previa</span>
            </button>
          </div>

          {/* Save and Cancel Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveSettings}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Settings size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Help Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-semibold text-blue-800 mb-2">Información de Impresión:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Los tickets se optimizan automáticamente para impresoras térmicas de 72mm</li>
            <li>• La impresión se activa automáticamente al generar un ticket</li>
            <li>• Usa "Probar" para verificar que la impresora funciona correctamente</li>
            <li>• "Vista Previa" te permite ver cómo se verá el ticket antes de imprimir</li>
            <li>• El modo de prueba es útil para configurar sin desperdiciar papel</li>
          </ul>
        </div>
      </div>
    </div>
  );
}