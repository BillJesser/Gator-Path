"use client"

import { useMemo, useState } from "react"
import { BookOpen, CalendarDays, Download, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { usePlanningData } from "@/components/planning-provider"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchUfScheduleBatch } from "@/lib/fetch-uf-schedule"
import { type PlannedSemester, type PlannedSemesterCourse } from "@/lib/planner"
import {
  buildScheduleOptions,
  formatCourseDisplayCode,
  getRecommendedCandidates,
  getTermLabel,
  parseMaxCredits,
  type AuditRemainingCourseInput,
  type CourseCandidate,
  type FormatPreference,
  type GeneratedScheduleOption,
  type TimePreference,
} from "@/lib/uf-schedule"

export function PlannerContent() {
  const { uploadedAudit, plannerSemesters, setPlannerSemesters } = usePlanningData()
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null)
  const [timePreference, setTimePreference] = useState<TimePreference>("any")
  const [formatPreference, setFormatPreference] = useState<FormatPreference>("any")
  const [maxCredits, setMaxCredits] = useState("12")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [options, setOptions] = useState<GeneratedScheduleOption[]>([])
  const [activeCandidatePool, setActiveCandidatePool] = useState<CourseCandidate[]>([])

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
  const candidateLookup = useMemo(
    () => new Map(candidatePool.map((course) => [course.code, course])),
    [candidatePool]
  )

  const activeSemester =
    plannerSemesters.find((semester) => semester.id === activeSemesterId) || null
  const totalPlannedCourses = plannerSemesters.reduce(
    (sum, semester) => sum + semester.courses.length,
    0
  )

  const getSemesterCandidatePool = (semester: PlannedSemester) => {
    if (semester.courses.length === 0) {
      return candidatePool
    }

    return Array.from(new Set(semester.courses.map((course) => course.code))).map((code) => {
      const fromAuditCandidates = candidateLookup.get(code)
      if (fromAuditCandidates) {
        return fromAuditCandidates
      }

      const sourceCourse = semester.courses.find((course) => course.code === code)
      return {
        code,
        displayCode: sourceCourse?.displayCode || formatCourseDisplayCode(code),
        name: sourceCourse?.name || code,
        difficulty: "Unknown",
        notes: sourceCourse?.note || null,
        group: "Added to plan",
        source: "remaining-from-audit" as const,
        sourceLabel: "Added to semester plan",
      }
    })
  }

  const loadRecommendations = async (semesterId: string) => {
    const semester = plannerSemesters.find((entry) => entry.id === semesterId)
    if (!semester) {
      return
    }
    const semesterCandidatePool = getSemesterCandidatePool(semester)

    if (semesterCandidatePool.length === 0) {
      setActiveSemesterId(semesterId)
      setActiveCandidatePool([])
      setOptions([])
      setWarnings([])
      setError(
        "No remaining courses could be derived from the uploaded degree audit for this semester."
      )
      return
    }

    setActiveSemesterId(semesterId)
    setActiveCandidatePool(semesterCandidatePool)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchUfScheduleBatch(
        semester.termCode,
        semesterCandidatePool.map((course) => course.code)
      )
      setWarnings(response.warnings)
      const generated = buildScheduleOptions({
        courses: response.courses,
        candidates: semesterCandidatePool,
        maxCredits: parseMaxCredits(maxCredits),
        timePreference,
        formatPreference,
        satisfiedCourseCodes,
        limit: 3,
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

    setPlannerSemesters((current: PlannedSemester[]) =>
      current.map((semester) =>
        semester.id === activeSemesterId
          ? {
              ...semester,
              courses: option.courses.map((course) => ({
                code: course.course.code,
                displayCode: course.course.displayCode || formatCourseDisplayCode(course.course.code),
                name: course.course.name,
                sectionNumber: course.section.number,
                credits: course.section.credits,
                color: course.color,
                meetings: course.section.meetings,
                sectionDisplay: course.section.display,
                note: course.section.note || null,
              })),
            }
          : semester
      )
    )
    setActiveSemesterId(null)
    setActiveCandidatePool([])
    setOptions([])
    setWarnings([])
    setError(null)
  }

  const removeCourseFromSemester = (semesterId: string, courseCode: string) => {
    setPlannerSemesters((current: PlannedSemester[]) =>
      current.map((semester) =>
        semester.id === semesterId
          ? {
              ...semester,
              courses: semester.courses.filter((course) => course.code !== courseCode),
            }
          : semester
      )
    )
  }

  const escapePdfText = (value: string) =>
    value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")

  const wrapPdfLine = (value: string, maxChars = 92) => {
    if (value.length <= maxChars) {
      return [value]
    }

    const words = value.split(" ")
    const lines: string[] = []
    let current = ""

    for (const word of words) {
      const next = current.length === 0 ? word : `${current} ${word}`
      if (next.length <= maxChars) {
        current = next
        continue
      }
      if (current) {
        lines.push(current)
      }
      current = word
    }

    if (current) {
      lines.push(current)
    }

    return lines
  }

  const buildPdfBlob = (pages: string[][]) => {
    const encoder = new TextEncoder()
    const objects: string[] = []
    const pageReferences: string[] = []

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>"

    const pageStartObject = 3
    pages.forEach((pageLines, index) => {
      const pageObjectNumber = pageStartObject + index * 2
      const contentObjectNumber = pageObjectNumber + 1
      pageReferences.push(`${pageObjectNumber} 0 R`)

      const textLines: string[] = ["BT", "/F1 11 Tf", "14 TL", "50 770 Td"]
      pageLines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          textLines.push("T*")
        }
        textLines.push(`(${escapePdfText(line)}) Tj`)
      })
      textLines.push("ET")

      const streamContent = textLines.join("\n")
      const streamLength = encoder.encode(streamContent).length

      objects[pageObjectNumber] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${
          pageStartObject + pages.length * 2
        } 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
      objects[contentObjectNumber] = `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`
    })

    objects[2] = `<< /Type /Pages /Kids [${pageReferences.join(" ")}] /Count ${pages.length} >>`
    objects[pageStartObject + pages.length * 2] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    let pdf = "%PDF-1.4\n"
    const offsets: number[] = [0]

    for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
      offsets[objectNumber] = encoder.encode(pdf).length
      pdf += `${objectNumber} 0 obj\n${objects[objectNumber]}\nendobj\n`
    }

    const xrefOffset = encoder.encode(pdf).length
    pdf += `xref\n0 ${objects.length}\n`
    pdf += "0000000000 65535 f \n"
    for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
      pdf += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

    return new Blob([pdf], { type: "application/pdf" })
  }

  const downloadSemesterPdf = (semester: PlannedSemester) => {
    const lines: string[] = [
      `Gator Path Semester Schedule`,
      `${semester.label}`,
      `Generated ${new Date().toLocaleString()}`,
      "",
    ]

    if (semester.courses.length === 0) {
      lines.push("No courses planned for this semester.")
    } else {
      semester.courses.forEach((course: PlannedSemesterCourse, index) => {
        const meetingLabel =
          course.meetings.length > 0
            ? course.meetings
                .map((meeting) =>
                  meeting.days.length > 0 && meeting.startTime && meeting.endTime
                    ? `${meeting.days.join("/")} ${meeting.startTime}-${meeting.endTime}`
                    : "Arranged / TBA"
                )
                .join(" | ")
            : "Arranged / TBA"

        const sectionLabel = course.sectionNumber
          ? `Section ${course.sectionNumber}`
          : "Section not assigned"

        lines.push(...wrapPdfLine(`${index + 1}. ${course.displayCode || course.code} - ${course.name}`))
        lines.push(...wrapPdfLine(`   ${sectionLabel} | ${course.credits || 0} credits`))
        lines.push(...wrapPdfLine(`   Meetings: ${meetingLabel}`))
        if (course.note) {
          lines.push(...wrapPdfLine(`   Note: ${course.note}`))
        }
        lines.push("")
      })
    }

    const pageSize = 48
    const pages: string[][] = []
    for (let index = 0; index < lines.length; index += pageSize) {
      pages.push(lines.slice(index, index + pageSize))
    }

    const blob = buildPdfBlob(pages.length > 0 ? pages : [["No data"]])
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${semester.label.toLowerCase().replace(/\s+/g, "-")}-schedule.pdf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  if (!uploadedAudit) {
    return null
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

        <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Planned semesters</p>
                <p className="text-3xl font-bold text-primary">{plannerSemesters.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Courses in plan</p>
                <p className="text-3xl font-bold text-primary">{totalPlannedCourses}</p>
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
          {plannerSemesters.map((semester) => (
            <Card key={semester.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">{semester.label}</CardTitle>
                    <CardDescription>
                      API term code {semester.termCode} ({getTermLabel(semester.termCode)})
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => downloadSemesterPdf(semester)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button onClick={() => loadRecommendations(semester.id)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Recommended Semester
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {semester.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No courses planned yet for this semester.
                  </p>
                ) : (
                  semester.courses.map((course) => (
                    <div
                      key={`${semester.id}-${course.code}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="rounded-lg bg-primary/10 p-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary">{course.displayCode || course.code}</p>
                        <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeCourseFromSemester(semester.id, course.code)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog
        open={Boolean(activeSemesterId)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSemesterId(null)
            setActiveCandidatePool([])
          }
        }}
      >
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
              Candidate pool:{" "}
              {activeCandidatePool.length > 0
                ? activeCandidatePool.map((course) => course.displayCode).join(", ")
                : "No candidate courses available for this semester."}
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
        </DialogContent>
      </Dialog>
    </>
  )
}
