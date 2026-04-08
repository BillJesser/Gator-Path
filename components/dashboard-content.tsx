"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePlanningData } from "@/components/planning-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CalendarDays,
  GraduationCap,
  BookOpen,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"

export function DashboardContent() {
  const { uploadedAudit, plannerSemesters } = usePlanningData()

  const plannedCourses = useMemo(
    () => plannerSemesters.flatMap((semester) => semester.courses.map((course) => ({ ...course, semester }))),
    [plannerSemesters]
  )

  if (!uploadedAudit) {
    return null
  }

  const completedCount = uploadedAudit.completedCourseCodes.length
  const inProgressCount = uploadedAudit.inProgressCourseCodes.length
  const remainingCount = uploadedAudit.remainingRequirementCourseCodes.length
  const trackedCount = completedCount + inProgressCount + remainingCount
  const progressValue =
    trackedCount === 0 ? 0 : Math.round(((completedCount + inProgressCount) / trackedCount) * 100)
  const activePlanCount = plannerSemesters.filter((semester) => semester.courses.length > 0).length

  const actionItems = [
    inProgressCount > 0
      ? {
          type: "info" as const,
          message: `${inProgressCount} course${inProgressCount === 1 ? "" : "s"} currently in progress`,
        }
      : null,
    remainingCount > 0
      ? {
          type: "warning" as const,
          message: `${remainingCount} remaining requirement${remainingCount === 1 ? "" : "s"} still to plan`,
        }
      : null,
    activePlanCount > 0
      ? {
          type: "success" as const,
          message: `${activePlanCount} semester${activePlanCount === 1 ? "" : "s"} already planned`,
        }
      : null,
  ].filter((item): item is { type: "warning" | "info" | "success"; message: string } => item !== null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          {uploadedAudit.studentName || "Uploaded Student"}
        </h1>
        <p className="text-muted-foreground">
          {uploadedAudit.programName || "Degree audit loaded"}.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl font-semibold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-xl font-semibold">{remainingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planned Semesters</p>
                <p className="text-xl font-semibold">{activePlanCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Degree Progress</CardTitle>
            <CardDescription>{uploadedAudit.programName || "Uploaded degree audit"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tracked completion</span>
                <span className="font-medium">
                  {completedCount + inProgressCount}/{trackedCount || 0}
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-semibold">{completedCount}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="mt-1 text-2xl font-semibold">{inProgressCount}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="mt-1 text-2xl font-semibold">{remainingCount}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/degree-audit">
                View Full Degree Audit
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Action Items</CardTitle>
            <CardDescription>Derived from the uploaded degree audit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No action items yet.</p>
            ) : (
              actionItems.map((item) => (
                <div
                  key={item.message}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                >
                  {item.type === "warning" && (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  )}
                  {item.type === "info" && (
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  )}
                  {item.type === "success" && (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  )}
                  <p className="text-sm">{item.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Planned Courses</CardTitle>
            <CardDescription>Semester planner content for this uploaded audit</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/planner">
              <CalendarDays className="mr-2 h-4 w-4" />
              Open Planner
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {plannedCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No planned courses yet. Use the semester planner to build recommendations from this
              degree audit.
            </p>
          ) : (
            <div className="space-y-3">
              {plannedCourses.map((entry) => (
                <div
                  key={`${entry.semester.id}-${entry.code}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{entry.displayCode}</p>
                      <p className="text-sm text-muted-foreground">{entry.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.semester.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
