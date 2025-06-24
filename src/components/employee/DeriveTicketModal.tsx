import React, { useState } from 'react';
import { ArrowRight, X, User, Users } from 'lucide-react';
import type { Ticket, Employee, ServiceCategory } from '../../types';

interface DeriveTicketModalProps {
  ticket: Ticket;
  employees: Employee[];
  serviceCategories: ServiceCategory[];
  onClose: () => void;
  onDerive: (targetType: 'queue' | 'employee', targetId?: string, newServiceType?: string) => void;
}

export default function DeriveTicketModal({
  ticket,
  employees,
  serviceCategories,
  onClose,
  onDerive
}: DeriveTicketModalProps) {
  const [deriveType, setDeriveType] = useState<'queue' | 'employee'>('queue');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState(ticket.serviceType);
  const [comment, setComment] = useState('');

  const handleDerive = () => {
    if (deriveType === 'employee' && !selectedEmployee) {
      alert('Debe seleccionar un empleado');
      return;
    }

    onDerive(
      deriveType,
      deriveType === 'employee' ? selectedEmployee : undefined,
      selectedServiceType !== ticket.serviceType ? selectedServiceType : undefined
    );
  };

  const availableEmployees = employees.filter(emp => 
    emp.isActive && !emp.isPaused && !emp.currentTicketId
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <ArrowRight size={32} className="text-purple-500" />
          <h3 className="text-2xl font-bold text-gray-800">Derivar Ticket</h3>
        </div>
        
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Ticket a Derivar:</h4>
            <div className="text-lg font-bold text-purple-600">
              #{ticket.number.toString().padStart(3, '0')} - {ticket.serviceType.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">
              Creado: {ticket.createdAt.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Derive Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Derivación
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="queue"
                    checked={deriveType === 'queue'}
                    onChange={(e) => setDeriveType(e.target.value as 'queue')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-purple-600" />
                    <span className="text-gray-700">Devolver a cola general</span>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value="employee"
                    checked={deriveType === 'employee'}
                    onChange={(e) => setDeriveType(e.target.value as 'employee')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-purple-600" />
                    <span className="text-gray-700">Asignar a empleado específico</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Employee Selection */}
            {deriveType === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empleado Destino
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
                {availableEmployees.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    No hay empleados disponibles en este momento
                  </p>
                )}
              </div>
            )}

            {/* Service Type Change */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cambiar Tipo de Servicio (Opcional)
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
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario de Derivación (Opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Motivo de la derivación..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDerive}
            disabled={deriveType === 'employee' && !selectedEmployee}
            className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Derivar Ticket
          </button>
        </div>
      </div>
    </div>
  );
}