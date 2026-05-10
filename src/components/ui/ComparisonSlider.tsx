import { useState, useRef, useEffect } from "react";

export function ComparisonSlider({ original, compressed }: { original: File, compressed: File }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [origUrl, setOrigUrl] = useState<string>("");
  const [compUrl, setCompUrl] = useState<string>("");

  useEffect(() => {
    const o = URL.createObjectURL(original);
    const c = URL.createObjectURL(compressed);
    setOrigUrl(o);
    setCompUrl(c);
    return () => {
      URL.revokeObjectURL(o);
      URL.revokeObjectURL(c);
    };
  }, [original, compressed]);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    let clientX = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setPosition(percent);
  };

  return (
    <div 
      className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden cursor-ew-resize bg-slate-900 border border-slate-800"
      ref={containerRef}
      onMouseMove={(e) => {
        if (e.buttons === 1) handleDrag(e);
      }}
      onTouchMove={handleDrag}
      onMouseDown={handleDrag}
    >
      {/* Container for Original (Left) */}
      <div className="absolute inset-0 select-none">
        <img src={origUrl || undefined} alt="Original" className="w-full h-full object-contain object-center" draggable="false" />
      </div>

      {/* Container for Compressed (Right) */}
      <div 
        className="absolute inset-0 select-none"
        style={{ clipPath: `polygon(${position}% 0, 100% 0, 100% 100%, ${position}% 100%)` }}
      >
        <img src={compUrl || undefined} alt="Compressed" className="w-full h-full object-contain object-center" draggable="false" />
      </div>

      {/* Slider */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
          <div className="w-0.5 h-3 bg-slate-400 mx-0.5"></div>
          <div className="w-0.5 h-3 bg-slate-400 mx-0.5"></div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">Original</div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">Processed</div>
    </div>
  );
}
