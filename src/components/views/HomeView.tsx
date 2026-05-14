import { NAV_ITEMS, ViewType } from "../Sidebar";

interface HomeViewProps {
  onChangeView: (view: ViewType) => void;
}

export function HomeView({ onChangeView }: HomeViewProps) {
  // Exclude "home" from the grid items
  const tools = NAV_ITEMS.filter(item => item.id !== 'home');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center justify-center mb-6">
          <img 
            src="https://ik.imagekit.io/sourav7img/Image%20Forge.png" 
            alt="Image Forge Logo" 
            className="h-20 w-auto drop-shadow-xl" 
          />
        </div>
        <p className="text-lg text-slate-400">
          A powerful, offline-first image processing suite. Compress, convert, resize, and optimize your images securely in your browser without any server uploads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onChangeView(tool.id as ViewType)}
              className="flex flex-col text-left items-start p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300 group shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.1)]"
            >
              <div className="p-3 rounded-xl bg-slate-800/50 text-indigo-400 mb-4 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-indigo-300 transition-colors">{tool.label}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{tool.description}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-16 text-center">
        <p className="text-sm text-slate-500 mb-8">
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
    </div>
  );
}
