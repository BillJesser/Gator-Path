"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  RefreshCw,
  User,
} from "lucide-react"
import { DegreeAuditUpload } from "@/components/degree-audit-upload"
import { usePlanningData } from "@/components/planning-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  UF_PUBLIC_BASE_URL,
  buildScheduleOptions,
  getRecommendedCandidates,
  getTermLabel,
  parseMaxCredits,
  type AuditRemainingCourseInput,
  type FormatPreference,
  type GeneratedScheduleOption,
  type TimePreference,
} from "@/lib/uf-schedule"
import { cn } from "@/lib/utils"

const timeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
]

const timetableDays = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const

function timeToRow(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  return Math.floor((hours * 60 + minutes - 8 * 60) / 30)
}

function getRowSpan(startTime: string, endTime: string) {
  return timeToRow(endTime) - timeToRow(startTime)
}

export function ScheduleContent() {
  const { selectedTerm, setSelectedTerm, uploadedAudit, uploadedAuditFileName } = usePlanningData()
  const [timePreference, setTimePreference] = useState<TimePreference>("any")
  const [formatPreference, setFormatPreference] = useState<FormatPreference>("any")
  const [maxCredits, setMaxCredits] = useState("12")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [options, setOptions] = useState<GeneratedScheduleOption[]>([])
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [apiSectionCount, setApiSectionCount] = useState(0)
  const [coursesWithMeetings, setCoursesWithMeetings] = useState(0)

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

  const recommendedCandidates = useMemo(
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

  const selectedOption =
    options.find((option) => option.id === selectedOptionId) || options[0] || null

  const generateSchedules = async () => {
    if (recommendedCandidates.length === 0) {
      setError(
        "No remaining courses could be derived from the uploaded degree audit for schedule generation."
      )
      setOptions([])
      setSelectedOptionId(null)
      setWarnings([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchUfScheduleBatch(
        selectedTerm,
        recommendedCandidates.map((course) => course.code)
      )
      setWarnings(response.warnings)

      const nextOptions = buildScheduleOptions({
        courses: response.courses,
        candidates: recommendedCandidates,
        maxCredits: parseMaxCredits(maxCredits),
        timePreference,
        formatPreference,
        satisfiedCourseCodes,
        limit: 6,
      })

      setApiSectionCount(
        response.courses.reduce((sum, course) => sum + course.sections.length, 0)
      )
      setCoursesWithMeetings(
        response.courses.filter((course) =>
          course.sections.some((section) => section.hasScheduledMeetings)
        ).length
      )
      setOptions(nextOptions)
      setSelectedOptionId(nextOptions[0]?.id || null)

      if (nextOptions.length === 0) {
        setError(
          "No schedule combinations fit the current filters. Try a higher credit cap or a different term."
        )
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Unable to generate schedules from the UF public API."
      )
      setOptions([])
      setSelectedOptionId(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setOptions([])
    setSelectedOptionId(null)
    setWarnings([])
    setError(null)
  }, [selectedTerm, timePreference, formatPreference, maxCredits, uploadedAudit])

  const currentIndex = selectedOption ? options.findIndex((option) => option.id === selectedOption.id) : -1

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedOptionId(options[currentIndex - 1].id)
    }
  }

  const goToNext = () => {
    if (currentIndex >= 0 && currentIndex < options.length - 1) {
      setSelectedOptionId(options[currentIndex + 1].id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Schedule Possibilities</h1>
        <p className="text-muted-foreground">
          Build schedule options from the live UF public course endpoint and the uploaded degree
          audit.
        </p>
      </div>

      <DegreeAuditUpload />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule Inputs</CardTitle>
            <CardDescription>
              Choose a term and generation preferences before querying the UF endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_OPTIONS.map((term) => (
                    <SelectItem key={term.code} value={term.code}>
                      {term.label}
                    </SelectItem>
                  ))}
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
            <div className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                <Button onClick={generateSchedules} disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Querying ONE.UF
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Schedules
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={generateSchedules}
                  disabled={isLoading || recommendedCandidates.length === 0}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Results
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Audit-Aware Candidate Courses</CardTitle>
            <CardDescription>
              Completed and in-progress courses from the uploaded audit are removed before any UF
              API requests are made.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {uploadedAudit ? (
                <>
                  Using <span className="font-medium text-foreground">{uploadedAuditFileName}</span>
                  {" "}with {uploadedAudit.completedCourseCodes.length} completed and{" "}
                  {uploadedAudit.inProgressCourseCodes.length} in-progress courses.
                </>
              ) : (
                <>
                  No degree audit uploaded yet. The generator falls back to the required-core
                  catalog list until an audit JSON is provided.
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendedCandidates.map((course) => (
                <Badge key={course.code} variant="secondary" className="py-1">
                  {course.displayCode}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected term: {getTermLabel(selectedTerm)}. As of March 31, 2026, the public UF API
              returns no rows for term code 2271 in this app's queries.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Candidate courses</p>
            <p className="text-3xl font-bold text-primary">{recommendedCandidates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Live sections loaded</p>
            <p className="text-3xl font-bold text-primary">{apiSectionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Courses with meeting times</p>
            <p className="text-3xl font-bold text-primary">{coursesWithMeetings}</p>
          </CardContent>
        </Card>
      </div>

      {warnings.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="flex items-start gap-2 text-sm text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedOption && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Available Schedules</CardTitle>
                  <CardDescription>
                    {options.length} option{options.length === 1 ? "" : "s"} generated for{" "}
                    {getTermLabel(selectedTerm)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPrevious} disabled={currentIndex <= 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-sm font-medium">
                    {currentIndex + 1} of {options.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNext}
                    disabled={currentIndex >= options.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 lg:grid-cols-3">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOptionId(option.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-all",
                      selectedOption.id === option.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-medium">{option.name}</span>
                      {option.conflictCount === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{option.totalCredits} credits</p>
                      <p>{option.gaps} gap{option.gaps === 1 ? "" : "s"}</p>
                      <p>{option.tbaCount} TBA / arranged section{option.tbaCount === 1 ? "" : "s"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Timetable</CardTitle>
              <CardDescription>
                {selectedOption.name} for {getTermLabel(selectedTerm)}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-6 gap-1 mb-1">
                  <div className="p-2 text-center text-sm font-medium text-muted-foreground">Time</div>
                  {timetableDays.map((day) => (
                    <div key={day} className="rounded-lg bg-muted p-2 text-center text-sm font-medium">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <div className="grid grid-cols-6 gap-1">
                    <div className="space-y-0">
                      {timeSlots.map((time, index) => (
                        <div
                          key={time}
                          className="flex h-8 items-center justify-end pr-2 text-right text-xs text-muted-foreground"
                        >
                          {index % 2 === 0 ? time : ""}
                        </div>
                      ))}
                    </div>

                    {timetableDays.map((day) => (
                      <div key={day} className="relative rounded-lg bg-muted/20">
                        {timeSlots.map((_, index) => (
                          <div
                            key={index}
                            className={cn(
                              "h-8 border-b",
                              index % 2 === 0 ? "border-border/50" : "border-border/20"
                            )}
                          />
                        ))}

                        {selectedOption.courses.flatMap((course) =>
                          course.section.meetings
                            .filter(
                              (meeting) =>
                                meeting.days.includes(day) &&
                                meeting.startTime &&
                                meeting.endTime
                            )
                            .map((meeting, index) => {
                              const startRow = timeToRow(meeting.startTime!)
                              const rowSpan = getRowSpan(meeting.startTime!, meeting.endTime!)
                              return (
                                <div
                                  key={`${course.course.code}-${day}-${index}`}
                                  className={cn(
                                    "absolute left-1 right-1 overflow-hidden rounded-md p-1.5 text-white",
                                    course.color
                                  )}
                                  style={{
                                    top: `${startRow * 32}px`,
                                    height: `${Math.max(rowSpan * 32 - 4, 24)}px`,
                                  }}
                                >
                                  <p className="truncate text-xs font-semibold">
                                    {course.course.displayCode}
                                  </p>
                                  <p className="truncate text-xs opacity-90">
                                    {meeting.locationLabel || course.section.display}
                                  </p>
                                </div>
                              )
                            })
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Option Details</CardTitle>
              <CardDescription>
                Section-level data normalized from {UF_PUBLIC_BASE_URL || "ONE.UF"} via the local API route.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedOption.courses.map((course) => (
                <div
                  key={`${course.course.code}-${course.section.number}`}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className={cn("h-12 w-2 rounded-full", course.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-medium text-primary">{course.course.displayCode}</p>
                        <Badge variant="secondary">Section {course.section.number}</Badge>
                        <Badge variant="outline">{course.course.sourceLabel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{course.course.name}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            {course.section.instructors.length > 0
                              ? course.section.instructors.join(", ")
                              : "Instructor TBA"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {course.section.meetings.length > 0
                              ? course.section.meetings
                                  .map((meeting) =>
                                    meeting.days.length > 0 && meeting.startTime && meeting.endTime
                                      ? `${meeting.days.join("/")} ${meeting.startTime}-${meeting.endTime}`
                                      : "Arranged / TBA"
                                  )
                                  .join(" | ")
                              : "Arranged / TBA"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {course.section.meetings
                              .map((meeting) => meeting.locationLabel)
                              .filter(Boolean)
                              .join(" | ") || "Location TBA"}
                          </span>
                        </div>
                      </div>
                      {course.section.note && (
                        <p className="mt-3 text-sm text-muted-foreground">{course.section.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedOption && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Generate schedules to query the UF public endpoint and build section combinations.
            Uploaded degree-audit data is used to remove completed and in-progress courses before
            the request is sent.
            <div className="mt-3">
              <Link href="/degree-audit" className="text-primary underline underline-offset-4">
                Review degree-audit mapping
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
