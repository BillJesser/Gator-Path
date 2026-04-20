"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  normalizeDegreeAudit,
  type NormalizedDegreeAudit,
} from "@/lib/degree-audit"
import {
  createInitialPlannerSemesters,
  type PlannedSemester,
} from "@/lib/planner"
import { TERM_OPTIONS } from "@/lib/uf-schedule"

const DEFAULT_TERM = TERM_OPTIONS[1]?.code || "2268"
const UPLOADED_AUDIT_GPA = 3.75

type PlanningContextValue = {
  selectedTerm: string
  setSelectedTerm: (term: string) => void
  plannerSemesters: PlannedSemester[]
  setPlannerSemesters: Dispatch<SetStateAction<PlannedSemester[]>>
  uploadedAudit: NormalizedDegreeAudit | null
  uploadedAuditFileName: string | null
  uploadedAuditAt: string | null
  saveUploadedAudit: (rawText: string, fileName: string) => NormalizedDegreeAudit
  clearUploadedAudit: () => void
}

const PlanningContext = createContext<PlanningContextValue | null>(null)

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [selectedTerm, setSelectedTerm] = useState<string>(DEFAULT_TERM)
  const [plannerSemesters, setPlannerSemesters] = useState<PlannedSemester[]>([])
  const [uploadedAudit, setUploadedAudit] = useState<NormalizedDegreeAudit | null>(null)
  const [uploadedAuditFileName, setUploadedAuditFileName] = useState<string | null>(null)
  const [uploadedAuditAt, setUploadedAuditAt] = useState<string | null>(null)

  const value = useMemo<PlanningContextValue>(
    () => ({
      selectedTerm,
      setSelectedTerm,
      plannerSemesters,
      setPlannerSemesters,
      uploadedAudit,
      uploadedAuditFileName,
      uploadedAuditAt,
      saveUploadedAudit(rawText, fileName) {
        const parsedJson = JSON.parse(rawText) as unknown
        const normalized = {
          ...normalizeDegreeAudit(parsedJson),
          gpa: UPLOADED_AUDIT_GPA,
        }
        setSelectedTerm(DEFAULT_TERM)
        setPlannerSemesters(createInitialPlannerSemesters())
        setUploadedAudit(normalized)
        setUploadedAuditFileName(fileName)
        setUploadedAuditAt(new Date().toISOString())
        return normalized
      },
      clearUploadedAudit() {
        setSelectedTerm(DEFAULT_TERM)
        setPlannerSemesters([])
        setUploadedAudit(null)
        setUploadedAuditFileName(null)
        setUploadedAuditAt(null)
      },
    }),
    [plannerSemesters, selectedTerm, uploadedAudit, uploadedAuditAt, uploadedAuditFileName]
  )

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>
}

export function usePlanningData() {
  const context = useContext(PlanningContext)
  if (!context) {
    throw new Error("usePlanningData must be used within PlanningProvider.")
  }
  return context
}
