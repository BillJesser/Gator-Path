import { extractCourseCodes, normalizeCourseCode } from "@/lib/uf-schedule"

export type DegreeAuditCourseStatus = "completed" | "in-progress" | "remaining" | "unknown"

export type DegreeAuditCourseRecord = {
  code: string
  status: DegreeAuditCourseStatus
  sourcePath: string
  title?: string
}

export type DegreeAuditTakenCourse = {
  code: string
  title: string
  termDescription: string | null
  grade: string | null
  inProgress: boolean
}

export type DegreeAuditRequirementNode = {
  id: string
  title: string
  description: string
  status: string
  resultDescription: string
  met: boolean
  inProgress: boolean
  progressValue: number | null
  code: string | null
  coursesTaken: DegreeAuditTakenCourse[]
  children: DegreeAuditRequirementNode[]
}

export type DegreeAuditSection = {
  id: string
  title: string
  description: string
  status: string
  resultDescription: string
  met: boolean
  inProgress: boolean
  progressValue: number | null
  children: DegreeAuditRequirementNode[]
}

export type NormalizedDegreeAudit = {
  sourceFormat: "one-uf" | "simple" | "generic"
  studentName: string | null
  programName: string | null
  completedCourseCodes: string[]
  inProgressCourseCodes: string[]
  remainingRequirementCourseCodes: string[]
  remainingRequirementCourses: DegreeAuditCourseRecord[]
  extractedCourses: DegreeAuditCourseRecord[]
  sections: DegreeAuditSection[]
  warnings: string[]
}

type TraverseState = {
  extractedCourses: DegreeAuditCourseRecord[]
  warnings: string[]
}

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toUniqueSorted(values: Iterable<string>) {
  return Array.from(new Set(values)).sort()
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
    normalized.includes("pending") ||
    normalized.includes("not satisfied")
  ) {
    return "remaining"
  }
  return "unknown"
}

function normalizeStatus(node: PlainObject, path: string) {
  const statusFields = [
    "status",
    "courseStatus",
    "state",
    "requirementStatus",
    "result",
    "resultDescription",
  ]

  for (const field of statusFields) {
    const value = node[field]
    if (typeof value === "string" && value.trim()) {
      return getStatusFromString(value)
    }
  }

  if (node.completed === true || node.satisfied === true || node.met === true) {
    return "completed"
  }
  if (node.inProgress === true || node.current === true) {
    return "in-progress"
  }
  if (node.remaining === true || node.needed === true || node.met === false) {
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

function readCourseCode(node: PlainObject) {
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

  if (
    typeof node.subject === "string" &&
    (typeof node.catalogNumber === "string" || typeof node.catalogNumber === "number")
  ) {
    return normalizeCourseCode(`${node.subject}${node.catalogNumber}`)
  }

  return null
}

function readCourseTitle(node: PlainObject) {
  const fields = ["name", "title", "courseTitle", "descr", "courseName"]
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

function createSimpleNode(course: DegreeAuditCourseRecord, index: number): DegreeAuditRequirementNode {
  return {
    id: `${course.status}-${course.code}-${index}`,
    title: course.title ? `${course.code} - ${course.title}` : course.code,
    description: "",
    status:
      course.status === "completed"
        ? "COMP"
        : course.status === "in-progress"
          ? "IP"
          : course.status === "remaining"
            ? "FAIL"
            : "UNKNOWN",
    resultDescription:
      course.status === "completed"
        ? "Satisfied"
        : course.status === "in-progress"
          ? "In Progress"
          : course.status === "remaining"
            ? "Not Satisfied"
            : "Unknown",
    met: course.status === "completed",
    inProgress: course.status === "in-progress",
    progressValue:
      course.status === "completed" ? 1 : course.status === "in-progress" ? 0.5 : 0,
    code: course.code,
    coursesTaken: [],
    children: [],
  }
}

function normalizeDirectFormat(payload: PlainObject): NormalizedDegreeAudit | null {
  const completed = Array.isArray(payload.completedCourseCodes)
    ? payload.completedCourseCodes
        .filter((value): value is string => typeof value === "string")
        .map(normalizeCourseCode)
    : null
  const inProgress = Array.isArray(payload.inProgressCourseCodes)
    ? payload.inProgressCourseCodes
        .filter((value): value is string => typeof value === "string")
        .map(normalizeCourseCode)
    : null
  const remaining = Array.isArray(payload.remainingRequirementCourseCodes)
    ? payload.remainingRequirementCourseCodes
        .filter((value): value is string => typeof value === "string")
        .map(normalizeCourseCode)
    : null

  if (!completed && !inProgress && !remaining) {
    return null
  }

  const completedRecords = (completed || []).map((code) => ({
    code,
    status: "completed" as const,
    sourcePath: "completedCourseCodes",
  }))
  const inProgressRecords = (inProgress || []).map((code) => ({
    code,
    status: "in-progress" as const,
    sourcePath: "inProgressCourseCodes",
  }))
  const remainingRecords = (remaining || []).map((code) => ({
    code,
    status: "remaining" as const,
    sourcePath: "remainingRequirementCourseCodes",
  }))

  const sections: DegreeAuditSection[] = [
    {
      id: "completed",
      title: "Completed Courses",
      description: "Courses already satisfied in the uploaded profile.",
      status: "COMP",
      resultDescription: "Satisfied",
      met: true,
      inProgress: false,
      progressValue: 1,
      children: completedRecords.map(createSimpleNode),
    },
    {
      id: "in-progress",
      title: "In Progress",
      description: "Courses currently in progress in the uploaded profile.",
      status: "IP",
      resultDescription: "In Progress",
      met: false,
      inProgress: true,
      progressValue: 0.5,
      children: inProgressRecords.map(createSimpleNode),
    },
    {
      id: "remaining",
      title: "Remaining Requirements",
      description: "Courses marked as remaining in the uploaded profile.",
      status: "FAIL",
      resultDescription: "Not Satisfied",
      met: false,
      inProgress: false,
      progressValue: 0,
      children: remainingRecords.map(createSimpleNode),
    },
  ].filter((section) => section.children.length > 0)

  return {
    sourceFormat: "simple",
    studentName: typeof payload.studentName === "string" ? payload.studentName : null,
    programName:
      typeof payload.programName === "string"
        ? payload.programName
        : typeof payload.program === "string"
          ? payload.program
          : null,
    completedCourseCodes: toUniqueSorted(completed || []),
    inProgressCourseCodes: toUniqueSorted(inProgress || []),
    remainingRequirementCourseCodes: toUniqueSorted(remaining || []),
    remainingRequirementCourses: remainingRecords,
    extractedCourses: [...completedRecords, ...inProgressRecords, ...remainingRecords],
    sections,
    warnings: [],
  }
}

function parseTakenCourse(entry: unknown): DegreeAuditTakenCourse | null {
  if (!isPlainObject(entry)) {
    return null
  }

  const code = readCourseCode(entry)
  if (!code) {
    return null
  }

  return {
    code,
    title:
      (typeof entry.courseName === "string" && entry.courseName) ||
      (typeof entry.title === "string" && entry.title) ||
      code,
    termDescription:
      typeof entry.termDescription === "string" ? entry.termDescription : null,
    grade: typeof entry.grade === "string" && entry.grade ? entry.grade : null,
    inProgress: entry.inProgress === true,
  }
}

function parseOneUfNode(
  node: unknown,
  path: string,
  extracted: DegreeAuditCourseRecord[]
): DegreeAuditRequirementNode | null {
  if (!isPlainObject(node)) {
    return null
  }

  const title = typeof node.title === "string" ? node.title : "Requirement"
  const description = typeof node.description === "string" ? node.description : ""
  const status = typeof node.status === "string" ? node.status : "UNKNOWN"
  const resultDescription =
    typeof node.resultDescription === "string" ? node.resultDescription : ""
  const code = extractCourseCodes(title)[0] || null

  const coursesTaken = Array.isArray(node.coursesTaken)
    ? node.coursesTaken
        .map(parseTakenCourse)
        .filter((course): course is DegreeAuditTakenCourse => course !== null)
    : []

  const childCollections = [node.requirements, node.subRequirements]
  const children = childCollections.flatMap((collection, collectionIndex) =>
    Array.isArray(collection)
      ? collection
          .map((child, index) =>
            parseOneUfNode(child, `${path}.children${collectionIndex}[${index}]`, extracted)
          )
          .filter((child): child is DegreeAuditRequirementNode => child !== null)
      : []
  )

  if (code) {
    let derivedStatus: DegreeAuditCourseStatus = "unknown"
    if (node.inProgress === true || coursesTaken.some((course) => course.inProgress)) {
      derivedStatus = "in-progress"
    } else if (node.met === true || status === "COMP") {
      derivedStatus = "completed"
    } else if (node.met === false || status === "FAIL") {
      derivedStatus = "remaining"
    }

    extracted.push({
      code,
      status: derivedStatus,
      sourcePath: path,
      title,
    })
  }

  for (const course of coursesTaken) {
    extracted.push({
      code: course.code,
      status: course.inProgress ? "in-progress" : "completed",
      sourcePath: `${path}.coursesTaken`,
      title: course.title,
    })
  }

  return {
    id: path,
    title,
    description,
    status,
    resultDescription,
    met: node.met === true,
    inProgress: node.inProgress === true,
    progressValue: typeof node.progressValue === "number" ? node.progressValue : null,
    code,
    coursesTaken,
    children,
  }
}

function normalizeOneUfExport(payload: PlainObject): NormalizedDegreeAudit | null {
  const careers = Array.isArray(payload.careers) ? payload.careers : []
  const firstCareer = careers.find((career) => isPlainObject(career))
  if (!firstCareer || !isPlainObject(firstCareer)) {
    return null
  }

  const programs = Array.isArray(firstCareer.programs) ? firstCareer.programs : []
  const primaryProgram = programs.find((program) => isPlainObject(program)) as PlainObject | undefined

  const extracted: DegreeAuditCourseRecord[] = []
  const completedFromCareer: string[] = []
  const inProgressFromCareer: string[] = []

  const careerCoursesTaken = Array.isArray(firstCareer.coursesTaken) ? firstCareer.coursesTaken : []
  for (const course of careerCoursesTaken) {
    const parsed = parseTakenCourse(course)
    if (!parsed) {
      continue
    }

    extracted.push({
      code: parsed.code,
      status: parsed.inProgress ? "in-progress" : "completed",
      sourcePath: "careers[0].coursesTaken",
      title: parsed.title,
    })

    if (parsed.inProgress) {
      inProgressFromCareer.push(parsed.code)
    } else {
      completedFromCareer.push(parsed.code)
    }
  }

  const sections: DegreeAuditSection[] = []
  const planGroups = Array.isArray(firstCareer.planGroups) ? firstCareer.planGroups : []
  planGroups.forEach((group, groupIndex) => {
    if (!Array.isArray(group)) {
      return
    }

    group.forEach((item, itemIndex) => {
      const parsed = parseOneUfNode(item, `careers[0].planGroups[${groupIndex}][${itemIndex}]`, extracted)
      if (!parsed) {
        return
      }

      sections.push({
        id: parsed.id,
        title: parsed.title,
        description: parsed.description,
        status: parsed.status,
        resultDescription: parsed.resultDescription,
        met: parsed.met,
        inProgress: parsed.inProgress,
        progressValue: parsed.progressValue,
        children: parsed.children,
      })
    })
  })

  const completed = extracted
    .filter((course) => course.status === "completed")
    .map((course) => course.code)
  const inProgress = extracted
    .filter((course) => course.status === "in-progress")
    .map((course) => course.code)
  const remainingRecords = extracted.filter((course) => course.status === "remaining")

  const remaining = remainingRecords.map((course) => course.code)

  return {
    sourceFormat: "one-uf",
    studentName: typeof firstCareer.name === "string" ? firstCareer.name : null,
    programName:
      typeof primaryProgram?.programName === "string"
        ? primaryProgram.programName
        : typeof firstCareer.careerDescription === "string"
          ? firstCareer.careerDescription
          : null,
    completedCourseCodes: toUniqueSorted([...completedFromCareer, ...completed]),
    inProgressCourseCodes: toUniqueSorted([...inProgressFromCareer, ...inProgress]),
    remainingRequirementCourseCodes: toUniqueSorted(remaining),
    remainingRequirementCourses: remainingRecords,
    extractedCourses: extracted,
    sections,
    warnings: [],
  }
}

export function normalizeDegreeAudit(payload: unknown): NormalizedDegreeAudit {
  if (isPlainObject(payload)) {
    const direct = normalizeDirectFormat(payload)
    if (direct) {
      return direct
    }

    const oneUf = normalizeOneUfExport(payload)
    if (oneUf) {
      return oneUf
    }
  }

  const state: TraverseState = {
    extractedCourses: [],
    warnings: [],
  }

  visitNode(payload, "", state)

  if (state.extractedCourses.length === 0) {
    state.warnings.push(
      "No recognizable course codes were found. The uploader currently expects either the ONE.UF degree-audit export shape or UF-style course codes such as COP3502C."
    )
  }

  const completed = state.extractedCourses
    .filter((course) => course.status === "completed")
    .map((course) => course.code)
  const inProgress = state.extractedCourses
    .filter((course) => course.status === "in-progress")
    .map((course) => course.code)
  const remainingRecords = state.extractedCourses.filter((course) => course.status === "remaining")
  const remaining = remainingRecords.map((course) => course.code)

  const root = isPlainObject(payload) ? payload : {}

  return {
    sourceFormat: "generic",
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
    remainingRequirementCourses: remainingRecords,
    extractedCourses: state.extractedCourses,
    sections: [],
    warnings: state.warnings,
  }
}
