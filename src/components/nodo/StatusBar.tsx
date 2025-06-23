import React from 'react';
import { Volume2 } from 'lucide-react';

interface StatusBarProps {
  waitingTicketsCount: number;
  beingServedTicketsCount: number;
  activeEmployeesCount: number;
  currentTime: Date;
  audioEnabled: boolean;
  selectedVoice: string;
  accentColor: string;
  showCarousel?: boolean; // NEW: Carousel visibility status
}

export default function StatusBar({
  waitingTicketsCount,
  beingServedTicketsCount,
  activeEmployeesCount,
  currentTime,
  audioEnabled,
  selectedVoice,
  accentColor,
  showCarousel = true // NEW: Default to show carousel
}: StatusBarProps) {
  
  const getVoiceTypeLabel = (voice: string) => {
    if (voice.includes('male') || voice.includes('Pablo') || voice.includes('Raul') || 
        voice.includes('Jorge') || voice.includes('Juan') || voice.includes('Carlos') || 
        voice.includes('Diego') || voice.includes('Andrés') || voice.includes('Miguel')) {
      return 'Masculino';
    }
    return 'Femenino';
  };

  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 p-2">
      <div className="flex justify-between items-center text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }}></div>
            <span>En cola: <strong style={{ color: accentColor }}>{waitingTicketsCount}</strong></span>
          </span>
          <span className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Atendiendo: <strong className="text-green-700">{beingServedTicketsCount}</strong></span>
          </span>
          <span className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Empleados activos: <strong className="text-purple-700">{activeEmployeesCount}</strong></span>
          </span>
          {/* NEW: Carousel status indicator */}
          <span className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${showCarousel ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
            <span>Carrusel: <strong className={showCarousel ? 'text-blue-700' : 'text-gray-500'}>{showCarousel ? 'ACTIVO' : 'OCULTO'}</strong></span>
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Última actualización: <strong>{currentTime.toLocaleTimeString()}</strong></span>
          {audioEnabled && (
            <div className="flex items-center space-x-1.5 text-green-600">
              <Volume2 size={12} />
              <span className="font-medium">Audio activo ({getVoiceTypeLabel(selectedVoice)})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}