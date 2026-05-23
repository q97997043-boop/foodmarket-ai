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

  const text = await res.text();
  console.log("Raw upload response:", text, { status: res.status, statusText: res.statusText });

  let data: { url?: string; error?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
    console.log("Parsed upload response:", data);
  } catch (err) {
    console.error("Upload JSON parse failed:", err, text);
    throw new Error("Invalid JSON response from server");
  }

  if (!res.ok) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  if (!data.url) {
    throw new Error("Upload failed: no URL returned");
  }
  return { url: data.url };
}
