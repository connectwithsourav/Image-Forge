import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function GlassSelect({ value, onChange, options, className }: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 flex justify-between items-center transition-all hover:bg-black/60 shadow-sm"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Solid Dropdown Options */}
      <div
        className={`absolute left-0 right-0 z-[100] mt-2 origin-top rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <ul className="max-h-60 overflow-auto flex flex-col p-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2.5 text-sm rounded-xl cursor-pointer transition-all duration-200 ${
                value === option.value
                  ? "bg-indigo-500/20 text-indigo-300 font-medium"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
