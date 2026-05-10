import { useState } from "react";
import { DropzoneArea } from "../DropzoneArea";
import { ImagePreviewGrid } from "../ui/ImagePreviewGrid";
import { ComparisonSlider } from "../ui/ComparisonSlider";
import { processImage } from "@/lib/imageProcessor";
import { downloadFile, downloadMultiple } from "@/lib/shared";
import { FileImage, Download, RotateCcw, Loader2, Maximize, Settings, Lock, Unlock } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { GlassSelect } from "../ui/GlassSelect";

export function ResizeView() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{original: File, resized: File}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [width, setWidth] = useState<string>("800");
  const [height, setHeight] = useState<string>("");
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [resizeMode, setResizeMode] = useState<'pixels' | 'percentage'>('pixels');
  const [percentage, setPercentage] = useState<string>("50");
  const [format, setFormat] = useState<string>("image/jpeg");

  const handleDrop = (acceptedFiles: File[]) => setFiles(prev => [...prev, ...acceptedFiles]);

  const handleRemoveFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleResize = async () => {
    setIsProcessing(true);
    const newResults: {original: File, resized: File}[] = [];
    
    for (const file of files) {
      try {
        let w = resizeMode === 'pixels' && width ? parseInt(width) : undefined;
        let h = resizeMode === 'pixels' && height && !lockRatio ? parseInt(height) : undefined;
        
        if (resizeMode === 'percentage' && percentage) {
          const perc = parseInt(percentage) / 100;
          const bmp = await createImageBitmap(file);
          w = Math.max(1, Math.round(bmp.width * perc));
          h = Math.max(1, Math.round(bmp.height * perc));
        }

        const resized = await processImage(file, { action: "resize", width: w, height: h, format });
        newResults.push({ original: file, resized });
      } catch (err) {
        console.error("Failed to resize", file.name, err);
      }
    }
    
    setResults(newResults);
    setIsProcessing(false);
    setFiles([]); // clear queue
  };

  const handleReset = () => {
    setFiles([]);
    setResults([]);
    setWidth("800");
    setHeight("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Image Resizer</h2>
          <p className="text-slate-500 text-sm mt-1">Resize dimensions of your images quickly.</p>
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
              <DropzoneArea onDrop={handleDrop} label="Drag & drop images to resize" />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-slate-200 mb-3">Queue ({files.length})</h3>
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
                    onClick={handleResize} 
                    disabled={isProcessing || (!width && !height)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resize All"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:order-2">
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" /> Resize Settings
            </h3>
            
            <div className="space-y-6">
              
              {/* Type Toggle */}
              <div className="flex bg-black/20 border border-white/10 rounded-lg p-1">
                <button 
                  onClick={() => setResizeMode('pixels')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${resizeMode === 'pixels' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  By Pixels
                </button>
                <button 
                  onClick={() => setResizeMode('percentage')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${resizeMode === 'percentage' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                >
                  By Percentage
                </button>
              </div>

              {resizeMode === 'pixels' ? (
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Width (px)</label>
                    <input 
                      type="number" 
                      placeholder="Auto" 
                      value={width} 
                      onChange={(e) => {
                        setWidth(e.target.value);
                        if (lockRatio) setHeight(e.target.value);
                      }}
                      className="w-full bg-black/20 border border-white/10 text-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="pb-[3px]">
                    <button 
                      onClick={() => {
                        setLockRatio(!lockRatio);
                        if (!lockRatio) setHeight(width); // Sync height when locking
                      }}
                      className={`p-2 rounded-lg transition-colors border ${lockRatio ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-black/10 text-slate-400 border-white/5 hover:bg-white/5'}`}
                    >
                      {lockRatio ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Height (px)</label>
                    <input 
                      type="number"
                      placeholder={lockRatio ? "Auto" : "Auto"} 
                      value={height} 
                      onChange={(e) => {
                        setHeight(e.target.value);
                        if (lockRatio) setWidth(e.target.value);
                      }}
                      disabled={lockRatio}
                      className="w-full bg-black/20 border border-white/10 text-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-black/20 border border-white/10 rounded-lg p-3">
                    <span className="text-slate-200 text-lg font-medium">{percentage}%</span>
                    <span className="text-slate-500 text-sm">of original size</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    step="10" 
                    value={percentage} 
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>10%</span>
                    <span>100%</span>
                    <span>200%</span>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/10">
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Output Format</label>
                <GlassSelect 
                  value={format} 
                  onChange={setFormat}
                  options={[
                    { value: "image/jpeg", label: "JPEG / JPG" },
                    { value: "image/png", label: "PNG" },
                    { value: "image/webp", label: "WebP" }
                  ]}
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
                onClick={() => downloadMultiple(results.map(r => r.resized))}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {results.map((res, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <ComparisonSlider original={res.original} compressed={res.resized} />
                
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Maximize className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{res.resized.name}</p>
                      <p className="text-slate-500">{formatBytes(res.resized.size)} • {res.resized.type}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => downloadFile(res.resized)}
                    className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
