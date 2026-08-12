import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Star, Trophy, Flame, CheckCircle2, ArrowRight, GraduationCap, ExternalLink, Play, Image, Loader2, ShieldCheck } from "lucide-react";
import { useLearning, LearningTrack, Lesson } from "@/hooks/useLearning";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-700 border-green-200",
  intermediate: "bg-blue-500/10 text-blue-700 border-blue-200",
  advanced: "bg-purple-500/10 text-purple-700 border-purple-200",
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  beginner: <BookOpen className="h-5 w-5" />,
  intermediate: <Star className="h-5 w-5" />,
  advanced: <Trophy className="h-5 w-5" />,
};

export default function Learning() {
  const { tracks, progress, totalPoints, totalCompleted, streakDays, completeLesson, verifyLesson } = useLearning();
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ track: LearningTrack; lesson: Lesson } | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const getTrackProgress = (track: LearningTrack) => {
    const p = progress.find(pr => pr.track_id === track.id);
    if (!p) return { completed: 0, total: track.lessons.length, percent: 0 };
    return {
      completed: p.completed_lessons.length,
      total: track.lessons.length,
      percent: Math.round((p.completed_lessons.length / track.lessons.length) * 100),
    };
  };

  const isLessonCompleted = (trackId: string, lessonId: string) => {
    const p = progress.find(pr => pr.track_id === trackId);
    return p?.completed_lessons.includes(lessonId) || false;
  };

  const handleVerify = async (track: LearningTrack, lesson: Lesson) => {
    setVerifying(lesson.id);
    try {
      const result = await verifyLesson.mutateAsync({
        lessonId: lesson.id,
        workspaceTab: lesson.workspace_tab,
      });
      if (result.verified) {
        completeLesson.mutate({ trackId: track.id, lessonId: lesson.id, points: lesson.points });
      }
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          Learning Path
        </h1>
        <p className="text-muted-foreground text-sm">Build your startup skills step by step</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Lessons Done</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-1 text-orange-500" />
            <p className="text-2xl font-bold">{streakDays}</p>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
      </div>

      {/* Tracks */}
      <div className="space-y-4">
        {tracks.map(track => {
          const tp = getTrackProgress(track);
          const isExpanded = expandedTrack === track.id;

          return (
            <motion.div key={track.id} layout>
              <Card className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${LEVEL_COLORS[track.level]}`}>
                        {LEVEL_ICONS[track.level]}
                      </div>
                      <div>
                        <CardTitle className="text-base">{track.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{track.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="capitalize">{track.level}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{tp.completed}/{tp.total} lessons</p>
                    </div>
                  </div>
                  <Progress value={tp.percent} className="mt-3 h-2" />
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {track.lessons.map((lesson: Lesson, i: number) => {
                            const completed = isLessonCompleted(track.id, lesson.id);
                            return (
                              <div
                                key={lesson.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${completed ? "bg-primary/5 border-primary/20" : "bg-muted/30 hover:bg-muted/50"}`}
                                onClick={() => setSelectedLesson({ track, lesson })}
                              >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                  {completed ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{lesson.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{lesson.description}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">{lesson.points} pts</Badge>
                                {completed ? (
                                  <Badge className="text-xs shrink-0">Done</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 shrink-0"
                                    disabled={verifying === lesson.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerify(track, lesson);
                                    }}
                                  >
                                    {verifying === lesson.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ShieldCheck className="h-3 w-3" />
                                    )}
                                    Verify
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Lesson Detail Dialog */}
      <Dialog open={!!selectedLesson} onOpenChange={(o) => !o && setSelectedLesson(null)}>
        <DialogContent className="max-w-lg">
          {selectedLesson && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedLesson.lesson.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLesson.lesson.description}</p>

                {/* Rich content fields */}
                {(selectedLesson.lesson as any).content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{(selectedLesson.lesson as any).content}</p>
                  </div>
                )}

                {(selectedLesson.lesson as any).video_url && (
                  <a
                    href={(selectedLesson.lesson as any).video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    <Play className="h-4 w-4 text-primary" />
                    Watch Video Lesson
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                )}

                {(selectedLesson.lesson as any).image_url && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={(selectedLesson.lesson as any).image_url} alt={selectedLesson.lesson.title} className="w-full h-auto" />
                  </div>
                )}

                {(selectedLesson.lesson as any).links && Array.isArray((selectedLesson.lesson as any).links) && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Resources</p>
                    {(selectedLesson.lesson as any).links.map((link: any, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted text-sm transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 text-primary shrink-0" />
                        {link.title || link.url}
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant="secondary">{selectedLesson.lesson.points} points</Badge>
                  <p className="text-xs text-muted-foreground">
                    Workspace tab: <span className="font-medium capitalize">{selectedLesson.lesson.workspace_tab}</span>
                  </p>
                </div>

                {!isLessonCompleted(selectedLesson.track.id, selectedLesson.lesson.id) && (
                  <Button
                    className="w-full gap-2"
                    disabled={verifying === selectedLesson.lesson.id}
                    onClick={() => handleVerify(selectedLesson.track, selectedLesson.lesson)}
                  >
                    {verifying === selectedLesson.lesson.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Verify & Complete
                  </Button>
                )}

                {isLessonCompleted(selectedLesson.track.id, selectedLesson.lesson.id) && (
                  <div className="flex items-center justify-center gap-2 text-primary text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    Lesson Completed!
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
