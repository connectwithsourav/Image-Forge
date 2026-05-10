import { useState } from "react";
import { fileToBase64, base64ToFile } from "@/lib/imageProcessor";
import { Copy, Download, Image as ImageIcon, Check, RotateCcw } from "lucide-react";
import { DropzoneArea } from "../DropzoneArea";

export function Base64View() {
  const [b64Result, setB64Result] = useState<string>("");
  const [fileToEncode, setFileToEncode] = useState<File | null>(null);
  const [decodedFile, setDecodedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputb64, setInputB64] = useState("");
  
  const handleEncodeDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      try {
        setFileToEncode(acceptedFiles[0]);
        const b64 = await fileToBase64(acceptedFiles[0]);
        setB64Result(b64);
        setCopied(false);
      } catch (err) {
        console.error("Failed to encode", err);
      }
    }
  };

  const handleDecode = () => {
    try {
      if (!inputb64) return;
      const file = base64ToFile(inputb64, "decoded_image.png");
      setDecodedFile(file);
    } catch (err) {
      alert("Invalid Base64 format.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(b64Result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadDecoded = () => {
    if (!decodedFile) return;
    const url = URL.createObjectURL(decodedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = decodedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setB64Result("");
    setFileToEncode(null);
    setDecodedFile(null);
    setInputB64("");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-start pb-6 border-b border-white/10 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Base64 Codec</h2>
          <p className="text-slate-500 text-sm mt-1">Encode images to Base64 strings or decode strings back to images.</p>
        </div>
        <button 
          onClick={handleReset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encode */}
        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Encode (Image &rarr; Base64)</h3>
          {!fileToEncode ? (
            <DropzoneArea onDrop={handleEncodeDrop} label="Drop Single Image" />
          ) : (
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-indigo-400" />
                <span className="text-sm font-medium text-slate-200 truncate max-w-[150px]">{fileToEncode.name}</span>
              </div>
              <button 
                onClick={() => { setFileToEncode(null); setB64Result(""); }}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Change Photo
              </button>
            </div>
          )}
          
          {b64Result && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">Base64 String</label>
              <div className="relative">
                <textarea 
                  readOnly 
                  value={b64Result} 
                  rows={5}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-slate-200 font-mono outline-none resize-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={handleCopy}
                  className="absolute bottom-3 right-3 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg shadow-sm flex items-center gap-2 text-xs font-medium"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Decode */}
        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-2xl border border-white/10 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Decode (Base64 &rarr; Image)</h3>
          <textarea 
            placeholder="Paste Base64 string here (e.g., data:image/png;base64,iVBORw0KGgo...)" 
            value={inputb64}
            onChange={e => setInputB64(e.target.value)}
            rows={5}
            className="w-full bg-black/20 text-slate-200 border border-white/10 rounded-lg p-3 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500 mb-4 flex-grow"
          />
          <button 
            onClick={handleDecode}
            disabled={!inputb64}
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium w-full disabled:opacity-50 transition-colors"
          >
            Decode to Image
          </button>

          {decodedFile && (
            <div className="mt-6 p-4 border border-slate-800 rounded-xl bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-indigo-400" />
                <span className="text-sm font-medium text-slate-200">{decodedFile.name}</span>
              </div>
              <button 
                onClick={downloadDecoded}
                className="bg-[#141416] border border-slate-800 hover:bg-slate-800 text-slate-200 p-2 rounded-lg"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
