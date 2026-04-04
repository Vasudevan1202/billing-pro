import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, getListMenuItemsQueryKey } from "@workspace/api-client-react";
import type { MenuItem } from "@workspace/api-client-react";
import { Plus, Pencil, Trash2, X, Check, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormData {
  name: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
}

const emptyForm: FormData = {
  name: "",
  price: "",
  category: "",
  imageUrl: "",
  available: true,
};

export default function AdminPage() {
  const { data: menuItems, isLoading } = useListMenuItems();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = "Valid price is required";
    if (!form.category.trim()) newErrors.category = "Category is required";
    if (!form.imageUrl.trim()) newErrors.imageUrl = "Image URL is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      imageUrl: item.imageUrl,
      available: item.available,
    });
    setErrors({});
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      imageUrl: form.imageUrl.trim(),
      available: form.available,
    };
    if (editingItem) {
      updateMenuItem.mutate({ id: editingItem.id, data }, { onSuccess: () => { invalidate(); setShowForm(false); } });
    } else {
      createMenuItem.mutate({ data }, { onSuccess: () => { invalidate(); setShowForm(false); } });
    }
  };

  const handleDelete = (id: number) => {
    deleteMenuItem.mutate({ id }, { onSuccess: () => { invalidate(); setDeleteConfirm(null); } });
  };

  const categories = Array.from(new Set(menuItems?.map((m) => m.category) ?? []));

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Item</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Category</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {menuItems?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/40x40/f97316/ffffff?text=${item.name[0]}`;
                          }}
                        />
                        <span className="font-semibold text-gray-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-primary">₹{item.price}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.available ? (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Available</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Unavailable</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === item.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-8 h-8 rounded-lg bg-destructive text-white flex items-center justify-center hover:opacity-90"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-destructive hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingItem ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Item Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Idly"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Price (₹)</label>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.5"
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
                  <Input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Breakfast"
                    list="categories-list"
                    className={errors.category ? "border-destructive" : ""}
                  />
                  <datalist id="categories-list">
                    {categories.map((c) => <option key={c} value={c} />)}
                  </datalist>
                  {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Image URL</label>
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className={errors.imageUrl ? "border-destructive" : ""}
                />
                {errors.imageUrl && <p className="text-xs text-destructive mt-1">{errors.imageUrl}</p>}
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="mt-2 h-20 w-20 rounded-lg object-cover border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Available for ordering</label>
                <button
                  onClick={() => setForm({ ...form, available: !form.available })}
                  className={`transition-colors ${form.available ? "text-primary" : "text-gray-400"}`}
                >
                  {form.available ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={createMenuItem.isPending || updateMenuItem.isPending}
              >
                {createMenuItem.isPending || updateMenuItem.isPending
                  ? "Saving..."
                  : editingItem
                  ? "Save Changes"
                  : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
