"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  normalizeDegreeAudit,
  type NormalizedDegreeAudit,
} from "@/lib/degree-audit"
import { TERM_OPTIONS } from "@/lib/uf-schedule"

const STORAGE_KEY = "gator-path-degree-audit-v1"
const DEFAULT_TERM = TERM_OPTIONS[1]?.code || "2268"

type StoredAuditPayload = {
  fileName: string
  uploadedAt: string
  audit?: NormalizedDegreeAudit
  rawText?: string
}

function coerceStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function hydrateStoredAudit(value: unknown): NormalizedDegreeAudit | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const audit = value as Partial<NormalizedDegreeAudit> & {
    extractedCourses?: Array<{
      code?: string
      status?: string
      sourcePath?: string
      title?: string
    }>
  }

  const extractedCourses = Array.isArray(audit.extractedCourses)
    ? audit.extractedCourses
        .filter((course) => typeof course?.code === "string")
        .map((course) => ({
          code: String(course.code),
          status:
            course.status === "completed" ||
            course.status === "in-progress" ||
            course.status === "remaining" ||
            course.status === "unknown"
              ? course.status
              : "unknown",
          sourcePath: typeof course.sourcePath === "string" ? course.sourcePath : "storedAudit",
          title: typeof course.title === "string" ? course.title : undefined,
        }))
    : []

  const remainingRequirementCourses =
    Array.isArray(audit.remainingRequirementCourses) && audit.remainingRequirementCourses.length > 0
      ? audit.remainingRequirementCourses
      : extractedCourses.filter((course) => course.status === "remaining").length > 0
        ? extractedCourses.filter((course) => course.status === "remaining")
        : coerceStringArray(audit.remainingRequirementCourseCodes).map((code) => ({
            code,
            status: "remaining" as const,
            sourcePath: "storedAudit.remainingRequirementCourseCodes",
          }))

  return {
    sourceFormat:
      audit.sourceFormat === "one-uf" ||
      audit.sourceFormat === "simple" ||
      audit.sourceFormat === "generic"
        ? audit.sourceFormat
        : "generic",
    studentName: typeof audit.studentName === "string" ? audit.studentName : null,
    programName: typeof audit.programName === "string" ? audit.programName : null,
    completedCourseCodes: coerceStringArray(audit.completedCourseCodes),
    inProgressCourseCodes: coerceStringArray(audit.inProgressCourseCodes),
    remainingRequirementCourseCodes: coerceStringArray(audit.remainingRequirementCourseCodes),
    remainingRequirementCourses,
    extractedCourses,
    sections: Array.isArray(audit.sections) ? audit.sections : [],
    warnings: coerceStringArray(audit.warnings),
  }
}

type PlanningContextValue = {
  selectedTerm: string
  setSelectedTerm: (term: string) => void
  uploadedAudit: NormalizedDegreeAudit | null
  uploadedAuditFileName: string | null
  uploadedAuditAt: string | null
  saveUploadedAudit: (rawText: string, fileName: string) => NormalizedDegreeAudit
  clearUploadedAudit: () => void
}

const PlanningContext = createContext<PlanningContextValue | null>(null)

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [selectedTerm, setSelectedTerm] = useState<string>(DEFAULT_TERM)
  const [uploadedAudit, setUploadedAudit] = useState<NormalizedDegreeAudit | null>(null)
  const [uploadedAuditFileName, setUploadedAuditFileName] = useState<string | null>(null)
  const [uploadedAuditAt, setUploadedAuditAt] = useState<string | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as StoredAuditPayload
      const restoredAudit =
        typeof parsed.rawText === "string"
          ? normalizeDegreeAudit(JSON.parse(parsed.rawText) as unknown)
          : hydrateStoredAudit(parsed.audit)

      if (!restoredAudit) {
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }

      setUploadedAudit(restoredAudit)
      setUploadedAuditFileName(parsed.fileName)
      setUploadedAuditAt(parsed.uploadedAt)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const value = useMemo<PlanningContextValue>(
    () => ({
      selectedTerm,
      setSelectedTerm,
      uploadedAudit,
      uploadedAuditFileName,
      uploadedAuditAt,
      saveUploadedAudit(rawText, fileName) {
        const parsedJson = JSON.parse(rawText) as unknown
        const normalized = normalizeDegreeAudit(parsedJson)
        const stored: StoredAuditPayload = {
          fileName,
          uploadedAt: new Date().toISOString(),
          audit: normalized,
          rawText,
        }

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
        setUploadedAudit(normalized)
        setUploadedAuditFileName(fileName)
        setUploadedAuditAt(stored.uploadedAt)
        return normalized
      },
      clearUploadedAudit() {
        window.localStorage.removeItem(STORAGE_KEY)
        setUploadedAudit(null)
        setUploadedAuditFileName(null)
        setUploadedAuditAt(null)
      },
    }),
    [selectedTerm, uploadedAudit, uploadedAuditAt, uploadedAuditFileName]
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
