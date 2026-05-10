import { useState } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { ImagePreviewGrid } from "../ui/ImagePreviewGrid";
import { ComparisonSlider } from "../ui/ComparisonSlider";
import { processImage } from "@/lib/imageProcessor";
import { downloadFile, downloadMultiple } from "@/lib/shared";
import { FileImage, Download, RotateCcw, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { GlassSelect } from "../ui/GlassSelect";

export function OptimizerView() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{original: File, optimized: File}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState(0.7);

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 10)); // Max 10 enforce
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleOptimize = async () => {
    setIsProcessing(true);
    const newResults: {original: File, optimized: File}[] = [];
    
    for (const file of files) {
      try {
        const compressed = await processImage(file, { action: "compress", quality });
        const optimized = await processImage(compressed, { action: "convert", format });
        newResults.push({ original: file, optimized });
      } catch (err) {
        console.error("Failed to optimize", file.name, err);
      }
    }
    
    setResults(newResults);
    setIsProcessing(false);
    setFiles([]); // clear queue
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setQuality(0.7);
    setFormat("image/webp");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Image Optimizer for Web</h2>
          <p className="text-slate-500 text-sm mt-1">Maximum compression and modern formats for the fastest load times.</p>
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
                label="Drag & drop images to optimize" 
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
                    onClick={handleOptimize} 
                    disabled={isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Optimize All"}
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
                    { value: "image/webp", label: "WebP (.webp)" },
                    { value: "image/jpeg", label: "JPEG (.jpg)" }
                  ]}
                />
                <p className="text-xs text-slate-500 mt-2">WebP provides superior lossless and lossy compression.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Optimization Level: {Math.round((1 - quality) * 100)}%
                </label>
                <input 
                  type="range" 
                  min="0.1" max="1" step="0.05" 
                  value={1 - quality} 
                  onChange={(e) => setQuality(1 - parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-200">Results</h3>
            {results.length > 1 && (
              <button 
                onClick={() => downloadMultiple(results.map(r => r.optimized))}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {results.map((res, idx) => {
              const saved = res.original.size - res.optimized.size;
              const ratio = (saved / res.original.size) * 100;
              return (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  {/* Visual Comparison */}
                  <ComparisonSlider original={res.original} compressed={res.optimized} />
                  
                  {/* File Details */}
                  <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 truncate max-w-md">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileImage className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-slate-200 truncate">{res.optimized.name}</p>
                        <p className="text-slate-500 flex gap-2 text-sm">
                          <span className="line-through">{formatBytes(res.original.size)}</span>
                          <span>&rarr;</span>
                          <span className="text-green-400 font-medium">{formatBytes(res.optimized.size)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                        -{ratio.toFixed(1)}%
                      </span>
                      <button 
                        onClick={() => downloadFile(res.optimized)}
                        className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                    </div>
                  </div>
                </div>
            )})}
          </div>
        </div>
      )}
    </div>
  );
}
