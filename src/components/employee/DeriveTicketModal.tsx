import React, { useState } from 'react';
import { ArrowRight, X, User, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [deriveType, setDeriveType] = useState<'queue' | 'employee'>('employee');
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

  // NEW: Categorize employees by availability
  const availableEmployees = employees.filter(emp => 
    emp.isActive && !emp.isPaused && !emp.currentTicketId
  );

  const busyEmployees = employees.filter(emp => 
    emp.isActive && !emp.isPaused && emp.currentTicketId
  );

  const pausedEmployees = employees.filter(emp => 
    emp.isActive && emp.isPaused
  );

  const getEmployeeStatusInfo = (employee: Employee) => {
    if (!employee.isActive) return { status: 'Inactivo', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    if (employee.isPaused) return { status: 'En Pausa', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (employee.currentTicketId) return { status: 'Ocupado', color: 'text-red-600', bgColor: 'bg-red-100' };
    return { status: 'Disponible', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const renderEmployeeCard = (employee: Employee, isRecommended: boolean = false) => {
    const statusInfo = getEmployeeStatusInfo(employee);
    const isAvailable = !employee.isPaused && !employee.currentTicketId && employee.isActive;

    return (
      <div
        key={employee.id}
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          selectedEmployee === employee.id
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        } ${isRecommended ? 'ring-2 ring-green-300' : ''}`}
        onClick={() => setSelectedEmployee(employee.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
              <User size={20} className={statusInfo.color} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{employee.name}</h4>
              <p className="text-sm text-gray-600">{employee.position}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                  {statusInfo.status}
                </span>
                {isRecommended && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Recomendado
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            {isAvailable ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Asignación inmediata</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-orange-600">
                <Clock size={16} />
                <span className="text-sm font-medium">Se agregará a cola personal</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Atendidos: {employee.totalTicketsServed}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
          
          <div className="space-y-6">
            {/* Derive Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Derivación
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    value="employee"
                    checked={deriveType === 'employee'}
                    onChange={(e) => setDeriveType(e.target.value as 'employee')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-purple-600" />
                    <span className="text-gray-700 font-medium">Asignar a empleado específico</span>
                  </div>
                  <div className="ml-auto text-sm text-gray-500">Recomendado</div>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    value="queue"
                    checked={deriveType === 'queue'}
                    onChange={(e) => setDeriveType(e.target.value as 'queue')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-purple-600" />
                    <span className="text-gray-700 font-medium">Devolver a cola general</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Employee Selection */}
            {deriveType === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccionar Empleado Destino
                </label>
                
                <div className="space-y-6">
                  {/* Available Employees Section */}
                  {availableEmployees.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center space-x-2">
                        <CheckCircle size={16} />
                        <span>Empleados Disponibles (Asignación Inmediata)</span>
                      </h5>
                      <div className="space-y-2">
                        {availableEmployees.map(employee => renderEmployeeCard(employee, true))}
                      </div>
                    </div>
                  )}
                  
                  {/* Busy Employees Section */}
                  {busyEmployees.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center space-x-2">
                        <Clock size={16} />
                        <span>Empleados Ocupados (Se agregará a cola personal)</span>
                      </h5>
                      <div className="space-y-2">
                        {busyEmployees.map(employee => renderEmployeeCard(employee))}
                      </div>
                    </div>
                  )}
                  
                  {/* Paused Employees Section */}
                  {pausedEmployees.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                        <AlertCircle size={16} />
                        <span>Empleados en Pausa (Se agregará a cola personal)</span>
                      </h5>
                      <div className="space-y-2">
                        {pausedEmployees.map(employee => renderEmployeeCard(employee))}
                      </div>
                    </div>
                  )}
                  
                  {employees.filter(e => e.isActive).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <User size={48} className="mx-auto mb-2 opacity-50" />
                      <p>No hay empleados disponibles</p>
                    </div>
                  )}
                </div>
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