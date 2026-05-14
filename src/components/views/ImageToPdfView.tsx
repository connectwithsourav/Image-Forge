import { useState, useRef, useEffect } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { downloadFile } from "@/lib/shared";
import { FileImage, Download, RotateCcw, Loader2, ArrowUp, ArrowDown, X, Trash2, Settings2, Plus, GripVertical } from "lucide-react";
import { PDFDocument } from 'pdf-lib';
import { formatBytes } from "@/lib/utils";

const MAX_FILES = 20;

type MarginType = 'none' | 'small' | 'medium' | 'large';

export function ImageToPdfView() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [margin, setMargin] = useState<MarginType>('none');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropReorder = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setFiles(prev => {
      const newFiles = [...prev];
      const draggedFile = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(dropIndex, 0, draggedFile);
      return newFiles;
    });
    setResultUrl(null);
    setResultBlob(null);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleDrop(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate previews when files change
  useEffect(() => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleDrop = (acceptedFiles: File[]) => {
    // Filter valid images
    const validFiles = acceptedFiles.filter(file => {
      const isImageMime = file.type.startsWith('image/');
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'];
      const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      return isImageMime || hasValidExtension;
    });

    setFiles(prev => {
      const combined = [...prev, ...validFiles];
      if (combined.length > MAX_FILES) {
        alert(`You can only upload up to ${MAX_FILES} images.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    setResultUrl(null);
    setResultBlob(null);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResultUrl(null);
    setResultBlob(null);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
    } else if (direction === 'down' && index < files.length - 1) {
      setFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
        return newFiles;
      });
    }
    setResultUrl(null);
    setResultBlob(null);
  };

  const handleReset = () => {
    setFiles([]);
    setResultUrl(null);
    setResultBlob(null);
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setResultUrl(null);
    setResultBlob(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        // Convert any image to JPEG using Canvas before embedding
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const jpegArrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
               ctx.fillStyle = '#FFFFFF'; // Fill white for transparent images like PNG
               ctx.fillRect(0, 0, canvas.width, canvas.height);
               ctx.drawImage(img, 0, 0);
               canvas.toBlob(async (blob) => {
                 if (blob) {
                   resolve(await blob.arrayBuffer());
                 } else {
                   reject(new Error("Canvas to blob failed"));
                 }
               }, 'image/jpeg', 0.95);
            } else {
               reject(new Error("Canvas missing context"));
            }
          };
          img.onerror = () => reject(new Error("Failed to load image for PDF"));
          img.src = URL.createObjectURL(file);
        });

        const image = await pdfDoc.embedJpg(jpegArrayBuffer);
        const { width, height } = image.scale(1);
        
        let marginFactor = 0;
        if (margin === 'small') marginFactor = Math.min(width, height) * 0.05;
        else if (margin === 'medium') marginFactor = Math.min(width, height) * 0.10;
        else if (margin === 'large') marginFactor = Math.min(width, height) * 0.15;
        
        const page = pdfDoc.addPage([width + marginFactor * 2, height + marginFactor * 2]);
        page.drawImage(image, {
          x: marginFactor,
          y: marginFactor,
          width,
          height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultBlob(blob);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to convert images to PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (resultBlob) {
      const file = new File([resultBlob], "converted-images.pdf", { type: "application/pdf" });
      downloadFile(file);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Image to PDF</h2>
          <p className="text-slate-500 text-sm mt-1">Convert and combine multiple images into a single PDF document.</p>
        </div>
        <button 
          onClick={handleReset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6 lg:order-1">
          <div className={`bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${files.length === 0 ? 'lg:h-[290px]' : ''}`}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            {files.length === 0 ? (
              <DropzoneArea 
                onDrop={handleDrop} 
                label={`Drag & drop images to convert to PDF (Max ${MAX_FILES})`} 
                maxFiles={MAX_FILES} 
                multiple={true}
                className="h-full flex flex-col items-center justify-center"
              />
            ) : (
               <div className="space-y-4">
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="text-sm font-medium text-slate-200 mb-3">Queue ({files.length}/{MAX_FILES})</h3>
                   <button 
                     onClick={() => setFiles([])}
                     className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                   >
                     <Trash2 className="w-3 h-3" /> Clear Queue
                   </button>
                 </div>
                 
                 <div className="space-y-3">
                   {previews.map((preview, index) => (
                      <div 
                        key={`${preview}-${index}`} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropReorder(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                          draggedIndex === index ? 'opacity-50 border-indigo-500 bg-indigo-500/10 scale-[1.02]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col gap-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 transition-colors">
                           <GripVertical className="w-5 h-5" />
                        </div>
                        
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                           <img 
                             src={preview} 
                             alt={`Preview ${index + 1}`} 
                             className="w-full h-full object-cover"
                           />
                        </div>
                        
                        <div className="flex-grow min-w-0">
                           <p className="text-sm font-medium text-slate-200 truncate">{files[index]?.name}</p>
                           <p className="text-xs text-slate-500">
                             {files[index] ? formatBytes(files[index].size) : '0 B'}
                           </p>
                           <div className="text-xs text-slate-500 mt-1">Page {index + 1}</div>
                        </div>
                        
                        <button 
                          onClick={() => removeFile(index)}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                   ))}

                   {files.length < MAX_FILES && (
                     <button
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full flex items-center justify-center gap-2 bg-slate-900/30 p-4 rounded-xl border-2 border-dashed border-slate-700 hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all text-slate-400 hover:text-indigo-400"
                     >
                       <Plus className="w-5 h-5" />
                       <span className="text-sm font-medium">Add {MAX_FILES - files.length} more {MAX_FILES - files.length === 1 ? 'image' : 'images'}</span>
                     </button>
                   )}
                 </div>
                 
                 <div className="mt-6 flex justify-end">
                   <button 
                     onClick={handleProcess} 
                     disabled={isProcessing || files.length === 0}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors w-full sm:w-auto justify-center"
                   >
                     {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileImage className="w-5 h-5" /> Convert to PDF</>}
                   </button>
                 </div>
               </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6 lg:order-2">
          <div className={`bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col ${files.length === 0 ? 'lg:h-[290px]' : ''}`}>
            <div className="flex items-center gap-2 mb-4 text-slate-200 font-medium shrink-0">
              <Settings2 className="w-5 h-5 text-indigo-400" />
              <h3>PDF Settings</h3>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-sm text-slate-400 mb-3 shrink-0">Page Margin</label>
              <div className="grid grid-cols-2 gap-3 flex-1 min-h-[160px]">
                {(['none', 'small', 'medium', 'large'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMargin(m)}
                    className={`h-full flex items-center justify-center rounded-xl text-sm font-medium capitalize transition-all border ${
                      margin === m 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {resultUrl && (
            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <h3 className="text-lg font-bold text-slate-200 mb-4">Result</h3>
              <div className="flex flex-col gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <Download className="w-6 h-6 text-green-400" />
                  </div>
                  <h4 className="text-green-400 font-medium tracking-wide">Conversion Complete</h4>
                  <p className="text-xs text-slate-400">Your PDF with {files.length} pages is ready.</p>
                </div>
                
                <button 
                  onClick={handleDownload}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg font-medium flex justify-center items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" /> Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
