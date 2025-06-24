import React from 'react';
import { CheckCircle, X, BarChart3 } from 'lucide-react';
import type { Employee } from '../../types';

interface EmployeeStatsProps {
  employee: Employee;
}

export default function EmployeeStats({ employee }: EmployeeStatsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas Personales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Tickets Atendidos</p>
                <p className="text-3xl font-bold text-green-900">{employee.totalTicketsServed}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Tickets Cancelados</p>
                <p className="text-3xl font-bold text-red-900">{employee.totalTicketsCancelled}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <X className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Eficiencia</p>
                <p className="text-3xl font-bold text-blue-900">
                  {employee.totalTicketsServed + employee.totalTicketsCancelled > 0
                    ? Math.round((employee.totalTicketsServed / (employee.totalTicketsServed + employee.totalTicketsCancelled)) * 100)
                    : 0}%
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}