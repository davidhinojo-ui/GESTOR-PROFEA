import React, { useState } from 'react';
import { Project, DocumentRecord, ToolRecord, Worker, ProjectNote, PlanningPhase } from '../types';
import { ArrowLeft, FileText, Hammer, Info, Users, Plus, Trash2, CheckSquare, Square, StickyNote, Calendar, Banknote, HardHat, Pickaxe, Hash, TrendingUp, CheckCircle2, Circle, Bell, MapPin, Clock } from 'lucide-react';
import { DocManager } from './DocManager';
import ToolTracker from './ToolTracker';
import WorkerManager from './WorkerManager';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

type Tab = 'info' | 'docs' | 'tools' | 'workers';

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<Tab>('docs');
  const [newNoteText, setNewNoteText] = useState('');

  // Planning State
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseStart, setNewPhaseStart] = useState('');
  const [newPhaseEnd, setNewPhaseEnd] = useState('');

  const handleAddDocument = (doc: DocumentRecord) => {
    const updated = {
      ...project,
      documents: [doc, ...project.documents]
    };
    onUpdateProject(updated);
  };

  const handleUpdateDocument = (updatedDoc: DocumentRecord) => {
    const updatedDocs = project.documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    const updated = {
        ...project,
        documents: updatedDocs
    };
    onUpdateProject(updated);
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = project.documents.filter(d => d.id !== docId);
    const updated = {
        ...project,
        documents: updatedDocs
    };
    onUpdateProject(updated);
  };

  const handleAddTool = (tool: ToolRecord) => {
    const updated = {
      ...project,
      tools: [tool, ...project.tools]
    };
    onUpdateProject(updated);
  };

  const handleAddWorker = (worker: Worker, autoDocs?: DocumentRecord[]) => {
      let updatedDocs = [...project.documents];
      if (autoDocs) {
          updatedDocs = [...autoDocs, ...updatedDocs];
      }
      const updated = {
          ...project,
          workers: [worker, ...project.workers],
          documents: updatedDocs
      };
      onUpdateProject(updated);
  };

  const handleDeleteWorker = (workerId: string) => {
      if (window.confirm('¿Está seguro de eliminar este trabajador de la lista?')) {
          const updatedWorkers = project.workers.filter(w => w.id !== workerId);
          onUpdateProject({ ...project, workers: updatedWorkers });
      }
  };

  // Note/Task Handlers
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: ProjectNote = {
        id: Date.now().toString(),
        text: newNoteText,
        createdAt: new Date().toISOString(),
        isCompleted: false,
        type: 'task'
    };
    const updated = {
        ...project,
        notes: [newNote, ...(project.notes || [])]
    };
    onUpdateProject(updated);
    setNewNoteText('');
  };

  const toggleNoteCompletion = (noteId: string) => {
    const updatedNotes = project.notes?.map(note => 
        note.id === noteId ? { ...note, isCompleted: !note.isCompleted } : note
    ) || [];
    onUpdateProject({ ...project, notes: updatedNotes });
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = project.notes?.filter(note => note.id !== noteId) || [];
    onUpdateProject({ ...project, notes: updatedNotes });
  };

  // --- Automatic Reminders Logic ---
  const getUpcomingReminders = () => {
      const reminders: Array<{
          id: string,
          type: 'PRL' | 'MED', 
          worker: string, 
          date: string, 
          time?: string, 
          location?: string
      }> = [];
      
      const today = new Date();
      today.setHours(0,0,0,0);

      project.workers.forEach(w => {
          // PRL Appointments
          if (!w.hasPrl20h && w.prlAppointment?.date) {
              const apptDate = new Date(w.prlAppointment.date);
              // Show if today or future
              if (!isNaN(apptDate.getTime()) && apptDate >= today) {
                  reminders.push({ 
                      id: `prl-${w.id}`,
                      type: 'PRL', 
                      worker: `${w.firstName} ${w.lastName}`, 
                      ...w.prlAppointment 
                  });
              }
          }
          // Medical Appointments
          if (w.medicalAppointment && w.medicalAppointment.date) {
               const apptDate = new Date(w.medicalAppointment.date);
               // Simple check if date is valid (and not 'Apto' string if previously set manually)
               if (!isNaN(apptDate.getTime()) && apptDate >= today) {
                   reminders.push({ 
                       id: `med-${w.id}`,
                       type: 'MED', 
                       worker: `${w.firstName} ${w.lastName}`, 
                       ...w.medicalAppointment 
                   });
               }
          }
      });
      // Sort by date ascending
      return reminders.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingReminders = getUpcomingReminders();


  // --- Planning & Progress Handlers ---

  const calculateProgress = (planning: PlanningPhase[]) => {
      if (!planning || planning.length === 0) return 0;
      const completed = planning.filter(p => p.isCompleted).length;
      return Math.round((completed / planning.length) * 100);
  };

  const handleAddPhase = () => {
      if (!newPhaseName || !newPhaseStart || !newPhaseEnd) return;
      const newPhase: PlanningPhase = {
          id: Date.now().toString(),
          name: newPhaseName,
          startDate: newPhaseStart,
          endDate: newPhaseEnd,
          isCompleted: false
      };
      const updatedPlanning = [...(project.planning || []), newPhase];
      const newProgress = calculateProgress(updatedPlanning);

      onUpdateProject({
          ...project,
          planning: updatedPlanning,
          progress: newProgress
      });
      
      setNewPhaseName('');
      setNewPhaseStart('');
      setNewPhaseEnd('');
  };

  const togglePhaseCompletion = (phaseId: string) => {
      const updatedPlanning = (project.planning || []).map(p => 
          p.id === phaseId ? { ...p, isCompleted: !p.isCompleted } : p
      );
      const newProgress = calculateProgress(updatedPlanning);
      onUpdateProject({ ...project, planning: updatedPlanning, progress: newProgress });
  };

  const deletePhase = (phaseId: string) => {
      const updatedPlanning = (project.planning || []).filter(p => p.id !== phaseId);
      const newProgress = calculateProgress(updatedPlanning);
      onUpdateProject({ ...project, planning: updatedPlanning, progress: newProgress });
  };

  // Calculate Peonadas
  const consumedPeonadas = project.workers.reduce((acc, worker) => {
      if (!worker.contractStart || !worker.contractEnd) return acc;
      const start = new Date(worker.contractStart);
      const end = new Date(worker.contractEnd);
      // Prevent crash if invalid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return acc;
      
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include start day
      return acc + diffDays;
  }, 0);
  
  const remainingPeonadas = (project.totalPeonadas || 0) - consumedPeonadas;
  const peonadasProgress = project.totalPeonadas ? Math.min(100, (consumedPeonadas / project.totalPeonadas) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 shadow-sm rounded-t-xl sm:rounded-lg mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight tracking-tight">{project.name}</h1>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm">
                     <span className="font-mono text-slate-500 font-medium">{project.code || 'NO-CODE'}</span>
                     <span className="text-slate-300">|</span>
                     <span className="text-slate-600">{project.location}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs (Light) */}
        <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto no-scrollbar border border-slate-200">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 min-w-[100px] py-2 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              activeTab === 'docs'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentación
          </button>
          <button
            onClick={() => setActiveTab('workers')}
            className={`flex-1 min-w-[100px] py-2 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              activeTab === 'workers'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Trabajadores
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 min-w-[100px] py-2 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              activeTab === 'tools'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Hammer className="w-4 h-4" />
            Herramientas
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 min-w-[120px] py-2 px-4 rounded-md flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              activeTab === 'info'
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Seguimiento de Obra
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-1 pb-20">
        {activeTab === 'docs' && (
          <DocManager 
            documents={project.documents} 
            workers={project.workers}
            onAddDocument={handleAddDocument} 
            onUpdateDocument={handleUpdateDocument}
            onDeleteDocument={handleDeleteDocument} 
          />
        )}
        {activeTab === 'workers' && (
          <WorkerManager workers={project.workers} onAddWorker={handleAddWorker} onDeleteWorker={handleDeleteWorker} />
        )}
        {activeTab === 'tools' && (
          <ToolTracker tools={project.tools} onAddTool={handleAddTool} projectCode={project.code} />
        )}
        {activeTab === 'info' && (
          <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
             {/* General Info Card - Widget Style */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                 <div className="flex items-center justify-between mb-6">
                     <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" />
                        Dashboard de Obra
                     </h3>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Métricas Clave</span>
                 </div>

                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Budget Widget */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Banknote className="w-16 h-16 text-slate-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Presupuesto</span>
                        <div className="mt-2 text-2xl font-bold text-slate-800">
                            {project.budget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                        <div className="mt-3 flex gap-2 text-xs">
                             <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium border border-blue-200">
                                MO: {project.laborBudget ? project.laborBudget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                             </div>
                             <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium border border-amber-200">
                                Mat: {project.materialBudget ? project.materialBudget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '-'}
                             </div>
                        </div>
                    </div>

                    {/* Timeline Widget */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm flex flex-col justify-between">
                         <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plazos</span>
                            <div className="mt-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-700">
                                    {new Date(project.startDate).toLocaleDateString()}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="text-sm font-semibold text-slate-700">
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '?'}
                                </span>
                            </div>
                         </div>
                         <div className="mt-2 text-xs text-slate-500 text-right">
                             Código: {project.code}
                         </div>
                    </div>

                    {/* Workers Widget */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Personal Activo</span>
                            <div className="mt-1 text-3xl font-bold text-blue-700">{project.workers.length}</div>
                            <span className="text-xs text-blue-600">Trabajadores registrados</span>
                        </div>
                        <div className="bg-white p-3 rounded-full shadow-sm border border-blue-100">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                     {/* Peonadas Widget */}
                     <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Peonadas</span>
                             <span className="text-xs font-bold bg-white text-indigo-700 px-2 py-0.5 rounded shadow-sm border border-indigo-100">
                                {remainingPeonadas} Rest.
                             </span>
                        </div>
                        <div className="flex items-end gap-1 mb-2">
                             <span className="text-2xl font-bold text-indigo-800">{consumedPeonadas}</span>
                             <span className="text-sm text-indigo-500 font-medium mb-1">/ {project.totalPeonadas || 0}</span>
                        </div>
                        <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-500 ${remainingPeonadas < 0 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                                style={{ width: `${Math.min(peonadasProgress, 100)}%` }}
                             ></div>
                         </div>
                     </div>
                 </div>
             </div>

             {/* PLANNING MODULE */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Planificación & Hitos
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase">Avance Total</span>
                        <div className="text-xl font-bold text-green-600">{project.progress}%</div>
                    </div>
                </div>

                <div className="relative pt-6 pb-2">
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-8 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* List */}
                        <div className="lg:col-span-2 space-y-3">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Fases del Proyecto</h4>
                            {(project.planning || []).length > 0 ? (
                                project.planning!.map(phase => (
                                    <div key={phase.id} className={`group flex items-center gap-4 p-4 border rounded-xl transition-all ${phase.isCompleted ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-blue-400'}`}>
                                        <button onClick={() => togglePhaseCompletion(phase.id)} className="text-slate-400 hover:text-green-500 transition-colors">
                                            {phase.isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Circle className="w-6 h-6" />}
                                        </button>
                                        <div className="flex-1">
                                            <p className={`font-bold ${phase.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                                {phase.name}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button onClick={() => deletePhase(phase.id)} className="text-slate-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-sm text-slate-500">No hay fases planificadas.</p>
                                </div>
                            )}
                        </div>

                        {/* Add Form */}
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 h-fit">
                            <h4 className="text-xs font-bold text-blue-600 uppercase mb-4 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Añadir Nueva Fase
                            </h4>
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Nombre de la fase" 
                                    className="w-full text-sm p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white text-slate-800 placeholder-slate-400"
                                    value={newPhaseName}
                                    onChange={(e) => setNewPhaseName(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Inicio</label>
                                        <input 
                                            type="date" 
                                            className="w-full text-sm p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-slate-800"
                                            value={newPhaseStart}
                                            onChange={(e) => setNewPhaseStart(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-500 ml-1">Fin</label>
                                        <input 
                                            type="date" 
                                            className="w-full text-sm p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 bg-white text-slate-800"
                                            value={newPhaseEnd}
                                            onChange={(e) => setNewPhaseEnd(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddPhase}
                                    disabled={!newPhaseName || !newPhaseStart || !newPhaseEnd}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors mt-2"
                                >
                                    Añadir a Planificación
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             {/* Tasks & Diary Section */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[600px]">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                     <div className="bg-yellow-100 p-2 rounded-lg">
                        <StickyNote className="w-5 h-5 text-yellow-600" />
                     </div>
                     <div>
                        <h3 className="text-lg font-bold text-slate-800 leading-none">Seguimiento de Obra</h3>
                        <p className="text-xs text-slate-500 mt-1">Diario, anotaciones e incidencias</p>
                     </div>
                 </div>
                 
                 {/* Input */}
                 <div className="flex gap-2 mb-6">
                     <input 
                        type="text" 
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Escribir nueva entrada..."
                        className="flex-1 p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm bg-white text-slate-800 placeholder-slate-400"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                     />
                     <button 
                        onClick={handleAddNote}
                        disabled={!newNoteText.trim()}
                        className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                     >
                         <Plus className="w-5 h-5" />
                     </button>
                 </div>

                 {/* List */}
                 <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                     
                     {/* Automatic Reminders Block */}
                     {upcomingReminders.length > 0 && (
                        <div className="mb-4 space-y-2">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                <Bell className="w-3 h-3" /> Recordatorios Automáticos
                             </div>
                             {upcomingReminders.map(rem => (
                                 <div key={rem.id} className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${rem.type === 'PRL' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                                     <div className={`p-1.5 rounded-full w-fit ${rem.type === 'PRL' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                         {rem.type === 'PRL' ? <CheckSquare className="w-4 h-4"/> : <Users className="w-4 h-4"/>}
                                     </div>
                                     <div className="flex-1">
                                         <p className="text-sm font-bold text-slate-800">
                                             {rem.type === 'PRL' ? 'Cita PRL 20h' : 'Reconocimiento Médico'}
                                         </p>
                                         <p className="text-xs text-slate-500">{rem.worker}</p>
                                     </div>
                                     <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                                         <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                            <Calendar className="w-3 h-3" /> {new Date(rem.date).toLocaleDateString()}
                                         </span>
                                         {rem.time && (
                                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                                <Clock className="w-3 h-3" /> {rem.time}
                                            </span>
                                         )}
                                         {rem.location && (
                                            <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm max-w-[100px] truncate">
                                                <MapPin className="w-3 h-3" /> {rem.location}
                                            </span>
                                         )}
                                     </div>
                                 </div>
                             ))}
                        </div>
                     )}

                     {project.notes && project.notes.length > 0 ? (
                         project.notes.map(note => (
                             <div 
                                key={note.id} 
                                className={`group p-4 rounded-xl border flex items-start gap-3 transition-all ${note.isCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                             >
                                 <button 
                                    onClick={() => toggleNoteCompletion(note.id)}
                                    className="mt-0.5 text-slate-400 hover:text-green-500 transition-colors"
                                 >
                                     {note.isCompleted ? (
                                         <CheckSquare className="w-5 h-5 text-green-600" />
                                     ) : (
                                         <Square className="w-5 h-5 text-slate-300" />
                                     )}
                                 </button>
                                 
                                 <div className="flex-1">
                                     <p className={`text-sm leading-relaxed ${note.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                                         {note.text}
                                     </p>
                                     <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                            <Calendar className="w-3 h-3"/>
                                            {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                     </div>
                                 </div>

                                 <button 
                                    onClick={() => deleteNote(note.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                 >
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                         ))
                     ) : (
                         (!upcomingReminders.length) && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                   <StickyNote className="w-8 h-8 opacity-30" />
                                </div>
                                <p className="text-sm font-medium">Diario vacío</p>
                            </div>
                         )
                     )}
                 </div>
             </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;