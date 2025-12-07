import React, { useState, useRef } from 'react';
import { ToolRecord, ToolStatus, ToolTrackingLog, ToolDoc } from '../types';
import { STATUS_COLORS, COMPANY_LOGO } from '../constants';
import { analyzeToolImage } from '../services/geminiService';
import { Camera, Loader2, PenTool, Wrench, ArrowLeft, Plus, MapPin, History, FileText, Upload, FileDown, CalendarClock, Trash2 } from 'lucide-react';

interface ToolTrackerProps {
  tools: ToolRecord[];
  onAddTool: (tool: ToolRecord) => void;
  projectCode: string;
}

const ToolTracker: React.FC<ToolTrackerProps> = ({ tools, onAddTool, projectCode }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'docs' | 'history'>('details');
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);

  // New entry states
  const [newLocation, setNewLocation] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const selectedTool = tools.find(t => t.id === selectedToolId);

  // Handlers for adding a new tool
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      
      const analysis = await analyzeToolImage(base64Data);

      const newTool: ToolRecord = {
        id: Date.now().toString(),
        name: analysis.name,
        status: ToolStatus.DISPONIBLE,
        lastCheck: new Date().toISOString(),
        imageUrl: base64,
        condition: analysis.conditionAssessment,
        documents: [],
        trackingLog: []
      };

      onAddTool(newTool);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const updateTool = (updatedTool: ToolRecord) => {
    // In a real app, bubble this up. For this demo, we manipulate the object in memory as per previous context
    // because ProjectDetail replaces list. 
    // This is a known limitation of the current prop structure but fits the scope.
    if (selectedTool) {
        Object.assign(selectedTool, updatedTool);
        setSelectedToolId(updatedTool.id); // Re-render
    }
  };

  const handleAddLog = () => {
    if (!selectedTool || !newLocation) return;
    
    const newLog: ToolTrackingLog = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        location: newLocation,
        action: 'Movimiento',
        user: 'Supervisor'
    };
    
    const updatedTool = {
        ...selectedTool,
        trackingLog: [newLog, ...selectedTool.trackingLog],
        status: ToolStatus.EN_USO
    };
    
    updateTool(updatedTool);
    setNewLocation('');
  };

  const handleAddDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTool || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    const newDoc: ToolDoc = {
        id: Date.now().toString(),
        name: file.name,
        type: 'Manual Instrucciones', 
        url: URL.createObjectURL(file), 
        uploadDate: new Date().toISOString()
    };
    
    const updatedTool = {
        ...selectedTool,
        documents: [...selectedTool.documents, newDoc]
    };
    
    updateTool(updatedTool);
  }

  const handleDeleteDoc = (docId: string) => {
    if (!selectedTool) return;
    if (window.confirm('¿Eliminar documento de la herramienta?')) {
        const updatedDocs = selectedTool.documents.filter(d => d.id !== docId);
        const updatedTool = {
             ...selectedTool,
             documents: updatedDocs
        };
        updateTool(updatedTool);
    }
  }

  // --- Export Global History ---
  const handleExportGlobalHistory = () => {
      // Flatten all logs
      const allLogs = tools.flatMap(t => 
          t.trackingLog.map(log => ({
              ...log,
              toolName: t.name,
              toolId: t.id
          }))
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Add Logo Header
      let tableRows = `
          <tr>
            <td colspan="5" style="text-align: left; padding: 10px; background-color: #ffffff;">
                <img src="${COMPANY_LOGO}" alt="Logo" height="60" style="display: block;" />
            </td>
          </tr>
          <tr style="background-color: #1e40af; color: white;">
            <th style="padding: 10px;">Fecha</th>
            <th style="padding: 10px;">Herramienta</th>
            <th style="padding: 10px;">Acción</th>
            <th style="padding: 10px;">Destino / Ubicación</th>
            <th style="padding: 10px;">Cód. Obra</th>
        </tr>
      `;

      allLogs.forEach(log => {
          tableRows += `
            <tr>
                <td style="border: 1px solid #ccc; padding: 5px;">${new Date(log.date).toLocaleString()}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${log.toolName}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${log.action}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${log.location}</td>
                <td style="border: 1px solid #ccc; padding: 5px;">${projectCode}</td>
            </tr>
          `;
      });

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head>
        <body>
            <h2 style="color: #1e3a8a;">Registro Global de Movimientos de Herramientas</h2>
            <table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
                ${tableRows}
            </table>
        </body>
        </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Movimientos_Herramientas_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // --- Detail View ---
  if (selectedTool) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
                <button onClick={() => setSelectedToolId(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h3 className="font-bold text-slate-800">{selectedTool.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedTool.status]}`}>
                        {selectedTool.status}
                    </span>
                </div>
            </div>

            <div className="flex border-b border-slate-200">
                <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>Detalles</button>
                <button onClick={() => setActiveTab('docs')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'docs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>Docs</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}>Seguimiento</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
                {activeTab === 'details' && (
                    <div className="space-y-4">
                        <div className="h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                             {selectedTool.imageUrl ? (
                                <img src={selectedTool.imageUrl} alt={selectedTool.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Wrench className="w-12 h-12 text-slate-400"/></div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Estado / Condición</label>
                            <p className="text-slate-700 bg-slate-100 p-3 rounded mt-1 text-sm border border-slate-200">{selectedTool.condition}</p>
                        </div>
                         <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Última Revisión</label>
                            <p className="text-slate-700 mt-1 text-sm">{new Date(selectedTool.lastCheck).toLocaleDateString()}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-800">Documentos Técnicos</h4>
                            <button onClick={() => docInputRef.current?.click()} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 font-medium flex items-center gap-1 border border-blue-200">
                                <Plus className="w-3 h-3"/> Subir
                            </button>
                            <input type="file" ref={docInputRef} className="hidden" onChange={handleAddDoc} />
                        </div>
                        
                        <div className="space-y-2">
                             {selectedTool.documents?.length > 0 ? (
                                selectedTool.documents.map(doc => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                                        <FileText className="w-5 h-5 text-red-500" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium text-slate-700 truncate">{doc.name}</p>
                                            <p className="text-xs text-slate-500">{doc.type}</p>
                                        </div>
                                        <button onClick={() => handleDeleteDoc(doc.id)} className="text-slate-500 hover:text-red-500 p-2 rounded hover:bg-red-50">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                             ) : (
                                 <p className="text-sm text-slate-500 text-center py-4 italic">No hay manuales o certificados.</p>
                             )}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6">
                        {/* Add Log */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Registrar Movimiento</label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="¿A dónde se lleva?" 
                                    className="flex-1 text-sm p-2 border border-slate-300 bg-white text-slate-800 rounded focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400"
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                />
                                <button 
                                    onClick={handleAddLog}
                                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                    disabled={!newLocation}
                                >
                                    <Plus className="w-5 h-5"/>
                                </button>
                             </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                            {selectedTool.trackingLog?.length > 0 ? (
                                selectedTool.trackingLog.map(log => (
                                    <div key={log.id} className="relative">
                                        <div className="absolute -left-[21px] top-1 bg-white border-2 border-blue-500 w-3 h-3 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{log.location}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span className="text-blue-600 font-medium">{log.action}</span>
                                                <span>•</span>
                                                <span>{log.user}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 italic pl-2">Sin historial de movimientos.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
  }

  // --- Global History View ---
  if (showGlobalHistory) {
      const allLogs = tools.flatMap(t => 
          t.trackingLog.map(log => ({...log, toolName: t.name}))
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowGlobalHistory(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h3 className="font-bold text-slate-800">Historial Global de Movimientos</h3>
                        <p className="text-xs text-slate-500">Relación de entradas y salidas de equipo</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleExportGlobalHistory}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                  >
                      <FileDown className="w-4 h-4" /> Exportar Relación
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                  {allLogs.length > 0 ? (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0 border-b border-slate-200">
                              <tr>
                                  <th className="p-3 font-semibold">Fecha</th>
                                  <th className="p-3 font-semibold">Herramienta</th>
                                  <th className="p-3 font-semibold">Destino</th>
                                  <th className="p-3 font-semibold">Acción</th>
                                  <th className="p-3 font-semibold">Cód. Obra</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                              {allLogs.map((log, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                      <td className="p-3 text-slate-600">{new Date(log.date).toLocaleString()}</td>
                                      <td className="p-3 font-medium text-slate-800">{log.toolName}</td>
                                      <td className="p-3 text-slate-800 font-bold">{log.location}</td>
                                      <td className="p-3 text-blue-600">{log.action}</td>
                                      <td className="p-3 text-slate-500 font-mono text-xs">{projectCode}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                          <History className="w-12 h-12 mb-2 opacity-30" />
                          <p>No hay movimientos registrados.</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- List View ---
  return (
    <div className="space-y-6">
      {/* Tool Add Action */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
           <h3 className="font-bold text-slate-800">Inventario de Herramientas</h3>
           <p className="text-sm text-slate-500">Gestiona y controla el equipo</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
                onClick={() => setShowGlobalHistory(true)}
                className="flex-1 sm:flex-none bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors font-medium text-sm"
            >
                <CalendarClock className="w-4 h-4" />
                Ver Historial Global
            </button>
            <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors text-sm font-medium"
            >
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {isAnalyzing ? 'Identificando...' : 'Registrar'}
            </button>
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map(tool => (
            <div 
                key={tool.id} 
                onClick={() => setSelectedToolId(tool.id)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-all group hover:border-blue-300"
            >
                <div className="h-32 bg-slate-50 relative border-b border-slate-100">
                    {tool.imageUrl ? (
                        <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Wrench className="w-12 h-12" />
                        </div>
                    )}
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full border ${STATUS_COLORS[tool.status]}`}>
                        {tool.status}
                    </span>
                    
                    {/* Hover indicator */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-white text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-lg">Ver Detalles</span>
                    </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-bold text-slate-800 mb-1">{tool.name}</h4>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{tool.condition}</p>
                    
                    <div className="mt-auto pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {tool.trackingLog && tool.trackingLog.length > 0 ? tool.trackingLog[0].location : 'Almacén'}
                        </div>
                        {tool.documents && tool.documents.length > 0 && (
                            <FileText className="w-3 h-3 text-blue-500" />
                        )}
                    </div>
                </div>
            </div>
        ))}

        {tools.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <PenTool className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>No hay herramientas registradas en esta obra.</p>
                <p className="text-sm">Usa el botón "Registrar" para escanear equipo.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ToolTracker;