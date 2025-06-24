import React from 'react';
import { ArrowLeft, Clock, Volume2, VolumeX, Wifi, WifiOff, Building } from 'lucide-react';

interface NodeHeaderProps {
  onBack: () => void;
  currentTime: Date;
  isConnected: boolean;
  audioEnabled: boolean;
  showDateTime: boolean;
  showConnectionStatus: boolean;
  showCompanyLogo: boolean;
  showCompanyName: boolean; // NEW: Show company name option
  headerColor: string;
  companyName?: string;
  companyLogo?: string;
}

export default function NodeHeader({
  onBack,
  currentTime,
  isConnected,
  audioEnabled,
  showDateTime,
  showConnectionStatus,
  showCompanyLogo,
  showCompanyName, // NEW
  headerColor,
  companyName = 'Panel de Visualización',
  companyLogo
}: NodeHeaderProps) {
  return (
    <div className="bg-opacity-95 backdrop-blur-sm shadow-lg p-3" style={{ backgroundColor: headerColor }}>
      <div className="flex justify-between items-center">
        {/* UPDATED: Only show arrow icon, no "Volver" text */}
        <button
          onClick={onBack}
          className="flex items-center text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
          title="Volver al selector de usuarios"
        >
          <ArrowLeft size={24} />
        </button>
        
        {/* UPDATED: Header title with optional logo and conditional company name */}
        <div className="flex items-center space-x-3">
          {/* Company Logo - only show if enabled and logo exists */}
          {showCompanyLogo && companyLogo && (
            <div className="bg-white bg-opacity-20 rounded-lg p-2 backdrop-blur-sm">
              <img
                src={companyLogo}
                alt="Logo de la empresa"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  // Hide logo if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Company Name or Default Title - CONDITIONAL RENDERING */}
          {showCompanyName && (
            <h1 className="text-2xl font-bold text-white">
              {companyName}
            </h1>
          )}
          
          {/* Fallback icon if no logo is shown */}
          {(!showCompanyLogo || !companyLogo) && (
            <div className="bg-white bg-opacity-20 rounded-lg p-2 backdrop-blur-sm">
              <Building size={24} className="text-white" />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Audio Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm">
            {audioEnabled ? (
              <>
                <Volume2 size={16} className="text-white" />
                <span className="font-medium text-white text-sm">Audio ON</span>
              </>
            ) : (
              <>
                <VolumeX size={16} className="text-white" />
                <span className="font-medium text-white text-sm">Audio OFF</span>
              </>
            )}
          </div>

          {/* Connection Status */}
          {showConnectionStatus && (
            <div className="bg-white rounded-lg px-3 py-1.5 shadow-md">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <>
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-700 font-medium">Conectado</span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    <span className="text-xs text-red-700 font-medium">Desconectado</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Current Time */}
          {showDateTime && (
            <div className="flex items-center space-x-2 text-lg text-white bg-white bg-opacity-20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
              <Clock size={20} />
              <span className="font-mono font-semibold">{currentTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}