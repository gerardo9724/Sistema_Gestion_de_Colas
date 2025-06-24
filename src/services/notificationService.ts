import type { TicketDerivation, Employee, Ticket } from '../types';

export const notificationService = {
  // Show notification for ticket derivation
  showDerivationNotification(
    derivation: TicketDerivation, 
    ticket: Ticket, 
    targetEmployee?: Employee
  ): void {
    if (derivation.toEmployeeId && targetEmployee) {
      // Notification for specific employee
      this.showNotification(
        `Nuevo ticket derivado: #${ticket.number.toString().padStart(3, '0')}`,
        `Ticket derivado a ${targetEmployee.name}`,
        'info'
      );
    } else {
      // Notification for general queue
      this.showNotification(
        `Ticket devuelto a cola general: #${ticket.number.toString().padStart(3, '0')}`,
        'El ticket está disponible para cualquier empleado',
        'info'
      );
    }
  },

  // Show success notification
  showSuccessNotification(message: string): void {
    this.showNotification('Derivación exitosa', message, 'success');
  },

  // Show error notification
  showErrorNotification(message: string): void {
    this.showNotification('Error en derivación', message, 'error');
  },

  // Generic notification function
  private showNotification(title: string, message: string, type: 'success' | 'error' | 'info'): void {
    // In a real implementation, this would integrate with a notification system
    // For now, we'll use browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
      });
    } else {
      // Fallback to console log
      console.log(`${type.toUpperCase()}: ${title} - ${message}`);
    }
  },

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
};