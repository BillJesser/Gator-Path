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
      <div className="w-full max-w-2xl">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFileChange}
        />

        <div className="relative overflow-hidden rounded-3xl border border-[rgb(40,87,151)]/20 bg-[rgb(255,255,255)] shadow-lg">
          <div className="absolute inset-x-0 top-0 h-2 bg-[rgb(224,129,46)]" />
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[rgb(40,87,151)]/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[rgb(224,129,46)]/10 blur-2xl" />

          <div className="relative space-y-6 p-8 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgb(40,87,151)]/15 bg-[rgb(40,87,151)]/10">
              <FileJson className="h-8 w-8 text-[rgb(40,87,151)]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-[rgb(40,87,151)]">Gator Path</h1>
              <p className="text-sm text-slate-600">Upload your degree audit JSON to enter the app.</p>
            </div>

            <div className="rounded-2xl border border-[rgb(40,87,151)]/15 bg-white/90 p-5 text-left">
              <p className="text-sm font-semibold text-[rgb(40,87,151)]">
                How to export your file from ONE.UF
              </p>
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                <li>1. Sign in at one.uf.edu and open your Degree Audit page.</li>
                <li>2. Choose the export/download option for audit data.</li>
                <li>3. Select JSON format and save the file to your device.</li>
                <li>4. Return here and upload that JSON file.</li>
              </ol>
            </div>

            <div>
              <Button
                size="lg"
                className="min-w-56 bg-[rgb(40,87,151)] text-white hover:bg-[rgb(30,69,120)]"
                onClick={openPicker}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Degree Audit
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-left text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
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
          dashboard, degree-audit, planner, coursework, and profile pages. In ONE.UF, open Degree
          Audit, export/download the audit as JSON, then upload it here.
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
