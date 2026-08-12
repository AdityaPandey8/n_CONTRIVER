import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Presentation, Sparkles, Edit3, Save, Download, Trash2, FileText, StickyNote } from "lucide-react";
import { usePitchDeck, PitchSlide } from "@/hooks/usePitchDeck";
import { IdeaWorkspace } from "@/hooks/useIdeaWorkspace";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  workspace: IdeaWorkspace;
  details: Record<string, any>;
  validations: any[];
}

export function WorkspacePitchDeck({ workspace, details, validations }: Props) {
  const { pitchDecks, generateDeck, updateDeck, deleteDeck } = usePitchDeck(workspace.id);
  const [style, setStyle] = useState("minimal");
  const [mode, setMode] = useState("normal");
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showSetup, setShowSetup] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  const activeDeck = pitchDecks.find(d => d.id === selectedDeck) || pitchDecks[0];
  const latestValidation = validations[0];

  const handleGenerate = () => {
    generateDeck.mutate({
      ideaName: workspace.idea_name,
      oneLiner: workspace.one_liner || undefined,
      domain: workspace.domain,
      stage: workspace.stage,
      details,
      validationScore: latestValidation?.overall_score,
      style,
      mode,
    });
    setShowSetup(false);
  };

  const handleSaveSlide = (deckId: string, slideIndex: number) => {
    if (!activeDeck) return;
    const updatedSlides = [...activeDeck.slides];
    updatedSlides[slideIndex] = { ...updatedSlides[slideIndex], content: editContent };
    updateDeck.mutate({ id: deckId, slides: updatedSlides as any });
    setEditingSlide(null);
  };

  const handleExportPPTX = async () => {
    if (!activeDeck) return;
    const pptxgenjs = await import("pptxgenjs");
    const pptx = new pptxgenjs.default();

    activeDeck.slides.forEach((slide: PitchSlide) => {
      const s = pptx.addSlide();
      s.addText(slide.title, { x: 0.5, y: 0.3, w: 9, h: 1, fontSize: 28, bold: true, color: "1a1a2e" });
      s.addText(slide.content, { x: 0.5, y: 1.5, w: 9, h: 4.5, fontSize: 14, color: "333333", breakLine: true });
      if (slide.notes) s.addNotes(slide.notes);
    });

    pptx.writeFile({ fileName: `${activeDeck.title}.pptx` });
  };

  if (pitchDecks.length === 0) {
    return (
      <div className="text-center py-16">
        <Presentation className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-xl font-semibold mb-2">AI Pitch Deck Generator</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Generate a professional pitch deck from your workspace data. Choose a style and mode to get started.
        </p>

        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Generate AI Pitch Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Your Pitch Deck</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Style</label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mode</label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Standard</SelectItem>
                    <SelectItem value="investor">Investor Mode (includes financials)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGenerate} disabled={generateDeck.isPending} className="w-full gap-2">
                {generateDeck.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generateDeck.isPending ? "Generating..." : "Generate Deck"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Sources Panel */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-2">
              <p className="font-medium">Data used:</p>
              <Badge variant="secondary" className="text-xs">Workspace: {workspace.idea_name}</Badge>
              {Object.keys(details).map(s => (
                <Badge key={s} variant="outline" className="text-xs ml-1">{s}</Badge>
              ))}
              {latestValidation && (
                <Badge variant="outline" className="text-xs ml-1">Validation: {latestValidation.overall_score}/100</Badge>
              )}
            </div>
            <Dialog open={showSetup} onOpenChange={setShowSetup}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2 mt-4">
                  <Sparkles className="h-3 w-3" />
                  New Deck
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Configure New Pitch Deck</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Style</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mode</label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Standard</SelectItem>
                        <SelectItem value="investor">Investor Mode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerate} disabled={generateDeck.isPending} className="w-full gap-2">
                    {generateDeck.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generateDeck.isPending ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {pitchDecks.length > 1 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Previous Decks</p>
                {pitchDecks.map(d => (
                  <Button
                    key={d.id}
                    variant={d.id === activeDeck?.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start text-xs truncate"
                    onClick={() => setSelectedDeck(d.id)}
                  >
                    {d.title}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slides Preview */}
      <div className="lg:col-span-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{activeDeck?.title}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPPTX} className="gap-1">
              <Download className="h-3 w-3" />
              Export .pptx
            </Button>
            <Button variant="ghost" size="sm" onClick={() => activeDeck && deleteDeck.mutate(activeDeck.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {activeDeck?.slides.map((slide: PitchSlide, i: number) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                      <CardTitle className="text-sm">{slide.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        if (editingSlide === i) {
                          setEditingSlide(null);
                        } else {
                          setEditingSlide(i);
                          setEditContent(slide.content);
                        }
                      }}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {editingSlide === i ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={6}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveSlide(activeDeck.id, i)} className="gap-1">
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingSlide(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{slide.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Notes Panel */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Speaker Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[550px]">
              <div className="space-y-3">
                {activeDeck?.slides.map((slide: PitchSlide, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Slide {i + 1}: {slide.title}</p>
                    <p className="text-xs text-muted-foreground">{slide.notes || "No notes"}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
