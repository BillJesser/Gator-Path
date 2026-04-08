"use client"

import { useState } from "react"
import { usePlanningData } from "@/components/planning-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GraduationCap,
  BookOpen,
  Clock,
  Sun,
  Moon,
  Sunset,
  Monitor,
  Users,
  Save,
  CheckCircle2,
  Circle,
} from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

export function ProfileContent() {
  const { uploadedAudit, uploadedAuditFileName } = usePlanningData()
  const [timePreference, setTimePreference] = useState<string[]>(["morning", "afternoon"])
  const [formatPreference, setFormatPreference] = useState("hybrid")

  const toggleTimePreference = (time: string) => {
    setTimePreference((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    )
  }

  if (!uploadedAudit) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Profile Setup</h1>
          <p className="text-muted-foreground">
            Configure your academic profile and preferences for personalized planning.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Academic Information
                  </CardTitle>
                  <CardDescription>Your degree program details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Student Name</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.studentName || "Unknown student"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Program</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.programName || "Unknown program"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Source File</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAuditFileName || "Uploaded degree audit"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Source Format</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.sourceFormat}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Load Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Credit Load
                  </CardTitle>
                  <CardDescription>How many credits per semester?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Completed Courses</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.completedCourseCodes.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>In-Progress Courses</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.inProgressCourseCodes.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Remaining Requirements</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.remainingRequirementCourseCodes.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Requirement Sections</Label>
                    <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                      {uploadedAudit.sections.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Time Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Preferred Class Times
                  </CardTitle>
                  <CardDescription>When do you prefer to have classes?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <button
                      onClick={() => toggleTimePreference("morning")}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        timePreference.includes("morning")
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          timePreference.includes("morning")
                            ? "bg-primary/20"
                            : "bg-muted"
                        }`}
                      >
                        <Sun
                          className={`w-5 h-5 ${
                            timePreference.includes("morning")
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Morning</p>
                        <p className="text-sm text-muted-foreground">8:00 AM - 12:00 PM</p>
                      </div>
                      {timePreference.includes("morning") && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleTimePreference("afternoon")}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        timePreference.includes("afternoon")
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          timePreference.includes("afternoon")
                            ? "bg-primary/20"
                            : "bg-muted"
                        }`}
                      >
                        <Sunset
                          className={`w-5 h-5 ${
                            timePreference.includes("afternoon")
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Afternoon</p>
                        <p className="text-sm text-muted-foreground">12:00 PM - 5:00 PM</p>
                      </div>
                      {timePreference.includes("afternoon") && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleTimePreference("evening")}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        timePreference.includes("evening")
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          timePreference.includes("evening")
                            ? "bg-primary/20"
                            : "bg-muted"
                        }`}
                      >
                        <Moon
                          className={`w-5 h-5 ${
                            timePreference.includes("evening")
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Evening</p>
                        <p className="text-sm text-muted-foreground">5:00 PM - 9:00 PM</p>
                      </div>
                      {timePreference.includes("evening") && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Format Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Class Format
                  </CardTitle>
                  <CardDescription>How do you prefer to attend classes?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <button
                      onClick={() => setFormatPreference("in-person")}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        formatPreference === "in-person"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formatPreference === "in-person" ? "bg-primary/20" : "bg-muted"
                        }`}
                      >
                        <Users
                          className={`w-5 h-5 ${
                            formatPreference === "in-person"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">In-Person Only</p>
                        <p className="text-sm text-muted-foreground">Traditional classroom setting</p>
                      </div>
                      {formatPreference === "in-person" ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </button>
                    <button
                      onClick={() => setFormatPreference("hybrid")}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        formatPreference === "hybrid"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formatPreference === "hybrid" ? "bg-primary/20" : "bg-muted"
                        }`}
                      >
                        <div className="flex">
                          <Users className={`w-3 h-3 ${
                            formatPreference === "hybrid"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`} />
                          <Monitor className={`w-3 h-3 ${
                            formatPreference === "hybrid"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`} />
                        </div>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Hybrid / Flexible</p>
                        <p className="text-sm text-muted-foreground">Mix of in-person and online</p>
                      </div>
                      {formatPreference === "hybrid" ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </button>
                    <button
                      onClick={() => setFormatPreference("online")}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        formatPreference === "online"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          formatPreference === "online" ? "bg-primary/20" : "bg-muted"
                        }`}
                      >
                        <Monitor
                          className={`w-5 h-5 ${
                            formatPreference === "online"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">Online Only</p>
                        <p className="text-sm text-muted-foreground">Remote/virtual classes</p>
                      </div>
                      {formatPreference === "online" ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
}
