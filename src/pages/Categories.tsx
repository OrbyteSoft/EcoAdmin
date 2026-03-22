import { useState, useEffect, ChangeEvent } from "react";
import { downloadCSV } from "@/lib/csv";
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
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  ChevronRight,
  FolderOpen,
  Folder,
  RefreshCcw,
  Upload,
  Loader2,
  X,
  ChevronLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCategories, Category } from "@/contexts/CategoryContext";
import { uploadImage } from "@/utils/cloudinary";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  parentId: "none",
  isActive: true,
};

function CategoryTreeNode({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-muted/50 group transition-colors">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "p-0.5 rounded transition-transform",
            hasChildren ? "visible" : "invisible",
          )}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>
        {hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium flex-1">{category.name}</span>
        <span className="text-xs text-muted-foreground mr-2">
          {category.slug}
        </span>
        <Badge
          variant={category.isActive ? "default" : "outline"}
          className="text-xs"
        >
          {category.isActive ? "Active" : "Inactive"}
        </Badge>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="ml-6 border-l border-muted pl-2">
          {category.children?.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  const {
    categories,
    categoryTree,
    isLoading,
    fetchCategories,
    fetchCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategories();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);

  // New states for image handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCategoryTree();
  }, [fetchCategories, fetchCategoryTree]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      let finalImageUrl = form.imageUrl;

      // 1. If a new file was selected, upload it first
      if (selectedFile) {
        const uploadData = await uploadImage(selectedFile, "categories");
        finalImageUrl = uploadData.secure_url;
      }

      // 2. Create payload
      const payload: any = {
        ...form,
        imageUrl: finalImageUrl,
        parentId: form.parentId === "none" ? null : form.parentId,
      };

      if (!payload.imageUrl || payload.imageUrl.trim() === "") {
        delete payload.imageUrl;
      }

      // 3. Save to DB
      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory(payload);
      }

      setDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload/Save failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug || "",
      description: c.description || "",
      imageUrl: c.imageUrl || "",
      parentId: c.parentId || "none",
      isActive: c.isActive,
    });
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Slug", "Description", "Active"];
    const rows = categories.map((c) => [
      c.name,
      c.slug,
      c.description || "",
      c.isActive ? "Yes" : "No",
    ]);
    downloadCSV("categories", headers, rows);
  };

  if (isLoading && categories.length === 0)
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4 animate-fade-in p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchCategories();
              fetchCategoryTree();
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Sync
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchCategories({ search: e.target.value });
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="tree">Tree View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            className="h-10 w-10 rounded object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                            No Img
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.isActive ? "default" : "outline"}>
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tree">
          <Card>
            <CardContent className="py-4">
              {categoryTree.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No categories found
                </p>
              ) : (
                categoryTree.map((c) => (
                  <CategoryTreeNode
                    key={c.id}
                    category={c}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              Provide the details below to{" "}
              {editing ? "update the existing" : "create a new"} category.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-slug">Slug (Optional)</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                placeholder="electronics-gadgets"
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId}
                onValueChange={(v) => setForm({ ...form, parentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root)</SelectItem>
                  {categories
                    .filter((c) => c.id !== editing?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* IMAGE UPLOAD SECTION */}
            <div className="grid gap-2">
              <Label>Category Image</Label>
              <div className="flex flex-col gap-3">
                {/* Preview existing or newly selected image */}
                {(selectedFile || form.imageUrl) && (
                  <div className="relative w-24 h-24 rounded-md border overflow-hidden group">
                    <img
                      src={
                        selectedFile
                          ? URL.createObjectURL(selectedFile)
                          : form.imageUrl
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setForm({ ...form, imageUrl: "" });
                      }}
                      className="absolute top-1 right-1 bg-destructive p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Input
                    id="cat-image-file"
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
                      document.getElementById("cat-image-file")?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {form.imageUrl || selectedFile
                      ? "Change Image"
                      : "Upload Image"}
                  </Button>
                  {selectedFile && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="cat-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label htmlFor="cat-active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Subcategories may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteCategory(deleteId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
