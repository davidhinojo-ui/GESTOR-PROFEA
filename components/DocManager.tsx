import React, { useState, useRef, useEffect } from 'react';
import { DocumentRecord, DocCategory, AIDocAnalysis, Worker } from '../types';
import { CATEGORY_ICONS, QUINCENAS_OPTIONS } from '../constants';
import { analyzeDocumentImage } from '../services/geminiService';
import { Upload, Loader2, CheckCircle, AlertTriangle, XCircle, Camera, ChevronDown, ChevronRight, Calendar, UserPlus, FileText, User, MapPin, Filter, FileCheck, PenTool, Mail, X, Download, Save, PlusCircle, Trash2, Image as ImageIcon, Copy, CheckSquare, Square, AlertCircle, ListTodo, Edit2 } from 'lucide-react';
import { jsPDF } from "jspdf";

interface DocManagerProps {
  documents: DocumentRecord[];
  workers?: Worker[];
  onAddDocument: (doc: DocumentRecord) => void;
  onUpdateDocument: (doc: DocumentRecord) => void;
  onDeleteDocument: (docId: string) => void;
}

export const DocManager: React.FC<DocManagerProps> = ({ documents, workers = [], onAddDocument, onUpdateDocument, onDeleteDocument }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [DocCategory.CONTRATOS]: true, // Prioritize Contracts
    [DocCategory.ADMINISTRATIVA]: false
  });
  
  // Filtering & Sorting
  const [selectedQuincena, setSelectedQuincena] = useState<string>('');

  // Subcontractor Checklist State (Local UI state)
  const [subcontractorChecks, setSubcontractorChecks] = useState<Record<string, boolean>>({});

  // Manual Entry States
  const [showManualForm, setShowManualForm] = useState<DocCategory | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualQuincena, setManualQuincena] = useState('');

  // Edit Existing Doc State
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editDocName, setEditDocName] = useState('');

  // Signature States
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Advanced Signature Positioning & Scope
  const [signaturePos, setSignaturePos] = useState<{x: number, y: number} | null>(null);
  const [signScope, setSignScope] = useState<'current' | 'all' | 'custom'>('current');
  const [customPageNumbers, setCustomPageNumbers] = useState('');

  // Email States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDoc, setEmailDoc] = useState<DocumentRecord | null>(null); // Null means bulk send
  const [recipientEmail, setRecipientEmail] = useState('');

  // REVIEW MODAL STATE
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [pendingDocData, setPendingDocData] = useState<{
      base64: string;
      thumbnailBase64: string; // Store thumbnail separately
      pdfUrl: string;
      originalName: string;
      analysis: AIDocAnalysis;
  } | null>(null);
  const [reviewName, setReviewName] = useState('');
  const [reviewCategory, setReviewCategory] = useState<DocCategory>(DocCategory.OBRA);
  const [reviewWorker, setReviewWorker] = useState('');
  const [reviewExpiry, setReviewExpiry] = useState('');
  const [reviewQuincena, setReviewQuincena] = useState('');

  // Source Selection Modal
  const [showSourceSelectModal, setShowSourceSelectModal] = useState(false);

  // Refs
  const targetCategoryRef = useRef<DocCategory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleSubCheck = (item: string) => {
      setSubcontractorChecks(prev => ({
          ...prev,
          [item]: !prev[item]
      }));
  };

  // --- Image & PDF Processing ---

  // Enhanced compressImage to support variable resizing for thumbnails
  const compressImage = (file: File, maxWidth = 1024, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('No context');

                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
  };

  const generatePdfFromImage = (imageDataUrl: string, signatureDataUrl?: string, sigPos?: {x: number, y: number}): string => {
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imageDataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add Original Document
      pdf.addImage(imageDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // Add Signature if present
      if (signatureDataUrl) {
          const sigWidth = 60;
          const sigHeight = 30;
          
          let posX, posY;
          
          if (sigPos) {
              // Percentage based positioning
              posX = sigPos.x * pdfWidth;
              posY = sigPos.y * pdfHeight;
              
              // Adjust to center signature on click point
              posX = posX - (sigWidth / 2);
              posY = posY - (sigHeight / 2);
          } else {
               // Default bottom right
               posX = pdfWidth - sigWidth - 10;
               posY = Math.min(pdfHeight - sigHeight - 10, 280);
          }

          // Ensure boundaries
          posX = Math.max(0, Math.min(posX, pdfWidth - sigWidth));
          posY = Math.max(0, Math.min(posY, pdfHeight - sigHeight));
          
          pdf.addImage(signatureDataUrl, 'PNG', posX, posY, sigWidth, sigHeight);
          
          // Add Date Stamp
          pdf.setFontSize(10);
          pdf.setTextColor(100);
          pdf.text(`Firmado: ${new Date().toLocaleDateString()}`, posX, posY + sigHeight + 5);
      }

      const blob = pdf.output('blob');
      return URL.createObjectURL(blob);
  };

  // --- Upload Handlers ---

  const handleSourceSelectClick = (specificCategory?: DocCategory, workerName?: string) => {
      targetCategoryRef.current = specificCategory || null;
      if (workerName) setReviewWorker(workerName); // Pre-fill worker name if triggered from pending list
      setShowSourceSelectModal(true);
  };

  const triggerCamera = () => {
      setShowSourceSelectModal(false);
      cameraInputRef.current?.click();
  };

  const triggerGallery = () => {
      setShowSourceSelectModal(false);
      fileInputRef.current?.click();
  };

  const processSingleFile = async (file: File, categoryOverride?: DocCategory, workerOverride?: string) => {
        // Generate High Res for PDF/Analysis
        const compressedBase64 = await compressImage(file, 1024, 0.6);
        // Generate Low Res Thumbnail for List View (Major Performance Fix)
        const thumbnailBase64 = await compressImage(file, 150, 0.5);

        const base64Data = compressedBase64.split(',')[1];
        
        // Analyze
        const analysis = await analyzeDocumentImage(base64Data);
        
        const pdfUrl = generatePdfFromImage(compressedBase64);
        
        // Determine category
        let finalCategory = DocCategory.OBRA;
        if (categoryOverride) {
            finalCategory = categoryOverride;
        } else if (targetCategoryRef.current) {
            finalCategory = targetCategoryRef.current;
        } else if (Object.values(DocCategory).includes(analysis.category as DocCategory)) {
            finalCategory = analysis.category as DocCategory;
        }

        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
            category: finalCategory,
            uploadDate: new Date().toISOString(),
            imageUrl: compressedBase64,
            thumbnailUrl: thumbnailBase64, // Add thumbnail
            fileUrl: pdfUrl,
            mimeType: 'application/pdf',
            summary: analysis.summary,
            expiryDate: analysis.expiryDate || undefined,
            workerName: workerOverride || analysis.workerName || undefined,
            isValid: analysis.isValid,
            recordType: 'file' as const,
            quincena: selectedQuincena || undefined,
            isSigned: false
        };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
        if (files.length === 1) {
            // Single File Flow -> Review Modal
            const file = files[0];
            const compressedBase64 = await compressImage(file, 1024, 0.6);
            const thumbnailBase64 = await compressImage(file, 150, 0.5); // Generate thumbnail

            const base64Data = compressedBase64.split(',')[1];
            
            const analysis = await analyzeDocumentImage(base64Data);
            const pdfUrl = generatePdfFromImage(compressedBase64);
            
            setPendingDocData({
                base64: compressedBase64,
                thumbnailBase64: thumbnailBase64, // Store thumbnail
                pdfUrl: pdfUrl,
                originalName: file.name.replace(/\.[^/.]+$/, ""),
                analysis: analysis
            });

            // Initialize review form
            setReviewName(file.name.replace(/\.[^/.]+$/, ""));
            
            let initialCategory = DocCategory.OBRA;
            if (targetCategoryRef.current) {
                initialCategory = targetCategoryRef.current;
            } else if (Object.values(DocCategory).includes(analysis.category as DocCategory)) {
                initialCategory = analysis.category as DocCategory;
            }
            
            setReviewCategory(initialCategory);
            if (!reviewWorker) setReviewWorker(analysis.workerName || '');
            setReviewExpiry(analysis.expiryDate || '');
            setReviewQuincena(selectedQuincena);

            setShowReviewModal(true);
        } else {
            // Bulk Upload Flow -> Auto Save
            for (let i = 0; i < files.length; i++) {
                const doc = await processSingleFile(files[i]);
                onAddDocument(doc);
                setUploadProgress({ current: i + 1, total: files.length });
                
                // Expand category of last added
                if (i === files.length - 1) {
                    setExpandedCategories(prev => ({ ...prev, [doc.category]: true }));
                }
            }
            // Clear target ref after bulk
            targetCategoryRef.current = null;
        }

    } catch (error) {
        console.error("Error processing document:", error);
        alert("Error al procesar. Intente de nuevo.");
    } finally {
        setIsUploading(false);
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const saveReviewedDocument = () => {
      if (!pendingDocData) return;

      const newDoc: DocumentRecord = {
          id: Date.now().toString(),
          name: reviewName + ".pdf",
          category: reviewCategory,
          uploadDate: new Date().toISOString(),
          imageUrl: pendingDocData.base64,
          thumbnailUrl: pendingDocData.thumbnailBase64, // Save thumbnail
          fileUrl: pendingDocData.pdfUrl,
          mimeType: 'application/pdf',
          summary: pendingDocData.analysis.summary,
          expiryDate: reviewExpiry || undefined,
          workerName: reviewWorker || undefined,
          isValid: pendingDocData.analysis.isValid,
          recordType: 'file',
          quincena: reviewQuincena || undefined,
          isSigned: false
      };

      onAddDocument(newDoc);
      setExpandedCategories(prev => ({ ...prev, [newDoc.category]: true }));
      setShowReviewModal(false);
      setPendingDocData(null);
      setReviewWorker(''); // Clear temp
      targetCategoryRef.current = null;
  };

  const confirmDelete = (docId: string, docName: string) => {
      if (window.confirm(`¿Estás seguro de que deseas eliminar el documento "${docName}"?`)) {
          onDeleteDocument(docId);
      }
  };

  // --- Manual Entry Logic ---
  const handleManualEntry = (category: DocCategory) => {
    if (!manualName || !manualDate) return;

    const isPRL = category === DocCategory.FORMACION;
    const docName = isPRL ? `Cita PRL 20h - ${manualName}` : `Cita Médica - ${manualName}`;

    const newDoc: DocumentRecord = {
        id: Date.now().toString(),
        name: docName,
        category: category,
        uploadDate: new Date().toISOString(),
        expiryDate: manualDate,
        workerName: manualName,
        summary: isPRL ? 'Cita programada formación 20h' : 'Cita programada reconocimiento médico',
        isValid: true,
        recordType: 'appointment',
        location: manualLocation,
        quincena: manualQuincena
    };

    onAddDocument(newDoc);
    setManualName('');
    setManualDate('');
    setManualLocation('');
    setManualQuincena('');
    setShowManualForm(null);
  };

  const openManualFormForWorker = (worker: Worker, category: DocCategory) => {
      setManualName(`${worker.firstName} ${worker.lastName}`);
      setManualQuincena(worker.quincena);
      setShowManualForm(category);
  }

  // --- Edit Existing Document ---

  const handleEditClick = (doc: DocumentRecord) => {
      setEditingDoc(doc);
      setEditDocName(doc.name);
      setEditExpiryDate(doc.expiryDate || '');
  };

  const saveEditedDoc = () => {
      if (!editingDoc) return;
      const updatedDoc = {
          ...editingDoc,
          name: editDocName,
          expiryDate: editExpiryDate || undefined
      };
      onUpdateDocument(updatedDoc);
      setEditingDoc(null);
  };

  // --- Advanced Signature Logic ---

  const openSignatureModal = (docId: string) => {
      setSigningDocId(docId);
      setSignaturePos(null);
      setSignScope('current');
      setCustomPageNumbers('');
      setShowSignatureModal(true);
      setTimeout(() => {
          const canvas = canvasRef.current;
          if (canvas) {
              const ctx = canvas.getContext('2d');
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
          }
      }, 100);
  };

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setSignaturePos({ x, y });
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      setIsDrawing(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
  };

  const endDrawing = () => {
      setIsDrawing(false);
  };

  const saveSignature = () => {
      if (!signingDocId || !canvasRef.current) return;

      const doc = documents.find(d => d.id === signingDocId);
      if (!doc || !doc.imageUrl) return;

      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      
      // Use custom position if set, otherwise default will be used in generate function
      const newPdfUrl = generatePdfFromImage(doc.imageUrl, signatureDataUrl, signaturePos || undefined);

      const updatedDoc: DocumentRecord = {
          ...doc,
          fileUrl: newPdfUrl,
          signatureUrl: signatureDataUrl,
          isSigned: true,
          name: doc.name.replace('.pdf', '') + '_FIRMADO.pdf'
      };

      onAddDocument(updatedDoc);
      setShowSignatureModal(false);
      setSigningDocId(null);
  };

  // --- Email Logic ---

  const handleOpenEmail = (doc: DocumentRecord | null) => {
      setEmailDoc(doc);
      setRecipientEmail('');
      setShowEmailModal(true);
  };

  const sendEmail = () => {
      if (!recipientEmail) return;

      const subject = emailDoc 
        ? `Documentación Obra: ${emailDoc.name}` 
        : `Documentación Obra - Quincena ${selectedQuincena || 'General'}`;
      
      const body = emailDoc
        ? `Adjunto encontrará el documento: ${emailDoc.name}.\n\nTipo: ${emailDoc.category}\nTrabajador: ${emailDoc.workerName || 'N/A'}\n\nPor favor, revise el archivo descargado.`
        : `Adjunto envío documentación correspondiente a la obra.\n\nPor favor, revise los archivos.`;

      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.open(mailtoLink, '_blank');
      
      if (emailDoc && emailDoc.fileUrl) {
          const link = document.createElement('a');
          link.href = emailDoc.fileUrl;
          link.download = emailDoc.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert(`Correo abierto. Archivo descargado.`);
      } else {
           alert(`Correo abierto.`);
      }

      setShowEmailModal(false);
  };

  // --- Rendering ---

  const categories = [
    DocCategory.CONTRATOS, 
    DocCategory.SAE,
    DocCategory.ADMINISTRATIVA,
    DocCategory.OBRA,
    DocCategory.SUBCONTRATAS,
    DocCategory.TRABAJADORES,
    DocCategory.FORMACION,
    DocCategory.RECONOCIMIENTOS,
  ];

  const filteredDocuments = selectedQuincena 
    ? documents.filter(d => d.quincena === selectedQuincena)
    : documents;
    
  const getSigningDocImage = () => {
      const doc = documents.find(d => d.id === signingDocId);
      return doc?.imageUrl;
  };

  // Subcontractor Checklist Items
  const subContractorRequirements = [
      'Adhesión Plan Seguridad y Salud',
      'Certificado Inscripción REA',
      'Seguro Responsabilidad Civil (RC) + Recibo',
      'TC1/TC2 (Seguridad Social)',
      'Certificado Corriente Pagos (Hacienda/SS)',
      'Evaluación de Riesgos Específica'
  ];

  return (
    <div className="space-y-6">
        
      {/* Hidden Global Inputs */}
      <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,application/pdf"
            multiple // Enable multiple files
            onChange={handleFileChange}
            disabled={isUploading}
      />
      {/* Camera specific input */}
      <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={isUploading}
      />
      
      {/* Filters & Bulk Actions */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
                className="flex-1 bg-slate-50 border border-slate-300 rounded text-sm font-medium text-slate-700 focus:outline-none p-2"
                value={selectedQuincena}
                onChange={(e) => setSelectedQuincena(e.target.value)}
            >
                <option value="">Todas las Quincenas</option>
                {QUINCENAS_OPTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                ))}
            </select>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => handleSourceSelectClick()} 
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-colors"
                disabled={isUploading}
            >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" />} Escanear Gral.
            </button>
            <button 
                onClick={() => handleOpenEmail(null)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors border border-indigo-200"
            >
                <Mail className="w-4 h-4" /> Enviar Todo
            </button>
        </div>
      </div>

      {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin"/>
              <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800">Procesando documentos...</p>
                  <p className="text-xs text-blue-600">Archivo {uploadProgress.current} de {uploadProgress.total}</p>
              </div>
          </div>
      )}

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category) => {
           const docs = filteredDocuments
                .filter(d => d.category === category)
                .sort((a, b) => (a.quincena || '').localeCompare(b.quincena || ''));

           const isExpanded = expandedCategories[category];
           const isFormActive = showManualForm === category;
           const isContract = category === DocCategory.CONTRATOS;
           const isSubcontractor = category === DocCategory.SUBCONTRATAS;
           const isFormacion = category === DocCategory.FORMACION;
           const isReconocimiento = category === DocCategory.RECONOCIMIENTOS;

           // Determine pending workers for Formacion and Reconocimientos
           let pendingWorkers: Worker[] = [];
           if (isFormacion) {
               // Filter workers who do not have PRL and do not have a document uploaded in this category with their name
               pendingWorkers = workers.filter(w => !w.hasPrl20h && !docs.some(d => d.workerName && d.workerName.includes(w.lastName)));
           } else if (isReconocimiento) {
               pendingWorkers = workers.filter(w => !w.medicalAppointment && !docs.some(d => d.workerName && d.workerName.includes(w.lastName)));
           }

           return (
            <div key={category} className={`rounded-lg shadow-sm border overflow-hidden ${isContract ? 'border-purple-200 ring-1 ring-purple-100' : 'bg-white border-slate-200'}`}>
                <button 
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between p-4 transition-colors ${isContract ? 'bg-purple-50 hover:bg-purple-100' : 'bg-white hover:bg-slate-50'}`}
                >
                    <div className="flex items-center gap-3">
                        {CATEGORY_ICONS[category as DocCategory]}
                        <h4 className={`font-semibold ${isContract ? 'text-purple-800' : 'text-slate-800'}`}>{category}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${docs.length > 0 ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                            {docs.length}
                        </span>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                    </div>
                </button>

                {isExpanded && (
                    <div className="p-4 border-t border-slate-200 bg-white">
                        
                        {/* SUBCONTRACTOR CHECKLIST */}
                        {isSubcontractor && (
                            <div className="bg-purple-50 p-4 rounded-lg mb-4 border border-purple-200">
                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                                        <ListTodo className="w-4 h-4" /> Requisitos Legales Obligatorios
                                    </h5>
                                    <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                                        {subContractorRequirements.filter(r => subcontractorChecks[r]).length} / {subContractorRequirements.length}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {subContractorRequirements.map((req, idx) => {
                                         // Check if we have a document that likely matches this requirement
                                         const hasRelatedDoc = docs.some(d => d.summary?.toLowerCase().includes(req.toLowerCase()) || d.name.toLowerCase().includes(req.substring(0, 10).toLowerCase()));
                                         const isChecked = subcontractorChecks[req] || hasRelatedDoc;
                                         
                                         return (
                                         <div key={idx} className={`flex items-center justify-between p-2.5 rounded border shadow-sm transition-colors ${isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-purple-100'}`}>
                                             <label className="flex items-center gap-3 text-sm text-slate-600 font-medium cursor-pointer flex-1">
                                                <button onClick={() => toggleSubCheck(req)} className="text-slate-400 hover:text-purple-600 transition-colors focus:outline-none">
                                                    {isChecked ? 
                                                        <CheckSquare className="w-5 h-5 text-green-500" /> : 
                                                        <Square className="w-5 h-5" />
                                                    }
                                                </button>
                                                <span className={isChecked ? 'text-green-600 line-through opacity-70' : ''}>{req}</span>
                                             </label>
                                             <button 
                                                onClick={() => handleSourceSelectClick(DocCategory.SUBCONTRATAS)} 
                                                className="text-xs bg-slate-100 border border-slate-200 text-purple-600 px-3 py-1.5 rounded-md hover:bg-slate-200 flex items-center gap-1.5 font-semibold transition-colors ml-2 shadow-sm"
                                             >
                                                 <Upload className="w-3.5 h-3.5" /> Subir
                                             </button>
                                         </div>
                                         );
                                    })}
                                </div>
                                <div className="mt-4 pt-3 border-t border-purple-200 text-right">
                                    <p className="text-xs text-purple-600 italic">
                                        Tip: Puedes subir varios documentos a la vez seleccionándolos en la galería.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* PENDING LIST (Formación & Reconocimientos) */}
                        {(isFormacion || isReconocimiento) && pendingWorkers.length > 0 && (
                            <div className="bg-orange-50 p-4 rounded-lg mb-4 border border-orange-200">
                                <h5 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Pendientes ({pendingWorkers.length})
                                </h5>
                                <div className="space-y-2">
                                    {pendingWorkers.map(w => (
                                        <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded border border-orange-200 shadow-sm gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{w.firstName} {w.lastName}</p>
                                                <p className="text-xs text-slate-500">{w.quincena}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => openManualFormForWorker(w, category as DocCategory)}
                                                    className="flex-1 sm:flex-none text-xs bg-orange-100 text-orange-800 px-3 py-1.5 rounded hover:bg-orange-200 border border-orange-200 font-medium"
                                                >
                                                    Agendar Cita
                                                </button>
                                                <button 
                                                    onClick={() => handleSourceSelectClick(category as DocCategory, `${w.firstName} ${w.lastName}`)}
                                                    className="flex-1 sm:flex-none text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium flex items-center justify-center gap-1"
                                                >
                                                    <Upload className="w-3 h-3" /> Subir
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Specific Action Buttons per Category */}
                        {isContract && (
                            <button 
                                onClick={() => handleSourceSelectClick(DocCategory.CONTRATOS)}
                                className="w-full mb-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 text-sm font-bold hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Subir Contrato para Firmar
                            </button>
                        )}

                        {!isContract && (
                            <div className="flex flex-col gap-2 mb-4">
                                {((category === DocCategory.FORMACION || category === DocCategory.RECONOCIMIENTOS)) && !isFormActive && (
                                    <button 
                                        onClick={() => {
                                            setShowManualForm(category as DocCategory);
                                            setManualQuincena(selectedQuincena);
                                        }}
                                        className="w-full py-3 border border-dashed border-blue-300 rounded-lg text-blue-600 text-sm font-medium hover:bg-blue-50 flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        {category === DocCategory.FORMACION ? 'Añadir Cita Formación PRL Manual' : 'Añadir Cita Médica Manual'}
                                    </button>
                                )}
                                
                                {!isFormActive && (
                                    <button 
                                        onClick={() => handleSourceSelectClick(category as DocCategory)}
                                        className="w-full py-3 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        {isSubcontractor ? 'Subir Documentos (Permite Selección Múltiple)' : `Escanear / Subir Documento en ${category}`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Manual Form */}
                        {isFormActive && (
                            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                                <h5 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">Nueva Cita</h5>
                                <div className="grid gap-3 mb-3">
                                    <input 
                                        type="text" 
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        className="w-full text-sm p-2 border border-blue-200 rounded bg-white text-slate-800 placeholder-slate-400"
                                        placeholder="Nombre del Trabajador"
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input 
                                            type="date" 
                                            value={manualDate}
                                            onChange={(e) => setManualDate(e.target.value)}
                                            className="w-full text-sm p-2 border border-blue-200 rounded bg-white text-slate-800"
                                        />
                                        <select 
                                            value={manualQuincena}
                                            onChange={(e) => setManualQuincena(e.target.value)}
                                            className="w-full text-sm p-2 border border-blue-200 rounded bg-white text-slate-800"
                                        >
                                            <option value="">Quincena...</option>
                                            {QUINCENAS_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                        </select>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={manualLocation}
                                        onChange={(e) => setManualLocation(e.target.value)}
                                        className="w-full text-sm p-2 border border-blue-200 rounded bg-white text-slate-800 placeholder-slate-400"
                                        placeholder="Lugar de la cita"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setShowManualForm(null)} className="text-xs text-slate-500 px-3 py-2 hover:text-slate-800">Cancelar</button>
                                    <button onClick={() => handleManualEntry(category as DocCategory)} className="bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-500">Guardar</button>
                                </div>
                            </div>
                        )}

                        {/* Documents List */}
                        <div className="grid gap-3">
                            {docs.length > 0 ? (
                                docs.map(doc => (
                                    <div key={doc.id} className={`rounded-lg p-3 border flex flex-col gap-3 ${doc.recordType === 'appointment' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        
                                        <div className="flex items-start gap-3">
                                            {/* Thumbnail / Icon */}
                                            <div className="flex-shrink-0">
                                                {doc.imageUrl ? (
                                                    <div className="relative group w-12 h-12">
                                                        <img 
                                                            src={doc.thumbnailUrl || doc.imageUrl} // Use thumbnail if available
                                                            alt="Doc" 
                                                            loading="lazy" // Native lazy loading
                                                            decoding="async"
                                                            className="w-full h-full object-cover rounded bg-white border border-slate-200" 
                                                        />
                                                        {doc.isSigned && (
                                                            <div className="absolute -top-1 -right-1 bg-green-500 text-white p-0.5 rounded-full z-10 shadow-sm">
                                                                <CheckCircle className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className={`w-12 h-12 rounded flex items-center justify-center ${doc.recordType === 'appointment' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                                                        {doc.recordType === 'appointment' ? <Calendar className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <a 
                                                        href={doc.fileUrl || '#'} 
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-semibold truncate hover:underline text-blue-600 block max-w-[150px] sm:max-w-xs"
                                                    >
                                                        {doc.name}
                                                    </a>
                                                    {doc.isValid ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                                </div>
                                                
                                                {doc.workerName && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><User className="w-3 h-3"/> {doc.workerName}</div>}
                                                {doc.quincena && <div className="text-xs text-slate-500 mt-0.5 bg-slate-200 inline-block px-1 rounded">{doc.quincena}</div>}
                                                
                                                {/* Expiry Date Display */}
                                                {doc.expiryDate && (
                                                    <div className={`text-xs mt-1 flex items-center gap-1 font-semibold ${new Date(doc.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                                                        <Calendar className="w-3 h-3"/> 
                                                        Caduca: {new Date(doc.expiryDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Toolbar Buttons */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 overflow-x-auto no-scrollbar justify-between">
                                            <div className="flex gap-2">
                                                {/* Edit Button */}
                                                <button 
                                                    onClick={() => handleEditClick(doc)}
                                                    className="flex-shrink-0 text-xs flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 shadow-sm"
                                                    title="Editar Datos"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>

                                                {/* Sign Button (Contracts) */}
                                                {isContract && !doc.isSigned && doc.recordType === 'file' && (
                                                    <button 
                                                        onClick={() => openSignatureModal(doc.id)}
                                                        className="flex-shrink-0 text-xs flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 shadow-sm"
                                                    >
                                                        <PenTool className="w-3 h-3" /> Firmar
                                                    </button>
                                                )}
                                                
                                                {/* Email Button */}
                                                <button 
                                                    onClick={() => handleOpenEmail(doc)}
                                                    className="flex-shrink-0 text-xs flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 shadow-sm"
                                                >
                                                    <Mail className="w-3 h-3" /> Email
                                                </button>

                                                {/* Download/View */}
                                                {doc.fileUrl && (
                                                    <a href={doc.fileUrl} download={doc.name} className="flex-shrink-0 text-xs flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-md hover:bg-slate-50 shadow-sm">
                                                        <Download className="w-3 h-3" /> PDF
                                                    </a>
                                                )}
                                            </div>

                                            {/* DELETE Button */}
                                            <button 
                                                onClick={() => confirmDelete(doc.id, doc.name)}
                                                className="flex-shrink-0 text-xs flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-2">
                                    {isContract ? "Sube una foto del contrato para firmarlo." : "No hay documentos."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {/* EDIT MODAL */}
      {editingDoc && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-blue-600" /> Editar Documento
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Documento</label>
                        <input 
                            type="text" 
                            value={editDocName} 
                            onChange={(e) => setEditDocName(e.target.value)}
                            className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Caducidad</label>
                        <input 
                            type="date" 
                            value={editExpiryDate} 
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                            className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Establecer fecha límite para recibir alertas.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button 
                        onClick={() => setEditingDoc(null)} 
                        className="flex-1 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={saveEditedDoc} 
                        className="flex-1 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                    >
                        Guardar Cambios
                    </button>
                </div>
              </div>
          </div>
      )}

      {/* SOURCE SELECTION MODAL */}
      {showSourceSelectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Seleccionar Origen</h3>
                <div className="grid gap-4">
                    <button 
                        onClick={triggerCamera}
                        className="flex flex-col items-center justify-center p-6 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <Camera className="w-10 h-10 text-blue-600 mb-2" />
                        <span className="font-bold text-blue-800">Usar Cámara (Escanear)</span>
                        <span className="text-xs text-blue-600">Tomar foto ahora</span>
                    </button>
                    <button 
                        onClick={triggerGallery}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <div className="relative">
                            <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 rounded-full border border-white">
                                +
                            </div>
                        </div>
                        <span className="font-bold text-slate-700">Subir Archivo(s)</span>
                        <span className="text-xs text-slate-500">Soporte Múltiple</span>
                    </button>
                </div>
                <button onClick={() => setShowSourceSelectModal(false)} className="mt-4 w-full py-2 text-slate-500 font-medium hover:text-slate-800">Cancelar</button>
             </div>
        </div>
      )}

      {/* REVIEW & CLASSIFY MODAL */}
      {showReviewModal && pendingDocData && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-xl">
                      <h3 className="font-bold text-lg text-blue-600 flex items-center gap-2">
                          <FileCheck className="w-5 h-5" /> Revisar y Archivar
                      </h3>
                      <button onClick={() => { setShowReviewModal(false); setPendingDocData(null); }} className="hover:bg-slate-100 p-1 rounded-full">
                          <X className="w-5 h-5 text-slate-400" />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      {/* Image Preview */}
                      <div className="flex justify-center bg-slate-100 rounded-lg p-2 border border-slate-200 h-40">
                          <img src={pendingDocData.base64} alt="Preview" className="h-full object-contain" />
                      </div>

                      {/* Category Selector */}
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">
                              Categoría / Apartado
                          </label>
                          <div className="relative">
                            <select 
                                value={reviewCategory}
                                onChange={(e) => setReviewCategory(e.target.value as DocCategory)}
                                className="w-full p-3 pl-10 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium appearance-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-3 text-blue-500 pointer-events-none">
                                {CATEGORY_ICONS[reviewCategory] || <FileText className="w-5 h-5"/>}
                            </div>
                            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none w-5 h-5" />
                          </div>
                      </div>

                      {/* Name Edit */}
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre del Archivo</label>
                          <input 
                              type="text" 
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800 placeholder-slate-400"
                          />
                      </div>

                      {/* Quincena */}
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quincena (Opcional)</label>
                          <select 
                              value={reviewQuincena}
                              onChange={(e) => setReviewQuincena(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                          >
                              <option value="">Seleccionar...</option>
                              {QUINCENAS_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                      </div>

                      {/* Worker & Date Info */}
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Trabajador</label>
                              <input 
                                  type="text" 
                                  value={reviewWorker}
                                  onChange={(e) => setReviewWorker(e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800 placeholder-slate-400"
                                  placeholder="Si aplica..."
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Caducidad</label>
                              <input 
                                  type="date" 
                                  value={reviewExpiry}
                                  onChange={(e) => setReviewExpiry(e.target.value)}
                                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-800"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 flex gap-3 bg-white rounded-b-xl">
                      <button 
                          onClick={() => { setShowReviewModal(false); setPendingDocData(null); }} 
                          className="flex-1 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={saveReviewedDocument}
                          className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                      >
                          <Save className="w-4 h-4" /> Guardar Archivo
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Signature Modal */}
      {showSignatureModal && getSigningDocImage() && (
          <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
                  <div className="p-4 border-b border-purple-100 flex justify-between items-center bg-purple-50 rounded-t-xl sticky top-0 z-10">
                      <h3 className="font-bold text-lg text-purple-700 flex items-center gap-2">
                          <PenTool className="w-5 h-5"/> Firmar Documento
                      </h3>
                      <button onClick={() => setShowSignatureModal(false)}><X className="w-6 h-6 text-slate-400 hover:text-slate-800" /></button>
                  </div>
                  
                  <div className="p-4 flex flex-col gap-4">
                      {/* Document Preview for Placement */}
                      <div className="relative border border-slate-300 rounded bg-slate-100">
                          <img 
                            src={getSigningDocImage()} 
                            alt="Document" 
                            className="w-full h-auto cursor-crosshair"
                            onClick={handleDocumentClick}
                          />
                          {/* Instructions overlay */}
                          {!signaturePos && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-black/60 text-white px-3 py-1 rounded text-sm backdrop-blur-sm shadow-md">
                                      Toca en la hoja donde quieres la firma
                                  </div>
                              </div>
                          )}
                          {/* Marker */}
                          {signaturePos && (
                              <div 
                                style={{ 
                                    left: `${signaturePos.x * 100}%`, 
                                    top: `${signaturePos.y * 100}%` 
                                }}
                                className="absolute w-6 h-6 -ml-3 -mt-6 text-red-600 pointer-events-none"
                              >
                                  <MapPin className="w-full h-full drop-shadow-md" fill="currentColor"/>
                              </div>
                          )}
                      </div>

                      {/* Drawing Canvas */}
                      <div className="flex flex-col items-center">
                        <p className="text-sm text-slate-600 mb-2 font-medium w-full text-left">Dibujar Firma:</p>
                        <div className="border-2 border-slate-300 rounded-lg bg-white touch-none shadow-inner overflow-hidden w-full">
                            <canvas 
                                ref={canvasRef} 
                                width={300} 
                                height={140}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={endDrawing}
                                onMouseLeave={endDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={endDrawing}
                                className="cursor-crosshair bg-white w-full h-full"
                            />
                        </div>
                        
                        {/* Signature Configuration Section */}
                        <div className="w-full mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                             <p className="text-xs font-bold text-slate-500 uppercase mb-2">Configuración de Firma</p>
                             <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="signScope"
                                        checked={signScope === 'current'}
                                        onChange={() => setSignScope('current')}
                                        className="text-purple-600 focus:ring-purple-500 bg-white border-slate-300"
                                    />
                                    Página Actual (Vista Previa)
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="signScope"
                                        checked={signScope === 'all'}
                                        onChange={() => setSignScope('all')}
                                        className="text-purple-600 focus:ring-purple-500 bg-white border-slate-300"
                                    />
                                    Firmar todas las páginas
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer whitespace-nowrap">
                                        <input 
                                            type="radio" 
                                            name="signScope"
                                            checked={signScope === 'custom'}
                                            onChange={() => setSignScope('custom')}
                                            className="text-purple-600 focus:ring-purple-500 bg-white border-slate-300"
                                        />
                                        Páginas específicas:
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: 1, 3, 5-8"
                                        disabled={signScope !== 'custom'}
                                        value={customPageNumbers}
                                        onChange={(e) => setCustomPageNumbers(e.target.value)}
                                        className="w-full text-sm p-1 border border-slate-300 rounded disabled:bg-slate-100 disabled:text-slate-400 bg-white text-slate-800 placeholder-slate-400"
                                    />
                                </div>
                             </div>
                        </div>

                        <div className="flex justify-end w-full mt-2">
                            <button 
                                onClick={() => {
                                    const ctx = canvasRef.current?.getContext('2d');
                                    ctx?.clearRect(0,0, 300, 140);
                                }}
                                className="text-xs text-red-500 hover:underline"
                            >
                                Borrar Trazo
                            </button>
                        </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-xl sticky bottom-0">
                      <button onClick={() => setShowSignatureModal(false)} className="px-4 py-2 text-sm text-slate-500 font-medium hover:bg-slate-100 rounded">Cancelar</button>
                      <button onClick={saveSignature} className="px-4 py-2 text-sm text-white bg-purple-600 rounded font-medium hover:bg-purple-700 shadow-sm">
                          Guardar Firma y Finalizar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-md border border-slate-200 shadow-xl">
                  <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-indigo-50 rounded-t-xl">
                      <h3 className="font-bold text-lg text-indigo-700 flex items-center gap-2">
                          <Mail className="w-5 h-5" /> Enviar por Email
                      </h3>
                      <button onClick={() => setShowEmailModal(false)}><X className="w-5 h-5 text-indigo-400 hover:text-indigo-800" /></button>
                  </div>
                  <div className="p-6">
                      <div className="mb-4">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Para (Email Responsable)</label>
                          <input 
                              type="email" 
                              value={recipientEmail}
                              onChange={(e) => setRecipientEmail(e.target.value)}
                              placeholder="responsable@ejemplo.com"
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-800 placeholder-slate-400"
                          />
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 mb-4">
                          <strong>Importante:</strong> Se abrirá su aplicación de correo predeterminada con el asunto y cuerpo redactados. El archivo se descargará en su dispositivo para que pueda adjuntarlo.
                      </div>

                      <div className="text-sm text-slate-600 mb-2">
                          <strong>Adjunto:</strong> {emailDoc ? emailDoc.name : `Documentación filtrada (${filteredDocuments.length} archivos)`}
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                      <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-sm text-slate-500 font-medium hover:bg-slate-100 rounded">Cancelar</button>
                      <button 
                        onClick={sendEmail} 
                        disabled={!recipientEmail}
                        className="px-4 py-2 text-sm text-white bg-indigo-600 rounded font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Redactar Correo
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};