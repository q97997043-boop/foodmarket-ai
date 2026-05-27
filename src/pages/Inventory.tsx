import React, { useCallback, useState, useEffect } from "react";
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
  const { restaurantId, isWorkspaceLoading } = useRestaurant();
  const { t, currency } = useI18n();
  const utils = trpc.useUtils();
  const canQueryMenu = Boolean(restaurantId);

  const productsQuery = trpc.menu.getProducts.useQuery(
    { restaurantId: restaurantId! },
    { enabled: canQueryMenu, retry: 1 },
  );
  const categoriesQuery = trpc.menu.getCategories.useQuery(
    { restaurantId: restaurantId! },
    { enabled: canQueryMenu, retry: 1 },
  );

  const {
    data: productsData,
    isFetching: isProductsFetching,
    error: productsError,
    status: productsStatus,
  } = productsQuery;
  const {
    data: categoriesData,
    isFetching: isCategoriesFetching,
    error: categoriesError,
    status: categoriesStatus,
  } = categoriesQuery;

  const productsList = productsData ?? [];
  const categoriesList = categoriesData ?? [];
  const productsCount = productsList.length;
  const categoriesCount = categoriesList.length;
  const hasAnyData = productsCount > 0 || categoriesCount > 0;
  const anyQueryLoading = isProductsFetching || isCategoriesFetching;
  const hasProductError = Boolean(productsError);
  const hasCategoryError = Boolean(categoriesError);
  const showInlineLoader = anyQueryLoading && hasAnyData;
  // Allow category/product modifications as soon as we have a restaurantId.
  // Do not block UI while workspace settings are still loading.
  const canModifyCategories = Boolean(restaurantId);

  const createProduct = trpc.menu.createProduct.useMutation({
    onSuccess: async () => {
      if (restaurantId) {
        await Promise.all([
          utils.menu.getProducts.invalidate({ restaurantId }),
          utils.menu.getCategories.invalidate({ restaurantId }),
        ]);
      }
    },
  });
  const updateProduct = trpc.menu.updateProduct.useMutation({
    onSuccess: async () => {
      if (restaurantId) {
        await Promise.all([
          utils.menu.getProducts.invalidate({ restaurantId }),
          utils.menu.getCategories.invalidate({ restaurantId }),
        ]);
      }
    },
  });
  const deleteProduct = trpc.menu.deleteProduct.useMutation({
    onSuccess: async () => {
      if (restaurantId) {
        await Promise.all([
          utils.menu.getProducts.invalidate({ restaurantId }),
          utils.menu.getCategories.invalidate({ restaurantId }),
        ]);
      }
    },
  });
  const createCategory = trpc.menu.createCategory.useMutation({
    onSuccess: async () => {
      if (restaurantId) {
        await Promise.all([
          utils.menu.getCategories.invalidate({ restaurantId }),
          utils.menu.getProducts.invalidate({ restaurantId }),
        ]);
      }
    },
  });
  const updateCategory = trpc.menu.updateCategory.useMutation({
    onSuccess: async () => {
      if (restaurantId) {
        await Promise.all([
          utils.menu.getCategories.invalidate({ restaurantId }),
          utils.menu.getProducts.invalidate({ restaurantId }),
        ]);
      }
    },
  });
  const deleteCategory = trpc.menu.deleteCategory.useMutation({
    onSuccess: async () => {
      if (restaurantId) {
        await Promise.all([
          utils.menu.getCategories.invalidate({ restaurantId }),
          utils.menu.getProducts.invalidate({ restaurantId }),
        ]);
      }
    },
  });

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

  // Debug logging for loading states and render safety
  useEffect(() => {
    console.log("Inventory rendered");
    console.log("restaurantId =", restaurantId);
    console.log("categoriesData =", categoriesData);
    console.log("productsData =", productsData);
    console.log("categoriesCount =", categoriesCount);
    console.log("productsCount =", productsCount);
    console.log("canQueryMenu =", canQueryMenu);
    console.log("anyQueryLoading =", anyQueryLoading);
    console.log("productsError =", productsError);
    console.log("categoriesError =", categoriesError);

    if (productsError) {
      console.error("[Inventory Debug] Products Error:", productsError);
    }
    if (categoriesError) {
      console.error("[Inventory Debug] Categories Error:", categoriesError);
    }
  }, [restaurantId, categoriesData, productsData, categoriesCount, productsCount, canQueryMenu, anyQueryLoading, productsError, categoriesError]);

  const refreshMenu = useCallback(async () => {
    if (!restaurantId) {
      console.warn("[Inventory] Missing restaurantId for refresh");
      return;
    }
    try {
      await Promise.all([
        utils.menu.getProducts.invalidate({ restaurantId }),
        utils.menu.getCategories.invalidate({ restaurantId }),
      ]);
      console.log("[Inventory] Menu refreshed successfully");
    } catch (err) {
      console.error("[Inventory] Failed to refresh menu:", err);
    }
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
      const error = t("inventory.errors.noRestaurant");
      console.error("[Inventory] Save failed:", error);
      setFormError(error);
      return;
    }
    if (!form.name.trim()) {
      const error = t("inventory.errors.nameRequired");
      console.error("[Inventory] Save failed:", error);
      setFormError(error);
      return;
    }
    const basePrice = parseFloat(form.basePrice);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      const error = t("inventory.errors.priceRequired");
      console.error("[Inventory] Save failed:", error);
      setFormError(error);
      return;
    }

    try {
      if (modal === "create") {
        const payload = {
          restaurantId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          emoji: form.emoji,
          imageUrl: form.imageUrl,
          basePrice,
          categoryId: form.categoryId || null,
          stockQuantity: form.stockQuantity,
          isAvailable: form.isAvailable,
        };
        console.log("PRODUCT_MUTATION_INPUT", payload);
        console.log("[Inventory] Creating product:", form.name);
        await createProduct.mutateAsync(payload);
        console.log("[Inventory] Product created successfully");
        showToast(t("inventory.productCreated"), "success");
      } else if (editId) {
        console.log("[Inventory] Updating product:", editId);
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
        console.log("[Inventory] Product updated successfully");
        showToast(t("inventory.productUpdated"), "success");
      }
      setModal(null);
      setForm(emptyProduct);
      setEditId(null);
      await refreshMenu();
    } catch (err) {
      const message = parseFetchError(err);
      console.error("[Inventory] Save operation failed:", message, err);
      setFormError(message);
      showToast(message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!restaurantId) {
      console.error("[Inventory] Cannot delete: missing restaurantId");
      showToast(t("inventory.errors.noRestaurant"), "error");
      return;
    }
    if (!confirm(t("inventory.deleteConfirm"))) return;
    try {
      console.log("[Inventory] Deleting product:", id);
      await deleteProduct.mutateAsync({ id, restaurantId });
      console.log("[Inventory] Product deleted successfully");
      showToast(t("inventory.productDeleted"), "success");
      await refreshMenu();
    } catch (err) {
      const message = parseFetchError(err);
      console.error("[Inventory] Delete operation failed:", message, err);
      showToast(message, "error");
    }
  };

  const handleCreateCategory = async (
    name: string,
    opts?: { selectInForm?: boolean },
  ) => {
    if (!restaurantId) {
      console.error("[Inventory] Cannot create category: missing restaurantId");
      // Non-fatal: do not show the generic "no restaurant" toast during normal loading.
      // Log and return silently so the user is not flooded with toasts.
      return;
    }
    if (!name.trim()) {
      console.warn("[Inventory] Cannot create category: empty name");
      showToast("Category name is required", "error");
      return;
    }
    try {
      const payload = {
        restaurantId,
        name: name.trim(),
      };
      console.log("CATEGORY_MUTATION_INPUT", payload);
      console.log("[Inventory] Creating category:", name);
      const created = await createCategory.mutateAsync(payload);
      console.log("[Inventory] Category created successfully:", created.id);
      
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
      const message = parseFetchError(err);
      console.error("[Inventory] Create category failed:", message, err);
      showToast(message, "error");
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!restaurantId) {
      console.error("[Inventory] Cannot update category: missing restaurantId");
      return;
    }
    if (!editingCategoryName.trim()) {
      console.warn("[Inventory] Cannot update category: empty name");
      showToast("Category name is required", "error");
      return;
    }
    try {
      console.log("[Inventory] Updating category:", id);
      await updateCategory.mutateAsync({
        id,
        restaurantId,
        name: editingCategoryName.trim(),
      });
      console.log("[Inventory] Category updated successfully");
      setEditingCategoryId(null);
      setEditingCategoryName("");
      await refreshMenu();
      showToast(t("inventory.categoryUpdated"), "success");
    } catch (err) {
      const message = parseFetchError(err);
      console.error("[Inventory] Update category failed:", message, err);
      showToast(message, "error");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!restaurantId) {
      console.error("[Inventory] Cannot delete category: missing restaurantId");
      return;
    }
    if (!confirm(t("inventory.deleteCategoryConfirm"))) return;
    try {
      console.log("[Inventory] Deleting category:", id);
      await deleteCategory.mutateAsync({ id, restaurantId });
      console.log("[Inventory] Category deleted successfully");
      if (form.categoryId === id) {
        setForm((f) => ({ ...f, categoryId: "" }));
      }
      await refreshMenu();
      showToast(t("inventory.categoryDeleted"), "success");
    } catch (err) {
      const message = parseFetchError(err);
      console.error("[Inventory] Delete category failed:", message, err);
      showToast(message, "error");
    }
  };

  const isSaving =
    createProduct.isLoading ||
    updateProduct.isLoading ||
    deleteProduct.isLoading ||
    createCategory.isLoading ||
    updateCategory.isLoading ||
    deleteCategory.isLoading;

  // Debug: Log query lifecycle and final loading state
  useEffect(() => {
    if (productsStatus === "loading" || categoriesStatus === "loading") {
      console.log("FETCH START");
    }
    if (
      productsStatus === "success" ||
      productsStatus === "error" ||
      categoriesStatus === "success" ||
      categoriesStatus === "error"
    ) {
      console.log("FETCH END");
    }
    console.log(
      "[Inventory Debug] productsStatus:",
      productsStatus,
      "categoriesStatus:",
      categoriesStatus,
      "productsError:",
      productsError,
      "categoriesError:",
      categoriesError,
      "restaurantId:",
      restaurantId,
    );
    if (productsError) {
      console.error("[Inventory Debug] Products Error:", productsError);
    }
    if (categoriesError) {
      console.error("[Inventory Debug] Categories Error:", categoriesError);
    }
  }, [productsStatus, categoriesStatus, productsError, categoriesError, restaurantId]);

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

      {!restaurantId && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Restaurant data is not yet available. Inventory is still usable once the workspace loads.
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">
            {t("inventory.categoriesTitle")}
          </h2>
          {isCategoriesFetching && categoriesCount > 0 && (
            <span className="ml-2 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">
              Loading categories…
            </span>
          )}
        </div>
        <p className="mb-4 text-sm text-slate-400">{t("inventory.categoriesHint")}</p>
        {hasCategoryError && (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Failed to load categories. Showing empty category list.
          </div>
        )}

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
            disabled={!newCategoryName.trim() || createCategory.isLoading || !canModifyCategories}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {createCategory.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("inventory.addCategory")
            )}
          </button>
        </div>

        {categoriesList.length > 0 ? (
          <ul className="space-y-2">
            {categoriesList.map((c) => (
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

      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Products</h2>
          {showInlineLoader && (
            <p className="mt-1 text-sm text-slate-400">Loading products and categories…</p>
          )}
          {hasProductError && (
            <p className="mt-1 text-sm text-red-300">
              Failed to load products. Showing saved data or empty list.
            </p>
          )}
        </div>
        {showInlineLoader && (
          <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-sm text-slate-200">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            <span>Refreshing inventory…</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {productsList.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center text-slate-400">
            {hasProductError
              ? "No products loaded due to a fetch error. You can create new products manually."
              : "No products found yet. Add a product to get started."}
          </div>
        ) : (
          productsList.map((product) => (
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
          ))
        )}
      </div>

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
                  {categoriesList.map((c) => (
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
                      disabled={!modalCategoryName.trim() || createCategory.isLoading || !canModifyCategories}
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
