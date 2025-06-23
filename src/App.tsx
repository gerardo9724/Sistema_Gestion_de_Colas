import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import UserSelector from './components/UserSelector';
import BottoneraUser from './components/BottoneraUser';
import NodoUser from './components/NodoUser';
import EmpleadoUser from './components/EmpleadoUser';
import AdministradorUser from './components/AdministradorUser';
import LoginScreen from './components/LoginScreen';
import DataInitializer from './components/DataInitializer';

function AppContent() {
  const { state } = useApp();

  // No user selected - show user selector
  if (!state.currentUser) {
    return (
      <>
        <UserSelector />
        <DataInitializer />
      </>
    );
  }

  // User requires authentication but not authenticated
  if ((state.currentUser.type === 'empleado' || state.currentUser.type === 'administrador') && 
      !state.isAuthenticated) {
    return <LoginScreen userType={state.currentUser.type} onBack={() => {}} />;
  }

  // Route to appropriate user interface
  switch (state.currentUser.type) {
    case 'botonera':
      return (
        <>
          <BottoneraUser />
          <DataInitializer />
        </>
      );
    case 'nodo':
      return <NodoUser />;
    case 'empleado':
      return <EmpleadoUser />;
    case 'administrador':
      return <AdministradorUser />;
    default:
      return (
        <>
          <UserSelector />
          <DataInitializer />
        </>
      );
  }
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;