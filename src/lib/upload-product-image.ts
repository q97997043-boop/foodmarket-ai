export type ProductImageUploadResult = {
  url: string;
};

export async function uploadProductImage(
  file: File,
  options?: { nameHint?: string; token?: string | null },
): Promise<ProductImageUploadResult> {
  const token = options?.token ?? localStorage.getItem("auth-token");
  const form = new FormData();
  form.append("file", file);
  if (options?.nameHint?.trim()) {
    form.append("nameHint", options.nameHint.trim());
  }

  const res = await fetch("/api/uploads/product", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  if (!data.url) {
    throw new Error("Upload failed: no URL returned");
  }
  return { url: data.url };
}
