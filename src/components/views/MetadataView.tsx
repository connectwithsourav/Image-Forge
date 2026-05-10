import { useState } from "react";
import piexif from "piexifjs";
import { DropzoneArea } from "../DropzoneArea";
import { downloadFile } from "@/lib/shared";
import { Download, AlertCircle, Info, ShieldCheck, RotateCcw, Image as ImageIcon } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { fileToBase64, base64ToFile } from "@/lib/imageProcessor";

export function MetadataView() {
  const [file, setFile] = useState<File | null>(null);
  const [exifData, setExifData] = useState<any>(null);
  const [cleanedFile, setCleanedFile] = useState<File | null>(null);

  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const f = acceptedFiles[0];
    setFile(f);
    setCleanedFile(null);
    setExifData(null);

    // Only JPEG supports piexifjs easily
    if (f.type === "image/jpeg" || f.name.toLowerCase().endsWith(".jpg")) {
      try {
        const b64 = await fileToBase64(f);
        const exifObj = piexif.load(b64);
        // Simple heuristic to check if it actually has data
        const hasData = Object.keys(exifObj).some(group => 
          group !== 'thumbnail' && Object.keys(exifObj[group as keyof piexif.IExifElement] || {}).length > 0
        );
        setExifData(hasData ? exifObj : "empty");
      } catch (err) {
        console.error("Failed to parse EXIF", err);
        setExifData("error");
      }
    } else {
      setExifData("unsupported");
    }
  };

  const handleStripMetadata = async () => {
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      const cleanB64 = piexif.remove(b64);
      const newFile = base64ToFile(cleanB64, `cleaned_${file.name}`);
      setCleanedFile(newFile);
    } catch (e) {
      console.error(e);
      alert("Failed to remove EXIF data.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setExifData(null);
    setCleanedFile(null);
  };

  const renderStatusBox = () => {
    if (!file) return null;
    if (exifData === "unsupported") return (
      <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-4 rounded-xl flex gap-3 text-sm mt-4">
         <AlertCircle className="w-5 h-5 flex-shrink-0" />
         <div>
           <h4 className="font-bold">Format Not Supported</h4>
           <p className="mt-1 opacity-90">Metadata stripping is currently only supported for JPEG/JPG images.</p>
         </div>
      </div>
    );
    if (exifData === "empty" || exifData === "error") return (
      <div className="bg-slate-800/50 border border-slate-700 text-slate-300 p-4 rounded-xl flex gap-3 text-sm mt-4">
         <Info className="w-5 h-5 flex-shrink-0 text-slate-500" />
         <div>
           <h4 className="font-bold">No EXIF Data Found</h4>
           <p className="mt-1 opacity-90">This image doesn't seem to have any readable EXIF metadata.</p>
         </div>
      </div>
    );
    
    return (
      <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-4 rounded-xl flex justify-between items-center text-sm mt-4">
         <div className="flex gap-3">
           <AlertCircle className="w-5 h-5 flex-shrink-0 text-indigo-400" />
           <div>
             <h4 className="font-bold">EXIF Data Found!</h4>
             <p className="mt-1 opacity-90">This image contains metadata (camera info, dates, possibly GPS location).</p>
           </div>
         </div>
         {(!cleanedFile && exifData !== "empty" && exifData !== "error" && exifData !== "unsupported") && (
           <p className="text-indigo-400 text-xs">Ready to strip in settings panel.</p>
         )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">EXIF Metadata</h2>
          <p className="text-slate-500 text-sm mt-1">Read and remove EXIF data from JPEG images for privacy.</p>
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
              <DropzoneArea onDrop={handleDrop} label="Drop a JPEG image to check metadata" multiple={false} />
            ) : (
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
            )}
            
            {renderStatusBox()}
            
            {cleanedFile && (
              <div className="mt-6 bg-green-500/10 border border-green-500/20 p-5 rounded-xl flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                  <div>
                    <h4 className="font-bold text-green-300">Success! Metadata Stripped.</h4>
                    <p className="text-green-400 mt-1 opacity-90">Your privacy is protected. The EXIF data has been completely erased.</p>
                  </div>
                </div>
                <button 
                  onClick={() => downloadFile(cleanedFile)}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex gap-2 items-center"
                >
                  <Download className="w-4 h-4" /> Download Clean
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:order-2">
          <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Settings</h3>
            <div className="space-y-6">
              <p className="text-sm text-slate-400">
                EXIF Metadata includes camera models, location (GPS), timestamp, and capture parameters.
              </p>
              
              <button 
                onClick={handleStripMetadata}
                disabled={!file || !!cleanedFile || typeof exifData === "string"}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Strip All Metadata
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
