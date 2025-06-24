import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Ticket } from '../../types';

interface CancelTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onCancel: (reason: string, comment: string) => void;
}

export default function CancelTicketModal({
  ticket,
  onClose,
  onCancel
}: CancelTicketModalProps) {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleCancel = () => {
    if (!reason.trim()) {
      setError('Debe seleccionar un motivo de cancelación');
      return;
    }

    if (!comment.trim()) {
      setError('Debe especificar un comentario explicando el motivo de la cancelación');
      return;
    }

    onCancel(reason, comment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-6">
          <AlertTriangle size={32} className="text-red-500" />
          <h3 className="text-2xl font-bold text-gray-800">Cancelar Ticket</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            ¿Estás seguro de que deseas cancelar el ticket #{ticket.number.toString().padStart(3, '0')}?
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de cancelación *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Selecciona un motivo</option>
                <option value="Cliente no se presentó">Cliente no se presentó</option>
                <option value="Documentación incompleta">Documentación incompleta</option>
                <option value="Problema técnico">Problema técnico</option>
                <option value="Solicitud del cliente">Solicitud del cliente</option>
                <option value="Tiempo de espera excedido">Tiempo de espera excedido</option>
                <option value="Emergencia">Emergencia</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario adicional *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Especifica el motivo detallado de la cancelación..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              onClose();
              setReason('');
              setComment('');
              setError('');
            }}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
}