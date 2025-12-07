import { Project, DocCategory, ToolStatus } from './types';
import { FileText, Hammer, ShieldAlert, UserCheck, Briefcase, Building, Users, PenTool, Landmark } from 'lucide-react';
import React from 'react';

// LOGO DIPUTACIÓN DE CÁDIZ
export const COMPANY_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Diputaci%C3%B3n_Provincial_de_C%C3%A1diz_-_Logo.svg/512px-Diputaci%C3%B3n_Provincial_de_C%C3%A1diz_-_Logo.svg.png";

// REEMPLACE ESTA URL CON LA IMAGEN DE FONDO QUE DESEA EN LA CABECERA
export const HEADER_BACKGROUND_IMAGE = "https://via.placeholder.com/1920x300/1e3a8a/ffffff?text=DISE%C3%91O+FONDO"; 

// URL para el fondo de pantalla de la aplicación (Usamos el logo como marca de agua)
export const APP_BACKGROUND_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Diputaci%C3%B3n_Provincial_de_C%C3%A1diz_-_Logo.svg/512px-Diputaci%C3%B3n_Provincial_de_C%C3%A1diz_-_Logo.svg.png"; 

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    code: 'PFEA-2023-001-MS',
    name: 'Reforma Plaza Mayor',
    location: 'Medina Sidonia',
    budget: 125000,
    startDate: '2023-09-01',
    endDate: '2024-03-30',
    laborBudget: 85000,
    materialBudget: 40000,
    totalPeonadas: 1240,
    progress: 50,
    planning: [
      { id: 'p1', name: 'Demolición y Limpieza', startDate: '2023-09-01', endDate: '2023-09-15', isCompleted: true },
      { id: 'p2', name: 'Saneamiento y Redes', startDate: '2023-09-16', endDate: '2023-10-15', isCompleted: true },
      { id: 'p3', name: 'Pavimentación', startDate: '2023-10-16', endDate: '2023-12-01', isCompleted: false },
      { id: 'p4', name: 'Mobiliario Urbano', startDate: '2023-12-02', endDate: '2024-01-15', isCompleted: false },
    ],
    documents: [
      {
        id: 'd1',
        name: 'Acta de Replanteo',
        category: DocCategory.ADMINISTRATIVA,
        uploadDate: '2023-09-02',
        summary: 'Inicio formal de la obra',
        isValid: true,
        quincena: '1ª Septiembre 2023'
      },
      {
        id: 'd2',
        name: 'Certificado PRL - Juan Perez',
        category: DocCategory.FORMACION,
        uploadDate: '2023-09-05',
        workerName: 'Juan Perez',
        isValid: true,
        expiryDate: '2024-09-05',
        quincena: '1ª Septiembre 2023'
      }
    ],
    tools: [
      {
        id: 't1',
        name: 'Martillo Demoledor Bosch',
        status: ToolStatus.EN_USO,
        lastCheck: '2023-10-01',
        condition: 'Buen estado, revisión mensual ok',
        documents: [
            {
                id: 'td1',
                name: 'Manual de Usuario',
                type: 'Manual Instrucciones',
                url: '',
                uploadDate: '2023-09-01'
            }
        ],
        trackingLog: [
            {
                id: 'l1',
                date: '2023-09-01',
                action: 'Salida',
                location: 'Almacén Central',
                user: 'Admin'
            },
            {
                id: 'l2',
                date: '2023-09-15',
                action: 'Movimiento',
                location: 'Obra Plaza Mayor - Zona Norte',
                user: 'Juan Perez'
            }
        ]
      },
      {
        id: 't2',
        name: 'Radial Grande',
        status: ToolStatus.DISPONIBLE,
        lastCheck: '2023-10-15',
        condition: 'Disco nuevo instalado',
        documents: [],
        trackingLog: []
      }
    ],
    workers: [
        {
            id: 'w1',
            offerNumber: 'OF-2023-001',
            firstName: 'Juan',
            lastName: 'Perez Garcia',
            dni: '12345678A',
            birthDate: '1980-05-15',
            quincena: '1ª Septiembre 2023',
            contractStart: '2023-09-01',
            contractEnd: '2023-09-15',
            phone: '600123456',
            shoeSize: 42,
            hasPrl20h: true
        }
    ],
    subcontractorChecklist: [],
    notes: [
      {
        id: 'n1',
        text: 'Revisar certificaciones de la subcontrata de fontanería antes del viernes.',
        createdAt: '2023-10-20T10:00:00Z',
        isCompleted: false,
        type: 'task'
      }
    ]
  },
  {
    id: '2',
    code: 'PFEA-2023-002-GZ',
    name: 'Adecuación Sendero Rural',
    location: 'Grazalema',
    budget: 45000,
    startDate: '2023-10-10',
    endDate: '2024-01-15',
    laborBudget: 30000,
    materialBudget: 15000,
    totalPeonadas: 450,
    progress: 0,
    planning: [],
    documents: [],
    tools: [],
    workers: [],
    subcontractorChecklist: [],
    notes: []
  }
];

export const CATEGORY_ICONS: Record<DocCategory, React.ReactNode> = {
  [DocCategory.ADMINISTRATIVA]: <FileText className="w-5 h-5 text-blue-600" />,
  [DocCategory.OBRA]: <Building className="w-5 h-5 text-amber-600" />,
  [DocCategory.TRABAJADORES]: <Users className="w-5 h-5 text-indigo-600" />,
  [DocCategory.RECONOCIMIENTOS]: <UserCheck className="w-5 h-5 text-green-600" />,
  [DocCategory.SUBCONTRATAS]: <Briefcase className="w-5 h-5 text-purple-600" />,
  [DocCategory.FORMACION]: <ShieldAlert className="w-5 h-5 text-orange-600" />,
  [DocCategory.CONTRATOS]: <PenTool className="w-5 h-5 text-teal-600" />,
  [DocCategory.SAE]: <Landmark className="w-5 h-5 text-green-700" />,
};

export const STATUS_COLORS: Record<ToolStatus, string> = {
  [ToolStatus.DISPONIBLE]: 'bg-green-100 text-green-700 border-green-200',
  [ToolStatus.EN_USO]: 'bg-blue-100 text-blue-700 border-blue-200',
  [ToolStatus.REPARACION]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [ToolStatus.BAJA]: 'bg-red-100 text-red-700 border-red-200',
};

// Helper to get Quincenas (simplified for demo)
export const QUINCENAS_OPTIONS = [
    "1ª Septiembre 2023",
    "2ª Septiembre 2023",
    "1ª Octubre 2023",
    "2ª Octubre 2023",
    "1ª Noviembre 2023",
    "2ª Noviembre 2023"
];

export const DEFAULT_SUBCONTRACTOR_REQ = [
    { id: 'req1', label: 'Adhesión Plan Seguridad y Salud', isChecked: false },
    { id: 'req2', label: 'Certificado Inscripción REA', isChecked: false },
    { id: 'req3', label: 'Seguro Responsabilidad Civil (RC) + Recibo', isChecked: false },
    { id: 'req4', label: 'TC1/TC2 (Seguridad Social)', isChecked: false },
    { id: 'req5', label: 'Certificado Corriente Pagos (Hacienda/SS)', isChecked: false },
    { id: 'req6', label: 'Evaluación de Riesgos Específica', isChecked: false },
];