import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard, CreatePostModal } from "@/components/social";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";

export default function SocialFeed() {
  const { user } = useAuth();
  const { posts, isLoading, deletePost } = usePosts();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Button */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full gradient-accent text-accent-foreground shadow-lg h-12"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Post
          </Button>
        </motion.div>
      )}

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(id) => deletePost.mutate(id)}
            />
          ))}
        </div>
      )}

      <CreatePostModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </div>
  );
}
