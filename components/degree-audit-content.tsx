"use client"

import { BookOpen, CheckCircle2, Circle, Clock3, FileJson, GraduationCap } from "lucide-react"
import { DegreeAuditUpload } from "@/components/degree-audit-upload"
import { usePlanningData } from "@/components/planning-provider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  type DegreeAuditRequirementNode,
  type DegreeAuditSection,
} from "@/lib/degree-audit"
import { formatCourseDisplayCode } from "@/lib/uf-schedule"
import { cn } from "@/lib/utils"

type RequirementSummary = {
  completed: number
  inProgress: number
  remaining: number
  total: number
}

function sanitizeText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function summarizeRequirementNode(node: DegreeAuditRequirementNode): RequirementSummary {
  if (node.children.length > 0) {
    return node.children.reduce(
      (summary, child) => {
        const childSummary = summarizeRequirementNode(child)
        return {
          completed: summary.completed + childSummary.completed,
          inProgress: summary.inProgress + childSummary.inProgress,
          remaining: summary.remaining + childSummary.remaining,
          total: summary.total + childSummary.total,
        }
      },
      { completed: 0, inProgress: 0, remaining: 0, total: 0 }
    )
  }

  if (!node.code) {
    return { completed: 0, inProgress: 0, remaining: 0, total: 0 }
  }

  if (node.met) {
    return { completed: 1, inProgress: 0, remaining: 0, total: 1 }
  }

  if (node.inProgress) {
    return { completed: 0, inProgress: 1, remaining: 0, total: 1 }
  }

  return { completed: 0, inProgress: 0, remaining: 1, total: 1 }
}

function summarizeRequirementNodes(nodes: DegreeAuditRequirementNode[]) {
  return nodes.reduce(
    (summary, node) => {
      const nodeSummary = summarizeRequirementNode(node)
      return {
        completed: summary.completed + nodeSummary.completed,
        inProgress: summary.inProgress + nodeSummary.inProgress,
        remaining: summary.remaining + nodeSummary.remaining,
        total: summary.total + nodeSummary.total,
      }
    },
    { completed: 0, inProgress: 0, remaining: 0, total: 0 }
  )
}

function summarizeSection(section: DegreeAuditSection) {
  return summarizeRequirementNodes(section.children)
}

function getProgressPercent(progressValue: number | null, summary: RequirementSummary) {
  if (typeof progressValue === "number" && Number.isFinite(progressValue)) {
    return Math.max(0, Math.min(100, Math.round(progressValue * 100)))
  }

  if (summary.total === 0) {
    return 0
  }

  return Math.round(((summary.completed + summary.inProgress) / summary.total) * 100)
}

function getStatusPresentation(status: string, met: boolean, inProgress: boolean) {
  if (met || status === "COMP") {
    return {
      label: "Satisfied",
      icon: CheckCircle2,
      badgeClassName: "bg-green-100 text-green-700",
      iconClassName: "text-green-600",
    }
  }

  if (inProgress || status === "IP") {
    return {
      label: "In Progress",
      icon: Clock3,
      badgeClassName: "bg-primary/10 text-primary",
      iconClassName: "text-primary",
    }
  }

  return {
    label: "Not Satisfied",
    icon: Circle,
    badgeClassName: "bg-muted text-muted-foreground",
    iconClassName: "text-muted-foreground/70",
  }
}

function RequirementNodeCard({
  node,
  depth,
}: {
  node: DegreeAuditRequirementNode
  depth: number
}) {
  const status = getStatusPresentation(node.status, node.met, node.inProgress)
  const summary = summarizeRequirementNode(node)
  const description = sanitizeText(node.description)
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        depth === 0 ? "border-border bg-background" : "border-border/60 bg-muted/20"
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusIcon className={cn("h-4 w-4 shrink-0", status.iconClassName)} />
              <p className="font-medium text-foreground">{node.title}</p>
              {node.code && (
                <Badge variant="outline" className="font-mono">
                  {formatCourseDisplayCode(node.code)}
                </Badge>
              )}
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {node.resultDescription && node.resultDescription !== status.label && (
              <p className="text-xs text-muted-foreground">{node.resultDescription}</p>
            )}
          </div>
          <Badge variant="secondary" className={status.badgeClassName}>
            {status.label}
          </Badge>
        </div>

        {node.coursesTaken.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {node.coursesTaken.map((course) => (
              <div
                key={`${node.id}-${course.code}-${course.termDescription || "na"}`}
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">{formatCourseDisplayCode(course.code)}</span>
                {course.title ? ` · ${course.title}` : ""}
                {course.termDescription ? ` · ${course.termDescription}` : ""}
                {course.grade ? ` · Grade ${course.grade}` : ""}
                {course.inProgress ? " · In Progress" : ""}
              </div>
            ))}
          </div>
        )}

        {node.children.length > 0 && summary.total > 0 && (
          <p className="text-xs text-muted-foreground">
            {summary.completed + summary.inProgress}/{summary.total} requirement
            {summary.total === 1 ? "" : "s"} satisfied or in progress
          </p>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="mt-4 border-l border-border/60 pl-4">
          <div className="space-y-3">
            {node.children.map((child) => (
              <RequirementNodeCard key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function DegreeAuditContent() {
  const { uploadedAudit, uploadedAuditFileName } = usePlanningData()

  const completedCount = uploadedAudit?.completedCourseCodes.length || 0
  const inProgressCount = uploadedAudit?.inProgressCourseCodes.length || 0
  const remainingCount = uploadedAudit?.remainingRequirementCourseCodes.length || 0
  const totalTrackedRequirements = completedCount + inProgressCount + remainingCount
  const satisfiedRequirements = completedCount + inProgressCount
  const overallProgress =
    totalTrackedRequirements === 0
      ? 0
      : Math.round((satisfiedRequirements / totalTrackedRequirements) * 100)

  const sourceLabel =
    uploadedAudit?.sourceFormat === "one-uf"
      ? "ONE.UF degree audit"
      : uploadedAudit?.sourceFormat === "simple"
        ? "Simplified test profile"
        : uploadedAudit?.sourceFormat === "generic"
          ? "Generic JSON parse"
          : "No audit uploaded"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Degree Audit</h1>
        <p className="text-muted-foreground">
          Upload a degree-audit JSON file and review the requirement sections directly from that
          audit instead of the local catalog fallback.
        </p>
      </div>

      <DegreeAuditUpload />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Active Degree Audit</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {uploadedAudit?.studentName || "Upload a degree audit JSON"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploadedAudit?.programName || "Computer Science planning view"} · {sourceLabel}
                </p>
              </div>
              {uploadedAuditFileName && (
                <p className="text-xs text-muted-foreground">Source file: {uploadedAuditFileName}</p>
              )}
            </div>
            <div className="w-full max-w-xl space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tracked requirement progress</span>
                <span className="font-medium">
                  {satisfiedRequirements}/{totalTrackedRequirements}
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Completed and in-progress requirements are derived from the uploaded degree audit.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-3xl font-bold text-primary">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-3xl font-bold text-foreground">{remainingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sections</p>
            <p className="text-3xl font-bold text-primary">{uploadedAudit?.sections?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {uploadedAudit && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="h-4 w-4 text-primary" />
              Parsed Degree Audit Summary
            </CardTitle>
            <CardDescription>
              Schedule generation uses the completed, in-progress, and remaining requirements parsed
              from this audit.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Completed course codes</p>
              <p className="text-2xl font-semibold">{uploadedAudit.completedCourseCodes.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In-progress course codes</p>
              <p className="text-2xl font-semibold">{uploadedAudit.inProgressCourseCodes.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining requirement codes</p>
              <p className="text-2xl font-semibold">
                {uploadedAudit.remainingRequirementCourseCodes.length}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!uploadedAudit && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Upload a ONE.UF degree-audit export such as `billy.json` to render requirement sections
            and remaining courses directly from the audit.
          </CardContent>
        </Card>
      )}

      {uploadedAudit && (uploadedAudit.sections?.length || 0) > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Requirement Sections</h2>
          </div>

          <Accordion
            type="multiple"
            defaultValue={(uploadedAudit.sections || []).slice(0, 3).map((section) => section.id)}
            className="rounded-xl border border-border bg-card px-4"
          >
            {(uploadedAudit.sections || []).map((section) => {
              const summary = summarizeSection(section)
              const progressPercent = getProgressPercent(section.progressValue, summary)
              const status = getStatusPresentation(section.status, section.met, section.inProgress)

              return (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex min-w-0 flex-1 flex-col gap-3 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{section.title}</p>
                        <Badge variant="secondary" className={status.badgeClassName}>
                          {status.label}
                        </Badge>
                      </div>
                      {section.description && (
                        <p className="text-sm font-normal text-muted-foreground">
                          {sanitizeText(section.description)}
                        </p>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {summary.completed + summary.inProgress}/{summary.total} tracked requirement
                            {summary.total === 1 ? "" : "s"} satisfied or in progress
                          </span>
                          <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {section.children.length > 0 ? (
                        section.children.map((node) => (
                          <RequirementNodeCard key={node.id} node={node} depth={0} />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          This section does not include expanded requirement nodes in the uploaded
                          audit.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      )}

      {uploadedAudit && (uploadedAudit.sections?.length || 0) === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            This JSON did not include ONE.UF-style requirement sections. The parser still extracted
            course codes for planning, but the sectioned degree-audit view requires a file shaped
            like `billy.json`.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
