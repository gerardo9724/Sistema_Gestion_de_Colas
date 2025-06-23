import React, { useState } from 'react';
import { Plus, Edit, Trash2, Cog, Save, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { serviceService } from '../../services/serviceService';
import type { ServiceCategory, ServiceSubcategory } from '../../types';

export default function ServicesManagement() {
  const { state, loadInitialData } = useApp();
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showCreateSubcategoryModal, setShowCreateSubcategoryModal] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<ServiceSubcategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    identifier: '',
    description: '',
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    identifier: '',
    description: '',
  });

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      identifier: '',
      description: '',
    });
    setError('');
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: '',
      identifier: '',
      description: '',
    });
    setError('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim() || !categoryForm.identifier.trim()) {
      setError('Nombre e identificador son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await serviceService.createServiceCategory(
        categoryForm.name.trim(),
        categoryForm.identifier.trim()
      );

      setShowCreateCategoryModal(false);
      resetCategoryForm();
      await loadInitialData();
      alert('Categoría creada exitosamente');
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Error al crear categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateSubcategoryModal || !subcategoryForm.name.trim() || !subcategoryForm.identifier.trim()) {
      setError('Nombre e identificador son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await serviceService.createServiceSubcategory(
        showCreateSubcategoryModal,
        subcategoryForm.name.trim(),
        subcategoryForm.identifier.trim()
      );

      setShowCreateSubcategoryModal(null);
      resetSubcategoryForm();
      await loadInitialData();
      alert('Subcategoría creada exitosamente');
    } catch (error) {
      console.error('Error creating subcategory:', error);
      setError('Error al crear subcategoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !categoryForm.name.trim() || !categoryForm.identifier.trim()) {
      setError('Nombre e identificador son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await serviceService.updateServiceCategory(editingCategory.id, {
        name: categoryForm.name.trim(),
        identifier: categoryForm.identifier.trim(),
        description: categoryForm.description.trim() || undefined,
      });

      setEditingCategory(null);
      resetCategoryForm();
      await loadInitialData();
      alert('Categoría actualizada exitosamente');
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Error al actualizar categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory || !subcategoryForm.name.trim() || !subcategoryForm.identifier.trim()) {
      setError('Nombre e identificador son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await serviceService.updateServiceSubcategory(editingSubcategory.id, {
        name: subcategoryForm.name.trim(),
        identifier: subcategoryForm.identifier.trim(),
        description: subcategoryForm.description.trim() || undefined,
      });

      setEditingSubcategory(null);
      resetSubcategoryForm();
      await loadInitialData();
      alert('Subcategoría actualizada exitosamente');
    } catch (error) {
      console.error('Error updating subcategory:', error);
      setError('Error al actualizar subcategoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Se eliminarán también todas sus subcategorías.')) {
      return;
    }

    setIsLoading(true);

    try {
      await serviceService.deleteServiceCategory(categoryId);
      await loadInitialData();
      alert('Categoría eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta subcategoría?')) {
      return;
    }

    setIsLoading(true);

    try {
      await serviceService.deleteServiceSubcategory(subcategoryId);
      await loadInitialData();
      alert('Subcategoría eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      alert('Error al eliminar subcategoría');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      identifier: category.identifier,
      description: category.description || '',
    });
  };

  const startEditSubcategory = (subcategory: ServiceSubcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryForm({
      name: subcategory.name,
      identifier: subcategory.identifier,
      description: subcategory.description || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Servicios</h2>
          <button
            onClick={() => setShowCreateCategoryModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Categoría</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="space-y-6">
          {state.serviceCategories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Cog size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{category.name}</h3>
                    <p className="text-gray-600">Identificador: {category.identifier}</p>
                    {category.description && (
                      <p className="text-gray-500 text-sm mt-1">{category.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowCreateSubcategoryModal(category.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    + Subcategoría
                  </button>
                  <button
                    onClick={() => startEditCategory(category)}
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {category.subcategories.length > 0 && (
                <div className="ml-8 space-y-2">
                  <h4 className="font-semibold text-gray-700 mb-2">Subcategorías:</h4>
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-800">{subcategory.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({subcategory.identifier})</span>
                        {subcategory.description && (
                          <p className="text-gray-500 text-xs mt-1">{subcategory.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditSubcategory(subcategory)}
                          className="bg-orange-500 hover:bg-orange-600 text-white p-1 rounded transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubcategory(subcategory.id)}
                          className="bg-red-500 hover:bg-red-600 text-white p-1 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {state.serviceCategories.length === 0 && (
            <div className="text-center py-12">
              <Cog size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">No hay categorías de servicios</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Crear Nueva Categoría</h3>
            
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Compras"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador
                </label>
                <input
                  type="text"
                  value={categoryForm.identifier}
                  onChange={(e) => setCategoryForm({ ...categoryForm, identifier: e.target.value.toUpperCase() })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: COMP"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descripción de la categoría"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCategoryModal(false);
                    resetCategoryForm();
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
                  {isLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Subcategory Modal */}
      {showCreateSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Crear Nueva Subcategoría</h3>
            
            <form onSubmit={handleCreateSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Subcategoría
                </label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Medicamentos"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador
                </label>
                <input
                  type="text"
                  value={subcategoryForm.identifier}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, identifier: e.target.value.toUpperCase() })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: MEDICAMENTOS"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descripción de la subcategoría"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSubcategoryModal(null);
                    resetSubcategoryForm();
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
                  {isLoading ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Editar Categoría</h3>
            
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Compras"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador
                </label>
                <input
                  type="text"
                  value={categoryForm.identifier}
                  onChange={(e) => setCategoryForm({ ...categoryForm, identifier: e.target.value.toUpperCase() })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: COMP"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descripción de la categoría"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editingSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Editar Subcategoría</h3>
            
            <form onSubmit={handleUpdateSubcategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Subcategoría
                </label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Medicamentos"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador
                </label>
                <input
                  type="text"
                  value={subcategoryForm.identifier}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, identifier: e.target.value.toUpperCase() })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: MEDICAMENTOS"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={subcategoryForm.description}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descripción de la subcategoría"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSubcategory(null);
                    resetSubcategoryForm();
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}