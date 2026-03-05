"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle2,
  Circle,
  BookOpen,
} from "lucide-react"

type Course = {
  code: string
  name: string
  credits: number
  status: "completed" | "in-progress" | "remaining"
  grade?: string
}

type RequirementGroup = {
  name: string
  completedCount: number
  totalCount: number
  courses: Course[]
}

const requirementGroups: RequirementGroup[] = [
  {
    name: "General Education",
    completedCount: 10,
    totalCount: 10,
    courses: [
      { code: "ENC1101", name: "Expository and Argumentative Writing", credits: 3, status: "completed", grade: "A" },
      { code: "ENC1102", name: "Argument and Persuasion", credits: 3, status: "completed", grade: "A-" },
      { code: "MAC2311", name: "Analytic Geometry and Calculus 1", credits: 4, status: "completed", grade: "B+" },
      { code: "MAC2312", name: "Analytic Geometry and Calculus 2", credits: 4, status: "completed", grade: "B" },
      { code: "PHY2048", name: "Physics with Calculus 1", credits: 3, status: "completed", grade: "B+" },
      { code: "PHY2048L", name: "Physics with Calculus 1 Lab", credits: 1, status: "completed", grade: "A" },
      { code: "STA2023", name: "Intro to Statistics", credits: 3, status: "completed", grade: "A" },
      { code: "PSY2012", name: "General Psychology", credits: 3, status: "completed", grade: "A-" },
      { code: "AMH2020", name: "United States History since 1877", credits: 3, status: "completed", grade: "B+" },
      { code: "PHI2010", name: "Introduction to Philosophy", credits: 3, status: "completed", grade: "A" },
    ],
  },
  {
    name: "Major (Computer Science Core)",
    completedCount: 6,
    totalCount: 8,
    courses: [
      { code: "COP3502C", name: "Programming Fundamentals 1", credits: 3, status: "completed", grade: "A" },
      { code: "COP3503C", name: "Programming Fundamentals 2", credits: 3, status: "completed", grade: "A-" },
      { code: "COP3530", name: "Data Structures and Algorithms", credits: 3, status: "completed", grade: "B+" },
      { code: "CDA3101", name: "Intro to Computer Organization", credits: 3, status: "completed", grade: "B" },
      { code: "COP4600", name: "Operating Systems", credits: 3, status: "remaining" },
      { code: "COP4020", name: "Programming Language Concepts", credits: 3, status: "completed", grade: "A" },
      { code: "CEN3031", name: "Intro to Software Engineering", credits: 3, status: "remaining" },
      { code: "COP3530", name: "Algorithm Abstraction and Design", credits: 3, status: "completed", grade: "B+" },
    ],
  },
  {
    name: "Minor (Mathematics)",
    completedCount: 3,
    totalCount: 4,
    courses: [
      { code: "MAS3114", name: "Computational Linear Algebra", credits: 3, status: "in-progress" },
      { code: "MAP2302", name: "Elementary Differential Equations", credits: 3, status: "completed", grade: "B+" },
      { code: "MAS4105", name: "Linear Algebra", credits: 4, status: "completed", grade: "B" },
      { code: "STA3032", name: "Engineering Statistics", credits: 3, status: "completed", grade: "A-" },
    ],
  },
  {
    name: "Writing",
    completedCount: 1,
    totalCount: 2,
    courses: [
      { code: "ENC3246", name: "Professional Communication", credits: 3, status: "remaining" },
      { code: "ENC1102", name: "Argument and Persuasion", credits: 3, status: "completed", grade: "A-" },
    ],
  },
  {
    name: "Quest",
    completedCount: 1,
    totalCount: 2,
    courses: [
      { code: "IDS2935", name: "Quest 1: The Good Life", credits: 3, status: "completed", grade: "A" },
      { code: "QUE2000", name: "Quest 2 (pending selection)", credits: 3, status: "remaining" },
    ],
  },
]

const totalCompleted = requirementGroups.reduce((sum, g) => sum + g.completedCount, 0)
const totalRequired = requirementGroups.reduce((sum, g) => sum + g.totalCount, 0)

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
    case "in-progress":
      return <Circle className="w-4 h-4 text-primary shrink-0 fill-primary/20" />
    default:
      return <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
  }
}

function getStatusBadge(status: string, grade?: string) {
  switch (status) {
    case "completed":
      return <Badge variant="secondary" className="bg-green-100 text-green-700">{grade || "Done"}</Badge>
    case "in-progress":
      return <Badge variant="secondary" className="bg-primary/10 text-primary">In Progress</Badge>
    default:
      return <Badge variant="secondary" className="text-muted-foreground">Needed</Badge>
  }
}

export function DegreeAuditContent() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Degree Audit</h1>
        <p className="text-muted-foreground">
          Computer Science, B.S. - Target Graduation: Spring 2027
        </p>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Overall Requirements</p>
              <p className="text-3xl font-bold text-primary">{totalCompleted}/{totalRequired}</p>
              <p className="text-sm text-muted-foreground mt-1">requirements completed</p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{totalCompleted}/{totalRequired}</span>
              </div>
              <Progress value={(totalCompleted / totalRequired) * 100} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                98 credits completed, 30 credits remaining
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {requirementGroups.map((group) => {
          const isComplete = group.completedCount === group.totalCount
          return (
            <Card key={group.name} className={isComplete ? "border-green-200 bg-green-50/50" : ""}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {group.completedCount}/{group.totalCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{group.name}</p>
                  {isComplete && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Requirement Group Details */}
      <div className="space-y-4">
        {requirementGroups.map((group) => {
          const pct = Math.round((group.completedCount / group.totalCount) * 100)
          const isComplete = group.completedCount === group.totalCount
          return (
            <Card key={group.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        {group.completedCount}/{group.totalCount} requirements completed
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={isComplete ? "default" : "outline"}
                    className={isComplete ? "bg-green-600 text-green-50 hover:bg-green-600" : ""}
                  >
                    {group.completedCount}/{group.totalCount}
                  </Badge>
                </div>
                <Progress value={pct} className="h-2 mt-3" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {group.courses.map((course, idx) => (
                    <div
                      key={`${course.code}-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      {getStatusIcon(course.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary text-sm">{course.code}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{course.credits} cr</span>
                      {getStatusBadge(course.status, course.grade)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
