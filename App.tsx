
import React, { useState } from 'react';
import { Project, DocCategory, ToolStatus } from './types';
import { INITIAL_PROJECTS, COMPANY_LOGO, HEADER_BACKGROUND_IMAGE, APP_BACKGROUND_IMAGE } from './constants';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import { HardHat } from 'lucide-react';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleAddProject = () => {
    const newProject: Project = {
        id: Date.now().toString(),
        code: `PFEA-${new Date().getFullYear()}-XXX`,
        name: 'Nueva Obra (Sin Nombre)',
        location: 'Localidad Pendiente',
        budget: 0,
        laborBudget: 0,
        materialBudget: 0,
        totalPeonadas: 0,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        progress: 0,
        documents: [],
        tools: [],
        workers: [],
        notes: [],
        planning: []
    };
    setProjects([newProject, ...projects]);
    // Optional: Open it immediately
    // setSelectedProjectId(newProject.id); 
  };

  const handleDeleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProjectId === id) {
          setSelectedProjectId(null);
      }
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 bg-slate-50">
      {/* Background Image Layer (Watermark) */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.08]"
        style={{
            backgroundImage: `url(${APP_BACKGROUND_IMAGE})`,
            backgroundSize: '50%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
        }}
      ></div>

      {/* Top Navigation Bar - Corporate Design */}
      <nav 
        className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all duration-300 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Branding Section */}
            <div className="flex items-center gap-6 h-full py-3">
               {/* Institution Text */}
               <div className="flex flex-col justify-center select-none border-r border-slate-300 pr-6 hidden sm:flex">
                    <h1 className="text-gray-500 font-medium text-xl tracking-tight leading-none">
                        DIPUTACIÓN
                    </h1>
                    <h1 className="text-gray-500 font-medium text-xl tracking-tight leading-none">
                        DE CÁDIZ
                    </h1>
               </div>
               
               {/* Department Text */}
               <div className="flex flex-col justify-center select-none">
                    <h1 className="text-[#004B87] font-bold tracking-[0.2em] text-lg leading-none mb-1">
                        COOPERACIÓN
                    </h1>
                    <div className="text-slate-600 text-sm leading-tight font-medium">
                        <p>Gestión de Fondos</p>
                        <p>PROFEA</p>
                    </div>
               </div>
            </div>

            {/* Supervisor Info - Right Aligned */}
            <div className="flex flex-col items-end text-sm">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider hidden sm:inline bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mb-1">
                    Supervisor de Obra
                </span>
                <div className="flex items-center gap-3 bg-white py-1.5 px-3 rounded-full border border-slate-200 shadow-sm">
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-slate-700 font-bold text-sm hidden sm:inline">David H.</span>
                    </div>
                    <div className="w-8 h-8 bg-[#004B87] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-slate-100">
                        DH
                    </div>
                </div>
              </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {activeProject ? (
          <ProjectDetail 
            project={activeProject} 
            onBack={() => setSelectedProjectId(null)} 
            onUpdateProject={handleUpdateProject}
          />
        ) : (
          <ProjectList 
            projects={projects} 
            onSelectProject={setSelectedProjectId} 
            onUpdateProject={handleUpdateProject}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
      </main>
    </div>
  );
};

export default App;
