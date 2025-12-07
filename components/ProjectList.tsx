import React, { useState } from 'react';
import { Project } from '../types';
import { MapPin, Calendar, Activity, ChevronRight, Edit2, Save, X, Plus, Trash2, Hash, ArrowRight, LayoutDashboard } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  onAddProject: () => void;
  onDeleteProject: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onUpdateProject, onAddProject, onDeleteProject }) => {
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const handleEditClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject({ ...project });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if (window.confirm(`¿Está seguro de que desea eliminar la obra "${name}"?\n\nEsta acción no se puede deshacer y borrará toda la documentación, trabajadores y herramientas asociadas.`)) {
          onDeleteProject(id);
      }
  };

  const handleSave = () => {
    if (editingProject) {
      onUpdateProject(editingProject);
      setEditingProject(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-slate-200 pb-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Obras Activas</h2>
            <p className="text-slate-500 mt-1 text-sm">Gestión y supervisión de proyectos en curso</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="flex items-center justify-center bg-[#004B87] text-white px-3 py-1 rounded-md font-bold text-sm shadow-sm">
            {projects.length}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Project Card */}
        <button 
            onClick={onAddProject}
            className="flex flex-col items-center justify-center min-h-[240px] bg-white border-2 border-dashed border-slate-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 hover:shadow-lg transition-all group duration-300"
        >
            <div className="w-16 h-16 bg-slate-50 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white group-hover:text-blue-600 group-hover:ring-4 group-hover:ring-blue-100 transition-all border border-slate-200">
                <Plus className="w-8 h-8 text-slate-400 group-hover:text-blue-600" />
            </div>
            <span className="font-bold text-slate-600 group-hover:text-blue-600 text-lg">Nueva Obra</span>
            <span className="text-xs text-slate-500 mt-1">Crear expediente vacío</span>
        </button>

        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group relative flex flex-col"
          >
            {/* Status Bar */}
            <div className="h-1.5 w-full bg-slate-100">
                <div 
                    className={`h-full transition-all duration-700 ${project.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                    style={{ width: `${project.progress}%` }}
                ></div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-2">
                   <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase tracking-wider">
                                {project.code || 'SIN CÓDIGO'}
                        </span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate">
                      {project.name}
                   </h3>
                </div>
                
                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={(e) => handleEditClick(e, project)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={(e) => handleDeleteClick(e, project.id, project.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">{project.location}</span>
                </div>
                
                <div className="flex items-start gap-2 text-slate-500">
                  <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div className="flex flex-col text-sm">
                      <span className="font-medium text-slate-600">Inicio: {new Date(project.startDate).toLocaleDateString()}</span>
                      <span className="text-xs text-slate-400">Fin Previsto: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Pendiente'}</span>
                  </div>
                </div>
              </div>

              {/* Mini Dashboard */}
              <div className="grid grid-cols-2 gap-2 mb-4 pt-4 border-t border-dashed border-slate-200">
                  <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                      <span className="block text-xs text-slate-500 font-bold uppercase">Personal</span>
                      <span className="block text-lg font-bold text-slate-700">{project.workers.length}</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                      <span className="block text-xs text-slate-500 font-bold uppercase">Avance</span>
                      <span className={`block text-lg font-bold ${project.progress > 0 ? 'text-blue-600' : 'text-slate-500'}`}>{project.progress}%</span>
                  </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-2">
                 <div className="flex -space-x-2 overflow-hidden">
                    {/* Fake avatars for visual interest */}
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-300"></div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-400"></div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-700">
                        +{project.workers.length}
                    </div>
                 </div>
                 <span className="flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    Gestionar <ArrowRight className="w-3 h-3 ml-1" />
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal - Professional Style (Light) */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-600" />
                    Configuración de Obra
                </h3>
                <p className="text-sm text-slate-500">Edite los detalles técnicos y administrativos</p>
              </div>
              <button 
                onClick={() => setEditingProject(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto bg-slate-50">
                <div className="grid gap-6">
                    {/* Section 1: Identification */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Identificación</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre del Proyecto</label>
                                <input 
                                    type="text" 
                                    value={editingProject.name}
                                    onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-slate-800 placeholder-slate-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Código de Expediente</label>
                                <input 
                                    type="text" 
                                    value={editingProject.code || ''}
                                    onChange={(e) => setEditingProject({...editingProject, code: e.target.value})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm text-slate-800 placeholder-slate-400"
                                    placeholder="Ej: PFEA-2024-001"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Localidad / Ubicación</label>
                                <input 
                                    type="text" 
                                    value={editingProject.location}
                                    onChange={(e) => setEditingProject({...editingProject, location: e.target.value})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Dates & Progress */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Planificación</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Fecha Inicio</label>
                                <input 
                                    type="date" 
                                    value={editingProject.startDate}
                                    onChange={(e) => setEditingProject({...editingProject, startDate: e.target.value})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Fecha Fin Prevista</label>
                                <input 
                                    type="date" 
                                    value={editingProject.endDate}
                                    onChange={(e) => setEditingProject({...editingProject, endDate: e.target.value})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Progreso (%)</label>
                                <input 
                                    type="number" 
                                    min="0" max="100"
                                    value={editingProject.progress}
                                    onChange={(e) => setEditingProject({...editingProject, progress: Number(e.target.value)})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Budget */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Datos Económicos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Presupuesto Total (€)</label>
                                <input 
                                    type="number" 
                                    value={editingProject.budget}
                                    onChange={(e) => setEditingProject({...editingProject, budget: Number(e.target.value)})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Peonadas (Jornales)</label>
                                <input 
                                    type="number" 
                                    value={editingProject.totalPeonadas}
                                    onChange={(e) => setEditingProject({...editingProject, totalPeonadas: Number(e.target.value)})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1.5">Mano de Obra (€)</label>
                                <input 
                                    type="number" 
                                    value={editingProject.laborBudget}
                                    onChange={(e) => setEditingProject({...editingProject, laborBudget: Number(e.target.value)})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 mb-1.5">Materiales (€)</label>
                                <input 
                                    type="number" 
                                    value={editingProject.materialBudget}
                                    onChange={(e) => setEditingProject({...editingProject, materialBudget: Number(e.target.value)})}
                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                <button 
                    onClick={() => setEditingProject(null)}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow-md flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                    <Save className="w-4 h-4" /> Guardar Cambios
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;