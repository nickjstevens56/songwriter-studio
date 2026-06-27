"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { PRODUCTION_STAGES, Stage } from "@/lib/productionGuide";
import { getProject, getProductionProgress, setChecklistItem } from "@/lib/storage";
import { Project, ProductionProgress, StageKey } from "@/types";
import ProductionChat from "@/components/ProductionChat";

const STAGE_COLORS: Record<StageKey, { badge: string; check: string; border: string; bg: string }> = {
  recording: { badge: "text-sky-400 bg-sky-400/10 border-sky-400/20", check: "text-sky-400", border: "border-sky-500/30", bg: "bg-sky-500/5" },
  mixing:    { badge: "text-violet-400 bg-violet-400/10 border-violet-400/20", check: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/5" },
  mastering: { badge: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", check: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
};

function stageProgress(stage: Stage, progress: ProductionProgress): { done: number; total: number } {
  const allSteps = stage.sections.flatMap((s) => s.steps);
  const done = allSteps.filter((s) => progress[stage.key]?.[s.id]).length;
  return { done, total: allSteps.length };
}

export default function ProducePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [progress, setProgress] = useState<ProductionProgress>({ recording: {}, mixing: {}, mastering: {} });
  const [activeStage, setActiveStage] = useState<StageKey>("recording");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push("/"); return; }
    setProject(p);
    setProgress(getProductionProgress(id));
    // expand all sections by default
    const expanded: Record<string, boolean> = {};
    PRODUCTION_STAGES.forEach((stage) => stage.sections.forEach((s) => { expanded[s.id] = true; }));
    setExpandedSections(expanded);
  }, [id]);

  function toggleCheck(stage: StageKey, stepId: string) {
    const next = !progress[stage]?.[stepId];
    setChecklistItem(id, stage, stepId, next);
    setProgress(getProductionProgress(id));
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }

  const currentStage = PRODUCTION_STAGES.find((s) => s.key === activeStage)!;
  const colors = STAGE_COLORS[activeStage];

  if (!project) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${id}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs text-zinc-500">{project.title}</p>
            <h1 className="text-lg font-semibold leading-tight">Production Guide</h1>
          </div>
        </div>
        <button
          onClick={() => setShowChat(!showChat)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            showChat
              ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          }`}
        >
          <Sparkles size={14} /> Ask your producer
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Stage sidebar */}
        <aside className="w-52 border-r border-zinc-800 flex flex-col pt-6 gap-1 px-3">
          {PRODUCTION_STAGES.map((stage) => {
            const { done, total } = stageProgress(stage, progress);
            const pct = total ? Math.round((done / total) * 100) : 0;
            const isActive = activeStage === stage.key;
            const c = STAGE_COLORS[stage.key];
            return (
              <button
                key={stage.key}
                onClick={() => setActiveStage(stage.key)}
                className={`w-full text-left rounded-xl px-3 py-3 transition-colors ${
                  isActive ? `${c.bg} border ${c.border}` : "hover:bg-zinc-900"
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-widest mb-1.5 ${isActive ? c.check : "text-zinc-500"}`}>
                  {stage.label}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stage.key === "recording" ? "bg-sky-500" :
                        stage.key === "mixing" ? "bg-violet-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-600">{done}/{total}</span>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto px-8 py-6">
            {/* Stage header */}
            <div className="mb-8">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${colors.badge}`}>
                {currentStage.label}
              </div>
              <h2 className="text-2xl font-bold">{currentStage.tagline}</h2>
              <div className="flex items-center gap-3 mt-3">
                {(() => {
                  const { done, total } = stageProgress(currentStage, progress);
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <>
                      <div className="flex-1 max-w-xs h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            activeStage === "recording" ? "bg-sky-500" :
                            activeStage === "mixing" ? "bg-violet-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-zinc-500">{done} of {total} steps complete</span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {currentStage.sections.map((section) => (
                <div key={section.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-zinc-100">{section.title}</h3>
                      <p className="text-sm text-zinc-500 mt-0.5">{section.intro}</p>
                    </div>
                    {expandedSections[section.id] ? (
                      <ChevronDown size={16} className="text-zinc-500 shrink-0 ml-4" />
                    ) : (
                      <ChevronRight size={16} className="text-zinc-500 shrink-0 ml-4" />
                    )}
                  </button>

                  {expandedSections[section.id] && (
                    <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
                      {section.steps.map((step) => {
                        const done = progress[activeStage]?.[step.id] ?? false;
                        const expanded = expandedSteps[step.id];
                        return (
                          <div key={step.id} className={done ? "opacity-60" : ""}>
                            <div className="flex items-start gap-3 px-6 py-3.5">
                              <button
                                onClick={() => toggleCheck(activeStage, step.id)}
                                className={`mt-0.5 shrink-0 transition-colors ${done ? colors.check : "text-zinc-700 hover:text-zinc-400"}`}
                              >
                                {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => toggleStep(step.id)}
                                  className="flex items-center gap-2 text-left w-full"
                                >
                                  <span className={`text-sm font-medium ${done ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                                    {step.label}
                                  </span>
                                  {expanded ? (
                                    <ChevronDown size={13} className="text-zinc-600 shrink-0" />
                                  ) : (
                                    <ChevronRight size={13} className="text-zinc-600 shrink-0" />
                                  )}
                                </button>
                                {expanded && (
                                  <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{step.detail}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>

          {/* AI chat panel */}
          {showChat && (
            <div className="w-96 border-l border-zinc-800 flex flex-col">
              <ProductionChat stage={activeStage} projectTitle={project.title} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
