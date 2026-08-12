import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { Investor } from "@/hooks/useInvestors";
import { PitchDeck } from "@/hooks/usePitchDeck";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor;
  pitchDecks: PitchDeck[];
  onShare: (data: { investor_id: string; pitch_deck_id?: string; message?: string }) => void;
  isSharing: boolean;
}

export function PitchShareModal({ open, onOpenChange, investor, pitchDecks, onShare, isSharing }: Props) {
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [message, setMessage] = useState("");

  const handleShare = () => {
    onShare({
      investor_id: investor.id,
      pitch_deck_id: selectedDeck || undefined,
      message: message || undefined,
    });
    setMessage("");
    setSelectedDeck("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Pitch with {investor.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {pitchDecks.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Attach Pitch Deck</label>
              <Select value={selectedDeck} onValueChange={setSelectedDeck}>
                <SelectTrigger><SelectValue placeholder="Select a pitch deck (optional)" /></SelectTrigger>
                <SelectContent>
                  {pitchDecks.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Write a brief message to the investor..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleShare} disabled={isSharing} className="w-full gap-2">
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSharing ? "Sending..." : "Send Pitch"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
