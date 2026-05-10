import { useState, useRef, useEffect } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { downloadFile } from "@/lib/shared";
import { Download, RotateCcw, Image as ImageIcon, Circle, Square, MonitorPlay } from "lucide-react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

export function ProfileView() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [result, setResult] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [shape, setShape] = useState<"square" | "circle">("circle");
  const [size, setSize] = useState<number>(400);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setFileUrl("");
    }
  }, [file]);

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
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setShape("circle");
  };

  const handleCreate = async () => {
    if (!file || !canvasRef.current || !croppedAreaPixels) return;
    
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

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        size,
        size
      );
      
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], `profile_${shape}_${file.name.replace(/\.[^/.]+$/, "")}.png`, { type: "image/png" });
          setResult(newFile);
        }
      }, "image/png");
    };
    img.src = fileUrl;
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
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col h-full min-h-[500px]">
            {!file ? (
              <div className="flex-1 flex flex-col justify-center">
                <DropzoneArea 
                  onDrop={handleDrop} 
                  label="Drop your photo" 
                  multiple={false} 
                />
              </div>
            ) : (
              <div className="space-y-4 flex flex-col h-full flex-1">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold mb-2">
                  <MonitorPlay className="w-5 h-5" />
                  <span>Live Preview</span>
                </div>
                
                <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-black/40 min-h-[400px] border border-white/10">
                  <Cropper
                    image={fileUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape={shape === "circle" ? "round" : "rect"}
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                  />
                </div>

                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden max-w-full">
                    <ImageIcon className="w-5 h-5 flex-shrink-0 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-200 truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => setFile(null)}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Change Photo
                    </button>
                    <button 
                      onClick={handleCreate} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Create Profile Pic
                    </button>
                  </div>
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
