import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Upload, X } from "lucide-react";
import { cn } from "../lib/utils";
import { readFileAsDataUrl } from "../lib/format";
import { useI18n } from "../providers/I18nProvider";

type ImageUploadProps = {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  aspect?: "square" | "banner" | "avatar";
  className?: string;
  hint?: string;
};

export function ImageUpload({
  label,
  value,
  onChange,
  aspect = "square",
  className,
  hint,
}: ImageUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > 2_500_000) {
        alert(t("errors.imageTooLarge"));
        return;
      }
      setUploading(true);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
      } finally {
        setUploading(false);
      }
    },
    [onChange, t],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const sizeClass =
    aspect === "banner"
      ? "h-40 w-full md:h-48"
      : aspect === "avatar"
        ? "h-28 w-28 rounded-full"
        : "h-36 w-full max-w-[200px]";

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          sizeClass,
          dragOver
            ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            : "border-slate-700/80 bg-slate-950/60 hover:border-slate-600",
          aspect === "avatar" && "mx-auto rounded-full",
        )}
      >
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full w-full"
            >
              <img
                src={value}
                alt=""
                className={cn(
                  "h-full w-full object-cover",
                  aspect === "avatar" && "rounded-full",
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition hover:opacity-100" />
              <button
                type="button"
                onClick={() => onChange(null)}
                className="absolute right-2 top-2 rounded-full border border-red-500/40 bg-slate-950/90 p-2 text-red-400 backdrop-blur hover:bg-red-500/20"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-2 right-2 rounded-lg border border-emerald-500/40 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-emerald-400 opacity-0 transition hover:opacity-100"
              >
                {t("settings.replaceImage")}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="empty"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-slate-500 transition",
                "hover:text-emerald-400",
                aspect === "avatar" && "rounded-full",
              )}
            >
              {uploading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent"
                />
              ) : dragOver ? (
                <>
                  <Upload className="h-8 w-8 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">
                    {t("settings.dropHere")}
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-xs font-medium">{t("settings.dragDrop")}</span>
                  <span className="text-[10px] text-slate-600">{t("common.uploadImage")}</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
