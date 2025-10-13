import { useState, useRef } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus, Pencil, Trash2, Upload, CheckCircle2 } from "lucide-react";
import type { AudioFile, EmotionCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function AudioManager() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AudioFile | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "categorizing" | "done">("idle");
  const [formData, setFormData] = useState({
    name: "",
    filePath: "",
    category: "general" as EmotionCategory,
    volume: 80,
  });

  const { data: audioFiles, isLoading } = useQuery<AudioFile[]>({
    queryKey: ["/api/audio"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("POST", "/api/audio", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio"] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      apiRequest("PUT", `/api/audio/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio"] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/audio/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audio"] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setFormData({ ...formData, name: file.name.replace(/\.[^/.]+$/, "") });
    
    let uploadURL = "";
    let uploadSucceeded = false;
    let objectPath = "";
    
    try {
      setUploadStatus("uploading");
      
      // Get upload URL with contentType
      const uploadUrlResponse = await apiRequest<{ uploadURL: string }>(
        "POST", 
        "/api/audio/upload-url", 
        { contentType: file.type }
      );
      uploadURL = uploadUrlResponse.uploadURL;
      
      // Upload file
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      uploadSucceeded = true;
      setUploadStatus("categorizing");

      // Auto-categorize
      const categorizeResponse = await apiRequest<{ objectPath: string; category: EmotionCategory; reasoning: string }>(
        "POST",
        "/api/audio/categorize",
        { uploadURL, name: file.name }
      );

      objectPath = categorizeResponse.objectPath;

      setFormData({
        ...formData,
        name: file.name.replace(/\.[^/.]+$/, ""),
        filePath: categorizeResponse.objectPath,
        category: categorizeResponse.category,
      });

      setUploadStatus("done");
      
      toast({
        title: "File uploaded!",
        description: `Auto-categorized as: ${categorizeResponse.category}`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      // If categorization failed but upload succeeded, provide manual option
      if (uploadSucceeded && uploadURL) {
        // If we don't have objectPath from categorization, try to get it from a manual call
        if (!objectPath) {
          try {
            // Make a simple request to get the normalized path without categorization
            const pathResponse = await apiRequest<{ objectPath: string }>(
              "POST",
              "/api/audio/normalize-path",
              { uploadURL }
            );
            objectPath = pathResponse.objectPath;
          } catch (pathError) {
            console.error("Failed to normalize object path:", pathError);
            // Leave objectPath empty - admin will need to enter manually
          }
        }

        setFormData({
          ...formData,
          name: file.name.replace(/\.[^/.]+$/, ""),
          filePath: objectPath,
          category: "general", // Default to general if AI fails
        });
        setUploadStatus("done");
        
        toast({
          title: "Upload succeeded!",
          description: objectPath 
            ? "Auto-categorization failed. Please select a category manually and save."
            : "Auto-categorization failed. Please enter the file path and category manually.",
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
        setUploadStatus("idle");
        setUploadedFile(null);
        setFormData({
          name: "",
          filePath: "",
          category: "general",
          volume: 80,
        });
      }
    }
  };

  const handleOpenDialog = (item?: AudioFile) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        filePath: item.filePath,
        category: item.category,
        volume: item.volume,
      });
      setUploadStatus("done");
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        filePath: "",
        category: "general",
        volume: 80,
      });
      setUploadedFile(null);
      setUploadStatus("idle");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setUploadedFile(null);
    setUploadStatus("idle");
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
          <CardTitle>Audio Files</CardTitle>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-audio">
            <Plus className="w-4 h-4 mr-2" />
            Add Audio
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : audioFiles && audioFiles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audioFiles.map((file) => (
                  <TableRow key={file.id} data-testid={`row-audio-${file.id}`}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${categoryColors[file.category]}`}>
                        {file.category}
                      </span>
                    </TableCell>
                    <TableCell>{file.volume}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(file)}
                          data-testid={`button-edit-${file.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(file.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${file.id}`}
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
              No audio files yet. Add your first one!
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-audio-form">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Audio File" : "Add Audio File"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!editingItem && (
              <div>
                <Label>Upload Audio File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadStatus === "uploading" || uploadStatus === "categorizing"}
                  className="w-full mt-2"
                  data-testid="button-upload-audio"
                >
                  {uploadStatus === "uploading" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {uploadStatus === "categorizing" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {uploadStatus === "done" && <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />}
                  {uploadStatus === "idle" && <Upload className="w-4 h-4 mr-2" />}
                  {uploadStatus === "uploading" ? "Uploading..." :
                   uploadStatus === "categorizing" ? "Categorizing..." :
                   uploadStatus === "done" ? "Uploaded!" : "Choose Audio File"}
                </Button>
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Calming Music"
                data-testid="input-audio-name"
              />
            </div>

            {(editingItem || uploadStatus === "done") && (
              <div>
                <Label htmlFor="filePath">File Path</Label>
                <Input
                  id="filePath"
                  value={formData.filePath}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  placeholder="/path/to/audio.mp3"
                  data-testid="input-audio-path"
                  disabled={!!editingItem}
                />
                {uploadStatus === "done" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated from upload
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="category">Emotion Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: EmotionCategory) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category" data-testid="select-audio-category">
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

            <div>
              <Label htmlFor="volume">Volume ({formData.volume}%)</Label>
              <Slider
                id="volume"
                value={[formData.volume]}
                onValueChange={([value]) => setFormData({ ...formData, volume: value })}
                min={0}
                max={100}
                step={1}
                className="mt-2"
                data-testid="slider-audio-volume"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel-audio">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name || 
                !formData.filePath || 
                uploadStatus === "uploading" || 
                uploadStatus === "categorizing" ||
                createMutation.isPending || 
                updateMutation.isPending
              }
              data-testid="button-save-audio"
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
