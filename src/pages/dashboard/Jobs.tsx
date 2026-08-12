import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, Search, Plus, MapPin, DollarSign, Clock, 
  Building, Filter, Loader2, ExternalLink, Send, Info, ArrowLeft,
  Users, MessageSquare, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

const workTypes = [
  { value: "all", label: "All Types" },
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
];

const jobTypes = [
  { value: "all", label: "All Types" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

const experienceLevels = [
  { value: "all", label: "All Levels" },
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    workType: "all",
    jobType: "all",
    experienceLevel: "all",
    search: "",
  });
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const { 
    jobs, 
    myPostedJobs, 
    myApplications, 
    isLoading, 
    postJob, 
    applyToJob,
    hasApplied 
  } = useJobs({
    workType: filters.workType !== "all" ? filters.workType : undefined,
    jobType: filters.jobType !== "all" ? filters.jobType : undefined,
    experienceLevel: filters.experienceLevel !== "all" ? filters.experienceLevel : undefined,
    search: filters.search || undefined,
  });

  // New job form state
  const [newJob, setNewJob] = useState({
    company_name: "",
    title: "",
    description: "",
    requirements: "",
    location: "",
    work_type: "remote" as "remote" | "onsite" | "hybrid",
    job_type: "full-time" as "full-time" | "part-time" | "contract" | "internship",
    skills_required: [] as string[],
    experience_level: "mid" as "entry" | "mid" | "senior" | "lead" | "executive" | null,
    salary_min: undefined as number | undefined,
    salary_max: undefined as number | undefined,
    is_active: true,
  });

  const [skillInput, setSkillInput] = useState("");

  const handlePostJob = async () => {
    if (!newJob.company_name || !newJob.title || !newJob.description || !newJob.location) return;
    
    await postJob.mutateAsync({
      ...newJob,
      company_logo_url: null,
      salary_currency: "USD",
    });
    setNewJob({
      company_name: "",
      title: "",
      description: "",
      requirements: "",
      location: "",
      work_type: "remote",
      job_type: "full-time",
      skills_required: [],
      experience_level: "mid",
      salary_min: undefined,
      salary_max: undefined,
      is_active: true,
    });
    setShowPostModal(false);
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    
    await applyToJob.mutateAsync({
      jobId: selectedJob.id,
      coverLetter: coverLetter || undefined,
    });
    setCoverLetter("");
    setShowApplyModal(false);
    setSelectedJob(null);
  };

  const addSkill = () => {
    if (skillInput.trim() && !newJob.skills_required.includes(skillInput.trim())) {
      setNewJob(p => ({ ...p, skills_required: [...p.skills_required, skillInput.trim()] }));
      setSkillInput("");
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background overflow-y-auto"
          >
            <div className="max-w-2xl mx-auto px-6 py-8">
              <Button variant="ghost" size="sm" onClick={() => setShowInfo(false)} className="mb-6 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-foreground mb-6">How Jobs Works</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Building className="h-5 w-5 text-primary" />
                    For Recruiters / Founders
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Recruiters and founders post job listings with title, company, description, requirements, salary range, location, work type (remote/onsite/hybrid), and required skills.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Search className="h-5 w-5 text-primary" />
                    For Job Seekers
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Job seekers browse active listings, filter by criteria, and apply with a cover letter and optional resume.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Application Tracking
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Recruiters see who applied and can update application statuses; applicants can view their own submissions.
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    How They Connect
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A recruiter posts a Job → talent users browse and apply. A recruiter browses the Talents pool → finds candidates and can reach out via the platform's messaging system.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            Jobs
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInfo(true)}>
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </h1>
          <p className="text-muted-foreground mt-1">
            Find your next opportunity or hire top talent
          </p>
        </div>
        <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Post a Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Post a Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    value={newJob.company_name}
                    onChange={(e) => setNewJob(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Your company"
                  />
                </div>
                <div>
                  <Label>Job Title *</Label>
                  <Input
                    value={newJob.title}
                    onChange={(e) => setNewJob(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., Senior Engineer"
                  />
                </div>
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the role and responsibilities"
                  rows={4}
                />
              </div>
              <div>
                <Label>Requirements</Label>
                <Textarea
                  value={newJob.requirements}
                  onChange={(e) => setNewJob(p => ({ ...p, requirements: e.target.value }))}
                  placeholder="Required qualifications and skills"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location *</Label>
                  <Input
                    value={newJob.location}
                    onChange={(e) => setNewJob(p => ({ ...p, location: e.target.value }))}
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div>
                  <Label>Work Type</Label>
                  <Select value={newJob.work_type} onValueChange={(v: any) => setNewJob(p => ({ ...p, work_type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Type</Label>
                  <Select value={newJob.job_type} onValueChange={(v: any) => setNewJob(p => ({ ...p, job_type: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Experience Level</Label>
                  <Select value={newJob.experience_level || ""} onValueChange={(v: any) => setNewJob(p => ({ ...p, experience_level: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill"
                  />
                  <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newJob.skills_required.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => 
                      setNewJob(p => ({ ...p, skills_required: p.skills_required.filter((_, idx) => idx !== i) }))
                    }>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handlePostJob} 
                disabled={!newJob.company_name || !newJob.title || !newJob.description || !newJob.location || postJob.isPending}
                className="w-full"
              >
                {postJob.isPending ? "Posting..." : "Post Job"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
            placeholder="Search jobs..."
            className="pl-10"
          />
        </div>
        <Select value={filters.workType} onValueChange={(v) => setFilters(p => ({ ...p, workType: v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Work Type" />
          </SelectTrigger>
          <SelectContent>
            {workTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.jobType} onValueChange={(v) => setFilters(p => ({ ...p, jobType: v }))}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent>
            {jobTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="browse" className="w-full">
        <TabsList>
          <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
          {user && <TabsTrigger value="applications">My Applications</TabsTrigger>}
          {user && <TabsTrigger value="posted">Posted Jobs</TabsTrigger>}
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  hasApplied={hasApplied(job.id)}
                  onApply={() => {
                    setSelectedJob(job);
                    setShowApplyModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          {myApplications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{app.job?.title}</h3>
                        <p className="text-muted-foreground">{app.job?.company_name}</p>
                      </div>
                      <Badge variant={
                        app.status === "pending" ? "secondary" :
                        app.status === "shortlisted" ? "default" :
                        app.status === "hired" ? "default" :
                        "destructive"
                      }>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="posted" className="mt-6">
          {myPostedJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">You haven't posted any jobs yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myPostedJobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{job.title}</h3>
                        <p className="text-muted-foreground">{job.company_name}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={job.is_active ? "default" : "secondary"}>
                          {job.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.applications_count} applications
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Apply Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-4">
              at {selectedJob?.company_name}
            </p>
            <div>
              <Label>Cover Letter (optional)</Label>
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Why are you a great fit for this role?"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button onClick={handleApply} disabled={applyToJob.isPending}>
              {applyToJob.isPending ? "Applying..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobCard({ job, hasApplied, onApply }: { job: any; hasApplied: boolean; onApply: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = `/dashboard/job/${job.id}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building className="h-4 w-4" />
                <span>{job.company_name}</span>
              </div>
            </div>
            {hasApplied ? (
              <Badge variant="secondary">Applied</Badge>
            ) : (
              <Button onClick={onApply}>
                <Send className="h-4 w-4 mr-2" />
                Apply
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </Badge>
            <Badge variant="outline">{job.work_type}</Badge>
            <Badge variant="outline">{job.job_type}</Badge>
            {job.experience_level && (
              <Badge variant="outline">{job.experience_level}</Badge>
            )}
          </div>

          <p className="text-muted-foreground line-clamp-2 mb-3">{job.description}</p>

          {job.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {job.skills_required.slice(0, 5).map((skill: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
              {job.skills_required.length > 5 && (
                <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 5}</Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {(job.salary_min || job.salary_max) && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary_min && job.salary_max 
                    ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                    : job.salary_min 
                      ? `From ${job.salary_min.toLocaleString()}`
                      : `Up to ${job.salary_max?.toLocaleString()}`
                  } {job.salary_currency}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
