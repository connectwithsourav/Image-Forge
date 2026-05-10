import { useState } from "react";
import { Sidebar, ViewType } from "./components/Sidebar";
import { CompressView } from "./components/views/CompressView";
import { ConvertView } from "./components/views/ConvertView";
import { ResizeView } from "./components/views/ResizeView";
import { OptimizerView } from "./components/views/OptimizerView";
import { ProfileView } from "./components/views/ProfileView";
import { MetadataView } from "./components/views/MetadataView";
import { Base64View } from "./components/views/Base64View";

export default function App() {
  const [view, setView] = useState<ViewType>("compress");

  const renderView = () => {
    switch (view) {
      case "compress": return <CompressView />;
      case "convert": return <ConvertView />;
      case "resize": return <ResizeView />;
      case "optimizer": return <OptimizerView />;
      case "profile": return <ProfileView />;
      case "metadata": return <MetadataView />;
      case "base64": return <Base64View />;
      default: return <CompressView />;
    }
  };

  return (
    <div 
      className="flex h-screen text-slate-200 font-sans overflow-hidden relative selection:bg-indigo-500/30 bg-[#0b1326]"
    >
      {/* SVG Filter for Liquid Gooey Effect */}
      <svg className="hidden" aria-hidden="true">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="goo" />
        </filter>
      </svg>

      {/* Liquid background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ filter: "url(#goo)" }}>
        <div className="absolute top-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-fuchsia-600/40 opacity-70 animate-blob"></div>
        <div className="absolute bottom-[10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/40 opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[30%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-indigo-600/40 opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <Sidebar currentView={view} onChangeView={setView} />
      
      {/* Glass pane to separate background from content */}
      <main className="flex-1 overflow-y-auto h-full p-6 pt-32 lg:px-8 lg:pb-8 lg:pt-[56px] relative z-10 w-full bg-white/[0.01] backdrop-blur-[60px]">
        <div className="max-w-5xl mx-auto w-full relative z-10">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
