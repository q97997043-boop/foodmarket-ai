import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Upload, X } from "lucide-react";
import { cn } from "../lib/utils";
import { resolveImageSrc } from "../lib/media";
import { uploadProductImage } from "../lib/upload-product-image";
import { useI18n } from "../providers/I18nProvider";

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

type ProductImageUploadProps = {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  nameHint?: string;
  className?: string;
  onToast?: (message: string, variant: "success" | "error") => void;
};

export function ProductImageUpload({
  label,
  value,
  onChange,
  nameHint,
  className,
  onToast,
}: ProductImageUploadProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewSrc = resolveImageSrc(value);

  const handleFile = useCallback(
    async (file: File) => {
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(file.type)) {
        onToast?.(t("inventory.errors.imageType"), "error");
        return;
      }
      if (file.size > MAX_BYTES) {
        onToast?.(t("inventory.errors.imageTooLarge"), "error");
        return;
      }

      setUploading(true);
      try {
        const { url } = await uploadProductImage(file, { nameHint });
        onChange(url);
        onToast?.(t("inventory.imageUploaded"), "success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("inventory.imageUploadFailed");
        onToast?.(message, "error");
      } finally {
        setUploading(false);
      }
    },
    [nameHint, onChange, onToast, t],
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

  return (
    <motion.div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-slate-300">{label}</label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative h-36 w-full max-w-[200px] overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          dragOver
            ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            : "border-slate-700/80 bg-slate-950/60 hover:border-slate-600",
        )}
      >
        <AnimatePresence mode="wait">
          {previewSrc ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full w-full"
            >
              <img
                src={previewSrc}
                alt=""
                className="h-full w-full object-cover"
              />
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
                className="absolute bottom-2 right-2 rounded-lg border border-emerald-500/40 bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-emerald-400"
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
              className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-slate-500 transition hover:text-emerald-400"
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
                  <span className="text-[10px] text-slate-600">
                    {t("inventory.imageFormats")}
                  </span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </motion.div>
  );
}
