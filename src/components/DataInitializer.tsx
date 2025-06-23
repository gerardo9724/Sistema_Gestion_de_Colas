import React, { useState } from 'react';
import { Database, Zap, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { serviceService } from '../services/serviceService';
import { carouselService } from '../services/carouselService';

export default function DataInitializer() {
  const { state, loadInitialData } = useApp();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showPanel, setShowPanel] = useState(false);

  const initializeDemoData = async () => {
    if (!state.isFirebaseConnected) {
      alert('No hay conexión a Firebase');
      return;
    }

    setIsInitializing(true);
    setInitStatus('idle');

    try {
      console.log('Initializing demo data...');

      // Create demo service categories
      const demoServices = [
        { name: 'Compra', identifier: 'COMP' },
        { name: 'Seguro', identifier: 'SEG' },
        { name: 'Consulta', identifier: 'CONS' }
      ];

      const createdCategories = [];
      for (const service of demoServices) {
        try {
          const category = await serviceService.createServiceCategory(service.name, service.identifier);
          createdCategories.push(category);
          console.log(`Created category: ${category.name}`);
        } catch (error) {
          console.log(`Category ${service.name} might already exist, continuing...`);
        }
      }

      // Create demo subcategories
      const demoSubcategories = [
        { categoryIdentifier: 'COMP', name: 'Medicamentos', identifier: 'MEDICAMENTOS' },
        { categoryIdentifier: 'COMP', name: 'Productos de Salud', identifier: 'SALUD' },
        { categoryIdentifier: 'SEG', name: 'Carnet de Identidad', identifier: 'CARNET' },
        { categoryIdentifier: 'SEG', name: 'Documentos', identifier: 'DOCUMENTOS' },
        { categoryIdentifier: 'CONS', name: 'Información General', identifier: 'INFO' },
        { categoryIdentifier: 'CONS', name: 'Soporte Técnico', identifier: 'SOPORTE' }
      ];

      // Get current categories to find IDs
      const currentCategories = await serviceService.getAllServiceCategories();
      
      for (const sub of demoSubcategories) {
        const category = currentCategories.find(c => c.identifier === sub.categoryIdentifier);
        if (category) {
          try {
            await serviceService.createServiceSubcategory(category.id, sub.name, sub.identifier);
            console.log(`Created subcategory: ${sub.name}`);
          } catch (error) {
            console.log(`Subcategory ${sub.name} might already exist, continuing...`);
          }
        }
      }

      // Create demo carousel images
      const demoImages = [
        {
          name: 'Promoción Seguros',
          url: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=800',
          description: 'Promociones especiales en seguros de vida y hogar'
        },
        {
          name: 'Ofertas Especiales',
          url: 'https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=800',
          description: 'Ofertas limitadas por tiempo en productos seleccionados'
        },
        {
          name: 'Nuevos Productos',
          url: 'https://images.pexels.com/photos/164527/pexels-photo-164527.jpeg?auto=compress&cs=tinysrgb&w=800',
          description: 'Conoce nuestra nueva línea de productos de salud'
        },
        {
          name: 'Servicios Premium',
          url: 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800',
          description: 'Servicios premium para clientes VIP'
        }
      ];

      for (const image of demoImages) {
        try {
          await carouselService.createCarouselImage(image);
          console.log(`Created carousel image: ${image.name}`);
        } catch (error) {
          console.log(`Image ${image.name} might already exist, continuing...`);
        }
      }

      // Reload data to reflect changes
      await loadInitialData();

      setInitStatus('success');
      console.log('Demo data initialized successfully!');
    } catch (error) {
      console.error('Error initializing demo data:', error);
      setInitStatus('error');
    } finally {
      setIsInitializing(false);
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Gestión de Datos"
      >
        <Database size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Database size={28} className="text-blue-500" />
            <span>Gestión de Datos</span>
          </h3>
          <button
            onClick={() => setShowPanel(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            {state.isFirebaseConnected ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <AlertCircle size={20} className="text-red-500" />
            )}
            
            <div>
              <div className="font-semibold text-gray-800">
                {state.isFirebaseConnected ? 'Conectado a Firebase' : 'Sin conexión'}
              </div>
              <div className="text-sm text-gray-600">
                {state.isFirebaseConnected 
                  ? 'Los datos se sincronizan automáticamente'
                  : 'Verifica tu conexión a Firebase'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50">
          <h4 className="font-semibold text-blue-800 mb-2">Datos Actuales:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
            <div>Tickets: <strong>{state.tickets.length}</strong></div>
            <div>Servicios: <strong>{state.serviceCategories.length}</strong></div>
            <div>Empleados: <strong>{state.employees.length}</strong></div>
            <div>Imágenes: <strong>{state.carouselImages.length}</strong></div>
          </div>
        </div>

        {/* Status Messages */}
        {initStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle size={16} />
              <span className="text-sm font-medium">Datos inicializados correctamente</span>
            </div>
          </div>
        )}

        {initStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Error al inicializar datos</span>
            </div>
          </div>
        )}

        {/* Initialize Demo Data */}
        <div className="border rounded-lg p-4 border-green-200 bg-green-50 mb-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
            <Zap size={18} className="text-green-600" />
            <span>Inicializar Datos Demo</span>
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Crea servicios e imágenes de demostración para todos los módulos. 
            Incluye categorías, subcategorías y carrusel publicitario.
          </p>
          <div className="bg-white p-3 rounded border mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <Image size={16} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Incluye:</span>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• 3 categorías de servicios con subcategorías</li>
              <li>• 4 imágenes publicitarias para el carrusel</li>
              <li>• Configuración completa para todos los módulos</li>
            </ul>
          </div>
          <button
            onClick={initializeDemoData}
            disabled={isInitializing || !state.isFirebaseConnected}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            {isInitializing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Inicializando...</span>
              </>
            ) : (
              <>
                <Zap size={16} />
                <span>Inicializar Demo</span>
              </>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h5 className="font-semibold text-blue-800 mb-2">Instrucciones:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Inicializar Demo:</strong> Crea datos completos para probar todos los módulos</li>
            <li>• Los datos se guardan automáticamente en Firebase</li>
            <li>• Sincronización en tiempo real habilitada</li>
            <li>• El carrusel rota automáticamente cada 5 segundos</li>
            <li>• Las notificaciones de audio funcionan en el módulo Nodo</li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowPanel(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}