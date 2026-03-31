import { electiveCourses, requiredCoreCourses } from "@/lib/course-catalog"

export const UF_PUBLIC_BASE_URL = "https://one.uf.edu"
export const UF_PUBLIC_SCHEDULE_ENDPOINT = "/apix/soc/schedule"

export const TERM_OPTIONS = [
  { code: "2265", label: "Summer 2026" },
  { code: "2268", label: "Fall 2026" },
  { code: "2271", label: "Spring 2027" },
] as const

export type TermCode = (typeof TERM_OPTIONS)[number]["code"]
export type TermLabel = (typeof TERM_OPTIONS)[number]["label"]
export type TimePreference = "any" | "morning" | "afternoon" | "evening"
export type FormatPreference = "any" | "in-person" | "online" | "hybrid"
export type DayCode = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
export type CoursePriority = "required" | "remaining-from-audit" | "elective-fallback"

export type UfMeeting = {
  days: DayCode[]
  startTime: string | null
  endTime: string | null
  building: string | null
  room: string | null
  locationLabel: string | null
  raw: Record<string, unknown>
}

export type UfSection = {
  number: string
  classNumber: number | null
  display: string
  credits: number
  note: string
  deptName: string
  instructors: string[]
  openSeats: number | null
  waitListCount: number | null
  deliveryCode: string
  addEligible: boolean
  meetings: UfMeeting[]
  hasScheduledMeetings: boolean
  isArranged: boolean
  finalExam: string | null
  raw: Record<string, unknown>
}

export type UfCourseRecord = {
  code: string
  name: string
  description: string
  prerequisitesText: string
  prerequisiteCodes: string[]
  prerequisiteGroups: string[][]
  corequisiteGroups: string[][]
  sections: UfSection[]
}

export type UfScheduleBatchResponse = {
  term: string
  fetchedAt: string
  courses: UfCourseRecord[]
  warnings: string[]
}

export type CourseCandidate = {
  code: string
  displayCode: string
  name: string
  difficulty: string
  notes: string | null
  group: string
  source: CoursePriority
  sourceLabel: string
}

export type ScheduledSectionChoice = {
  course: CourseCandidate
  section: UfSection
  color: string
}

export type GeneratedScheduleOption = {
  id: string
  name: string
  totalCredits: number
  conflictCount: number
  gaps: number
  score: number
  tbaCount: number
  warnings: string[]
  courses: ScheduledSectionChoice[]
}

type RequirementGroups = {
  prerequisiteGroups: string[][]
  corequisiteGroups: string[][]
}

const dayLookup: Record<string, DayCode> = {
  M: "Mon",
  MON: "Mon",
  MONDAY: "Mon",
  T: "Tue",
  TUE: "Tue",
  TUESDAY: "Tue",
  W: "Wed",
  WED: "Wed",
  WEDNESDAY: "Wed",
  R: "Thu",
  TH: "Thu",
  THU: "Thu",
  THURSDAY: "Thu",
  F: "Fri",
  FRI: "Fri",
  FRIDAY: "Fri",
  S: "Sat",
  SAT: "Sat",
  SATURDAY: "Sat",
  U: "Sun",
  SU: "Sun",
  SUN: "Sun",
  SUNDAY: "Sun",
}

const sectionColors = [
  "bg-primary",
  "bg-accent",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

type RawUfResponse = Array<{
  COURSES?: unknown[]
}>

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }
  return null
}

function pickNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
    if (typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Number(value))) {
      return Number(value)
    }
  }
  return null
}

function normalizeTimeValue(value: string | null) {
  if (!value) {
    return null
  }

  const cleaned = value.toUpperCase().replace(/\./g, "").replace(/\s+/g, "")
  const padded = cleaned.match(/^\d{3,4}$/)
    ? `${cleaned.slice(0, cleaned.length - 2)}:${cleaned.slice(-2)}`
    : cleaned

  const match = padded.match(/^(\d{1,2}):?(\d{2})(AM|PM)?$/)
  if (!match) {
    return null
  }

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]

  if (meridiem === "AM" && hours === 12) {
    hours = 0
  } else if (meridiem === "PM" && hours < 12) {
    hours += 12
  }

  if (hours > 23 || minutes > 59) {
    return null
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

function parseDays(value: string | null, source: Record<string, unknown>) {
  const days = new Set<DayCode>()

  if (value) {
    const normalized = value.toUpperCase()
    const tokens = normalized.includes("/")
      ? normalized.split("/")
      : normalized.includes(" ")
        ? normalized.split(/\s+/)
        : normalized.match(/TH|SU|MON|TUE|WED|THU|FRI|SAT|SUN|M|T|W|R|F|S|U/g) || []

    for (const token of tokens) {
      const mapped = dayLookup[token]
      if (mapped) {
        days.add(mapped)
      }
    }
  }

  const booleanDayKeys: Array<[string, DayCode]> = [
    ["monday", "Mon"],
    ["tuesday", "Tue"],
    ["wednesday", "Wed"],
    ["thursday", "Thu"],
    ["friday", "Fri"],
    ["saturday", "Sat"],
    ["sunday", "Sun"],
  ]

  for (const [key, mapped] of booleanDayKeys) {
    if (source[key] === true || source[key] === "Y") {
      days.add(mapped)
    }
  }

  return Array.from(days)
}

function normalizeMeeting(raw: unknown): UfMeeting | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }

  const source = raw as Record<string, unknown>
  const startTime = normalizeTimeValue(
    pickString(source, ["meetTimeBegin", "meetTimeStart", "startTime", "beginTime", "start"])
  )
  const endTime = normalizeTimeValue(
    pickString(source, ["meetTimeEnd", "meetTimeStop", "endTime", "end"])
  )
  const building = pickString(source, ["building", "bldg", "facility", "meetBuilding"])
  const room = pickString(source, ["room", "roomNumber", "meetRoom"])
  const dayValue = pickString(source, ["days", "meetDays", "meetingDays"])
  const days = parseDays(dayValue, source)
  const locationLabel =
    [building, room].filter(Boolean).join(" ").trim() || pickString(source, ["location"])

  if (days.length === 0 && !startTime && !endTime && !locationLabel) {
    return null
  }

  return {
    days,
    startTime,
    endTime,
    building,
    room,
    locationLabel: locationLabel || null,
    raw: source,
  }
}

export function normalizeCourseCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

export function extractCourseCodes(text: string) {
  return Array.from(
    new Set(
      (text.toUpperCase().match(/\b[A-Z]{3}\s?\d{4}[A-Z]?\b/g) || []).map((code) =>
        normalizeCourseCode(code)
      )
    )
  )
}

function splitTopLevelClauses(text: string, keyword: "AND" | "OR") {
  const clauses: string[] = []
  let depth = 0
  let start = 0
  const normalized = text.trim()

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]
    if (char === "(") {
      depth += 1
      continue
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1)
      continue
    }

    if (depth === 0) {
      const token = ` ${keyword} `
      if (normalized.slice(index, index + token.length) === token) {
        clauses.push(normalized.slice(start, index).trim())
        start = index + token.length
        index += token.length - 1
      }
    }
  }

  clauses.push(normalized.slice(start).trim())
  return clauses.filter(Boolean)
}

function parseRequirementClauseGroups(text: string) {
  const cleaned = text
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/MINIMUM GRADE OF [A-Z]/g, "")
    .replace(/KNOWLEDGE OF [^.]+/g, "")
    .trim()

  if (!cleaned) {
    return []
  }

  const andClauses = splitTopLevelClauses(cleaned, "AND")
  const groups: string[][] = []

  for (const clause of andClauses) {
    const normalizedClause = clause.replace(/^[();,\s]+|[();,\s]+$/g, "")
    if (!normalizedClause) {
      continue
    }

    const orClauses = splitTopLevelClauses(normalizedClause, "OR")
    if (orClauses.length > 1) {
      const options = Array.from(new Set(extractCourseCodes(normalizedClause)))
      if (options.length > 0) {
        groups.push(options)
      }
      continue
    }

    for (const code of extractCourseCodes(normalizedClause)) {
      groups.push([code])
    }
  }

  return groups
}

function parseRequirementGroups(text: string): RequirementGroups {
  const normalized = text.toUpperCase().replace(/\s+/g, " ").trim()
  if (!normalized) {
    return {
      prerequisiteGroups: [],
      corequisiteGroups: [],
    }
  }

  const prereqStart = normalized.indexOf("PREREQ:")
  const coreqStart = normalized.indexOf("COREQ:")
  const prereqText =
    prereqStart >= 0
      ? normalized.slice(prereqStart + "PREREQ:".length, coreqStart >= 0 ? coreqStart : undefined)
      : coreqStart >= 0
        ? normalized.slice(0, coreqStart)
        : normalized

  const coreqText = coreqStart >= 0 ? normalized.slice(coreqStart + "COREQ:".length) : ""

  return {
    prerequisiteGroups: parseRequirementClauseGroups(prereqText),
    corequisiteGroups: parseRequirementClauseGroups(coreqText),
  }
}

function satisfiesRequirementGroups(groups: string[][], satisfiedCourseCodes: Set<string>) {
  if (groups.length === 0) {
    return true
  }

  const hasSatisfiedCode = (requiredCode: string) => {
    if (satisfiedCourseCodes.has(requiredCode)) {
      return true
    }

    if (requiredCode.endsWith("C") && satisfiedCourseCodes.has(requiredCode.slice(0, -1))) {
      return true
    }

    if (satisfiedCourseCodes.has(`${requiredCode}C`)) {
      return true
    }

    return false
  }

  return groups.every((group) => group.some((code) => hasSatisfiedCode(code)))
}

export function buildUfScheduleUrl(courseCode: string, term: string) {
  const params = new URLSearchParams({
    ai: "false",
    auf: "false",
    category: "CWSP",
    "class-num": "",
    "course-code": courseCode.toLowerCase(),
    "course-title": "",
    "cred-srch": "",
    credits: "",
    "day-f": "",
    "day-m": "",
    "day-r": "",
    "day-s": "",
    "day-t": "",
    "day-w": "",
    dept: "",
    eep: "",
    fitsSchedule: "false",
    ge: "",
    "ge-b": "",
    "ge-c": "",
    "ge-d": "",
    "ge-h": "",
    "ge-m": "",
    "ge-n": "",
    "ge-p": "",
    "ge-s": "",
    instructor: "",
    "last-control-number": "0",
    "level-max": "",
    "level-min": "",
    "no-open-seats": "false",
    "online-a": "",
    "online-c": "",
    "online-h": "",
    "online-p": "",
    "period-b": "",
    "period-e": "",
    "prog-level": "",
    "qst-1": "",
    "qst-2": "",
    "qst-3": "",
    quest: "false",
    term,
    "wr-2000": "",
    "wr-4000": "",
    "wr-6000": "",
    writing: "false",
    "var-cred": "",
    hons: "false",
  })

  return `${UF_PUBLIC_BASE_URL}${UF_PUBLIC_SCHEDULE_ENDPOINT}?${params.toString()}`
}

export function normalizeUfSchedulePayload(payload: unknown): UfCourseRecord[] {
  if (!Array.isArray(payload)) {
    return []
  }

  const firstPage = (payload as RawUfResponse)[0]
  const rawCourses = Array.isArray(firstPage?.COURSES) ? firstPage.COURSES : []

  return rawCourses.flatMap((rawCourse) => {
    if (!rawCourse || typeof rawCourse !== "object" || Array.isArray(rawCourse)) {
      return []
    }

    const source = rawCourse as Record<string, unknown>
    const prerequisitesText = pickString(source, ["prerequisites"]) || ""
    const requirementGroups = parseRequirementGroups(prerequisitesText)
    const sections = Array.isArray(source.sections)
      ? source.sections.flatMap((rawSection) => {
          if (!rawSection || typeof rawSection !== "object" || Array.isArray(rawSection)) {
            return []
          }

          const sectionSource = rawSection as Record<string, unknown>
          const meetings = Array.isArray(sectionSource.meetTimes)
            ? sectionSource.meetTimes.map(normalizeMeeting).filter(Boolean) as UfMeeting[]
            : []

          const openSeats = pickNumber(sectionSource, ["openSeats"])
          const waitList =
            sectionSource.waitList && typeof sectionSource.waitList === "object"
              ? pickNumber(sectionSource.waitList as Record<string, unknown>, ["total"])
              : null

          return [
            {
              number: pickString(sectionSource, ["number"]) || "TBA",
              classNumber: pickNumber(sectionSource, ["classNumber"]),
              display: pickString(sectionSource, ["display"]) || pickString(source, ["name"]) || "Course Section",
              credits: pickNumber(sectionSource, ["credits", "credits_min", "credits_max"]) || 0,
              note: pickString(sectionSource, ["note", "dNote"]) || "",
              deptName: pickString(sectionSource, ["deptName"]) || "",
              instructors: Array.isArray(sectionSource.instructors)
                ? sectionSource.instructors.flatMap((entry) => {
                    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
                      return []
                    }
                    const name = pickString(entry as Record<string, unknown>, ["name"])
                    return name ? [name] : []
                  })
                : [],
              openSeats,
              waitListCount: waitList,
              deliveryCode: pickString(sectionSource, ["sectWeb"]) || "",
              addEligible: (pickString(sectionSource, ["addEligible"]) || "N") === "Y",
              meetings,
              hasScheduledMeetings: meetings.some(
                (meeting) => meeting.days.length > 0 && Boolean(meeting.startTime) && Boolean(meeting.endTime)
              ),
              isArranged: meetings.length === 0,
              finalExam: pickString(sectionSource, ["finalExam"]),
              raw: sectionSource,
            } satisfies UfSection,
          ]
        })
      : []

    return [
      {
        code: normalizeCourseCode(pickString(source, ["code"]) || ""),
        name: pickString(source, ["name"]) || "Unknown Course",
        description: pickString(source, ["description"]) || "",
        prerequisitesText,
        prerequisiteCodes: extractCourseCodes(prerequisitesText),
        prerequisiteGroups: requirementGroups.prerequisiteGroups,
        corequisiteGroups: requirementGroups.corequisiteGroups,
        sections,
      } satisfies UfCourseRecord,
    ]
  })
}

export function getTermLabel(termCode: string) {
  return TERM_OPTIONS.find((term) => term.code === termCode)?.label || termCode
}

export function parseMaxCredits(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15
}

export function getRecommendedCandidates(
  completedCodes: Set<string>,
  inProgressCodes: Set<string>,
  remainingCodesFromAudit: Set<string>
): CourseCandidate[] {
  const completedOrActive = new Set([...completedCodes, ...inProgressCodes])

  const requiredCandidates: CourseCandidate[] = requiredCoreCourses
    .filter((course) => !completedOrActive.has(course.code))
    .map((course): CourseCandidate => ({
      ...course,
      source: remainingCodesFromAudit.has(course.code)
        ? ("remaining-from-audit" satisfies CoursePriority)
        : ("required" satisfies CoursePriority),
      sourceLabel: remainingCodesFromAudit.has(course.code)
        ? "Remaining requirement from audit"
        : "Required core course",
    }))

  const electiveFallback: CourseCandidate[] = electiveCourses
    .filter((course) => !completedOrActive.has(course.code))
    .slice(0, 8)
    .map((course): CourseCandidate => ({
      code: course.code,
      displayCode: course.displayCode,
      name: course.name,
      difficulty: course.difficulty,
      notes: course.notes,
      group: course.group,
      source: "elective-fallback" satisfies CoursePriority,
      sourceLabel: "Elective fallback",
    }))

  const prioritizedRequired = requiredCandidates.sort((left, right) => {
    const leftPriority = left.source === "remaining-from-audit" ? 0 : 1
    const rightPriority = right.source === "remaining-from-audit" ? 0 : 1
    return leftPriority - rightPriority || left.displayCode.localeCompare(right.displayCode)
  })

  return [...prioritizedRequired, ...electiveFallback]
}

function toMinutes(time: string | null) {
  if (!time) {
    return null
  }

  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function meetingsConflict(left: UfMeeting, right: UfMeeting) {
  if (left.days.length === 0 || right.days.length === 0) {
    return false
  }

  const sharedDays = left.days.some((day) => right.days.includes(day))
  if (!sharedDays) {
    return false
  }

  const leftStart = toMinutes(left.startTime)
  const leftEnd = toMinutes(left.endTime)
  const rightStart = toMinutes(right.startTime)
  const rightEnd = toMinutes(right.endTime)

  if (
    leftStart === null ||
    leftEnd === null ||
    rightStart === null ||
    rightEnd === null
  ) {
    return false
  }

  return leftStart < rightEnd && rightStart < leftEnd
}

function sectionConflictsWith(section: UfSection, chosen: ScheduledSectionChoice[]) {
  for (const existing of chosen) {
    for (const meeting of section.meetings) {
      for (const otherMeeting of existing.section.meetings) {
        if (meetingsConflict(meeting, otherMeeting)) {
          return true
        }
      }
    }
  }
  return false
}

function scoreSection(section: UfSection, timePreference: TimePreference, formatPreference: FormatPreference) {
  let score = 0

  if (section.hasScheduledMeetings) {
    score += 10
  } else {
    score -= 5
  }

  if (section.addEligible) {
    score += 3
  }

  if ((section.openSeats ?? 0) > 0) {
    score += 2
  }

  const startMinutes = section.meetings
    .map((meeting) => toMinutes(meeting.startTime))
    .filter((value): value is number => value !== null)
  const earliest = startMinutes.length > 0 ? Math.min(...startMinutes) : null

  if (earliest !== null) {
    if (timePreference === "morning" && earliest < 12 * 60) {
      score += 4
    }
    if (timePreference === "afternoon" && earliest >= 12 * 60 && earliest < 17 * 60) {
      score += 4
    }
    if (timePreference === "evening" && earliest >= 17 * 60) {
      score += 4
    }
  }

  const sectionLooksOnline = !section.hasScheduledMeetings || section.deliveryCode.includes("W")
  if (formatPreference === "online" && sectionLooksOnline) {
    score += 4
  }
  if (formatPreference === "in-person" && section.hasScheduledMeetings) {
    score += 4
  }
  if (formatPreference === "hybrid" && section.hasScheduledMeetings && sectionLooksOnline) {
    score += 2
  }

  return score
}

function computeDailyGaps(courses: ScheduledSectionChoice[]) {
  const scheduleByDay = new Map<DayCode, Array<{ start: number; end: number }>>()

  for (const course of courses) {
    for (const meeting of course.section.meetings) {
      const start = toMinutes(meeting.startTime)
      const end = toMinutes(meeting.endTime)
      if (start === null || end === null) {
        continue
      }

      for (const day of meeting.days) {
        const slots = scheduleByDay.get(day) || []
        slots.push({ start, end })
        scheduleByDay.set(day, slots)
      }
    }
  }

  let totalGaps = 0

  for (const slots of scheduleByDay.values()) {
    slots.sort((left, right) => left.start - right.start)
    for (let index = 1; index < slots.length; index += 1) {
      if (slots[index].start > slots[index - 1].end) {
        totalGaps += 1
      }
    }
  }

  return totalGaps
}

function scoreOption(
  courses: ScheduledSectionChoice[],
  timePreference: TimePreference,
  formatPreference: FormatPreference
) {
  const sectionScore = courses.reduce(
    (sum, course) => sum + scoreSection(course.section, timePreference, formatPreference),
    0
  )
  const totalCredits = courses.reduce((sum, course) => sum + course.section.credits, 0)
  const tbaCount = courses.filter((course) => !course.section.hasScheduledMeetings).length
  const gapPenalty = computeDailyGaps(courses) * 2
  return sectionScore + totalCredits - tbaCount * 3 - gapPenalty
}

export function buildScheduleOptions(args: {
  courses: UfCourseRecord[]
  candidates: CourseCandidate[]
  maxCredits: number
  timePreference: TimePreference
  formatPreference: FormatPreference
  satisfiedCourseCodes?: Set<string>
  limit?: number
}) {
  const {
    courses,
    candidates,
    maxCredits,
    timePreference,
    formatPreference,
    satisfiedCourseCodes = new Set<string>(),
    limit = 3,
  } = args

  const courseMap = new Map(courses.map((course) => [course.code, course]))
  const candidatePool = candidates
    .filter((candidate) => {
      const liveCourse = courseMap.get(candidate.code)
      if (!liveCourse || liveCourse.sections.length === 0) {
        return false
      }

      if (satisfiedCourseCodes.size === 0) {
        return true
      }

      return satisfiesRequirementGroups(liveCourse.prerequisiteGroups, satisfiedCourseCodes)
    })
    .slice(0, 8)

  const collected: GeneratedScheduleOption[] = []
  const seen = new Set<string>()

  function visit(index: number, chosen: ScheduledSectionChoice[]) {
    const totalCredits = chosen.reduce((sum, choice) => sum + choice.section.credits, 0)
    if (totalCredits > maxCredits) {
      return
    }

    if (index >= candidatePool.length) {
      if (chosen.length === 0) {
        return
      }

      const signature = chosen
        .map((choice) => `${choice.course.code}:${choice.section.number}`)
        .sort()
        .join("|")

      if (seen.has(signature)) {
        return
      }
      seen.add(signature)

      // The public ONE.UF payload currently returns many sections with no meetTimes.
      // Those are treated as arranged/TBA: they stay eligible but do not create conflicts.
      const gaps = computeDailyGaps(chosen)
      const tbaCount = chosen.filter((course) => !course.section.hasScheduledMeetings).length
      const warnings =
        tbaCount > 0
          ? [`${tbaCount} selected section${tbaCount === 1 ? "" : "s"} currently have no public meeting times from the UF API.`]
          : []

      collected.push({
        id: signature || `option-${collected.length + 1}`,
        name: `Option ${String.fromCharCode(65 + collected.length)}`,
        totalCredits,
        conflictCount: 0,
        gaps,
        score: scoreOption(chosen, timePreference, formatPreference),
        tbaCount,
        warnings,
        courses: chosen,
      })
      return
    }

    visit(index + 1, chosen)

    const candidate = candidatePool[index]
    const liveCourse = courseMap.get(candidate.code)
    if (!liveCourse) {
      return
    }

    const rankedSections = [...liveCourse.sections]
      .sort((left, right) => scoreSection(right, timePreference, formatPreference) - scoreSection(left, timePreference, formatPreference))
      .slice(0, 6)

    for (const section of rankedSections) {
      if (sectionConflictsWith(section, chosen)) {
        continue
      }

      visit(index + 1, [
        ...chosen,
        {
          course: candidate,
          section,
          color: sectionColors[chosen.length % sectionColors.length],
        },
      ])
    }
  }

  visit(0, [])

  return collected
    .sort((left, right) => right.totalCredits - left.totalCredits || right.score - left.score)
    .slice(0, limit)
}
