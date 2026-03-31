import rawCatalog from "@/data/course-catalog.json"

export type CourseDifficulty = "Easy" | "Medium" | "Hard"
export type ElectiveSource = "CISE Technical Elective" | "Approved Tech Elective"

type RawCatalogCourse = {
  code: string
  displayCode: string
  name: string
  difficulty: CourseDifficulty
  notes: string | null
  group: string | null
}

export type CatalogCourse = RawCatalogCourse & {
  group: string
}

export type ElectiveCourse = CatalogCourse & {
  source: ElectiveSource
}

type DifficultyLegend = {
  difficulty: CourseDifficulty
  description: string
}

type CatalogPayload = {
  legend: DifficultyLegend[]
  note: string | null
  requiredCoreCourses: RawCatalogCourse[]
  ciseTechnicalElectives: RawCatalogCourse[]
  approvedTechElectives: RawCatalogCourse[]
}

const catalog = rawCatalog as CatalogPayload

function normalizeGroupLabel(group: string | null) {
  return group?.replaceAll("\u2500", "").trim() || "Other"
}

function normalizeCourse(course: RawCatalogCourse): CatalogCourse {
  return {
    ...course,
    group: normalizeGroupLabel(course.group),
  }
}

function addElectiveSource(source: ElectiveSource) {
  return (course: CatalogCourse): ElectiveCourse => ({
    ...course,
    source,
  })
}

function byLabel(a: { group: string }, b: { group: string }) {
  return a.group.localeCompare(b.group)
}

export const catalogLegend = catalog.legend
export const catalogNote = catalog.note || "Difficulty ratings may vary by instructor and term."

export const requiredCoreCourses = catalog.requiredCoreCourses
  .map(normalizeCourse)
  .sort((a, b) => byLabel(a, b) || a.code.localeCompare(b.code))

export const ciseTechnicalElectives: ElectiveCourse[] = catalog.ciseTechnicalElectives
  .map(normalizeCourse)
  .map(addElectiveSource("CISE Technical Elective"))
  .sort((a, b) => byLabel(a, b) || a.code.localeCompare(b.code))

export const approvedTechElectives: ElectiveCourse[] = catalog.approvedTechElectives
  .map(normalizeCourse)
  .map(addElectiveSource("Approved Tech Elective"))
  .sort((a, b) => byLabel(a, b) || a.code.localeCompare(b.code))

export const electiveCourses = [...ciseTechnicalElectives, ...approvedTechElectives]

export const requiredGroups = [
  "All",
  ...Array.from(new Set(requiredCoreCourses.map((course) => course.group))),
]

export const electiveGroups = [
  "All",
  ...Array.from(new Set(electiveCourses.map((course) => course.group))).sort(),
]

export const electiveSources = [
  "All",
  "CISE Technical Elective",
  "Approved Tech Elective",
] as const

export const electiveSourceLabels: Record<(typeof electiveSources)[number], string> = {
  All: "All Electives",
  "CISE Technical Elective": "CISE Electives",
  "Approved Tech Elective": "Approved Outside Electives",
}
