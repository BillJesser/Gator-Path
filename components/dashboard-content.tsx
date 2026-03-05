"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  CalendarDays,
  GraduationCap,
  BookOpen,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"

const upcomingCourses = [
  { code: "CAP3032", name: "Interactive Modeling & Animation", credits: 3, time: "MWF 10:30 AM" },
  { code: "CIS4914", name: "Senior Project", credits: 3, time: "TuTh 2:00 PM" },
  { code: "EGN4912", name: "Engineering Research", credits: 3, time: "Online" },
]

const actionItems = [
  { type: "warning", message: "Registration opens in 3 days", action: "View Dates" },
  { type: "info", message: "1 prerequisite not yet satisfied for COP4600", action: "View Details" },
  { type: "success", message: "On track for Spring 2027 graduation", action: null },
]

const degreeProgress = [
  { name: "General Education", completed: 12, total: 12 },
  { name: "Core Requirements", completed: 6, total: 8 },
  { name: "Major Electives", completed: 3, total: 5 },
  { name: "Writing Requirement", completed: 1, total: 2 },
  { name: "Quest", completed: 1, total: 2 },
  { name: "Minor", completed: 3, total: 4 },
]

export function DashboardContent() {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back, Alex</h1>
        <p className="text-muted-foreground">Track your progress and plan your path to graduation.</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Graduation</p>
                <p className="text-xl font-semibold">Spring 2027</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                <p className="text-xl font-semibold">3.77</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Credits Completed</p>
                <p className="text-xl font-semibold">98 / 128</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semesters Left</p>
                <p className="text-xl font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Degree Progress - Fraction Format */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Degree Progress</CardTitle>
            <CardDescription>Computer Science, B.S.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {degreeProgress.map((req) => {
              const pct = Math.round((req.completed / req.total) * 100)
              return (
                <div key={req.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{req.name}</span>
                    <span className="font-medium">
                      {req.completed}/{req.total} completed
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              )
            })}
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/degree-audit">
                View Full Degree Audit
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Action Items</CardTitle>
            <CardDescription>Things that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                {item.type === "warning" && (
                  <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                )}
                {item.type === "info" && (
                  <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                )}
                {item.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.message}</p>
                  {item.action && (
                    <button className="text-sm text-primary font-medium hover:underline mt-1">
                      {item.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Current Semester */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Spring 2026 Schedule</CardTitle>
            <CardDescription>Current semester - 9 credits</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedule">
              <CalendarDays className="w-4 h-4 mr-2" />
              View Full Schedule
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingCourses.map((course) => (
              <div
                key={course.code}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{course.code}</p>
                    <p className="text-sm text-muted-foreground">{course.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{course.credits} cr</p>
                  <p className="text-xs text-muted-foreground">{course.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
