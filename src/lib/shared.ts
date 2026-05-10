import { ProcessOptions } from "@/lib/imageProcessor";

export interface ProcessorState {
  files: File[];
  isProcessing: boolean;
  progress: number;
  results: File[];
  error?: string;
}

export const downloadFile = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadMultiple = async (files: File[]) => {
  files.forEach((file, i) => {
    // Add small delay to avoid browser blocking multiple downloads
    setTimeout(() => downloadFile(file), i * 300);
  });
};
