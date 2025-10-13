import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import type { Joke, EmotionCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function JokeManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Joke | null>(null);
  const [formData, setFormData] = useState({
    text: "",
    category: "general" as EmotionCategory,
  });

  const { data: jokes, isLoading } = useQuery<Joke[]>({
    queryKey: ["/api/jokes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("POST", "/api/jokes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jokes"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      apiRequest("PUT", `/api/jokes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jokes"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jokes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jokes"] });
    },
  });

  const handleOpenDialog = (item?: Joke) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        text: item.text,
        category: item.category,
      });
    } else {
      setEditingItem(null);
      setFormData({
        text: "",
        category: "general",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categoryColors = {
    red: "bg-traffic-red/20 text-traffic-red border-traffic-red/30",
    yellow: "bg-traffic-yellow/20 text-traffic-yellow-foreground border-traffic-yellow/30",
    green: "bg-traffic-green/20 text-traffic-green border-traffic-green/30",
    general: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Jokes</CardTitle>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-joke">
            <Plus className="w-4 h-4 mr-2" />
            Add Joke
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : jokes && jokes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Text</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jokes.map((item) => (
                  <TableRow key={item.id} data-testid={`row-joke-${item.id}`}>
                    <TableCell className="font-medium max-w-md">{item.text}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${categoryColors[item.category]}`}>
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(item)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No jokes yet. Add your first one!
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-joke-form">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Joke" : "Add Joke"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Joke Text</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Why did the bunny cross the road? To get to the carrot patch!"
                className="min-h-24"
                data-testid="input-joke-text"
              />
            </div>

            <div>
              <Label htmlFor="category">Emotion Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: EmotionCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category" data-testid="select-joke-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red (Not Great)</SelectItem>
                  <SelectItem value="yellow">Yellow (Nervous)</SelectItem>
                  <SelectItem value="green">Green (Feeling Good)</SelectItem>
                  <SelectItem value="general">General (All Emotions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-joke">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.text || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-joke"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
