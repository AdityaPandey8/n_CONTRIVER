import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Connection {
  id: string;
  user_a: string;
  user_b: string;
  connection_type: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    email: string;
  };
}

interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  message: string | null;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    email: string;
  };
  receiver?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
    email: string;
  };
}

export function useConnections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all connections for current user
  const { data: connections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ["connections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("connections")
        .select(`
          id, user_a, user_b, connection_type, created_at
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      if (error) throw error;

      // Fetch profiles for the other users in connections
      const otherUserIds = data.map(c => c.user_a === user.id ? c.user_b : c.user_a);
      
      if (otherUserIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email")
        .in("id", otherUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(c => ({
        ...c,
        profile: profileMap.get(c.user_a === user.id ? c.user_b : c.user_a) || null
      })) as Connection[];
    },
    enabled: !!user,
  });

  // Fetch pending connection requests (received)
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["connection-requests", "received", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = data.map(r => r.sender_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email")
        .in("id", senderIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(r => ({
        ...r,
        sender: profileMap.get(r.sender_id)
      })) as ConnectionRequest[];
    },
    enabled: !!user,
  });

  // Fetch sent connection requests
  const { data: sentRequests = [], isLoading: loadingSent } = useQuery({
    queryKey: ["connection-requests", "sent", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch receiver profiles
      const receiverIds = data.map(r => r.receiver_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, headline, email")
        .in("id", receiverIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data.map(r => ({
        ...r,
        receiver: profileMap.get(r.receiver_id)
      })) as ConnectionRequest[];
    },
    enabled: !!user,
  });

  // Check connection status with a specific user
  const getConnectionStatus = (userId: string): "connected" | "pending_sent" | "pending_received" | "none" => {
    if (connections.some(c => c.profile?.id === userId)) return "connected";
    if (sentRequests.some(r => r.receiver_id === userId && r.status === "pending")) return "pending_sent";
    if (pendingRequests.some(r => r.sender_id === userId)) return "pending_received";
    return "none";
  };

  // Send connection request
  const sendRequest = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message?: string }) => {
      if (!user) throw new Error("Must be logged in");
      
      const { error } = await supabase
        .from("connection_requests")
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          message: message || null,
        });

      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "connection_request",
        title: "New Connection Request",
        message: `You have a new connection request`,
        actor_id: user.id,
        target_type: "connection_request",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      toast({ title: "Connection request sent!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Accept connection request
  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("accept_connection_request", {
        request_id: requestId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      toast({ title: "Connection accepted!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Decline connection request
  const declineRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status: "declined" })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      toast({ title: "Request declined" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove connection
  const removeConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("connections")
        .delete()
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      toast({ title: "Connection removed" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Cancel sent request
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("connection_requests")
        .delete()
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
      toast({ title: "Request cancelled" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    connections,
    pendingRequests,
    sentRequests,
    loadingConnections,
    loadingRequests,
    loadingSent,
    getConnectionStatus,
    sendRequest,
    acceptRequest,
    declineRequest,
    removeConnection,
    cancelRequest,
    connectionsCount: connections.length,
    pendingCount: pendingRequests.length,
  };
}
