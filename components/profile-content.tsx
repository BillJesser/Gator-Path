"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Info,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const majors = [
  "Computer Science",
  "Computer Engineering",
  "Digital Arts & Sciences",
  "Information Systems",
  "Electrical Engineering",
]

const minors = [
  "Mathematics",
  "Business Administration",
  "Digital Arts & Sciences",
  "Statistics",
  "Physics",
]

export function ProfileContent() {
  const [timePreference, setTimePreference] = useState<string[]>(["morning", "afternoon"])
  const [formatPreference, setFormatPreference] = useState("hybrid")

  const toggleTimePreference = (time: string) => {
    setTimePreference((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    )
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
                    <Label htmlFor="major">Primary Major</Label>
                    <Select defaultValue="Computer Science">
                      <SelectTrigger id="major">
                        <SelectValue placeholder="Select major" />
                      </SelectTrigger>
                      <SelectContent>
                        {majors.map((major) => (
                          <SelectItem key={major} value={major}>
                            {major}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minor">Minor (Optional)</Label>
                    <Select defaultValue="Mathematics">
                      <SelectTrigger id="minor">
                        <SelectValue placeholder="Select minor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {minors.map((minor) => (
                          <SelectItem key={minor} value={minor}>
                            {minor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduation">Target Graduation</Label>
                    <Select defaultValue="Spring 2027">
                      <SelectTrigger id="graduation">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Summer 2026">Summer 2026</SelectItem>
                        <SelectItem value="Fall 2026">Fall 2026</SelectItem>
                        <SelectItem value="Spring 2027">Spring 2027</SelectItem>
                        <SelectItem value="Summer 2027">Summer 2027</SelectItem>
                        <SelectItem value="Fall 2027">Fall 2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufid">UF ID</Label>
                    <Input id="ufid" defaultValue="1234-5678" disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      Contact registrar to update
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
                    <div className="flex items-center justify-between">
                      <Label>Fall/Spring Credits</Label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Full-time status requires 12+ credits</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select defaultValue="15">
                      <SelectTrigger>
                        <SelectValue placeholder="Select credits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 credits (minimum full-time)</SelectItem>
                        <SelectItem value="13">13 credits</SelectItem>
                        <SelectItem value="14">14 credits</SelectItem>
                        <SelectItem value="15">15 credits (recommended)</SelectItem>
                        <SelectItem value="16">16 credits</SelectItem>
                        <SelectItem value="17">17 credits</SelectItem>
                        <SelectItem value="18">18 credits (heavy load)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Summer Attendance</Label>
                    <div className="flex items-start gap-3">
                      <Checkbox id="summer" defaultChecked />
                      <div className="space-y-1">
                        <label htmlFor="summer" className="text-sm font-medium cursor-pointer">
                          Include summer semesters in my plan
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Taking summer classes can help you graduate earlier
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Summer Credits</Label>
                    <Select defaultValue="6">
                      <SelectTrigger>
                        <SelectValue placeholder="Select credits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 credits (1 course)</SelectItem>
                        <SelectItem value="6">6 credits (2 courses)</SelectItem>
                        <SelectItem value="9">9 credits (3 courses)</SelectItem>
                        <SelectItem value="12">12 credits (full-time)</SelectItem>
                      </SelectContent>
                    </Select>
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
