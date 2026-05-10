import { useState } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { ImagePreviewGrid } from "../ui/ImagePreviewGrid";
import { ComparisonSlider } from "../ui/ComparisonSlider";
import { processImage } from "@/lib/imageProcessor";
import { downloadFile, downloadMultiple } from "@/lib/shared";
import { FileImage, Download, RotateCcw, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { GlassSelect } from "../ui/GlassSelect";

export function CompressView() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{original: File, compressed: File}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState("image/jpeg");
  const [targetSize, setTargetSize] = useState<string>("");

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, 10)); // Max 10 enforce
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleCompress = async () => {
    setIsProcessing(true);
    const newResults: {original: File, compressed: File}[] = [];
    const maxSizeKB = targetSize ? parseInt(targetSize) : undefined;
    
    for (const file of files) {
      try {
        const compressed = await processImage(file, { action: "compress", quality, format, maxSizeKB });
        newResults.push({ original: file, compressed });
      } catch (err) {
        console.error("Failed to compress", file.name, err);
      }
    }
    
    setResults(newResults);
    setIsProcessing(false);
    setFiles([]); // clear queue
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setQuality(0.8);
    setFormat("image/jpeg");
    setTargetSize("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Image Compressor</h2>
          <p className="text-slate-500 text-sm mt-1">Compress images to reduce file size without losing quality.</p>
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
                label="Drag & drop images to compress" 
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
                    onClick={handleCompress} 
                    disabled={isProcessing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Compress All"}
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
                <label className="block text-sm font-medium text-slate-400 mb-2">Output Format</label>
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
                <label className="block text-sm font-medium text-slate-400 mb-2">Target File Size (Optional)</label>
                <GlassSelect 
                  value={targetSize} 
                  onChange={setTargetSize}
                  options={[
                    { value: "", label: "No Target (Use Quality slider)" },
                    { value: "10", label: "Under 10KB" },
                    { value: "20", label: "Under 20KB" },
                    { value: "30", label: "Under 30KB" },
                    { value: "50", label: "Under 50KB" },
                    { value: "80", label: "Under 80KB" },
                    { value: "100", label: "Under 100KB" },
                    { value: "150", label: "Under 150KB" },
                    { value: "200", label: "Under 200KB" },
                    { value: "250", label: "Under 250KB" },
                    { value: "300", label: "Under 300KB" }
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
                  disabled={!!targetSize}
                  className={`w-full accent-indigo-500 mt-2 ${targetSize ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                onClick={() => downloadMultiple(results.map(r => r.compressed))}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {results.map((res, idx) => {
              const saved = res.original.size - res.compressed.size;
              const ratio = (saved / res.original.size) * 100;
              return (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  {/* Visual Comparison */}
                  <ComparisonSlider original={res.original} compressed={res.compressed} />
                  
                  {/* File Details */}
                  <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 truncate max-w-md">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileImage className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="truncate">
                        <p className="font-medium text-slate-200 truncate">{res.compressed.name}</p>
                        <p className="text-slate-500 flex gap-2 text-sm">
                          <span className="line-through">{formatBytes(res.original.size)}</span>
                          <span>&rarr;</span>
                          <span className="text-green-400 font-medium">{formatBytes(res.compressed.size)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                        -{ratio.toFixed(1)}%
                      </span>
                      <button 
                        onClick={() => downloadFile(res.compressed)}
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
