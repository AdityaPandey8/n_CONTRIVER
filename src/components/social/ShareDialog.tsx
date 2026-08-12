import { useState } from "react";
import { Copy, Check, Linkedin, Facebook, Mail, Link2, MessageCircle, Repeat2, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useShare } from "@/hooks/useShare";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/contexts/AuthContext";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
  postId?: string;
  shortId?: string;
}

export function ShareDialog({ open, onOpenChange, title, url, postId, shortId }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [repostCaption, setRepostCaption] = useState("");
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { shareToWhatsApp, createRepost, shareToConnection } = useShare();
  const { connections } = useConnections();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleRepost = async () => {
    await createRepost.mutateAsync({
      originalPostId: postId,
      originalShortId: shortId,
      caption: repostCaption,
    });
    setShowRepost(false);
    setRepostCaption("");
    onOpenChange(false);
  };

  const handleShareToConnection = async () => {
    if (!selectedConnection) return;
    
    await shareToConnection.mutateAsync({
      connectionId: selectedConnection,
      postId,
      shortId,
      message: shareMessage,
    });
    setShowConnections(false);
    setSelectedConnection(null);
    setShareMessage("");
    onOpenChange(false);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Twitter/X icon as SVG
  const XIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  if (showRepost && user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat2 className="h-5 w-5" />
              Repost
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a caption to your repost... (optional)"
              value={repostCaption}
              onChange={(e) => setRepostCaption(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRepost(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleRepost} 
                disabled={createRepost.isPending}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {createRepost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Repost"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showConnections && user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Share to Connection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-48">
              {connections.length > 0 ? (
                <div className="space-y-2">
                  {connections.map((conn) => (
                    <button
                      key={conn.id}
                      onClick={() => setSelectedConnection(conn.profile?.id || "")}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        selectedConnection === conn.profile?.id 
                          ? "bg-primary/10 border border-primary" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conn.profile?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(conn.profile?.full_name || null)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{conn.profile?.full_name || "User"}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No connections yet</p>
              )}
            </ScrollArea>
            
            {selectedConnection && (
              <Textarea
                placeholder="Add a message... (optional)"
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="min-h-[80px]"
              />
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConnections(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleShareToConnection} 
                disabled={!selectedConnection || shareToConnection.isPending}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {shareToConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const socialLinks = [
    {
      name: "X",
      icon: XIcon,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: "hover:text-foreground",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "hover:text-blue-500",
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
      color: "hover:text-primary",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Quick Actions */}
          {user && (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShowConnections(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">Connection</span>
              </button>
              
              <button
                onClick={() => shareToWhatsApp(title, url)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="p-2 rounded-full bg-green-500/10">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-xs font-medium">WhatsApp</span>
              </button>
              
              <button
                onClick={() => setShowRepost(true)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="p-2 rounded-full bg-accent/10">
                  <Repeat2 className="h-5 w-5 text-accent" />
                </div>
                <span className="text-xs font-medium">Repost</span>
              </button>
            </div>
          )}

          {/* Social share buttons */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">Share on social media</p>
            <div className="flex justify-center gap-4">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-full bg-secondary/50 text-muted-foreground transition-colors ${link.color}`}
                    title={`Share on ${link.name}`}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Copy link input */}
          <div className="flex gap-2">
            <Input
              value={url}
              readOnly
              className="flex-1 bg-secondary/30 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
