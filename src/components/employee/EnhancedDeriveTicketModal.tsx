import React, { useState } from 'react';
import { ArrowRight, X, User, Users, AlertTriangle, Clock, Star } from 'lucide-react';
import type { Ticket, Employee, ServiceCategory } from '../../types';

interface EnhancedDeriveTicketModalProps {
  ticket: Ticket;
  employees: Employee[];
  serviceCategories: ServiceCategory[];
  onClose: () => void;
  onDerive: (
    targetType: 'queue' | 'employee', 
    targetId?: string, 
    options?: {
      newServiceType?: string;
      priority?: 'normal' | 'high' | 'urgent';
      reason?: string;
      comment?: string;
    }
  ) => void;
}

export default function EnhancedDeriveTicketModal({
  ticket,
  employees,
  serviceCategories,
  onClose,
  onDerive
}: EnhancedDeriveTicketModalProps) {
  const [deriveType, setDeriveType] = useState<'queue' | 'employee'>('queue');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState(ticket.serviceType);
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');

  const handleDerive = () => {
    if (deriveType === 'employee' && !selectedEmployee) {
      alert('Debe seleccionar un empleado');
      return;
    }

    const options = {
      newServiceType: selectedServiceType !== ticket.serviceType ? selectedServiceType : undefined,
      priority: priority !== 'normal' ? priority : undefined,
      reason: reason.trim() || undefined,
      comment: comment.trim() || undefined,
    };

    onDerive(
      deriveType,
      deriveType === 'employee' ? selectedEmployee : undefined,
      options
    );
  };

  const availableEmployees = employees.filter(emp => 
    emp.isActive && emp.id !== ticket.servedBy
  );

  const busyEmployees = availableEmployees.filter(emp => emp.currentTicketId);
  const freeEmployees = availableEmployees.filter(emp => !emp.currentTicketId && !emp.isPaused);

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityIcon = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'urgent': return '🚨';
      case 'high': return '⚡';
      default: return '📋';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6">
          <ArrowRight size={32} className="text-purple-500" />
          <h3 className="text-2xl font-bold text-gray-800">Derivar Ticket - Flujo Avanzado</h3>
        </div>
        
        <div className="mb-6">
          {/* Current Ticket Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">📋 Ticket a Derivar:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  #{ticket.number.toString().padStart(3, '0')}
                </div>
                <div className="text-sm text-gray-600">
                  Servicio: {ticket.serviceType.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">
                  Creado: {ticket.createdAt.toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-600">
                  Tiempo en atención: {ticket.servedAt ? 
                    Math.floor((new Date().getTime() - new Date(ticket.servedAt).getTime()) / 60000) + ' min' 
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Derivation Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🎯 Tipo de Derivación
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="queue"
                    checked={deriveType === 'queue'}
                    onChange={(e) => setDeriveType(e.target.value as 'queue')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Users size={16} className="text-purple-600" />
                      <span className="font-medium text-gray-700">Devolver a Cola General</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      El ticket volverá a la cola general y será atendido por el próximo empleado disponible
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="employee"
                    checked={deriveType === 'employee'}
                    onChange={(e) => setDeriveType(e.target.value as 'employee')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-purple-600" />
                      <span className="font-medium text-gray-700">Asignar a Empleado Específico</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Si está disponible: asignación inmediata. Si está ocupado: va a su cola personal
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Employee Selection */}
            {deriveType === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  👤 Empleado Destino
                </label>
                
                {/* Free Employees */}
                {freeEmployees.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Disponibles (Asignación Inmediata)</span>
                    </h5>
                    <div className="space-y-2">
                      {freeEmployees.map((employee) => (
                        <label key={employee.id} className="flex items-center space-x-3 cursor-pointer p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                          <input
                            type="radio"
                            value={employee.id}
                            checked={selectedEmployee === employee.id}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{employee.name}</div>
                            <div className="text-sm text-gray-600">{employee.position}</div>
                          </div>
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Disponible
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Busy Employees */}
                {busyEmployees.length > 0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Ocupados (Cola Personal)</span>
                    </h5>
                    <div className="space-y-2">
                      {busyEmployees.map((employee) => (
                        <label key={employee.id} className="flex items-center space-x-3 cursor-pointer p-3 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                          <input
                            type="radio"
                            value={employee.id}
                            checked={selectedEmployee === employee.id}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{employee.name}</div>
                            <div className="text-sm text-gray-600">{employee.position}</div>
                          </div>
                          <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                            Ocupado
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {availableEmployees.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    <User size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No hay empleados disponibles</p>
                  </div>
                )}
              </div>
            )}

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ⭐ Prioridad del Ticket
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['normal', 'high', 'urgent'] as const).map((priorityLevel) => (
                  <label key={priorityLevel} className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      value={priorityLevel}
                      checked={priority === priorityLevel}
                      onChange={(e) => setPriority(e.target.value as 'normal' | 'high' | 'urgent')}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <div className="flex-1 text-center">
                      <div className="text-lg mb-1">{getPriorityIcon(priorityLevel)}</div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${getPriorityColor(priorityLevel)}`}>
                        {priorityLevel === 'normal' ? 'Normal' : 
                         priorityLevel === 'high' ? 'Alta' : 'Urgente'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Service Type Change */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔄 Cambiar Tipo de Servicio (Opcional)
              </label>
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {serviceCategories.map((category) => (
                  <option key={category.id} value={category.identifier.toLowerCase()}>
                    {category.name}
                  </option>
                ))}
              </select>
              {selectedServiceType !== ticket.serviceType && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ El tipo de servicio cambiará de "{ticket.serviceType}" a "{selectedServiceType}"
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Motivo de Derivación
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar motivo</option>
                <option value="Especialización requerida">Especialización requerida</option>
                <option value="Carga de trabajo">Redistribución de carga de trabajo</option>
                <option value="Cliente específico">Solicitud de cliente específico</option>
                <option value="Urgencia">Manejo de urgencia</option>
                <option value="Capacitación">Propósitos de capacitación</option>
                <option value="Otro">Otro motivo</option>
              </select>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Comentario Adicional (Opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Información adicional sobre la derivación..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDerive}
            disabled={deriveType === 'employee' && !selectedEmployee}
            className="flex-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowRight size={20} />
            <span>
              {deriveType === 'queue' ? 'Derivar a Cola General' : 
               selectedEmployee && freeEmployees.find(e => e.id === selectedEmployee) ? 'Asignar Inmediatamente' :
               'Agregar a Cola Personal'}
            </span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle size={16} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">🎯 Flujo de Derivación:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Empleado Disponible:</strong> Asignación inmediata</li>
                <li>• <strong>Empleado Ocupado:</strong> Ticket va a su cola personal</li>
                <li>• <strong>Cola General:</strong> Próximo empleado disponible lo tomará</li>
                <li>• <strong>Prioridad:</strong> Cola personal → Cola general</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}