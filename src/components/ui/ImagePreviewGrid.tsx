import { FileImage, Trash2, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ImagePreviewGrid({ files, onRemove, isProcessing = false }: { files: File[], onRemove: (index: number) => void, isProcessing?: boolean }) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Free memory
    previews.forEach(p => URL.revokeObjectURL(p));
    
    // Create new previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach(p => URL.revokeObjectURL(p));
    };
  }, [files]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {files.map((file, idx) => (
        <div key={`${file.name}-${idx}`} className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-square">
          <img src={previews[idx] || undefined} alt={file.name} className="w-full h-full object-cover" />
          
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mb-2" />
              <p className="text-[10px] text-white font-medium uppercase tracking-wider">Processing</p>
            </div>
          )}

          {!isProcessing && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
              <p className="text-white text-xs font-medium truncate">{file.name}</p>
              <p className="text-slate-300 text-[10px]">{formatBytes(file.size)}</p>
            </div>
          )}
          
          {!isProcessing && (
            <button 
              onClick={() => onRemove(idx)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
