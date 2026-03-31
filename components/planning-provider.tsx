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
  audit: NormalizedDegreeAudit
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
      setUploadedAudit(parsed.audit)
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
