"use client"

import { useMemo, useState } from "react"
import { BookOpen, CalendarDays, Loader2, RefreshCw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePlanningData } from "@/components/planning-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchUfScheduleBatch } from "@/lib/fetch-uf-schedule"
import {
  TERM_OPTIONS,
  buildScheduleOptions,
  getRecommendedCandidates,
  getTermLabel,
  parseMaxCredits,
  type AuditRemainingCourseInput,
  type FormatPreference,
  type GeneratedScheduleOption,
  type TimePreference,
} from "@/lib/uf-schedule"

type PlannerCourse = {
  code: string
  name: string
}

type PlannerSemester = {
  id: string
  label: string
  termCode: string
  courses: PlannerCourse[]
}

const initialSemesters: PlannerSemester[] = [
  {
    id: "summer-2026",
    label: "Summer 2026",
    termCode: "2265",
    courses: [
      { code: "COP4600", name: "Operating Systems" },
      { code: "CEN3031", name: "Introduction to Software Engineering" },
      { code: "MAS3114", name: "Computational Linear Algebra" },
    ],
  },
  {
    id: "fall-2026",
    label: "Fall 2026",
    termCode: "2268",
    courses: [
      { code: "COP4533", name: "Algorithm Abstraction and Design" },
      { code: "CIS4301", name: "Information and Database Systems" },
      { code: "STA3032", name: "Engineering Statistics" },
    ],
  },
  {
    id: "spring-2027",
    label: "Spring 2027",
    termCode: "2271",
    courses: [
      { code: "CNT4007", name: "Computer Network Fundamentals" },
      { code: "EGS4034", name: "Engineering Ethics and Professionalism" },
    ],
  },
]

export function PlannerContent() {
  const { uploadedAudit } = usePlanningData()
  const [semesters, setSemesters] = useState(initialSemesters)
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null)
  const [timePreference, setTimePreference] = useState<TimePreference>("any")
  const [formatPreference, setFormatPreference] = useState<FormatPreference>("any")
  const [maxCredits, setMaxCredits] = useState("12")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [options, setOptions] = useState<GeneratedScheduleOption[]>([])

  const completedCodes = useMemo(
    () => new Set(uploadedAudit?.completedCourseCodes || []),
    [uploadedAudit]
  )
  const inProgressCodes = useMemo(
    () => new Set(uploadedAudit?.inProgressCourseCodes || []),
    [uploadedAudit]
  )
  const remainingCodesFromAudit = useMemo(
    () => new Set(uploadedAudit?.remainingRequirementCourseCodes || []),
    [uploadedAudit]
  )
  const satisfiedCourseCodes = useMemo(
    () => new Set([...completedCodes, ...inProgressCodes]),
    [completedCodes, inProgressCodes]
  )

  const candidatePool = useMemo(
    () =>
      getRecommendedCandidates({
        completedCodes,
        inProgressCodes,
        remainingCodesFromAudit,
        remainingCoursesFromAudit:
          (uploadedAudit?.remainingRequirementCourses as AuditRemainingCourseInput[] | undefined) ||
          [],
        limit: 14,
      }),
    [completedCodes, inProgressCodes, remainingCodesFromAudit, uploadedAudit]
  )

  const activeSemester = semesters.find((semester) => semester.id === activeSemesterId) || null
  const totalPlannedCourses = semesters.reduce((sum, semester) => sum + semester.courses.length, 0)

  const loadRecommendations = async (semesterId: string) => {
    const semester = semesters.find((entry) => entry.id === semesterId)
    if (!semester) {
      return
    }

    if (candidatePool.length === 0) {
      setActiveSemesterId(semesterId)
      setOptions([])
      setWarnings([])
      setError(
        "No remaining courses could be derived from the uploaded degree audit for this semester."
      )
      return
    }

    setActiveSemesterId(semesterId)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchUfScheduleBatch(
        semester.termCode,
        candidatePool.map((course) => course.code)
      )
      setWarnings(response.warnings)
      const generated = buildScheduleOptions({
        courses: response.courses,
        candidates: candidatePool,
        maxCredits: parseMaxCredits(maxCredits),
        timePreference,
        formatPreference,
        satisfiedCourseCodes,
        limit: 6,
      })

      setOptions(generated)
      if (generated.length === 0) {
        setError(
          `No section combinations are currently available for ${semester.label}.`
        )
      }
    } catch (generationError) {
      setOptions([])
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to load live semester recommendations."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const applyRecommendation = (option: GeneratedScheduleOption) => {
    if (!activeSemesterId) {
      return
    }

    setSemesters((current) =>
      current.map((semester) =>
        semester.id === activeSemesterId
          ? {
              ...semester,
              courses: option.courses.map((course) => ({
                code: course.course.code,
                name: course.course.name,
              })),
            }
          : semester
      )
    )
    setActiveSemesterId(null)
    setOptions([])
    setWarnings([])
    setError(null)
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Smart Semester Planner</h1>
          <p className="text-muted-foreground">
            Use the uploaded degree audit and live UF schedule data to build each semester.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Planned semesters</p>
              <p className="text-3xl font-bold text-primary">{semesters.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Courses in plan</p>
              <p className="text-3xl font-bold text-primary">{totalPlannedCourses}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Audit state</p>
              <p className="text-3xl font-bold text-primary">
                {uploadedAudit ? "Loaded" : "Mock"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Recommendation Inputs</CardTitle>
            <CardDescription>
              These settings are shared by the live semester recommendation dialog.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Time</label>
              <Select
                value={timePreference}
                onValueChange={(value) => setTimePreference(value as TimePreference)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Format</label>
              <Select
                value={formatPreference}
                onValueChange={(value) => setFormatPreference(value as FormatPreference)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any format</SelectItem>
                  <SelectItem value="in-person">In-person</SelectItem>
                  <SelectItem value="online">Online / arranged</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Credits</label>
              <Select value={maxCredits} onValueChange={setMaxCredits}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9 credits</SelectItem>
                  <SelectItem value="12">12 credits</SelectItem>
                  <SelectItem value="15">15 credits</SelectItem>
                  <SelectItem value="18">18 credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {semesters.map((semester) => (
            <Card key={semester.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{semester.label}</CardTitle>
                    <CardDescription>
                      API term code {semester.termCode} ({getTermLabel(semester.termCode)})
                    </CardDescription>
                  </div>
                  <Button onClick={() => loadRecommendations(semester.id)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Recommended Semester
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {semester.courses.map((course) => (
                  <div
                    key={`${semester.id}-${course.code}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="rounded-lg bg-primary/10 p-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary">{course.code}</p>
                      <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(activeSemesterId)} onOpenChange={(open) => !open && setActiveSemesterId(null)}>
        <DialogContent className="w-full sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  Live Semester Recommendations{activeSemester ? ` - ${activeSemester.label}` : ""}
                </DialogTitle>
                <DialogDescription>
                  These options come from the UF public course endpoint plus the uploaded degree-audit
                  JSON.
                </DialogDescription>
              </div>
              {activeSemester && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadRecommendations(activeSemester.id)}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              )}
            </div>
          </DialogHeader>

          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Candidate pool: {candidatePool.map((course) => course.displayCode).join(", ")}
            </CardContent>
          </Card>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading live semester options from ONE.UF...
            </div>
          )}

          {warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6 space-y-2">
                {warnings.map((warning) => (
                  <p key={warning} className="text-sm text-amber-950">
                    {warning}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            {options.map((option) => (
              <Card key={option.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">{option.name}</CardTitle>
                    <Badge variant="secondary">{option.totalCredits} cr</Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {option.gaps} gaps, {option.tbaCount} arranged/TBA sections
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {option.courses.map((course) => (
                    <div
                      key={`${course.course.code}-${course.section.number}`}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-primary">{course.course.displayCode}</p>
                        <Badge variant="outline">Sec {course.section.number}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{course.course.name}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {course.section.meetings.length > 0
                          ? course.section.meetings
                              .map((meeting) =>
                                meeting.days.length > 0 && meeting.startTime && meeting.endTime
                                  ? `${meeting.days.join("/")} ${meeting.startTime}-${meeting.endTime}`
                                  : "Arranged / TBA"
                              )
                              .join(" | ")
                          : "Arranged / TBA"}
                      </p>
                    </div>
                  ))}
                </CardContent>
                <div className="p-4 pt-0">
                  <Button className="w-full" onClick={() => applyRecommendation(option)}>
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Apply to Planner
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {activeSemester?.termCode === TERM_OPTIONS[2].code && (
            <p className="text-xs text-muted-foreground">
              Spring 2027 is still selectable, but the public UF endpoint currently returns no rows
              for term code 2271 in this repo's queries.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
