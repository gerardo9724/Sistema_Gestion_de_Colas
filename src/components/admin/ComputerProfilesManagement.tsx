import React, { useState } from 'react';
import { Plus, Edit, Trash2, Monitor, Save, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { computerProfileService } from '../../services/computerProfileService';
import type { ComputerProfile } from '../../types';

export default function ComputerProfilesManagement() {
  const { state, loadInitialData } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ComputerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    computerIdentifier: '',
    profileType: 'botonera' as 'botonera' | 'nodo' | 'empleado',
    profileName: '',
    assignedUserId: '',
  });

  const resetForm = () => {
    setFormData({
      computerIdentifier: '',
      profileType: 'botonera',
      profileName: '',
      assignedUserId: '',
    });
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.computerIdentifier.trim() || !formData.profileName.trim()) {
      setError('Identificador de PC y nombre de perfil son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await computerProfileService.createComputerProfile({
        computerIdentifier: formData.computerIdentifier.trim(),
        profileType: formData.profileType,
        profileName: formData.profileName.trim(),
        assignedUserId: formData.assignedUserId || undefined,
      });

      setShowCreateModal(false);
      resetForm();
      await loadInitialData();
      alert('Perfil de PC creado exitosamente');
    } catch (error) {
      console.error('Error creating computer profile:', error);
      setError('Error al crear perfil de PC');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile || !formData.computerIdentifier.trim() || !formData.profileName.trim()) {
      setError('Identificador de PC y nombre de perfil son requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await computerProfileService.updateComputerProfile(editingProfile.id, {
        computerIdentifier: formData.computerIdentifier.trim(),
        profileType: formData.profileType,
        profileName: formData.profileName.trim(),
        assignedUserId: formData.assignedUserId || undefined,
      });

      setEditingProfile(null);
      resetForm();
      await loadInitialData();
      alert('Perfil de PC actualizado exitosamente');
    } catch (error) {
      console.error('Error updating computer profile:', error);
      setError('Error al actualizar perfil de PC');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este perfil de PC?')) {
      return;
    }

    setIsLoading(true);

    try {
      await computerProfileService.deleteComputerProfile(profileId);
      await loadInitialData();
      alert('Perfil de PC eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting computer profile:', error);
      alert('Error al eliminar perfil de PC');
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (profile: ComputerProfile) => {
    setEditingProfile(profile);
    setFormData({
      computerIdentifier: profile.computerIdentifier,
      profileType: profile.profileType,
      profileName: profile.profileName,
      assignedUserId: profile.assignedUserId || '',
    });
  };

  const cancelEdit = () => {
    setEditingProfile(null);
    resetForm();
  };

  const getProfileTypeLabel = (type: string) => {
    const labels = {
      'botonera': 'Botonera',
      'nodo': 'Nodo',
      'empleado': 'Empleado'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getProfileTypeColor = (type: string) => {
    const colors = {
      'botonera': 'bg-blue-100 text-blue-800',
      'nodo': 'bg-green-100 text-green-800',
      'empleado': 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getUserName = (userId?: string) => {
    if (!userId) return 'N/A';
    const user = state.users.find(u => u.id === userId);
    return user?.name || 'Usuario no encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Perfiles de PC</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nuevo Perfil</span>
          </button>
        </div>

        {/* Profiles List */}
        <div className="space-y-4">
          {state.computerProfiles.map((profile) => (
            <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <Monitor size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{profile.profileName}</h3>
                    <p className="text-gray-600">ID: {profile.computerIdentifier}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProfileTypeColor(profile.profileType)}`}>
                        {getProfileTypeLabel(profile.profileType)}
                      </span>
                      {profile.assignedUserId && (
                        <span className="text-sm text-gray-500">
                          Usuario: {getUserName(profile.assignedUserId)}
                        </span>
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        profile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {profile.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(profile)}
                    className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {state.computerProfiles.length === 0 && (
            <div className="text-center py-12">
              <Monitor size={64} className="mx-auto text-gray-300 mb-4" />
              <p className="text-xl text-gray-500">No hay perfiles de PC configurados</p>
              <p className="text-gray-400">Crea perfiles para asignar automáticamente módulos a computadoras específicas</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Perfil de PC</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador de PC
                </label>
                <input
                  type="text"
                  value={formData.computerIdentifier}
                  onChange={(e) => setFormData({ ...formData, computerIdentifier: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: PC-BOTONERA-01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Perfil
                </label>
                <select
                  value={formData.profileType}
                  onChange={(e) => setFormData({ ...formData, profileType: e.target.value as 'botonera' | 'nodo' | 'empleado' })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="botonera">Botonera</option>
                  <option value="nodo">Nodo</option>
                  <option value="empleado">Empleado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  value={formData.profileName}
                  onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Botonera Principal"
                  required
                />
              </div>
              
              {formData.profileType === 'empleado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario Asignado (Opcional)
                  </label>
                  <select
                    value={formData.assignedUserId}
                    onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar usuario</option>
                    {state.users.filter(u => u.type === 'empleado' && u.isActive).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </option>
                    ))}
                  </select>
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
                    resetForm();
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

      {/* Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Editar Perfil de PC</h3>
            
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identificador de PC
                </label>
                <input
                  type="text"
                  value={formData.computerIdentifier}
                  onChange={(e) => setFormData({ ...formData, computerIdentifier: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: PC-BOTONERA-01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Perfil
                </label>
                <select
                  value={formData.profileType}
                  onChange={(e) => setFormData({ ...formData, profileType: e.target.value as 'botonera' | 'nodo' | 'empleado' })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="botonera">Botonera</option>
                  <option value="nodo">Nodo</option>
                  <option value="empleado">Empleado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Perfil
                </label>
                <input
                  type="text"
                  value={formData.profileName}
                  onChange={(e) => setFormData({ ...formData, profileName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: Botonera Principal"
                  required
                />
              </div>
              
              {formData.profileType === 'empleado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario Asignado (Opcional)
                  </label>
                  <select
                    value={formData.assignedUserId}
                    onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar usuario</option>
                    {state.users.filter(u => u.type === 'empleado' && u.isActive).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} (@{user.username})
                      </option>
                    ))}
                  </select>
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
                  onClick={cancelEdit}
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