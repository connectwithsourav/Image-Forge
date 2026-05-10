import { useState } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { ImagePreviewGrid } from "../ui/ImagePreviewGrid";
import { processImage } from "@/lib/imageProcessor";
import { downloadFile, downloadMultiple } from "@/lib/shared";
import { FileImage, Download, RotateCcw, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { GlassSelect } from "../ui/GlassSelect";

export function ConvertView() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState(0.85);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [lockRatio, setLockRatio] = useState<boolean>(true);

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 10));
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleConvert = async () => {
    setIsProcessing(true);
    const newResults: File[] = [];
    const w = width ? parseInt(width) : undefined;
    const h = height && !lockRatio ? parseInt(height) : undefined;
    
    for (const file of files) {
      try {
        const result = await processImage(file, { action: "convert", format, quality, width: w, height: h });
        newResults.push(result);
      } catch (err) {
        console.error("Failed to convert", file.name, err);
      }
    }
    
    setResults(newResults);
    setIsProcessing(false);
    setFiles([]); // clear queue
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setFormat("image/webp");
    setQuality(0.85);
    setWidth("");
    setHeight("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Image Converter</h2>
          <p className="text-slate-500 text-sm mt-1">Convert batch images between JPG, PNG, WebP.</p>
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
            {files.length === 0 ? (
              <DropzoneArea 
                onDrop={handleDrop} 
                label="Drag & drop images to convert" 
                maxFiles={10} 
                maxSize={7 * 1024 * 1024} 
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-200 mb-3">Queue ({files.length}/10)</h3>
                  <button 
                    onClick={() => setFiles([])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear Queue
                  </button>
                </div>
                <ImagePreviewGrid files={files} onRemove={handleRemoveFile} isProcessing={isProcessing} />
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleConvert} 
                    disabled={isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Convert All"}
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
                <label className="block text-sm font-medium text-slate-400 mb-2">Target Format</label>
                <GlassSelect 
                  value={format} 
                  onChange={setFormat}
                  options={[
                    { value: "image/jpeg", label: "JPEG (.jpg)" },
                    { value: "image/png", label: "PNG (.png)" },
                    { value: "image/webp", label: "WebP (.webp)" }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Compression Quality: {Math.round(quality * 100)}%
                </label>
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.05" 
                  value={quality} 
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 mt-2"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-400">Dimensions (px, Optional)</label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={lockRatio} onChange={e => {
                      setLockRatio(e.target.checked);
                      if (e.target.checked) setHeight(""); // Clear height when locking
                    }} className="accent-indigo-500 rounded" />
                    <span className="text-xs text-slate-400">Lock Ratio</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder={lockRatio ? "Width" : "Width (Auto)"} 
                    value={width} 
                    onChange={(e) => {
                      setWidth(e.target.value);
                    }}
                    className="w-full border border-white/10 bg-black/20 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200"
                  />
                  <span className="text-slate-500">×</span>
                  <input 
                    type="number" 
                    placeholder={lockRatio ? "Auto" : "Height (Auto)"} 
                    value={height} 
                    onChange={(e) => {
                      setHeight(e.target.value);
                    }}
                    disabled={lockRatio}
                    className="w-full border border-white/10 bg-black/20 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {lockRatio && <p className="text-xs text-slate-500 mt-2">Height is determined automatically to preserve ratio.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-200">Results</h3>
            {results.length > 1 && (
              <button 
                onClick={() => downloadMultiple(results)}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download All
              </button>
            )}
          </div>
          
          <ul className="divide-y divide-slate-800/50">
            {results.map((res, idx) => (
              <li key={idx} className="flex justify-between items-center py-4 gap-4 text-sm">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileImage className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">{res.name}</p>
                    <p className="text-slate-500">{formatBytes(res.size)} • {res.type}</p>
                  </div>
                </div>
                <button 
                  onClick={() => downloadFile(res)}
                  className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                  title="Download"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
