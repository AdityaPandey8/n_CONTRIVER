import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Video,
  FileText,
  X,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePosts, useUploadMedia } from "@/hooks/usePosts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ContentType = "text" | "image" | "video";

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const [contentType, setContentType] = useState<ContentType>("text");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createPost } = usePosts();
  const { uploadToStorage } = useUploadMedia();
  const { toast } = useToast();

  const contentTypes = [
    { type: "text" as const, icon: FileText, label: "Text" },
    { type: "image" as const, icon: Image, label: "Image" },
    { type: "video" as const, icon: Video, label: "Video" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    if ((contentType === "image" && !isImage) || (contentType === "video" && !isVideo)) {
      toast({
        title: "Invalid file type",
        description: `Please select a ${contentType} file`,
        variant: "destructive",
      });
      return;
    }

    // Size limit (50MB for video, 10MB for image)
    const maxSize = contentType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${contentType === "video" ? "50MB" : "10MB"}`,
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async () => {
    if (!caption.trim() && contentType === "text") {
      toast({ title: "Please add some content", variant: "destructive" });
      return;
    }

    if ((contentType === "image" || contentType === "video") && !file) {
      toast({ title: `Please select a ${contentType}`, variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      let mediaUrl: string | undefined;

      if (file) {
        mediaUrl = await uploadToStorage(file, "posts");
      }

      await createPost.mutateAsync({
        content_type: contentType,
        caption: caption.trim() || undefined,
        description: description.trim() || undefined,
        media_url: mediaUrl,
      });

      toast({ title: "Post created successfully!" });
      handleClose();
    } catch (error) {
      console.error("Failed to create post:", error);
      toast({
        title: "Failed to create post",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setContentType("text");
    setCaption("");
    setDescription("");
    setFile(null);
    setPreview(null);
    onOpenChange(false);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content type selector */}
          <div className="flex gap-2">
            {contentTypes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => {
                  setContentType(type);
                  removeFile();
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all",
                  contentType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="bg-secondary/30 border-border/50 resize-none"
            />
          </div>

          {/* Media upload */}
          {contentType !== "text" && (
            <div className="space-y-2">
              <Label>
                {contentType === "image" ? "Upload Image" : "Upload Video"}
              </Label>

              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative rounded-xl overflow-hidden bg-secondary/30"
                  >
                    {contentType === "video" ? (
                      <video
                        src={preview}
                        controls
                        className="w-full max-h-64 object-contain"
                      />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full max-h-64 object-contain"
                      />
                    )}
                    <button
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={contentType === "image" ? "image/*" : "video/*"}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-40 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload {contentType}
                      </span>
                      <span className="text-xs text-muted-foreground/60">
                        Max {contentType === "video" ? "50MB" : "10MB"}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="bg-secondary/30 border-border/50"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || createPost.isPending}
              className="gradient-accent text-accent-foreground"
            >
              {isUploading || createPost.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
