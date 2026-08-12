import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UseMutationResult } from "@tanstack/react-query";

interface Props {
  feedback: any[];
  addFeedback: UseMutationResult<void, Error, string>;
}

export function WorkspaceFeedback({ feedback, addFeedback }: Props) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) return;
    addFeedback.mutate(content.trim());
    setContent("");
  };

  return (
    <div className="space-y-6">
      {/* Add Feedback */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Leave Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Share your thoughts, suggestions, or feedback..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="bg-background"
          />
          <Button onClick={handleSubmit} disabled={!content.trim() || addFeedback.isPending}>
            <Send className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Feedback ({feedback.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No feedback yet.</p>
          ) : (
            <div className="space-y-4">
              {feedback.map((f) => (
                <div key={f.id} className="flex gap-3 p-3 rounded-lg bg-secondary/30">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={f.author?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {f.author?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{f.author?.full_name || "User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{f.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
