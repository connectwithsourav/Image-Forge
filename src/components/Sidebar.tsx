import { 
  Minimize, 
  RefreshCcw, 
  Maximize, 
  Droplet, 
  Code, 
  Info,
  Menu,
  X,
  Home,
  FileImage
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type ViewType = 'home' | 'compress' | 'convert' | 'resize' | 'optimizer' | 'metadata' | 'base64' | 'profile' | 'topdf';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, description: 'Overview of all tools' },
  { id: 'compress', label: 'Image Compressor', icon: Minimize, description: 'Reduce file size without losing quality' },
  { id: 'resize', label: 'Image Resizer', icon: Maximize, description: 'Scale images to strict dimensions' },
  { id: 'convert', label: 'Image Converter', icon: RefreshCcw, description: 'Convert between PNG, JPG, WEBP, etc.' },
  { id: 'topdf', label: 'Image to PDF', icon: FileImage, description: 'Combine images into a PDF document' },
  { id: 'optimizer', label: 'Image Optimizer for Web', icon: Droplet, description: 'Perfect formats & sizes for web' },
  { id: 'profile', label: 'Profile Image Creator', icon: RefreshCcw, description: 'Crop and create perfect avatars' },
  { id: 'metadata', label: 'EXIF Metadata', icon: Info, description: 'View and strip image metadata' },
  { id: 'base64', label: 'Base64 Codec', icon: Code, description: 'Encode/decode to Base64 strings' },
] as const;

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navContent = (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = currentView === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => {
              onChangeView(item.id as ViewType);
              setIsOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent",
              active 
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            )}
          >
            <Icon className={cn("w-5 h-5", active ? "text-indigo-400" : "text-slate-500")} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Toggle Button (Always on top) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[100] w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white transition-colors focus:outline-none rounded-lg bg-black/20 backdrop-blur-md border border-white/10 shadow-sm"
      >
        <div className="flex flex-col items-center justify-center w-5 h-5 gap-[5px] cursor-pointer">
          <span className={`block h-[2px] w-5 bg-current transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
          <span className={`block h-[2px] w-5 bg-current transition-all duration-300 ease-in-out ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
          <span className={`block h-[2px] w-5 bg-current transform transition-all duration-300 ease-in-out ${isOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
        </div>
      </button>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-center h-[72px] border-b border-white/10 bg-[#0b1326] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-center">
          <img 
            src="https://ik.imagekit.io/sourav7img/Image%20Forge.png" 
            alt="Image Forge Logo" 
            className="h-12 w-auto drop-shadow-md" 
          />
        </div>
      </div>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[80] w-72 bg-[#0b1326] lg:bg-white/[0.02] lg:backdrop-blur-3xl border-r border-white/10 px-4 py-6 transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.3)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button 
          onClick={() => {
            onChangeView("home");
            setIsOpen(false);
          }}
          className="flex items-center px-4 mb-8 mt-16 lg:mt-8 text-left hover:opacity-80 transition-opacity"
        >
          <img 
            src="https://ik.imagekit.io/sourav7img/Image%20Forge.png" 
            alt="Image Forge Logo" 
            className="h-14 w-auto drop-shadow-md" 
          />
        </button>
        
        <div className="flex-grow">
          {navContent}
        </div>

        <div className="mt-auto px-4 pb-4 lg:pb-0">
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs">
            <p className="font-bold mb-1 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Offline Ready!
            </p>
            <p className="opacity-80 text-[#6f7e91]">This app uses Service Workers and can be installed as a PWA.</p>
          </div>
          
          <p className="text-[11px] text-slate-500 text-center mt-6 mb-2">
            Design and Developed by{" "}
            <a 
              href="https://connectwithsourav.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 hover:underline font-medium transition-colors"
            >
              Sourav Dutta
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
