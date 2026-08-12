import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, Send, Search, MoreVertical, Phone, Video, Paperclip, Smile, Check, CheckCheck, Plus, Loader2, ArrowLeft, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useConversations, useMessages } from "@/hooks/useMessages";
import { useSearch } from "@/hooks/useSearch";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { conversations, isLoading: conversationsLoading, createConversation } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { messages, isLoading: messagesLoading, sendMessage, markMessagesAsRead } = useMessages(selectedConversationId);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const { searchUsers, users: searchedUsers, isSearching } = useSearch();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // On mobile, don't auto-select
  useEffect(() => {
    if (!isMobile && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, isMobile]);

  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
      markMessagesAsRead.mutate();
    }
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (userSearchQuery.length >= 2) {
      searchUsers(userSearchQuery);
    }
  }, [userSearchQuery]);

  // Handle route state for auto-starting conversation
  useEffect(() => {
    const state = location.state as { startConversationWith?: string } | null;
    if (state?.startConversationWith) {
      handleStartConversation(state.startConversationWith);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const filteredConversations = conversations.filter((conv) =>
    conv.participants.some(p =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    try {
      await sendMessage.mutateAsync({ content: newMessage.trim() });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleStartConversation = async (userId: string) => {
    try {
      const conversation = await createConversation.mutateAsync([userId]);
      setSelectedConversationId(conversation.id);
      setShowNewConversation(false);
      setUserSearchQuery("");
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getParticipantName = (conv: typeof conversations[0]) => {
    const otherParticipants = conv.participants.filter(p => p.id !== user?.id);
    if (otherParticipants.length === 0) return "Unknown";
    if (otherParticipants.length === 1) return otherParticipants[0].full_name || "User";
    return `${otherParticipants[0].full_name || "User"} +${otherParticipants.length - 1}`;
  };

  const showChatOnMobile = isMobile && selectedConversationId;
  const showListOnMobile = isMobile && !selectedConversationId;

  // New Conversation Dialog
  const newConversationDialog = (
    <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <PenSquare className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search for users..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
          />
          <ScrollArea className="max-h-80">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchedUsers.length > 0 ? (
              <div className="space-y-2">
                {searchedUsers.filter(u => u.id !== user?.id).map((searchedUser) => (
                  <button
                    key={searchedUser.id}
                    onClick={() => handleStartConversation(searchedUser.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={searchedUser.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(searchedUser.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{searchedUser.full_name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{searchedUser.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : userSearchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            ) : (
              <p className="text-center text-muted-foreground py-4">Type to search for users</p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Conversation list panel
  const conversationList = (
    <div className={cn(
      "border-r border-border flex flex-col bg-card",
      isMobile ? "w-full" : "w-80 shrink-0"
    )}>
      {/* List Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground text-lg">Messages</h2>
        {newConversationDialog}
      </div>
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0"
          />
        </div>
      </div>
      {/* Conversations */}
      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversationId(conversation.id)}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                selectedConversationId === conversation.id && "bg-muted"
              )}
            >
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={conversation.participants[0]?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(conversation.participants[0]?.full_name || null)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-sm truncate",
                    conversation.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"
                  )}>
                    {getParticipantName(conversation)}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {conversation.last_message?.created_at
                      ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={cn(
                    "text-sm truncate flex-1",
                    conversation.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {conversation.last_message?.content || "No messages yet"}
                  </p>
                  {conversation.unread_count > 0 && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <Button
              variant="link"
              className="mt-2 text-sm"
              onClick={() => setShowNewConversation(true)}
            >
              Start a new conversation
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Chat area panel
  const chatArea = selectedConversation ? (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Chat Header */}
      <div className="h-[60px] px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedConversationId(null)} className="shrink-0 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedConversation.participants[0]?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(selectedConversation.participants[0]?.full_name || null)}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-foreground text-sm">
            {getParticipantName(selectedConversation)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                )}
              >
                {message.sender_id !== user?.id && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={message.sender?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(message.sender?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-4 py-2",
                    message.sender_id === user?.id
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className={cn(
                    "flex items-center gap-1 mt-0.5",
                    message.sender_id === user?.id ? "justify-end" : "justify-start"
                  )}>
                    <span className={cn(
                      "text-[10px]",
                      message.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {message.sender_id === user?.id && (
                      message.is_read ? (
                        <CheckCheck className="h-3 w-3 text-primary-foreground/60" />
                      ) : (
                        <Check className="h-3 w-3 text-primary-foreground/60" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            className="flex-1 bg-muted/50 border-0 rounded-full"
          />
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
            <Smile className="h-4 w-4" />
          </Button>
          {newMessage.trim() && (
            <Button
              size="icon"
              className="shrink-0 h-9 w-9 rounded-full"
              onClick={handleSendMessage}
              disabled={sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium text-foreground">Your Messages</p>
        <p className="text-sm mt-1">Send private messages to friends and groups</p>
        <Button className="mt-4" onClick={() => setShowNewConversation(true)}>
          Send Message
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex bg-background">
      {/* Mobile: show list OR chat */}
      {isMobile ? (
        showChatOnMobile ? chatArea : conversationList
      ) : (
        <>
          {conversationList}
          {chatArea}
        </>
      )}
    </div>
  );
}
