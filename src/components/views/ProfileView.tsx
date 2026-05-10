import { useState, useRef, useEffect } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { downloadFile } from "@/lib/shared";
import { Download, RotateCcw, Image as ImageIcon, Circle, Square } from "lucide-react";

export function ProfileView() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [shape, setShape] = useState<"square" | "circle">("circle");
  const [size, setSize] = useState<number>(400);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (result) {
      const url = URL.createObjectURL(result);
      setResultUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setResultUrl("");
    }
  }, [result]);

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]); // Only one file for profile
      setResult(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setShape("circle");
  };

  const handleCreate = async () => {
    if (!file || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      
      ctx.clearRect(0, 0, size, size);
      
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // center crop
      const minDimension = Math.min(img.width, img.height);
      const sx = (img.width - minDimension) / 2;
      const sy = (img.height - minDimension) / 2;
      
      ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], `profile_${shape}_${file.name.replace(/\.[^/.]+$/, "")}.png`, { type: "image/png" });
          setResult(newFile);
        }
      }, "image/png");
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Profile Image Creator</h2>
          <p className="text-slate-500 text-sm mt-1">Easily create perfect circular or square profile pictures.</p>
        </div>
        <button 
          onClick={handleReset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6 lg:order-1">
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {!file ? (
              <DropzoneArea 
                onDrop={handleDrop} 
                label="Drop your photo" 
                multiple={false} 
              />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-200">{file.name}</span>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Change Photo
                  </button>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleCreate} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    Create Profile Pic
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:order-2">
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Shape</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShape("circle")}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-2 rounded-lg border transition-colors ${shape === "circle" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-black/20 border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    <Circle className="w-6 h-6" />
                    <span className="text-xs font-medium">Circle</span>
                  </button>
                  <button 
                    onClick={() => setShape("square")}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-2 rounded-lg border transition-colors ${shape === "square" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-black/20 border-white/10 text-slate-400 hover:border-white/20"}`}
                  >
                    <Square className="w-6 h-6" />
                    <span className="text-xs font-medium">Square</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Resolution: {size}x{size}</label>
                <input 
                  type="range" 
                  min="100" max="1000" step="50" 
                  value={size} 
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full accent-indigo-500 mt-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>

      {result && (
        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col items-center space-y-6">
          <h3 className="text-lg font-bold text-slate-200 self-start">Result</h3>
          <div className="relative border border-slate-800 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMWUxZTIyIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMyYjJkMzMiPjwvcmVjdD4KPHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iIzJiMmQzMyI+PC9yZWN0Pgo8L3N2Zz4=')] rounded-xl overflow-hidden p-8">
             <img src={resultUrl || undefined} alt="Profile Preview" className="max-w-[200px] max-h-[200px]" />
          </div>
          <button 
            onClick={() => downloadFile(result)}
            className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" /> Download Image
          </button>
        </div>
      )}
    </div>
  );
}
