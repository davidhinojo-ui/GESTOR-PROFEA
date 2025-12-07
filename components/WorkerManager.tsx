import React, { useState } from 'react';
import { Worker, DocCategory, DocumentRecord } from '../types';
import { QUINCENAS_OPTIONS, COMPANY_LOGO } from '../constants';
import { Users, ChevronDown, ChevronRight, Plus, UserPlus, Phone, XCircle, CheckCircle, Ruler, FileDown, X, CheckSquare, Square, Trash2, CalendarClock, Clock } from 'lucide-react';

interface WorkerManagerProps {
  workers: Worker[];
  onAddWorker: (worker: Worker, autoDocs?: DocumentRecord[]) => void;
  onDeleteWorker: (workerId: string) => void;
}

const WorkerManager: React.FC<WorkerManagerProps> = ({ workers, onAddWorker, onDeleteWorker }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedQuincenas, setExpandedQuincenas] = useState<Record<string, boolean>>({});

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportQuincenas, setSelectedExportQuincenas] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<Worker>>({
    hasPrl20h: false,
    shoeSize: 42,
    quincena: QUINCENAS_OPTIONS[0]
  });
  
  // Appointment sub-states for form
  const [prlAppt, setPrlAppt] = useState({ date: '', time: '', location: '' });
  const [medAppt, setMedAppt] = useState({ date: '', time: '', location: '' });
  const [medicalCheckDone, setMedicalCheckDone] = useState(false);

  // Group workers by Quincena
  const workersByQuincena = workers.reduce((acc, worker) => {
    if (!acc[worker.quincena]) acc[worker.quincena] = [];
    acc[worker.quincena].push(worker);
    return acc;
  }, {} as Record<string, Worker[]>);

  const toggleQuincena = (q: string) => {
    setExpandedQuincenas(prev => ({ ...prev, [q]: !prev[q] }));
  };

  // --- Export Logic ---

  const openExportModal = () => {
      // Pre-select all quincenas that have workers
      const activeQuincenas = Object.keys(workersByQuincena);
      setSelectedExportQuincenas(activeQuincenas);
      setShowExportModal(true);
  };

  const toggleExportQuincena = (q: string) => {
      setSelectedExportQuincenas(prev => 
          prev.includes(q) ? prev.filter(item => item !== q) : [...prev, q]
      );
  };

  const executeExportExcel = () => {
    // Basic HTML template for Excel
    let tableRows = '';

    // Sort quincenas logic
    const sortedQuincenas = selectedExportQuincenas.sort();

    if (sortedQuincenas.length === 0) {
        alert("Por favor, seleccione al menos una quincena.");
        return;
    }

    // Add Logo Header Row
    tableRows += `
        <tr>
            <td colspan="9" style="text-align: left; padding: 10px; background-color: #ffffff;">
                <img src="${COMPANY_LOGO}" alt="Logo" height="60" style="display: block;" />
            </td>
        </tr>
    `;

    sortedQuincenas.forEach(q => {
        const groupWorkers = workersByQuincena[q] || [];
        if (groupWorkers.length === 0) return;

        // Header for Quincena
        tableRows += `
            <tr style="background-color: #f0f9ff;">
                <td colspan="9" style="font-weight: bold; border: 1px solid #ccc; font-size: 14px; padding: 10px;">${q} (${groupWorkers.length} Trabajadores)</td>
            </tr>
            <tr style="background-color: #1e40af; color: white;">
                <th style="border: 1px solid #000; padding: 5px;">Nº Oferta</th>
                <th style="border: 1px solid #000; padding: 5px;">Apellidos, Nombre</th>
                <th style="border: 1px solid #000; padding: 5px;">DNI</th>
                <th style="border: 1px solid #000; padding: 5px;">Fecha Nacimiento</th>
                <th style="border: 1px solid #000; padding: 5px;">Teléfono</th>
                <th style="border: 1px solid #000; padding: 5px;">Inicio Contrato</th>
                <th style="border: 1px solid #000; padding: 5px;">Fin Contrato</th>
                <th style="border: 1px solid #000; padding: 5px;">Reconocimiento Médico</th>
                <th style="border: 1px solid #000; padding: 5px;">Talla Pie</th>
            </tr>
        `;
        
        groupWorkers.forEach(w => {
            const medInfo = w.medicalAppointment 
                ? `Cita: ${new Date(w.medicalAppointment.date).toLocaleDateString()} ${w.medicalAppointment.time || ''} - ${w.medicalAppointment.location}` 
                : 'Apto / Realizado';

            tableRows += `
                <tr>
                    <td style="border: 1px solid #ccc; padding: 5px;">${w.offerNumber}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${w.lastName}, ${w.firstName}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${w.dni}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${w.birthDate ? new Date(w.birthDate).toLocaleDateString() : ''}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${w.phone}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${new Date(w.contractStart).toLocaleDateString()}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${new Date(w.contractEnd).toLocaleDateString()}</td>
                    <td style="border: 1px solid #ccc; padding: 5px;">${medInfo}</td>
                    <td style="border: 1px solid #ccc; padding: 5px; text-align: center;">${w.shoeSize}</td>
                </tr>
            `;
        });
        // Spacer
        tableRows += '<tr><td colspan="9" style="height: 10px;"></td></tr>';
    });

    const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Listado PROFEA</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta charset="UTF-8">
        </head>
        <body>
            <h2 style="color: #1e3a8a;">Listado de Trabajadores - Gestor PROFEA</h2>
            <table style="border-collapse: collapse; width: 100%;">
                ${tableRows}
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Relacion_Trabajadores_PROFEA_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.dni) return;

    const newWorker: Worker = {
        id: Date.now().toString(),
        offerNumber: formData.offerNumber || '',
        firstName: formData.firstName,
        lastName: formData.lastName,
        dni: formData.dni,
        birthDate: formData.birthDate || '',
        quincena: formData.quincena || '',
        contractStart: formData.contractStart || '',
        contractEnd: formData.contractEnd || '',
        phone: formData.phone || '',
        shoeSize: formData.shoeSize || 42,
        hasPrl20h: formData.hasPrl20h || false,
        prlAppointment: !formData.hasPrl20h ? prlAppt : undefined,
        medicalAppointment: !medicalCheckDone ? medAppt : undefined
    };

    // Auto-generate appointment documents if needed
    const autoDocs: DocumentRecord[] = [];
    const fullName = `${newWorker.firstName} ${newWorker.lastName}`;
    const now = new Date().toISOString();

    if (!newWorker.hasPrl20h && prlAppt.date) {
        autoDocs.push({
            id: `appt-prl-${Date.now()}`,
            name: `Cita PRL - ${fullName}`,
            category: DocCategory.FORMACION,
            uploadDate: now,
            workerName: fullName,
            expiryDate: prlAppt.date,
            location: prlAppt.location,
            quincena: newWorker.quincena,
            summary: `Cita automática: ${prlAppt.date} ${prlAppt.time || ''}`,
            isValid: true,
            recordType: 'appointment'
        });
    }

    if (!medicalCheckDone && medAppt.date) {
         autoDocs.push({
            id: `appt-med-${Date.now()}`,
            name: `Cita Médica - ${fullName}`,
            category: DocCategory.RECONOCIMIENTOS,
            uploadDate: now,
            workerName: fullName,
            expiryDate: medAppt.date,
            location: medAppt.location,
            quincena: newWorker.quincena,
            summary: `Cita automática: ${medAppt.date} ${medAppt.time || ''}`,
            isValid: true,
            recordType: 'appointment'
        });
    }

    onAddWorker(newWorker, autoDocs);
    setIsFormOpen(false);
    // Reset form
    setFormData({ hasPrl20h: false, shoeSize: 42, quincena: QUINCENAS_OPTIONS[0] });
    setPrlAppt({ date: '', time: '', location: '' });
    setMedAppt({ date: '', time: '', location: '' });
    setMedicalCheckDone(false);
  };

  const availableQuincenas = Object.keys(workersByQuincena).sort();

  if (isFormOpen) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Alta Nuevo Trabajador
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Datos Personales */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase border-b border-slate-200 pb-1">Datos Personales</h4>
                    <input type="text" placeholder="Nº Oferta" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, offerNumber: e.target.value})} />
                    <div className="flex gap-2">
                        <input type="text" placeholder="Nombre" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, firstName: e.target.value})} />
                        <input type="text" placeholder="Apellidos" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, lastName: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                         <input type="text" placeholder="DNI" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, dni: e.target.value})} />
                         <input type="date" placeholder="Fecha Nacimiento" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                         <div className="flex-1 flex items-center border rounded px-2 bg-white border-slate-300 focus-within:ring-2 focus-within:ring-blue-500">
                            <Phone className="w-4 h-4 text-slate-400 mr-2"/>
                            <input type="tel" placeholder="Teléfono" className="w-full text-sm p-2 outline-none bg-transparent text-slate-800 placeholder:text-slate-400" onChange={e => setFormData({...formData, phone: e.target.value})} />
                         </div>
                         <div className="w-1/3 flex items-center border rounded px-2 bg-white border-slate-300 focus-within:ring-2 focus-within:ring-blue-500">
                            <Ruler className="w-4 h-4 text-slate-400 mr-2"/>
                            <input type="number" placeholder="Pie" className="w-full text-sm p-2 outline-none bg-transparent text-slate-800 placeholder:text-slate-400" value={formData.shoeSize} onChange={e => setFormData({...formData, shoeSize: parseInt(e.target.value)})} />
                         </div>
                    </div>
                </div>

                {/* Contrato y PRL */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-500 uppercase border-b border-slate-200 pb-1">Contrato & Seguridad</h4>
                    <select 
                        className="w-full text-sm p-2 border rounded bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.quincena}
                        onChange={e => setFormData({...formData, quincena: e.target.value})}
                    >
                        {QUINCENAS_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <div className="flex gap-2">
                         <div className="w-1/2">
                            <label className="text-xs text-slate-500">Inicio</label>
                            <input type="date" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, contractStart: e.target.value})} />
                         </div>
                         <div className="w-1/2">
                            <label className="text-xs text-slate-500">Fin</label>
                            <input type="date" className="w-full text-sm p-2 border rounded border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" onChange={e => setFormData({...formData, contractEnd: e.target.value})} />
                         </div>
                    </div>
                    
                    {/* PRL Logic */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">¿Curso PRL 20h?</label>
                            <div className="flex gap-2">
                                <button onClick={() => setFormData({...formData, hasPrl20h: true})} className={`text-xs px-2 py-1 rounded border ${formData.hasPrl20h ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-300 text-slate-500'}`}>Sí</button>
                                <button onClick={() => setFormData({...formData, hasPrl20h: false})} className={`text-xs px-2 py-1 rounded border ${!formData.hasPrl20h ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white border-slate-300 text-slate-500'}`}>No</button>
                            </div>
                         </div>
                         {!formData.hasPrl20h && (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Asignar Cita PRL</p>
                                <div className="flex gap-2">
                                    <input type="date" className="w-1/3 text-xs p-1 border rounded border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500" value={prlAppt.date} onChange={e => setPrlAppt({...prlAppt, date: e.target.value})} />
                                    <input type="time" className="w-1/4 text-xs p-1 border rounded border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500" value={prlAppt.time} onChange={e => setPrlAppt({...prlAppt, time: e.target.value})} />
                                    <input type="text" placeholder="Lugar" className="flex-1 text-xs p-1 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500" value={prlAppt.location} onChange={e => setPrlAppt({...prlAppt, location: e.target.value})} />
                                </div>
                            </div>
                         )}
                    </div>

                    {/* Medical Logic */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">¿Reconocimiento Médico?</label>
                            <div className="flex gap-2">
                                <button onClick={() => setMedicalCheckDone(true)} className={`text-xs px-2 py-1 rounded border ${medicalCheckDone ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-slate-300 text-slate-500'}`}>Hecho</button>
                                <button onClick={() => setMedicalCheckDone(false)} className={`text-xs px-2 py-1 rounded border ${!medicalCheckDone ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-slate-300 text-slate-500'}`}>Pendiente</button>
                            </div>
                         </div>
                         {!medicalCheckDone && (
                            <div className="space-y-2 pt-2 border-t border-slate-200">
                                <p className="text-xs text-amber-600 font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Asignar Cita Médica</p>
                                <div className="flex gap-2">
                                    <input type="date" className="w-1/3 text-xs p-1 border rounded border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500" value={medAppt.date} onChange={e => setMedAppt({...medAppt, date: e.target.value})} />
                                    <input type="time" className="w-1/4 text-xs p-1 border rounded border-slate-300 bg-white text-slate-800 focus:ring-1 focus:ring-blue-500" value={medAppt.time} onChange={e => setMedAppt({...medAppt, time: e.target.value})} />
                                    <input type="text" placeholder="Lugar" className="flex-1 text-xs p-1 border rounded border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500" value={medAppt.location} onChange={e => setMedAppt({...medAppt, location: e.target.value})} />
                                </div>
                            </div>
                         )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Guardar Trabajador</button>
            </div>
        </div>
    );
  }

  // --- List View ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
            <h3 className="text-lg font-bold text-slate-800">Relación de Trabajadores</h3>
            <p className="text-sm text-slate-500">Gestiona las cuadrillas por quincenas</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={openExportModal}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
                <FileDown className="w-4 h-4" /> Exportar Excel
            </button>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
                <Plus className="w-4 h-4" /> Nuevo
            </button>
        </div>
      </div>

      <div className="space-y-3">
        {QUINCENAS_OPTIONS.map(quincena => {
            const groupWorkers = workersByQuincena[quincena] || [];
            const isExpanded = expandedQuincenas[quincena];

            return (
                <div key={quincena} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <button 
                        onClick={() => toggleQuincena(quincena)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <h4 className="font-bold text-slate-800">{quincena}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                {groupWorkers.length} Empleados
                            </span>
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </div>
                    </button>

                    {isExpanded && (
                        <div className="p-4 border-t border-slate-200 overflow-x-auto">
                            {groupWorkers.length > 0 ? (
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="text-xs text-slate-500 font-semibold uppercase bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-2">Nombre</th>
                                            <th className="p-2">Fecha Nac.</th>
                                            <th className="p-2">Teléfono</th>
                                            <th className="p-2">DNI</th>
                                            <th className="p-2">Oferta</th>
                                            <th className="p-2">Contrato</th>
                                            <th className="p-2 text-center">PRL 20h</th>
                                            <th className="p-2 text-center">Reconocimiento</th>
                                            <th className="p-2 text-center">Pie</th>
                                            <th className="p-2 text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {groupWorkers.map(w => (
                                            <tr key={w.id} className="hover:bg-slate-50">
                                                <td className="p-2 font-medium text-slate-800">
                                                    {w.lastName}, {w.firstName}
                                                </td>
                                                <td className="p-2 text-slate-500 text-xs">
                                                    {w.birthDate ? new Date(w.birthDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-2 text-slate-500 text-xs font-medium">
                                                    {w.phone}
                                                </td>
                                                <td className="p-2 text-slate-500 text-xs">{w.dni}</td>
                                                <td className="p-2 text-slate-500 text-xs">{w.offerNumber}</td>
                                                <td className="p-2 text-slate-500 text-xs">
                                                    {new Date(w.contractStart).toLocaleDateString()} - <br/>
                                                    {new Date(w.contractEnd).toLocaleDateString()}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {w.hasPrl20h ? (
                                                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto"/>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <XCircle className="w-5 h-5 text-red-400"/>
                                                            <span className="text-[10px] text-red-500 font-bold">Cita Pend.</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {w.medicalAppointment ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-medium flex items-center gap-1 mb-0.5">
                                                                <CalendarClock className="w-3 h-3"/>
                                                                {new Date(w.medicalAppointment.date).toLocaleDateString()}
                                                                {w.medicalAppointment.time && ` ${w.medicalAppointment.time}`}
                                                            </span>
                                                            <span className="text-[10px] text-slate-500 truncate max-w-[100px]" title={w.medicalAppointment.location}>
                                                                {w.medicalAppointment.location}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <CheckCircle className="w-5 h-5 text-green-500"/>
                                                            <span className="text-[9px] text-green-600">Apto</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2 text-center text-slate-500 font-bold">{w.shoeSize}</td>
                                                <td className="p-2 text-center">
                                                    <button 
                                                        onClick={() => onDeleteWorker(w.id)}
                                                        className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                                                        title="Eliminar Trabajador"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center text-slate-400 italic py-4">No hay trabajadores registrados en esta quincena.</p>
                            )}
                        </div>
                    )}
                </div>
            )
        })}
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileDown className="w-5 h-5" /> Exportar a Excel
                    </h3>
                    <button onClick={() => setShowExportModal(false)} className="hover:bg-blue-700 p-1 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-4">Seleccione las quincenas que desea incluir en el informe:</p>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-6">
                        {availableQuincenas.length > 0 ? (
                            availableQuincenas.map(q => (
                                <div 
                                    key={q}
                                    onClick={() => toggleExportQuincena(q)}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${selectedExportQuincenas.includes(q) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        {selectedExportQuincenas.includes(q) && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{q}</span>
                                    <span className="ml-auto text-xs text-slate-500">{workersByQuincena[q].length} trab.</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-red-400 italic text-center">No hay datos para exportar.</p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowExportModal(false)}
                            className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={executeExportExcel}
                            disabled={selectedExportQuincenas.length === 0}
                            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Descargar Informe
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default WorkerManager;