"use client";

import { useState, useMemo, useRef } from "react";
import { useProducts, Product } from "@/contexts/ProductContext";
import { useBrand } from "@/contexts/BrandContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";
import { uploadImage } from "@/utils/cloudinary";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  Star,
  Flame,
  Package,
  ImageIcon,
  TrendingUp,
  Tag,
  Percent,
  X,
  UploadCloud,
  Loader2,
  FileText,
  Image as ImageLucide,
  Banknote,
  Layers,
  Eye,
  Sparkles,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const emptyProduct = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  compareAt: 0,
  sku: "",
  stock: 0,
  imageUrl: "",
  images: [] as string[],
  categoryId: "",
  brandId: "",
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  isFlashDeal: false,
  flashDealEnd: "",
};

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct, page, setPage, total } =
    useProducts();
  const { brands } = useBrand();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoSlug, setIsAutoSlug] = useState(true);

  // Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<any>("/categories"),
  });

  const catList = Array.isArray(categories)
    ? categories
    : categories?.data || [];

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [products, search]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");

  const handleNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: isAutoSlug ? slugify(val) : prev.slug,
    }));
  };

  // Image Upload Logic
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (form.images.length + files.length > 5) {
      return toast.error("Maximum 5 images allowed per product");
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map((file) => uploadImage(file, "products"));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((res) => res.secure_url);

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls],
        imageUrl: prev.imageUrl || newUrls[0], // Set first one as main if empty
      }));
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      toast.error("Upload failed. Please check your Cloudinary config.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const updatedImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: updatedImages,
        imageUrl: updatedImages[0] || "", // Update main image to next available
      };
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setIsAutoSlug(true);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setIsAutoSlug(false);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      price: p.price,
      compareAt: p.compareAt || 0,
      sku: p.sku || "",
      stock: p.stock,
      imageUrl: p.imageUrl || "",
      images: Array.isArray(p.images)
        ? p.images
        : p.imageUrl
          ? [p.imageUrl]
          : [],
      categoryId: p.categoryId || "",
      brandId: p.brandId || "",
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isNewArrival: p.isNewArrival,
      isFlashDeal: p.isFlashDeal,
      flashDealEnd: p.flashDealEnd
        ? new Date(p.flashDealEnd).toISOString().slice(0, 16)
        : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      return toast.error("Name and Slug are required fields");
    }
    if (form.images.length === 0) {
      return toast.error("At least one product image is required");
    }

    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        price: Number(form.price),
        compareAt:
          form.compareAt && Number(form.compareAt) > 0
            ? Number(form.compareAt)
            : null,
        stock: Number(form.stock),
        categoryId:
          form.categoryId === "none" || !form.categoryId
            ? null
            : form.categoryId,
        brandId: form.brandId === "none" || !form.brandId ? null : form.brandId,
        flashDealEnd:
          form.isFlashDeal && form.flashDealEnd
            ? new Date(form.flashDealEnd).toISOString()
            : null,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Product updated successfully");
      } else {
        await createProduct(payload);
        toast.success("Product created successfully");
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      toast.success("Product removed");
      setDeleteId(null);
    } catch (e: any) {
      toast.error(e.message || "Deletion failed");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "SKU", "Price", "CompareAt", "Stock", "Status"];
    const rows = products.map((p) => [
      p.name,
      p.sku || "N/A",
      String(p.price),
      String(p.compareAt || 0),
      String(p.stock),
      p.isActive ? "Active" : "Inactive",
    ]);
    downloadCSV("inventory_export", headers, rows);
    toast.success("Exported to CSV");
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground text-sm">
            Update your inventory, set discounts, and manage store visibility.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9 bg-background border-input"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card className="shadow-sm border border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[350px]">Product Info</TableHead>
                <TableHead className="text-right">Price (NPR)</TableHead>
                <TableHead>Marketing</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group hover:bg-muted/30 transition-colors border-b border-border"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg border border-border bg-muted flex-shrink-0 overflow-hidden">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-sm truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {p.sku || "NO SKU"}
                          </span>
                          {p.brandId && (
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {brands.find((b) => b.id === p.brandId)?.name ||
                                "Unknown"}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-sm">
                          {formatNPR(p.price)}
                        </span>
                        {p.compareAt && p.compareAt > p.price && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatNPR(p.compareAt)}
                            </span>
                            <span className="text-[10px] font-bold text-green-500">
                              -
                              {Math.round(
                                ((p.compareAt - p.price) / p.compareAt) * 100,
                              )}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[150px]">
                        {p.isFeatured && (
                          <Badge className="h-5 px-1.5 text-[9px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                            <Star className="h-2.5 w-2.5 mr-1 fill-amber-500" />{" "}
                            FEAT
                          </Badge>
                        )}
                        {p.isFlashDeal && (
                          <Badge className="h-5 px-1.5 text-[9px] bg-red-500/10 text-red-500 border-red-500/20 animate-pulse">
                            <Flame className="h-2.5 w-2.5 mr-1 fill-red-500" />{" "}
                            FLASH
                          </Badge>
                        )}
                        {p.isBestSeller && (
                          <Badge className="h-5 px-1.5 text-[9px] bg-blue-500/10 text-blue-500 border-blue-500/20">
                            <TrendingUp className="h-2.5 w-2.5 mr-1" /> BEST
                          </Badge>
                        )}
                        {p.isNewArrival && (
                          <Badge className="h-5 px-1.5 text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            <Plus className="h-2.5 w-2.5 mr-1" /> NEW
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.stock < 5 ? "destructive" : "secondary"}
                        className="font-mono whitespace-nowrap"
                      >
                        {p.stock} QTY
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? "default" : "outline"}>
                        {p.isActive ? "Live" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(p.id)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Package className="h-8 w-8 mb-2 opacity-20" />
                      <p>No products found in the catalog.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PAGINATION */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{" "}
            <span className="font-medium">{Math.min(page * 10, total)}</span> of{" "}
            <span className="font-medium">{total}</span> products
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{Math.ceil(total / 10)}</span>
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 10)}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl h-[95vh] p-0 flex flex-col overflow-hidden shadow-2xl border-border bg-card">
          {/* Enhanced Header */}
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {editingId ? "Edit Product Details" : "Create New Product"}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  {editingId
                    ? "Update product information, pricing, and marketing settings"
                    : "Add a new product to your inventory with complete details"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Tabbed Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs
              defaultValue="general"
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Tab Triggers */}
              <div className="px-6 pt-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                <TabsList className="grid w-full max-w-md grid-cols-3 bg-transparent border-b border-border/50 p-0 h-auto">
                  <TabsTrigger
                    value="general"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 px-4 font-semibold transition-all hover:text-primary/80"
                  >
                    <FileText className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="pricing"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 px-4 font-semibold transition-all hover:text-primary/80"
                  >
                    <Banknote className="h-4 w-4" />
                    Pricing
                  </TabsTrigger>
                  <TabsTrigger
                    value="marketing"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none py-3 px-4 font-semibold transition-all hover:text-primary/80"
                  >
                    <Sparkles className="h-4 w-4" />
                    Marketing
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {/* GENERAL TAB */}
                <TabsContent value="general" className="p-6 space-y-6 m-0">
                  {/* Product Gallery Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageLucide className="h-5 w-5 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">
                        Product Gallery
                      </Label>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {form.images.length}/5 images
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {form.images.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-lg border-2 border-border overflow-hidden group hover:border-primary transition-colors"
                        >
                          <img
                            src={url}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 p-1.5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {idx === 0 && (
                            <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                      {form.images.length < 5 && (
                        <button
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-lg border-2 border-dashed border-primary/30 hover:border-primary flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                        >
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          ) : (
                            <UploadCloud className="h-5 w-5 text-primary" />
                          )}
                          <span className="text-[10px] font-semibold text-primary">
                            {isUploading ? "Uploading" : "Upload"}
                          </span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="h-px bg-border" />

                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">
                        Basic Information
                      </Label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                          Product Name *
                        </Label>
                        <Input
                          value={form.name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. Samsung Galaxy S24 Ultra"
                          className="h-10 border-border/80 focus:border-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                            Slug *
                          </Label>
                          <Input
                            value={form.slug}
                            onChange={(e) => {
                              setIsAutoSlug(false);
                              setForm({ ...form, slug: e.target.value });
                            }}
                            placeholder="product-slug"
                            className="h-10 border-border/80 focus:border-primary"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                            SKU
                          </Label>
                          <Input
                            value={form.sku}
                            onChange={(e) =>
                              setForm({ ...form, sku: e.target.value })
                            }
                            placeholder="SKU-12345"
                            className="h-10 border-border/80 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                            Category
                          </Label>
                          <Select
                            value={form.categoryId || "none"}
                            onValueChange={(v) =>
                              setForm({ ...form, categoryId: v })
                            }
                          >
                            <SelectTrigger className="h-10 border-border/80">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Uncategorized
                              </SelectItem>
                              {catList.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                            Brand
                          </Label>
                          <Select
                            value={form.brandId || "none"}
                            onValueChange={(v) =>
                              setForm({ ...form, brandId: v })
                            }
                          >
                            <SelectTrigger className="h-10 border-border/80">
                              <SelectValue placeholder="Select Brand" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Brand</SelectItem>
                              {brands.map((b) => (
                                <SelectItem key={b.id} value={b.id}>
                                  {b.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">
                          Description
                        </Label>
                        <Textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          placeholder="Add a detailed product description..."
                          className="min-h-[100px] border-border/80 focus:border-primary resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* PRICING TAB */}
                <TabsContent value="pricing" className="p-6 space-y-6 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">
                        Pricing Information
                      </Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                          Sale Price (NPR) *
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                            ₨
                          </span>
                          <Input
                            type="number"
                            value={form.price}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                price: Number(e.target.value),
                              })
                            }
                            placeholder="0.00"
                            className="h-10 pl-7 border-border/80 focus:border-primary font-semibold"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                          Compare Price (NPR)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                            ₨
                          </span>
                          <Input
                            type="number"
                            value={form.compareAt}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                compareAt: Number(e.target.value),
                              })
                            }
                            placeholder="0.00"
                            className="h-10 pl-7 border-border/80 focus:border-primary font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {form.compareAt && form.compareAt > form.price && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                          🎉{" "}
                          {Math.round(
                            ((form.compareAt - form.price) / form.compareAt) *
                              100,
                          )}
                          % off displayed
                        </p>
                      </div>
                    )}

                    <div className="h-px bg-border" />

                    <div className="space-y-4">
                      <Label className="text-sm font-semibold text-foreground block">
                        Inventory
                      </Label>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                          Stock Quantity
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={form.stock}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                stock: Number(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="h-10 flex-1 border-border/80 focus:border-primary"
                          />
                          <Badge
                            variant={
                              form.stock < 5 ? "destructive" : "secondary"
                            }
                            className="whitespace-nowrap"
                          >
                            {form.stock < 5 ? "Low Stock" : "In Stock"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* MARKETING TAB */}
                <TabsContent value="marketing" className="p-6 space-y-6 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">
                        Visibility & Tags
                      </Label>
                    </div>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Active", key: "isActive", icon: "📱" },
                        { label: "Featured", key: "isFeatured", icon: "⭐" },
                        {
                          label: "Best Seller",
                          key: "isBestSeller",
                          icon: "🔝",
                        },
                        {
                          label: "New Arrival",
                          key: "isNewArrival",
                          icon: "✨",
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between ${
                            (form as any)[item.key]
                              ? "border-primary bg-primary/5"
                              : "border-border bg-muted/20 hover:border-primary/50"
                          }`}
                          onClick={() =>
                            setForm({
                              ...form,
                              [item.key]: !(form as any)[item.key],
                            })
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <Label className="text-xs font-semibold cursor-pointer">
                              {item.label}
                            </Label>
                          </div>
                          <Switch
                            checked={(form as any)[item.key]}
                            onCheckedChange={(v) =>
                              setForm({ ...form, [item.key]: v })
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-border" />

                    {/* Flash Deal Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-primary" />
                        <Label className="text-sm font-semibold text-foreground">
                          Flash Deal
                        </Label>
                      </div>
                      <div
                        className={`p-4 rounded-lg border-2 transition-all ${
                          form.isFlashDeal
                            ? "border-red-500/50 bg-red-50/50 dark:bg-red-950/20"
                            : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={form.isFlashDeal}
                              onCheckedChange={(v) =>
                                setForm({ ...form, isFlashDeal: v })
                              }
                            />
                            <div>
                              <Label className="text-sm font-semibold">
                                Enable Flash Deal
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Set an end date for this promotion
                              </p>
                            </div>
                          </div>
                        </div>
                        {form.isFlashDeal && (
                          <div className="mt-3">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
                              Deal End Date/Time
                            </Label>
                            <Input
                              type="datetime-local"
                              value={form.flashDealEnd}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  flashDealEnd: e.target.value,
                                })
                              }
                              className="h-10 border-border/80 focus:border-primary"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Enhanced Footer */}
          <DialogFooter className="p-4 bg-muted/20 border-t border-border shrink-0 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {editingId
                ? "Changes are automatically saved"
                : "All fields marked * are required"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="h-9 gap-2"
              >
                {isSaving || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploading ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    {editingId ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
