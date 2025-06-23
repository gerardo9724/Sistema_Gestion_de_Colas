import type { Ticket, ServiceCategory, ServiceSubcategory, SystemSettings } from '../types';

// Basic thermal ticket template for 70mm printers (without footer instructions)
const DEFAULT_THERMAL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket #{TICKET_NUMBER}</title>
  <style>
    @page {
      size: 70mm auto;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.3;
      margin: 0;
      padding: 3mm;
      width: 64mm;
      background: white;
      text-align: center;
      color: #000;
    }
    .logo-section {
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ddd;
    }
    .company-logo {
      max-width: 50mm;
      max-height: 20mm;
      width: auto;
      height: auto;
      object-fit: contain;
      margin: 0 auto;
      display: block;
    }
    .header {
      border-bottom: 2px dashed #000;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }
    .company-name {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .company-info {
      font-size: 9px;
      margin-bottom: 1px;
      line-height: 1.1;
    }
    .ticket-section {
      margin: 8px 0;
      padding: 6px;
      border: 2px solid #000;
      background: #f9f9f9;
    }
    .ticket-number {
      font-size: 22px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    .ticket-label {
      font-size: 9px;
      margin-top: 2px;
      font-weight: normal;
    }
    .service-info {
      margin: 6px 0;
      padding: 4px;
      background: #f0f0f0;
      border: 1px solid #ccc;
    }
    .service-name {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .subservice-name {
      font-size: 10px;
      margin-bottom: 2px;
      font-style: italic;
    }
    .queue-info {
      background: #e8f4f8;
      padding: 4px;
      margin: 6px 0;
      border: 1px solid #b3d9e6;
      border-radius: 2px;
    }
    .queue-item {
      font-size: 10px;
      margin: 1px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .queue-label {
      font-weight: bold;
    }
    .queue-value {
      font-weight: normal;
    }
    .datetime {
      font-size: 9px;
      margin: 4px 0;
      color: #666;
    }
    .footer {
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      font-size: 8px;
      color: #666;
    }
  </style>
</head>
<body>
  {LOGO_SECTION}
  
  <div class="header">
    <div class="company-name">{COMPANY_NAME}</div>
    <div class="company-info">{COMPANY_ADDRESS}</div>
    <div class="company-info">Tel: {COMPANY_PHONE}</div>
  </div>
  
  <div class="ticket-section">
    <div class="ticket-number">#{TICKET_NUMBER}</div>
    <div class="ticket-label">NÚMERO DE TICKET</div>
  </div>
  
  <div class="service-info">
    <div class="service-name">{SERVICE_NAME}</div>
    {SUBSERVICE_SECTION}
  </div>
  
  <div class="queue-info">
    <div class="queue-item">
      <span class="queue-label">Posición en cola:</span>
      <span class="queue-value">{QUEUE_POSITION}</span>
    </div>
    <div class="queue-item">
      <span class="queue-label">Fecha:</span>
      <span class="queue-value">{DATE}</span>
    </div>
    <div class="queue-item">
      <span class="queue-label">Hora:</span>
      <span class="queue-value">{TIME}</span>
    </div>
  </div>
  
  <div class="footer">
    <div>¡Gracias por su visita!</div>
  </div>
</body>
</html>
`;

// Detailed thermal ticket template with instructions (for detailed option)
const DETAILED_THERMAL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ticket #{TICKET_NUMBER}</title>
  <style>
    @page {
      size: 70mm auto;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      line-height: 1.3;
      margin: 0;
      padding: 3mm;
      width: 64mm;
      background: white;
      text-align: center;
      color: #000;
    }
    .logo-section {
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #ddd;
    }
    .company-logo {
      max-width: 50mm;
      max-height: 20mm;
      width: auto;
      height: auto;
      object-fit: contain;
      margin: 0 auto;
      display: block;
    }
    .header {
      border-bottom: 2px dashed #000;
      padding-bottom: 5px;
      margin-bottom: 6px;
    }
    .company-name {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .company-info {
      font-size: 9px;
      margin-bottom: 1px;
      line-height: 1.1;
    }
    .ticket-section {
      margin: 8px 0;
      padding: 6px;
      border: 2px solid #000;
      background: #f9f9f9;
    }
    .ticket-number {
      font-size: 22px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 1px;
    }
    .ticket-label {
      font-size: 9px;
      margin-top: 2px;
      font-weight: normal;
    }
    .service-info {
      margin: 6px 0;
      padding: 4px;
      background: #f0f0f0;
      border: 1px solid #ccc;
    }
    .service-name {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .subservice-name {
      font-size: 10px;
      margin-bottom: 2px;
      font-style: italic;
    }
    .queue-info {
      background: #e8f4f8;
      padding: 4px;
      margin: 6px 0;
      border: 1px solid #b3d9e6;
      border-radius: 2px;
    }
    .queue-item {
      font-size: 10px;
      margin: 1px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .queue-label {
      font-weight: bold;
    }
    .queue-value {
      font-weight: normal;
    }
    .datetime {
      font-size: 9px;
      margin: 4px 0;
      color: #666;
    }
    .instructions {
      margin-top: 8px;
      font-size: 9px;
      text-align: left;
      line-height: 1.2;
    }
    .instructions-title {
      font-weight: bold;
      text-align: center;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .instruction-item {
      margin: 1px 0;
      padding-left: 6px;
      position: relative;
    }
    .instruction-item:before {
      content: "•";
      position: absolute;
      left: 0;
      font-weight: bold;
    }
    .footer {
      border-top: 1px dashed #000;
      padding-top: 6px;
      margin-top: 8px;
      font-size: 8px;
      color: #666;
    }
  </style>
</head>
<body>
  {LOGO_SECTION}
  
  <div class="header">
    <div class="company-name">{COMPANY_NAME}</div>
    <div class="company-info">{COMPANY_ADDRESS}</div>
    <div class="company-info">Tel: {COMPANY_PHONE}</div>
  </div>
  
  <div class="ticket-section">
    <div class="ticket-number">#{TICKET_NUMBER}</div>
    <div class="ticket-label">NÚMERO DE TICKET</div>
  </div>
  
  <div class="service-info">
    <div class="service-name">{SERVICE_NAME}</div>
    {SUBSERVICE_SECTION}
  </div>
  
  <div class="queue-info">
    <div class="queue-item">
      <span class="queue-label">Posición en cola:</span>
      <span class="queue-value">{QUEUE_POSITION}</span>
    </div>
    <div class="queue-item">
      <span class="queue-label">Fecha:</span>
      <span class="queue-value">{DATE}</span>
    </div>
    <div class="queue-item">
      <span class="queue-label">Hora:</span>
      <span class="queue-value">{TIME}</span>
    </div>
  </div>
  
  <div class="instructions">
    <div class="instructions-title">Instrucciones Importantes</div>
    <div class="instruction-item">Conserve este ticket hasta ser atendido</div>
    <div class="instruction-item">Espere su turno en la sala de espera</div>
    <div class="instruction-item">Esté atento al llamado de su número</div>
    <div class="instruction-item">Presente este ticket al ser llamado</div>
  </div>
  
  <div class="footer">
    <div>¡Gracias por su visita!</div>
  </div>
</body>
</html>
`;

export interface PrintOptions {
  enablePrint: boolean;
  printerName?: string;
  paperSize: 'thermal_58mm' | 'thermal_80mm' | 'a4' | 'letter';
  copies: number;
  autoClose: boolean;
}

export const printService = {
  // Default print options for 70mm thermal printers
  getDefaultPrintOptions(): PrintOptions {
    return {
      enablePrint: true,
      paperSize: 'thermal_80mm', // 70mm fits in 80mm category
      copies: 1,
      autoClose: true,
    };
  },

  // Generate ticket content from template with logo support
  generateTicketContent(
    ticket: Ticket,
    serviceCategories: ServiceCategory[],
    systemSettings?: SystemSettings,
    customTemplate?: string,
    templateType: 'default' | 'detailed' = 'default'
  ): string {
    // Choose template based on type
    let template = customTemplate;
    if (!template) {
      template = templateType === 'detailed' ? DETAILED_THERMAL_TEMPLATE : DEFAULT_THERMAL_TEMPLATE;
    }
    
    // Find service and subservice information
    const service = serviceCategories.find(s => 
      s.identifier.toLowerCase() === ticket.serviceType.toLowerCase()
    );
    
    const subservice = service?.subcategories.find(s => 
      s.identifier.toLowerCase() === ticket.serviceSubtype?.toLowerCase()
    );

    // Prepare replacement values
    const serviceName = service?.name || ticket.serviceType.toUpperCase();
    const subserviceName = subservice?.name;
    
    // Generate logo section if logo exists
    const logoSection = systemSettings?.companyLogo 
      ? `<div class="logo-section"><img src="${systemSettings.companyLogo}" alt="Logo" class="company-logo" /></div>`
      : '';
    
    // Generate subservice section if exists
    const subserviceSection = subserviceName 
      ? `<div class="subservice-name">Categoría: ${subserviceName}</div>`
      : '';

    // Company information
    const companyName = systemSettings?.companyName || 'Sistema de Gestión de Colas';
    const companyAddress = systemSettings?.companyAddress || 'Av. Principal 123, Ciudad';
    const companyPhone = systemSettings?.companyPhone || '+1 (555) 123-4567';

    // Date and time formatting
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Replace template variables
    let content = template
      .replace(/{LOGO_SECTION}/g, logoSection)
      .replace(/{TICKET_NUMBER}/g, ticket.number.toString().padStart(3, '0'))
      .replace(/{COMPANY_NAME}/g, companyName)
      .replace(/{COMPANY_ADDRESS}/g, companyAddress)
      .replace(/{COMPANY_PHONE}/g, companyPhone)
      .replace(/{SERVICE_NAME}/g, serviceName)
      .replace(/{SUBSERVICE_SECTION}/g, subserviceSection)
      .replace(/{QUEUE_POSITION}/g, ticket.queuePosition.toString())
      .replace(/{DATE}/g, dateStr)
      .replace(/{TIME}/g, timeStr);

    return content;
  },

  // Print ticket with 70mm thermal printer optimization and logo support
  async printTicket(
    ticket: Ticket,
    serviceCategories: ServiceCategory[],
    options: Partial<PrintOptions> = {},
    systemSettings?: SystemSettings,
    customTemplate?: string,
    templateType: 'default' | 'detailed' = 'default'
  ): Promise<boolean> {
    const printOptions = { ...this.getDefaultPrintOptions(), ...options };
    
    if (!printOptions.enablePrint) {
      console.log('Printing disabled');
      return false;
    }

    try {
      const content = this.generateTicketContent(
        ticket,
        serviceCategories,
        systemSettings,
        customTemplate,
        templateType
      );

      // Create print window with specific settings for 70mm thermal printing
      const printWindow = window.open(
        '',
        `ticket_${ticket.id}_${Date.now()}`,
        'width=280,height=500,scrollbars=no,resizable=no'
      );

      if (!printWindow) {
        throw new Error('No se pudo abrir la ventana de impresión');
      }

      // Write content to print window
      printWindow.document.write(content);
      printWindow.document.close();

      // Wait for content to load
      await new Promise<void>((resolve) => {
        printWindow.onload = () => {
          setTimeout(resolve, 300); // Reduced wait time for faster printing
        };
      });

      // Configure print settings for 70mm thermal printer
      if (printWindow.print) {
        // Focus window before printing
        printWindow.focus();
        
        // Print the document
        printWindow.print();
        
        console.log(`Ticket ${ticket.number} sent to 70mm thermal printer with logo support`);
        
        // Auto-close window after printing
        if (printOptions.autoClose) {
          setTimeout(() => {
            try {
              printWindow.close();
            } catch (error) {
              console.warn('Could not close print window:', error);
            }
          }, 1500);
        }
        
        return true;
      } else {
        throw new Error('Función de impresión no disponible');
      }
    } catch (error) {
      console.error('Error printing ticket:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al imprimir';
      
      alert(`Error al imprimir ticket: ${errorMessage}`);
      return false;
    }
  },

  // Preview ticket before printing with logo support
  previewTicket(
    ticket: Ticket,
    serviceCategories: ServiceCategory[],
    systemSettings?: SystemSettings,
    customTemplate?: string,
    templateType: 'default' | 'detailed' = 'default'
  ): void {
    const content = this.generateTicketContent(
      ticket,
      serviceCategories,
      systemSettings,
      customTemplate,
      templateType
    );

    const previewWindow = window.open(
      '',
      `preview_${ticket.id}_${Date.now()}`,
      'width=350,height=600,scrollbars=yes,resizable=yes'
    );

    if (previewWindow) {
      previewWindow.document.write(content);
      previewWindow.document.close();
      previewWindow.focus();
    }
  },

  // Test print functionality with logo support
  async testPrint(): Promise<boolean> {
    const testTicket: Ticket = {
      id: 'test',
      number: 999,
      serviceType: 'test',
      serviceSubtype: undefined,
      status: 'waiting',
      queuePosition: 1,
      createdAt: new Date(),
    };

    const testCategories: ServiceCategory[] = [{
      id: 'test',
      name: 'Servicio de Prueba',
      identifier: 'TEST',
      isActive: true,
      displayOrder: 1,
      createdAt: new Date(),
      subcategories: [],
    }];

    // Use system settings if available for logo in test print
    const testSystemSettings = {
      id: 'test',
      companyName: 'Empresa de Prueba',
      companyAddress: 'Dirección de Prueba 123',
      companyPhone: '+1 (555) 000-0000',
      companyLogo: '/image.png', // Use the uploaded logo if available
      printTickets: true,
      selectedTicketTemplate: '',
      autoAssignTickets: true,
      enableAudioNotifications: true,
      enableVisualNotifications: true,
      notificationVolume: 0.8,
      language: 'es' as const,
      timezone: 'America/Mexico_City',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h' as const,
      updatedAt: new Date(),
    };

    return this.printTicket(testTicket, testCategories, {
      enablePrint: true,
      autoClose: true,
    }, testSystemSettings, undefined, 'default');
  },

  // Get printer status (basic check)
  async getPrinterStatus(): Promise<{ available: boolean; message: string }> {
    try {
      // Check if print functionality is available
      if (typeof window.print !== 'function') {
        return {
          available: false,
          message: 'Función de impresión no disponible en este navegador'
        };
      }

      // Check if we can create print windows
      const testWindow = window.open('', 'test', 'width=1,height=1');
      if (testWindow) {
        testWindow.close();
        return {
          available: true,
          message: 'Impresora 70mm lista para usar con soporte de logo'
        };
      } else {
        return {
          available: false,
          message: 'Bloqueador de ventanas emergentes activo'
        };
      }
    } catch (error) {
      return {
        available: false,
        message: `Error al verificar impresora: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
};