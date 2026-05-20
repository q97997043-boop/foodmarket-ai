import React, { useCallback, useState } from "react";
import {
  PackageOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  FolderOpen,
  Check,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { parseFetchError } from "../providers/TRPCProvider";
import { useRestaurant } from "../providers/RestaurantProvider";
import { ProductCard } from "../components/ProductCard";
import { ProductImageUpload } from "../components/ProductImageUpload";
import { Toast, type ToastState } from "../components/Toast";
import { useI18n } from "../providers/I18nProvider";

const emptyProduct = {
  name: "",
  description: "",
  emoji: "🍽️",
  imageUrl: null as string | null,
  basePrice: "",
  categoryId: "" as string | "",
  stockQuantity: 0,
  isAvailable: true,
};

export function Inventory() {
  const { restaurantId } = useRestaurant();
  const { t, currency } = useI18n();
  const utils = trpc.useUtils();

  const { data: products, isLoading } = trpc.menu.getProducts.useQuery(
    { restaurantId: restaurantId! },
    { enabled: !!restaurantId },
  );
  const { data: categories } = trpc.menu.getCategories.useQuery(
    { restaurantId: restaurantId! },
    { enabled: !!restaurantId },
  );

  const createProduct = trpc.menu.createProduct.useMutation();
  const updateProduct = trpc.menu.updateProduct.useMutation();
  const deleteProduct = trpc.menu.deleteProduct.useMutation();
  const createCategory = trpc.menu.createCategory.useMutation();
  const updateCategory = trpc.menu.updateCategory.useMutation();
  const deleteCategory = trpc.menu.deleteCategory.useMutation();

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [showModalNewCategory, setShowModalNewCategory] = useState(false);
  const [modalCategoryName, setModalCategoryName] = useState("");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const refreshMenu = useCallback(async () => {
    if (!restaurantId) return;
    await Promise.all([
      utils.menu.getProducts.invalidate({ restaurantId }),
      utils.menu.getCategories.invalidate({ restaurantId }),
    ]);
  }, [restaurantId, utils]);

  const showToast = (message: string, variant: "success" | "error") => {
    setToast({ message, variant });
  };

  const openCreate = () => {
    setForm(emptyProduct);
    setEditId(null);
    setFormError(null);
    setShowModalNewCategory(false);
    setModalCategoryName("");
    setModal("create");
  };

  const openEdit = (p: NonNullable<typeof products>[0]) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      emoji: p.emoji ?? "🍽️",
      imageUrl: p.imageUrl,
      basePrice: String(p.basePrice),
      categoryId: p.categoryId ?? "",
      stockQuantity: p.stockQuantity,
      isAvailable: p.isAvailable,
    });
    setFormError(null);
    setShowModalNewCategory(false);
    setModalCategoryName("");
    setModal("edit");
  };

  const handleSave = async () => {
    setFormError(null);
    if (!restaurantId) {
      setFormError(t("inventory.errors.noRestaurant"));
      return;
    }
    if (!form.name.trim()) {
      setFormError(t("inventory.errors.nameRequired"));
      return;
    }
    const basePrice = parseFloat(form.basePrice);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setFormError(t("inventory.errors.priceRequired"));
      return;
    }

    try {
      if (modal === "create") {
        await createProduct.mutateAsync({
          restaurantId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          emoji: form.emoji,
          imageUrl: form.imageUrl,
          basePrice,
          categoryId: form.categoryId || null,
          stockQuantity: form.stockQuantity,
          isAvailable: form.isAvailable,
        });
        showToast(t("inventory.productCreated"), "success");
      } else if (editId) {
        await updateProduct.mutateAsync({
          id: editId,
          restaurantId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          emoji: form.emoji,
          imageUrl: form.imageUrl,
          basePrice,
          categoryId: form.categoryId || null,
          stockQuantity: form.stockQuantity,
          isAvailable: form.isAvailable,
        });
        showToast(t("inventory.productUpdated"), "success");
      }
      setModal(null);
      await refreshMenu();
    } catch (err) {
      const message = parseFetchError(err);
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!restaurantId || !confirm(t("inventory.deleteConfirm"))) return;
    try {
      await deleteProduct.mutateAsync({ id, restaurantId });
      showToast(t("inventory.productDeleted"), "success");
      await refreshMenu();
    } catch (err) {
      showToast(parseFetchError(err), "error");
    }
  };

  const handleCreateCategory = async (
    name: string,
    opts?: { selectInForm?: boolean },
  ) => {
    if (!restaurantId || !name.trim()) return;
    try {
      const created = await createCategory.mutateAsync({
        restaurantId,
        name: name.trim(),
      });
      await refreshMenu();
      if (opts?.selectInForm) {
        setForm((f) => ({ ...f, categoryId: created.id }));
        setShowModalNewCategory(false);
        setModalCategoryName("");
      } else {
        setNewCategoryName("");
      }
      showToast(t("inventory.categoryCreated"), "success");
    } catch (err) {
      showToast(parseFetchError(err), "error");
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!restaurantId || !editingCategoryName.trim()) return;
    try {
      await updateCategory.mutateAsync({
        id,
        restaurantId,
        name: editingCategoryName.trim(),
      });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      await refreshMenu();
      showToast(t("inventory.categoryUpdated"), "success");
    } catch (err) {
      showToast(parseFetchError(err), "error");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!restaurantId || !confirm(t("inventory.deleteCategoryConfirm"))) return;
    try {
      await deleteCategory.mutateAsync({ id, restaurantId });
      if (form.categoryId === id) {
        setForm((f) => ({ ...f, categoryId: "" }));
      }
      await refreshMenu();
      showToast(t("inventory.categoryDeleted"), "success");
    } catch (err) {
      showToast(parseFetchError(err), "error");
    }
  };

  const isSaving =
    createProduct.isLoading ||
    updateProduct.isLoading ||
    createCategory.isLoading;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-50">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <PackageOpen className="h-8 w-8 text-emerald-500" />
            {t("inventory.title")}
          </h1>
          <p className="mt-1 text-slate-400">{t("inventory.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={!restaurantId}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          {t("inventory.addProduct")}
        </button>
      </header>

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">
            {t("inventory.categoriesTitle")}
          </h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">{t("inventory.categoriesHint")}</p>

        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={t("inventory.newCategory")}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreateCategory(newCategoryName);
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleCreateCategory(newCategoryName)}
            disabled={!newCategoryName.trim() || createCategory.isLoading}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {createCategory.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("inventory.addCategory")
            )}
          </button>
        </div>

        {categories && categories.length > 0 ? (
          <ul className="space-y-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2"
              >
                {editingCategoryId === c.id ? (
                  <>
                    <input
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => void handleUpdateCategory(c.id)}
                      disabled={updateCategory.isLoading}
                      className="rounded-lg bg-emerald-500/20 p-2 text-emerald-400 hover:bg-emerald-500/30"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setEditingCategoryName("");
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-slate-200">{c.name}</span>
                    <span className="text-xs text-slate-500">
                      {t("inventory.productCount", {
                        count: c._count?.products ?? 0,
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(c.id);
                        setEditingCategoryName(c.name);
                      }}
                      className="rounded-lg p-2 text-sky-400 hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(c.id)}
                      disabled={deleteCategory.isLoading}
                      className="rounded-lg p-2 text-red-400 hover:bg-slate-800 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">{t("inventory.noCategories")}</p>
        )}
      </section>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} currency={currency} />
              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="rounded-lg bg-slate-900/90 p-2 text-sky-400 hover:bg-slate-800"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(product.id)}
                  className="rounded-lg bg-slate-900/90 p-2 text-red-400 hover:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {modal === "create" ? t("inventory.newProduct") : t("inventory.editProduct")}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <ProductImageUpload
                label={t("inventory.productImage")}
                value={form.imageUrl}
                nameHint={form.name}
                onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
                onToast={(message, variant) => setToast({ message, variant })}
              />
              <input
                placeholder={t("inventory.productName")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
              <textarea
                placeholder={t("inventory.description")}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder={t("inventory.emoji")}
                  value={form.emoji}
                  onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder={t("inventory.price")}
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {t("inventory.categoryLabel")}
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
                >
                  <option value="">{t("inventory.noCategory")}</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {!showModalNewCategory ? (
                  <button
                    type="button"
                    onClick={() => setShowModalNewCategory(true)}
                    className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="h-4 w-4" />
                    {t("inventory.newCategoryButton")}
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                    <input
                      value={modalCategoryName}
                      onChange={(e) => setModalCategoryName(e.target.value)}
                      placeholder={t("inventory.newCategory")}
                      className="min-w-[140px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void handleCreateCategory(modalCategoryName, {
                          selectInForm: true,
                        })
                      }
                      disabled={!modalCategoryName.trim() || createCategory.isLoading}
                      className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {t("inventory.addCategory")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModalNewCategory(false);
                        setModalCategoryName("");
                      }}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800"
                    >
                      {t("inventory.cancel")}
                    </button>
                  </div>
                )}
              </div>

              <input
                type="number"
                min={0}
                placeholder={t("inventory.stockQuantity")}
                value={form.stockQuantity}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    stockQuantity: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                />
                {t("inventory.availableForSale")}
              </label>

              {formError && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {formError}
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-5 w-5 animate-spin" />}
                {t("inventory.saveProduct")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
