import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, ArrowLeft, MessageSquare, MapPin, DollarSign, Clock, Building, Loader2, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useJobs } from "@/hooks/useJobs";
import { useNavigateToMessage } from "@/hooks/useNavigateToMessage";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { jobs, isLoading, applyToJob, hasApplied } = useJobs({});
  const { navigateToMessage } = useNavigateToMessage();

  const job = jobs.find(j => j.id === jobId);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (!job) {
    return (
      <div className="text-center py-20">
        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Job not found</h2>
        <Button variant="link" onClick={() => navigate("/dashboard/jobs")}>Back to Jobs</Button>
      </div>
    );
  }

  const applied = hasApplied(job.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/jobs")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{job.job_type}</Badge>
              <Badge variant="outline">{job.work_type}</Badge>
              {job.experience_level && <Badge variant="secondary">{job.experience_level}</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Building className="h-4 w-4" />{job.company_name}</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
              {(job.salary_min || job.salary_max) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary_min ? `$${Number(job.salary_min).toLocaleString()}` : ""}{job.salary_min && job.salary_max ? " – " : ""}{job.salary_max ? `$${Number(job.salary_max).toLocaleString()}` : ""}
                </span>
              )}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDistanceToNow(new Date(job.created_at!), { addSuffix: true })}</span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {!applied ? (
                <Button className="gradient-primary text-primary-foreground gap-2" onClick={() => applyToJob.mutateAsync({ jobId: job.id })} disabled={!user || applyToJob.isPending}>
                  <Send className="h-4 w-4" /> Apply Now
                </Button>
              ) : (
                <Button variant="outline" disabled>Applied ✓</Button>
              )}
              <Button variant="outline" onClick={() => navigateToMessage(job.posted_by)} className="gap-2">
                <MessageSquare className="h-4 w-4" /> Message Recruiter
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Description */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p></CardContent>
        </Card>
      </motion.div>

      {/* Requirements */}
      {job.requirements && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader><CardTitle>Requirements</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.requirements}</p></CardContent>
          </Card>
        </motion.div>
      )}

      {/* Skills */}
      {job.skills_required && job.skills_required.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle>Required Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">{job.skills_required.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="grid grid-cols-2 gap-4">
          <Card><CardContent className="p-4 text-center"><Users className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{job.applications_count || 0}</p><p className="text-xs text-muted-foreground">Applications</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Briefcase className="h-5 w-5 mx-auto text-primary mb-1" /><p className="text-2xl font-bold">{job.views_count || 0}</p><p className="text-xs text-muted-foreground">Views</p></CardContent></Card>
        </div>
      </motion.div>
    </div>
  );
}
