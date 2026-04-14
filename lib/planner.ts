import type { UfMeeting } from "@/lib/uf-schedule"

export type PlannedSemesterCourse = {
  code: string
  displayCode: string
  name: string
  sectionNumber: string | null
  credits: number
  color: string | null
  meetings: UfMeeting[]
  sectionDisplay: string | null
  note: string | null
}

export type PlannedSemester = {
  id: string
  label: string
  termCode: string
  courses: PlannedSemesterCourse[]
}

export function createInitialPlannerSemesters(): PlannedSemester[] {
  return [
    {
      id: "summer-2026",
      label: "Summer 2026",
      termCode: "2265",
      courses: [],
    },
    {
      id: "fall-2026",
      label: "Fall 2026",
      termCode: "2268",
      courses: [],
    },
  ]
}
