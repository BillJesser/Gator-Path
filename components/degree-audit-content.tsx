"use client"

import { BookOpen, CheckCircle2, Circle, Clock, FileJson } from "lucide-react"
import { DegreeAuditUpload } from "@/components/degree-audit-upload"
import { usePlanningData } from "@/components/planning-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { requiredCoreCourses } from "@/lib/course-catalog"

type CourseStatus = "completed" | "in-progress" | "remaining"

function getStatusIcon(status: CourseStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
    case "in-progress":
      return <Clock className="h-4 w-4 shrink-0 text-primary" />
    default:
      return <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
  }
}

function getStatusBadge(status: CourseStatus) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Completed
        </Badge>
      )
    case "in-progress":
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          In Progress
        </Badge>
      )
    default:
      return <Badge variant="secondary">Remaining</Badge>
  }
}

export function DegreeAuditContent() {
  const { uploadedAudit, uploadedAuditFileName } = usePlanningData()

  const completedCodes = new Set(uploadedAudit?.completedCourseCodes || [])
  const inProgressCodes = new Set(uploadedAudit?.inProgressCourseCodes || [])
  const remainingCodes = new Set(uploadedAudit?.remainingRequirementCourseCodes || [])

  const normalizedRequiredCourses = requiredCoreCourses.map((course) => {
    let status: CourseStatus = "remaining"

    if (completedCodes.has(course.code)) {
      status = "completed"
    } else if (inProgressCodes.has(course.code)) {
      status = "in-progress"
    } else if (remainingCodes.has(course.code)) {
      status = "remaining"
    }

    return {
      ...course,
      status,
    }
  })

  const overallCompleted = normalizedRequiredCourses.filter((course) => course.status === "completed").length
  const overallInProgress = normalizedRequiredCourses.filter((course) => course.status === "in-progress").length
  const overallRequired = normalizedRequiredCourses.length
  const overallSatisfied = overallCompleted + overallInProgress

  const groupedRequirements = Array.from(
    normalizedRequiredCourses.reduce((groups, course) => {
      const list = groups.get(course.group) || []
      list.push(course)
      groups.set(course.group, list)
      return groups
    }, new Map<string, typeof normalizedRequiredCourses>())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Degree Audit</h1>
        <p className="text-muted-foreground">
          Upload a student degree-audit JSON file and map it against the local UF course catalog.
        </p>
      </div>

      <DegreeAuditUpload />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Required Core Coverage</p>
              <p className="text-3xl font-bold text-primary">
                {overallSatisfied}/{overallRequired}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                completed or currently in progress
              </p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {overallSatisfied}/{overallRequired}
                </span>
              </div>
              <Progress
                value={overallRequired === 0 ? 0 : (overallSatisfied / overallRequired) * 100}
                className="h-3"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {uploadedAudit
                  ? `Using ${uploadedAuditFileName || "the uploaded degree audit"} to classify required-core courses.`
                  : "Upload a degree audit JSON to replace the placeholder required-core status."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-600">{overallCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-3xl font-bold text-primary">{overallInProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-3xl font-bold text-foreground">
              {overallRequired - overallSatisfied}
            </p>
          </CardContent>
        </Card>
      </div>

      {uploadedAudit && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileJson className="h-4 w-4 text-primary" />
              Parsed Degree Audit Summary
            </CardTitle>
            <CardDescription>
              The parser uses the uploaded JSON to extract completed, in-progress, and remaining UF
              course codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Completed codes</p>
              <p className="text-2xl font-semibold">{uploadedAudit.completedCourseCodes.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In-progress codes</p>
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

      <div className="space-y-4">
        {groupedRequirements.map(([groupName, courses]) => {
          const completedCount = courses.filter((course) => course.status === "completed").length
          const inProgressCount = courses.filter((course) => course.status === "in-progress").length
          const satisfiedCount = completedCount + inProgressCount
          const pct = Math.round((satisfiedCount / courses.length) * 100)

          return (
            <Card key={groupName}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{groupName}</CardTitle>
                      <CardDescription>
                        {satisfiedCount}/{courses.length} required courses satisfied or active
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {satisfiedCount}/{courses.length}
                  </Badge>
                </div>
                <Progress value={pct} className="mt-3 h-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div
                      key={course.code}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                    >
                      {getStatusIcon(course.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-primary">{course.displayCode}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                      </div>
                      {getStatusBadge(course.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
