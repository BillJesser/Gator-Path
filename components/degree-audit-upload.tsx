"use client"

import { useRef, useState } from "react"
import { AlertTriangle, FileJson, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlanningData } from "@/components/planning-provider"

export function DegreeAuditUpload({
  variant = "default",
}: {
  variant?: "default" | "entry"
}) {
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

  if (variant === "entry") {
    return (
      <div className="w-full max-w-xl">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="rounded-3xl border border-border bg-card/80 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <FileJson className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">Gator Path</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Upload your degree audit JSON to enter the app.
          </p>
          <div className="mt-8">
            <Button size="lg" className="min-w-56" onClick={openPicker}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Degree Audit
            </Button>
          </div>
          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-left text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    )
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
          dashboard, degree-audit, planner, coursework, and profile pages.
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
