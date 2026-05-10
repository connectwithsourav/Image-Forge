import { ReactNode } from "react";
import { useDropzone, DropzoneOptions } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneAreaProps extends DropzoneOptions {
  children?: ReactNode;
  className?: string;
  label?: string;
}

export function DropzoneArea({ children, className, label = "Drag & drop images here, or click to select", maxFiles, maxSize, ...dropzoneOptions }: DropzoneAreaProps & { maxFiles?: number; maxSize?: number }) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.heic']
    },
    maxFiles,
    maxSize,
    ...dropzoneOptions
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[200px] w-full",
          isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 hover:border-white/20 bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-xl",
          className
        )}
      >
        <input {...getInputProps()} />
        {children || (
          <div className="flex flex-col items-center text-slate-500 text-center">
            <UploadCloud className="w-10 h-10 mb-4 text-indigo-400" />
            <span className="text-sm font-bold tracking-wider text-slate-300">{label}</span>
            <p className="text-xs mt-2 text-slate-500 font-medium">Supports JPG, PNG, WebP, HEIC, GIF</p>
            {(maxFiles || maxSize) && (
              <p className="text-[10px] mt-1 text-slate-600 uppercase font-bold">
                {maxFiles && `Max ${maxFiles} files`} {maxFiles && maxSize && '•'} {maxSize && `Up to ${(maxSize / 1024 / 1024).toFixed(0)}MB per file`}
              </p>
            )}
          </div>
        )}
      </div>
      {fileRejections.length > 0 && (
        <div className="text-red-400 text-xs mt-1 bg-red-500/10 border border-red-500/20 p-2 rounded max-w-full truncate">
          {fileRejections.map(({ file, errors }) => (
            <p key={file.name}>{file.name}: {errors[0].message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
