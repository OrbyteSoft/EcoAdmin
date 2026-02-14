import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? "fill-accent text-accent" : "text-muted"}`} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products } = useQuery({ queryKey: ["products"], queryFn: () => api<any>("/products") });
  const productList = (Array.isArray(products) ? products : products?.data || []) as any[];

  const [selectedProductId, setSelectedProductId] = useState("");
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ["reviews", selectedProductId],
    queryFn: () => selectedProductId ? api<any>(`/reviews/product/${selectedProductId}`) : api<any>("/reviews"),
    enabled: true,
  });
  const reviews = (Array.isArray(reviewsData) ? reviewsData : reviewsData?.data || []) as any[];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reviews"] }); setDeleteId(null); toast.success("Review deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Filter by product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i=><Skeleton key={i} className="h-16"/>)}</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.product?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{r.user?.name || "—"}</TableCell>
                    <TableCell><StarRating rating={r.rating} /></TableCell>
                    <TableCell className="max-w-xs truncate text-sm">{r.comment}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.createdAt ? formatDate(r.createdAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {reviews.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No reviews found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete review?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
