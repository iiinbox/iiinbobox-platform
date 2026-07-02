"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New parent category form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [adding, setAdding] = useState(false);

  // New subcategory form (per parent)
  const [subParent, setSubParent] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subAdding, setSubAdding] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories");
      if (!res.ok) {
        setError(`Failed to load categories (${res.status})`);
        setCategories([]);
      } else {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError("Could not reach API. The API may need to be rebuilt.");
      setCategories([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addCategory() {
    if (!newName.trim()) return;
    setAdding(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), slug: newSlug || slugify(newName) }),
    });
    setNewName(""); setNewSlug("");
    await load();
    setAdding(false);
  }

  async function addSubcategory(parentSlug: string) {
    if (!subName.trim()) return;
    setSubAdding(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: subName.trim(), slug: subSlug || slugify(subName), parentSlug }),
    });
    setSubName(""); setSubSlug(""); setSubParent(null);
    await load();
    setSubAdding(false);
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category and all its subcategories?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    await load();
  }

  async function deleteSubcategory(id: string) {
    if (!confirm("Delete this subcategory?")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-6">Categories</h1>

      {/* Add parent category */}
      <div className="flex gap-2 mb-8">
        <Input
          placeholder="Category name"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }}
          className="max-w-48"
        />
        <Input
          placeholder="slug (auto)"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          className="max-w-36"
        />
        <Button onClick={addCategory} disabled={adding || !newName.trim()} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Category list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : categories.length === 0 && !error ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div>
                  <span className="font-medium text-sm">{cat.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{cat.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setSubParent(subParent === cat.id ? null : cat.id); setSubName(""); setSubSlug(""); }}
                    className="text-xs h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Sub
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCategory(cat.id)} className="h-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {cat.children.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{sub.name}</span>
                    <span className="text-xs text-muted-foreground">{sub.slug}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteSubcategory(sub.id)} className="h-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Add subcategory inline form */}
              {subParent === cat.id && (
                <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-blue-50">
                  <Input
                    placeholder="Subcategory name"
                    value={subName}
                    onChange={(e) => { setSubName(e.target.value); setSubSlug(slugify(e.target.value)); }}
                    className="max-w-44 h-8 text-sm"
                    autoFocus
                  />
                  <Input
                    placeholder="slug (auto)"
                    value={subSlug}
                    onChange={(e) => setSubSlug(e.target.value)}
                    className="max-w-32 h-8 text-sm"
                  />
                  <Button size="sm" className="h-8" disabled={subAdding || !subName.trim()} onClick={() => addSubcategory(cat.slug)}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setSubParent(null)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
