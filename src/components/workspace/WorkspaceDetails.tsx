import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Loader2 } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface Props {
  details: Record<string, any>;
  saveDetail: UseMutationResult<void, Error, { section: string; data: any }>;
}

function DetailSection({ section, label, fields, data, onSave, isSaving }: {
  section: string;
  label: string;
  fields: { key: string; label: string; type: "input" | "textarea" }[];
  data: any;
  onSave: (section: string, data: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>(
    fields.reduce((acc, f) => ({ ...acc, [f.key]: data?.[f.key] || "" }), {})
  );

  return (
    <Card className="bg-card/80 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{label}</CardTitle>
        <Button
          size="sm"
          onClick={() => onSave(section, form)}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label>{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                value={form[f.key]}
                onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                rows={3}
                className="bg-background"
              />
            ) : (
              <Input
                value={form[f.key]}
                onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="bg-background"
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function WorkspaceDetails({ details, saveDetail }: Props) {
  const handleSave = (section: string, data: any) => {
    saveDetail.mutate({ section, data });
  };

  const sections = [
    {
      key: "problem_solution",
      label: "Problem & Solution",
      fields: [
        { key: "problem", label: "Problem Statement", type: "textarea" as const },
        { key: "solution", label: "Solution", type: "textarea" as const },
        { key: "severity", label: "Problem Severity", type: "input" as const },
        { key: "why_now", label: "Why Now?", type: "textarea" as const },
      ],
    },
    {
      key: "target_audience",
      label: "Target Audience",
      fields: [
        { key: "primary_users", label: "Primary Users", type: "input" as const },
        { key: "secondary_users", label: "Secondary Users", type: "input" as const },
        { key: "geography", label: "Geography", type: "input" as const },
        { key: "paying_customer", label: "Paying Customer", type: "input" as const },
        { key: "pain_points", label: "Pain Points", type: "textarea" as const },
      ],
    },
    {
      key: "business_model",
      label: "Business Model",
      fields: [
        { key: "revenue_model", label: "Revenue Model", type: "input" as const },
        { key: "pricing_strategy", label: "Pricing Strategy", type: "input" as const },
        { key: "value_proposition", label: "Value Proposition", type: "textarea" as const },
        { key: "scalability", label: "Scalability", type: "textarea" as const },
      ],
    },
    {
      key: "competitors",
      label: "Competitors",
      fields: [
        { key: "direct_competitors", label: "Direct Competitors", type: "textarea" as const },
        { key: "indirect_competitors", label: "Indirect Competitors", type: "textarea" as const },
        { key: "usp", label: "Unique Advantage (USP)", type: "textarea" as const },
      ],
    },
  ];

  return (
    <Tabs defaultValue="problem_solution" className="space-y-4">
      <TabsList className="grid grid-cols-2 lg:grid-cols-4">
        <TabsTrigger value="problem_solution">Problem</TabsTrigger>
        <TabsTrigger value="target_audience">Audience</TabsTrigger>
        <TabsTrigger value="business_model">Business</TabsTrigger>
        <TabsTrigger value="competitors">Competitors</TabsTrigger>
      </TabsList>
      {sections.map((s) => (
        <TabsContent key={s.key} value={s.key}>
          <DetailSection
            section={s.key}
            label={s.label}
            fields={s.fields}
            data={details[s.key]}
            onSave={handleSave}
            isSaving={saveDetail.isPending}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
