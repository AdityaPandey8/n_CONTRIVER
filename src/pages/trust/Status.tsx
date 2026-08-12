import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const systems = [
  { name: "Web application", status: "Operational" },
  { name: "Authentication", status: "Operational" },
  { name: "AI Gateway", status: "Operational" },
  { name: "Database", status: "Operational" },
  { name: "Realtime messaging", status: "Operational" },
  { name: "File storage", status: "Operational" },
];

export default function Status() {
  return (
    <LegalPageLayout
      title="System Status | CONTRIVER"
      description="Real-time status of CONTRIVER systems, incidents, and scheduled maintenance."
      canonical="/status"
      heading="System status"
      eyebrow="Trust"
    >
      <div className="not-prose mb-8 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
        </span>
        <p className="text-sm font-semibold text-foreground">All systems operational</p>
      </div>

      <div className="not-prose grid gap-3">
        {systems.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <span className="text-sm font-medium text-foreground">{s.name}</span>
            <span className="text-sm text-success">{s.status}</span>
          </div>
        ))}
      </div>

      <h2>Past incidents</h2>
      <p>No incidents reported in the last 90 days.</p>

      <h2>Scheduled maintenance</h2>
      <p>None scheduled. We post planned maintenance at least 48 hours in advance.</p>
    </LegalPageLayout>
  );
}