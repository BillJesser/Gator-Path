"use client"

import { useRef, useState } from "react"
import { AlertTriangle, FileJson, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlanningData } from "@/components/planning-provider"

export function DegreeAuditUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    uploadedAudit,
    uploadedAuditAt,
    uploadedAuditFileName,
    saveUploadedAudit,
    clearUploadedAudit,
  } = usePlanningData()

  const openPicker = () => {
    inputRef.current?.click()
  }

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const text = await file.text()
      saveUploadedAudit(text, file.name)
      setError(null)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to parse the uploaded degree audit JSON."
      )
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileJson className="h-4 w-4 text-primary" />
          Degree Audit JSON
        </CardTitle>
        <CardDescription>
          Upload a student degree-audit JSON file. The parsed result is reused across the
          degree-audit, planner, and schedule pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="flex flex-wrap gap-2">
          <Button onClick={openPicker}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Degree Audit JSON
          </Button>
          {uploadedAudit && (
            <Button variant="outline" onClick={clearUploadedAudit}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Uploaded Audit
            </Button>
          )}
        </div>

        {uploadedAudit && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{uploadedAuditFileName || "Uploaded degree audit"}</p>
                <p className="text-sm text-muted-foreground">
                  Parsed {uploadedAudit.completedCourseCodes.length} completed and{" "}
                  {uploadedAudit.inProgressCourseCodes.length} in-progress courses.
                </p>
              </div>
              {uploadedAuditAt && (
                <p className="text-xs text-muted-foreground">
                  Uploaded {new Date(uploadedAuditAt).toLocaleString()}
                </p>
              )}
            </div>
            {uploadedAudit.warnings.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedAudit.warnings.map((warning) => (
                  <div
                    key={warning}
                    className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
