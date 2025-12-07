

export enum DocCategory {
  ADMINISTRATIVA = 'Administrativa',
  OBRA = 'Documentación de Obra',
  TRABAJADORES = 'Documentación de Trabajadores',
  RECONOCIMIENTOS = 'Reconocimientos Médicos',
  SUBCONTRATAS = 'Documentación Subcontratas',
  FORMACION = 'Formación de Trabajadores',
  CONTRATOS = 'Contratos de Trabajo',
  SAE = 'Documentación SAE'
}

export enum ToolStatus {
  DISPONIBLE = 'Disponible',
  EN_USO = 'En Uso',
  REPARACION = 'En Reparación',
  BAJA = 'De Baja'
}

export interface DocumentRecord {
  id: string;
  name: string;
  category: DocCategory;
  uploadDate: string;
  expiryDate?: string; // AI detected or Manual
  summary?: string; // AI detected or Manual
  imageUrl?: string; // Optional for manual records (used as thumbnail)
  thumbnailUrl?: string; // New: Optimized small image for list views
  fileUrl?: string; // New: URL to the PDF file
  mimeType?: string; // New: Mime type (e.g., application/pdf)
  workerName?: string; // AI detected or Manual
  isValid: boolean;
  recordType?: 'file' | 'appointment';
  location?: string; // New: For appointments
  quincena?: string; // New: To organize by fortnight
  signatureUrl?: string; // New: For contracts
  isSigned?: boolean; // New: For contracts
}

export interface ToolDoc {
  id: string;
  name: string;
  type: 'Manual Instrucciones' | 'Certificado Conformidad' | 'Otro';
  url: string; // Base64 or URL
  uploadDate: string;
}

export interface ToolTrackingLog {
  id: string;
  date: string;
  location: string; // Where it is taken
  action: 'Salida' | 'Devolución' | 'Movimiento' | 'Mantenimiento';
  user: string; // Who authorized or took it
}

export interface ToolRecord {
  id: string;
  name: string;
  status: ToolStatus;
  assignedTo?: string; // Worker name
  lastCheck: string;
  imageUrl?: string;
  condition: string; // AI detected
  documents: ToolDoc[];
  trackingLog: ToolTrackingLog[];
}

export interface Worker {
  id: string;
  offerNumber: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  quincena: string;
  contractStart: string;
  contractEnd: string;
  phone: string;
  shoeSize: number;
  hasPrl20h: boolean; // If false, requires appointment
  prlAppointment?: { date: string; time?: string; location: string };
  medicalAppointment?: { date: string; time?: string; location: string };
}

export interface SubcontractorItem {
    id: string;
    label: string;
    isChecked: boolean;
}

export interface ProjectNote {
  id: string;
  text: string;
  createdAt: string;
  isCompleted: boolean;
  type: 'task' | 'note';
}

export interface PlanningPhase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export interface Project {
  id: string;
  code: string; // New: Código de Obra
  name: string;
  location: string;
  budget: number;
  startDate: string;
  endDate: string; // New
  laborBudget: number; // New: Cantidad Mano de Obra
  materialBudget: number; // New: Cantidad Materiales
  totalPeonadas: number; // New: Numero de peonadas
  progress: number;
  documents: DocumentRecord[];
  tools: ToolRecord[];
  workers: Worker[];
  subcontractorChecklist?: SubcontractorItem[];
  notes: ProjectNote[]; 
  planning: PlanningPhase[]; // New: Editable planning
}

// AI Response Schemas
export interface AIDocAnalysis {
  category: string;
  summary: string;
  expiryDate: string | null;
  workerName: string | null;
  isValid: boolean;
}

export interface AIToolAnalysis {
  name: string;
  suggestedStatus: string;
  conditionAssessment: string;
}