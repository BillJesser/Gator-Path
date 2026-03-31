import { extractCourseCodes, normalizeCourseCode } from "@/lib/uf-schedule"

export type DegreeAuditCourseStatus = "completed" | "in-progress" | "remaining" | "unknown"

export type DegreeAuditCourseRecord = {
  code: string
  status: DegreeAuditCourseStatus
  sourcePath: string
  title?: string
}

export type NormalizedDegreeAudit = {
  studentName: string | null
  programName: string | null
  completedCourseCodes: string[]
  inProgressCourseCodes: string[]
  remainingRequirementCourseCodes: string[]
  extractedCourses: DegreeAuditCourseRecord[]
  warnings: string[]
}

type TraverseState = {
  extractedCourses: DegreeAuditCourseRecord[]
  warnings: string[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function getStatusFromString(value: string): DegreeAuditCourseStatus {
  const normalized = value.trim().toLowerCase()
  if (
    normalized.includes("complete") ||
    normalized.includes("passed") ||
    normalized.includes("earned") ||
    normalized.includes("satisfied") ||
    normalized.includes("taken")
  ) {
    return "completed"
  }
  if (
    normalized.includes("in progress") ||
    normalized.includes("in-progress") ||
    normalized.includes("current") ||
    normalized.includes("enrolled")
  ) {
    return "in-progress"
  }
  if (
    normalized.includes("remaining") ||
    normalized.includes("needed") ||
    normalized.includes("unsatisfied") ||
    normalized.includes("missing") ||
    normalized.includes("pending")
  ) {
    return "remaining"
  }
  return "unknown"
}

function normalizeStatus(node: Record<string, unknown>, path: string) {
  const statusFields = [
    "status",
    "courseStatus",
    "state",
    "requirementStatus",
    "result",
  ]

  for (const field of statusFields) {
    const value = node[field]
    if (typeof value === "string" && value.trim()) {
      return getStatusFromString(value)
    }
  }

  if (node.completed === true || node.satisfied === true) {
    return "completed"
  }
  if (node.inProgress === true || node.current === true) {
    return "in-progress"
  }
  if (node.remaining === true || node.needed === true) {
    return "remaining"
  }

  const loweredPath = path.toLowerCase()
  if (loweredPath.includes("completed")) {
    return "completed"
  }
  if (loweredPath.includes("progress") || loweredPath.includes("current")) {
    return "in-progress"
  }
  if (loweredPath.includes("remaining") || loweredPath.includes("needed")) {
    return "remaining"
  }

  const grade = typeof node.grade === "string" ? node.grade.trim() : ""
  if (grade && !["IP", "I", "W"].includes(grade.toUpperCase())) {
    return "completed"
  }
  if (grade.toUpperCase() === "IP") {
    return "in-progress"
  }

  return "unknown"
}

function readCourseCode(node: Record<string, unknown>) {
  const directFields = [
    "code",
    "courseCode",
    "course_code",
    "subjectCatalog",
    "classCode",
  ]

  for (const field of directFields) {
    const value = node[field]
    if (typeof value === "string") {
      const codes = extractCourseCodes(value)
      if (codes.length > 0) {
        return codes[0]
      }
      const normalized = normalizeCourseCode(value)
      if (/^[A-Z]{3}\d{4}[A-Z]?$/.test(normalized)) {
        return normalized
      }
    }
  }

  if (typeof node.subject === "string" && (typeof node.catalogNumber === "string" || typeof node.catalogNumber === "number")) {
    return normalizeCourseCode(`${node.subject}${node.catalogNumber}`)
  }

  return null
}

function readCourseTitle(node: Record<string, unknown>) {
  const fields = ["name", "title", "courseTitle", "descr"]
  for (const field of fields) {
    const value = node[field]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function visitNode(node: unknown, path: string, state: TraverseState) {
  if (Array.isArray(node)) {
    node.forEach((value, index) => visitNode(value, `${path}[${index}]`, state))
    return
  }

  if (!isPlainObject(node)) {
    return
  }

  const code = readCourseCode(node)
  if (code) {
    state.extractedCourses.push({
      code,
      status: normalizeStatus(node, path),
      sourcePath: path,
      title: readCourseTitle(node),
    })
  }

  for (const [key, value] of Object.entries(node)) {
    visitNode(value, path ? `${path}.${key}` : key, state)
  }
}

function toUniqueSorted(values: Iterable<string>) {
  return Array.from(new Set(values)).sort()
}

function normalizeDirectFormat(payload: Record<string, unknown>): NormalizedDegreeAudit | null {
  const completed = Array.isArray(payload.completedCourseCodes)
    ? payload.completedCourseCodes.filter((value): value is string => typeof value === "string").map(normalizeCourseCode)
    : null
  const inProgress = Array.isArray(payload.inProgressCourseCodes)
    ? payload.inProgressCourseCodes.filter((value): value is string => typeof value === "string").map(normalizeCourseCode)
    : null
  const remaining = Array.isArray(payload.remainingRequirementCourseCodes)
    ? payload.remainingRequirementCourseCodes.filter((value): value is string => typeof value === "string").map(normalizeCourseCode)
    : null

  if (!completed && !inProgress && !remaining) {
    return null
  }

  return {
    studentName: typeof payload.studentName === "string" ? payload.studentName : null,
    programName: typeof payload.programName === "string" ? payload.programName : null,
    completedCourseCodes: toUniqueSorted(completed || []),
    inProgressCourseCodes: toUniqueSorted(inProgress || []),
    remainingRequirementCourseCodes: toUniqueSorted(remaining || []),
    extractedCourses: [
      ...(completed || []).map((code) => ({ code, status: "completed" as const, sourcePath: "completedCourseCodes" })),
      ...(inProgress || []).map((code) => ({ code, status: "in-progress" as const, sourcePath: "inProgressCourseCodes" })),
      ...(remaining || []).map((code) => ({ code, status: "remaining" as const, sourcePath: "remainingRequirementCourseCodes" })),
    ],
    warnings: [],
  }
}

export function normalizeDegreeAudit(payload: unknown): NormalizedDegreeAudit {
  if (isPlainObject(payload)) {
    const direct = normalizeDirectFormat(payload)
    if (direct) {
      return direct
    }
  }

  const state: TraverseState = {
    extractedCourses: [],
    warnings: [],
  }

  // The sample degree-audit JSON was not present locally, so the fallback parser scans
  // arbitrary uploaded objects for UF-style course codes plus nearby status fields.
  visitNode(payload, "", state)

  if (state.extractedCourses.length === 0) {
    state.warnings.push(
      "No recognizable course codes were found. The uploader currently expects UF-style codes such as COP3502C."
    )
  }

  const completed = state.extractedCourses
    .filter((course) => course.status === "completed")
    .map((course) => course.code)
  const inProgress = state.extractedCourses
    .filter((course) => course.status === "in-progress")
    .map((course) => course.code)
  const remaining = state.extractedCourses
    .filter((course) => course.status === "remaining")
    .map((course) => course.code)

  const root = isPlainObject(payload) ? payload : {}

  return {
    studentName: typeof root.studentName === "string" ? root.studentName : null,
    programName:
      typeof root.programName === "string"
        ? root.programName
        : typeof root.program === "string"
          ? root.program
          : null,
    completedCourseCodes: toUniqueSorted(completed),
    inProgressCourseCodes: toUniqueSorted(inProgress),
    remainingRequirementCourseCodes: toUniqueSorted(remaining),
    extractedCourses: state.extractedCourses,
    warnings: state.warnings,
  }
}
