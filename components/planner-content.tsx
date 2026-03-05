"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Lock,
  Unlock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  GripVertical,
  Plus,
  Sparkles,
  Clock,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Course = {
  code: string
  name: string
  credits: number
  difficulty: "Easy" | "Medium" | "Hard"
  locked: boolean
  prereqs?: string[]
  alternatives?: { code: string; name: string }[]
}

type Semester = {
  id: string
  term: string
  year: number
  courses: Course[]
  totalCredits: number
  expanded: boolean
}

const initialSemesters: Semester[] = [
  {
    id: "summer-2026",
    term: "Summer",
    year: 2026,
    expanded: true,
    totalCredits: 9,
    courses: [
      { code: "COP4600", name: "Operating Systems", credits: 3, difficulty: "Hard", locked: false, prereqs: ["COP3530"], alternatives: [{ code: "COP4020", name: "Programming Languages" }] },
      { code: "CEN3031", name: "Introduction to Software Engineering", credits: 3, difficulty: "Medium", locked: false },
      { code: "MAS3114", name: "Computational Linear Algebra", credits: 3, difficulty: "Medium", locked: false },
    ],
  },
  {
    id: "fall-2026",
    term: "Fall",
    year: 2026,
    expanded: true,
    totalCredits: 15,
    courses: [
      { code: "COP4020", name: "Programming Language Concepts", credits: 3, difficulty: "Hard", locked: true },
      { code: "CIS4301", name: "Information and Database Systems", credits: 3, difficulty: "Medium", locked: false },
      { code: "CDA3101", name: "Computer Organization", credits: 3, difficulty: "Hard", locked: false, prereqs: ["COP3530"] },
      { code: "STA3032", name: "Engineering Statistics", credits: 3, difficulty: "Medium", locked: false },
      { code: "ENC3246", name: "Professional Communication", credits: 3, difficulty: "Easy", locked: false },
    ],
  },
  {
    id: "spring-2027",
    term: "Spring",
    year: 2027,
    expanded: true,
    totalCredits: 12,
    courses: [
      { code: "COP4533", name: "Algorithm Abstraction and Design", credits: 3, difficulty: "Hard", locked: false, prereqs: ["COP3530", "MAS3114"] },
      { code: "CNT4007", name: "Computer Network Fundamentals", credits: 3, difficulty: "Medium", locked: false },
      { code: "CIS4914", name: "Senior Project", credits: 3, difficulty: "Medium", locked: true },
      { code: "Elective", name: "Major Elective", credits: 3, difficulty: "Medium", locked: false },
    ],
  },
]

type RecommendedSchedule = {
  id: string
  label: string
  description: string
  courses: { code: string; name: string; credits: number; difficulty: "Easy" | "Medium" | "Hard" }[]
  totalCredits: number
  workload: "Light" | "Moderate" | "Heavy"
}

function getRecommendations(semId: string, _prefs: { time: string; format: string; maxCredits: string }): RecommendedSchedule[] {
  if (semId === "summer-2026") {
    return [
      {
        id: "rec-a", label: "Balanced Plan", description: "A mix of difficulty levels with 9 credits",
        courses: [
          { code: "COP4600", name: "Operating Systems", credits: 3, difficulty: "Hard" },
          { code: "CEN3031", name: "Intro to Software Engineering", credits: 3, difficulty: "Medium" },
          { code: "MAS3114", name: "Computational Linear Algebra", credits: 3, difficulty: "Medium" },
        ],
        totalCredits: 9, workload: "Moderate",
      },
      {
        id: "rec-b", label: "Lighter Load", description: "Focus on fewer courses with lower difficulty",
        courses: [
          { code: "CEN3031", name: "Intro to Software Engineering", credits: 3, difficulty: "Medium" },
          { code: "MAS3114", name: "Computational Linear Algebra", credits: 3, difficulty: "Medium" },
        ],
        totalCredits: 6, workload: "Light",
      },
      {
        id: "rec-c", label: "Accelerated", description: "Take heavier load to graduate sooner",
        courses: [
          { code: "COP4600", name: "Operating Systems", credits: 3, difficulty: "Hard" },
          { code: "CEN3031", name: "Intro to Software Engineering", credits: 3, difficulty: "Medium" },
          { code: "MAS3114", name: "Computational Linear Algebra", credits: 3, difficulty: "Medium" },
          { code: "STA3032", name: "Engineering Statistics", credits: 3, difficulty: "Medium" },
        ],
        totalCredits: 12, workload: "Heavy",
      },
    ]
  }
  if (semId === "fall-2026") {
    return [
      {
        id: "rec-a", label: "Balanced Plan", description: "Standard full-time load with variety",
        courses: [
          { code: "COP4020", name: "Programming Language Concepts", credits: 3, difficulty: "Hard" },
          { code: "CIS4301", name: "Info & Database Systems", credits: 3, difficulty: "Medium" },
          { code: "CDA3101", name: "Computer Organization", credits: 3, difficulty: "Hard" },
          { code: "STA3032", name: "Engineering Statistics", credits: 3, difficulty: "Medium" },
          { code: "ENC3246", name: "Professional Communication", credits: 3, difficulty: "Easy" },
        ],
        totalCredits: 15, workload: "Heavy",
      },
      {
        id: "rec-b", label: "Reduced Stress", description: "Fewer hard courses this semester",
        courses: [
          { code: "CIS4301", name: "Info & Database Systems", credits: 3, difficulty: "Medium" },
          { code: "STA3032", name: "Engineering Statistics", credits: 3, difficulty: "Medium" },
          { code: "ENC3246", name: "Professional Communication", credits: 3, difficulty: "Easy" },
          { code: "COP4020", name: "Programming Language Concepts", credits: 3, difficulty: "Hard" },
        ],
        totalCredits: 12, workload: "Moderate",
      },
      {
        id: "rec-c", label: "Major Focus", description: "Prioritize core CS requirements",
        courses: [
          { code: "COP4020", name: "Programming Language Concepts", credits: 3, difficulty: "Hard" },
          { code: "CDA3101", name: "Computer Organization", credits: 3, difficulty: "Hard" },
          { code: "CIS4301", name: "Info & Database Systems", credits: 3, difficulty: "Medium" },
          { code: "ENC3246", name: "Professional Communication", credits: 3, difficulty: "Easy" },
        ],
        totalCredits: 12, workload: "Moderate",
      },
    ]
  }
  return [
    {
      id: "rec-a", label: "Balanced Plan", description: "Complete remaining requirements",
      courses: [
        { code: "COP4533", name: "Algorithm Abstraction & Design", credits: 3, difficulty: "Hard" },
        { code: "CNT4007", name: "Computer Networks", credits: 3, difficulty: "Medium" },
        { code: "CIS4914", name: "Senior Project", credits: 3, difficulty: "Medium" },
        { code: "CAP4630", name: "Artificial Intelligence", credits: 3, difficulty: "Medium" },
      ],
      totalCredits: 12, workload: "Moderate",
    },
    {
      id: "rec-b", label: "Senior Focus", description: "Prioritize capstone and elective",
      courses: [
        { code: "CIS4914", name: "Senior Project", credits: 3, difficulty: "Medium" },
        { code: "COP4533", name: "Algorithm Abstraction & Design", credits: 3, difficulty: "Hard" },
        { code: "CAP4720", name: "Computer Graphics", credits: 3, difficulty: "Hard" },
      ],
      totalCredits: 9, workload: "Moderate",
    },
    {
      id: "rec-c", label: "Light Finish", description: "Minimal load for final semester",
      courses: [
        { code: "CIS4914", name: "Senior Project", credits: 3, difficulty: "Medium" },
        { code: "CNT4007", name: "Computer Networks", credits: 3, difficulty: "Medium" },
        { code: "COP4533", name: "Algorithm Abstraction & Design", credits: 3, difficulty: "Hard" },
      ],
      totalCredits: 9, workload: "Light",
    },
  ]
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Hard":
      return "bg-destructive/10 text-destructive"
    case "Medium":
      return "bg-accent/20 text-accent"
    case "Easy":
      return "bg-green-100 text-green-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getWorkloadColor(workload: string) {
  switch (workload) {
    case "Heavy":
      return "text-destructive"
    case "Moderate":
      return "text-accent"
    case "Light":
      return "text-green-600"
    default:
      return "text-muted-foreground"
  }
}

function getWorkloadIndicator(courses: Course[]) {
  const hardCount = courses.filter((c) => c.difficulty === "Hard").length
  if (hardCount >= 3) return { label: "Heavy", color: "text-destructive" }
  if (hardCount >= 2) return { label: "Moderate", color: "text-accent" }
  return { label: "Light", color: "text-green-600" }
}

export function PlannerContent() {
  const [semesters, setSemesters] = useState<Semester[]>(initialSemesters)
  const [recommendDialogOpen, setRecommendDialogOpen] = useState(false)
  const [recommendingSemester, setRecommendingSemester] = useState<string | null>(null)
  const [recPrefs, setRecPrefs] = useState({ time: "any", format: "any", maxCredits: "15" })

  const toggleSemester = (id: string) => {
    setSemesters((prev) =>
      prev.map((sem) => (sem.id === id ? { ...sem, expanded: !sem.expanded } : sem))
    )
  }

  const toggleLock = (semesterId: string, courseCode: string) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === semesterId
          ? {
              ...sem,
              courses: sem.courses.map((c) =>
                c.code === courseCode ? { ...c, locked: !c.locked } : c
              ),
            }
          : sem
      )
    )
  }

  const openRecommendDialog = (semId: string) => {
    setRecommendingSemester(semId)
    setRecommendDialogOpen(true)
  }

  const recommendations = recommendingSemester ? getRecommendations(recommendingSemester, recPrefs) : []
  const recSemester = semesters.find((s) => s.id === recommendingSemester)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Smart Semester Planner</h1>
          <p className="text-muted-foreground">
            AI-generated course plan based on your preferences and requirements.
          </p>
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor("Hard")}>Hard</Badge>
                <span className="text-sm text-muted-foreground">Challenging course</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor("Medium")}>Medium</Badge>
                <span className="text-sm text-muted-foreground">Moderate difficulty</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor("Easy")}>Easy</Badge>
                <span className="text-sm text-muted-foreground">Lighter workload</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Locked in place</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <span className="text-sm text-muted-foreground">Has prerequisites</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prerequisite Check - separate widget */}
        <Card className="border-accent/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Prerequisite Check
            </CardTitle>
            <CardDescription>Verify that prerequisites are satisfied before each semester.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">COP4600 (Operating Systems)</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Requires COP3530 (Data Structures) before Summer 2026.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">COP3530 completed in Fall 2025</span>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">COP4533 (Algorithm Abstraction and Design)</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Requires COP3530 and MAS3114 before Spring 2027.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">COP3530 completed in Fall 2025</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">MAS3114 planned for Summer 2026</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">36</p>
                <p className="text-sm text-muted-foreground">Credits Planned</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Semesters to Graduation</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">On Track</p>
                <p className="text-sm text-muted-foreground">Spring 2027 Graduation</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Semester Cards */}
        <div className="space-y-4">
          {semesters.map((semester, index) => {
            const workload = getWorkloadIndicator(semester.courses)
            return (
              <Collapsible
                key={semester.id}
                open={semester.expanded}
                onOpenChange={() => toggleSemester(semester.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {semester.expanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                            <CardTitle className="text-lg">
                              {semester.term} {semester.year}
                            </CardTitle>
                          </div>
                          {index === 0 && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Next Semester
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-medium ${workload.color}`}>
                            {workload.label} Workload
                          </span>
                          <Badge variant="outline">
                            {semester.totalCredits} credits
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {semester.courses.map((course) => (
                          <div
                            key={course.code}
                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors group"
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-primary">{course.code}</p>
                                {course.prereqs && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="w-4 h-4 text-accent" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Prerequisites: {course.prereqs.join(", ")}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className={getDifficultyColor(course.difficulty)}
                              >
                                {course.difficulty}
                              </Badge>
                              <span className="text-sm font-medium w-12 text-right">
                                {course.credits} cr
                              </span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleLock(semester.id, course.code)
                                    }}
                                  >
                                    {course.locked ? (
                                      <Lock className="w-4 h-4 text-primary" />
                                    ) : (
                                      <Unlock className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{course.locked ? "Unlock course" : "Lock course in place"}</p>
                                </TooltipContent>
                              </Tooltip>
                              {course.alternatives && course.alternatives.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <RefreshCw className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Swap with: {course.alternatives[0].code}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                          <Button variant="ghost" className="flex-1 justify-center text-primary" asChild>
                            <Link href="/coursework">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Coursework
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 justify-center"
                            onClick={(e) => {
                              e.stopPropagation()
                              openRecommendDialog(semester.id)
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Recommended Semester
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )
          })}
        </div>
      </div>

      {/* Recommend Dialog */}
      <Dialog open={recommendDialogOpen} onOpenChange={setRecommendDialogOpen}>
        <DialogContent className="w-full sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Recommended Schedules{recSemester ? ` - ${recSemester.term} ${recSemester.year}` : ""}
            </DialogTitle>
            <DialogDescription>
              Compare three AI-generated schedule options. Adjust preferences to see different recommendations.
            </DialogDescription>
          </DialogHeader>

          {/* Preferences Toolbox */}
          <Card className="bg-muted/50 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Preferred Time</label>
                  <Select value={recPrefs.time} onValueChange={(v) => setRecPrefs((p) => ({ ...p, time: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Time</SelectItem>
                      <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                      <SelectItem value="evening">Evening (5pm-9pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Class Format</label>
                  <Select value={recPrefs.format} onValueChange={(v) => setRecPrefs((p) => ({ ...p, format: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Format</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Max Credits</label>
                  <Select value={recPrefs.maxCredits} onValueChange={(v) => setRecPrefs((p) => ({ ...p, maxCredits: v }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9">9 credits</SelectItem>
                      <SelectItem value="12">12 credits</SelectItem>
                      <SelectItem value="15">15 credits</SelectItem>
                      <SelectItem value="18">18 credits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3 Recommendations Side-by-Side */}
          <div className="grid gap-4 lg:grid-cols-3">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{rec.label}</CardTitle>
                    <span className={cn("text-xs font-semibold", getWorkloadColor(rec.workload))}>
                      {rec.workload}
                    </span>
                  </div>
                  <CardDescription className="text-xs">{rec.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  {rec.courses.map((c) => (
                    <div key={c.code} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">{c.code}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                      </div>
                      <Badge variant="secondary" className={cn("text-xs shrink-0", getDifficultyColor(c.difficulty))}>
                        {c.difficulty}
                      </Badge>
                    </div>
                  ))}
                  <div className="pt-2 text-sm font-medium text-center">
                    {rec.totalCredits} credits total
                  </div>
                </CardContent>
                <div className="p-4 pt-0">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => setRecommendDialogOpen(false)}
                  >
                    Apply This Schedule
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
