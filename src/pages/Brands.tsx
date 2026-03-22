"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useBrand } from "@/contexts/BrandContext";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  RefreshCcw,
  Upload,
  Loader2,
  X,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const emptyForm = {
  name: "",
  slug: "",
  logoUrl: "",
};
const ITEMS_PER_PAGE = 10;

export default function BrandsPage() {
  const {
    brands,
    isLoading,
    error,
    fetchAllBrands,
    createBrand,
    updateBrand,
    deleteBrand,
  } = useBrand();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAllBrands();
  }, [fetchAllBrands]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    if (!form.slug.trim()) {
      toast.error("Brand slug is required");
      return;
    }

    try {
      setIsSaving(true);
      let finalLogoUrl = form.logoUrl;

      // Upload image if selected
      if (selectedFile) {
        setIsUploading(true);
        const uploadData = await uploadImage(selectedFile, "brands");
        finalLogoUrl = uploadData.secure_url;
        setIsUploading(false);
      }

      const payload: any = {
        name: form.name,
        slug: form.slug,
        ...(finalLogoUrl && { logoUrl: finalLogoUrl }),
      };

      if (editingId) {
        await updateBrand(editingId, payload);
        toast.success("Brand updated successfully");
      } else {
        await createBrand(payload);
        toast.success("Brand created successfully");
      }

      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setSelectedFile(null);
    } catch (error) {
      console.error("Save failed", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save brand",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteBrand(deleteId);
      toast.success("Brand deleted successfully");
      setDeleteId(null);
    } catch (error) {
      console.error("Delete failed", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete brand",
      );
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const openEdit = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    if (brand) {
      setEditingId(brandId);
      setForm({
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl || "",
      });
      setSelectedFile(null);
      setDialogOpen(true);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Slug", "Logo URL", "Status"];
    const rows = brands.map((b) => [
      b.name,
      b.slug,
      b.logoUrl || "",
      b.isActive ? "Active" : "Inactive",
    ]);
    downloadCSV("brands", headers, rows);
  };

  const filteredBrands = brands.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()),
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBrands = filteredBrands.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  if (isLoading && brands.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Brands</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllBrands}
            disabled={isLoading}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Sync
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Brand
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBrands.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Lightbulb className="h-8 w-8 opacity-50" />
                      <p>
                        No brands found. Create your first brand to get started.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="h-10 w-10 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
                          {brand.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {brand.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={brand.isActive ? "default" : "outline"}>
                        {brand.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(brand.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(brand.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold">
            {filteredBrands.length === 0 ? 0 : startIndex + 1}-
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredBrands.length)}
          </span>{" "}
          of <span className="font-semibold">{filteredBrands.length}</span>{" "}
          brands
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 2),
                Math.min(totalPages, currentPage + 1),
              )
              .map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 min-w-8"
                >
                  {page}
                </Button>
              ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Brand" : "New Brand"}</DialogTitle>
            <DialogDescription>
              Provide the details below to{" "}
              {editingId ? "update the existing" : "create a new"} brand.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="brand-name">Name</Label>
              <Input
                id="brand-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Nike"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="brand-slug">Slug</Label>
              <Input
                id="brand-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. nike"
              />
            </div>

            {/* LOGO UPLOAD SECTION */}
            <div className="grid gap-2">
              <Label>Brand Logo</Label>
              <div className="flex flex-col gap-3">
                {/* Preview existing or newly selected image */}
                {(selectedFile || form.logoUrl) && (
                  <div className="relative w-24 h-24 rounded-md border overflow-hidden group">
                    <img
                      src={
                        selectedFile
                          ? URL.createObjectURL(selectedFile)
                          : form.logoUrl
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setForm({ ...form, logoUrl: "" });
                      }}
                      className="absolute top-1 right-1 bg-destructive p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    id="brand-logo-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("brand-logo-file")?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {form.logoUrl || selectedFile
                      ? "Change Logo"
                      : "Upload Logo"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingId(null);
                setForm(emptyForm);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving || isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                "Save Brand"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this brand? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
