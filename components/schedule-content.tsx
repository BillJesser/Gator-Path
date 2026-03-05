"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ScheduleOption = {
  id: string
  name: string
  courses: ScheduledCourse[]
  gaps: number
  conflicts: number
  rating: number
}

type ScheduledCourse = {
  code: string
  name: string
  section: string
  instructor: string
  location: string
  days: string[]
  startTime: string
  endTime: string
  color: string
}

const scheduleOptions: ScheduleOption[] = [
  {
    id: "option-1",
    name: "Option A",
    gaps: 0,
    conflicts: 0,
    rating: 5,
    courses: [
      { code: "COP4600", name: "Operating Systems", section: "001", instructor: "Dr. Smith", location: "CSE 101", days: ["Mon", "Wed", "Fri"], startTime: "10:40", endTime: "11:30", color: "bg-primary" },
      { code: "CEN3031", name: "Software Engineering", section: "002", instructor: "Dr. Johnson", location: "MAT 102", days: ["Tue", "Thu"], startTime: "10:40", endTime: "12:35", color: "bg-accent" },
      { code: "MAS3114", name: "Comp. Linear Algebra", section: "003", instructor: "Dr. Williams", location: "LIT 121", days: ["Mon", "Wed", "Fri"], startTime: "13:55", endTime: "14:45", color: "bg-chart-3" },
    ],
  },
  {
    id: "option-2",
    name: "Option B",
    gaps: 1,
    conflicts: 0,
    rating: 4,
    courses: [
      { code: "COP4600", name: "Operating Systems", section: "003", instructor: "Dr. Lee", location: "CSE 220", days: ["Tue", "Thu"], startTime: "09:35", endTime: "11:30", color: "bg-primary" },
      { code: "CEN3031", name: "Software Engineering", section: "001", instructor: "Dr. Brown", location: "NEB 101", days: ["Mon", "Wed", "Fri"], startTime: "11:45", endTime: "12:35", color: "bg-accent" },
      { code: "MAS3114", name: "Comp. Linear Algebra", section: "002", instructor: "Dr. Davis", location: "LIT 101", days: ["Tue", "Thu"], startTime: "14:00", endTime: "15:55", color: "bg-chart-3" },
    ],
  },
  {
    id: "option-3",
    name: "Option C",
    gaps: 2,
    conflicts: 0,
    rating: 3,
    courses: [
      { code: "COP4600", name: "Operating Systems", section: "002", instructor: "Dr. Garcia", location: "CSE 101", days: ["Mon", "Wed", "Fri"], startTime: "08:30", endTime: "09:20", color: "bg-primary" },
      { code: "CEN3031", name: "Software Engineering", section: "003", instructor: "Dr. Miller", location: "CAR 100", days: ["Mon", "Wed"], startTime: "15:00", endTime: "16:50", color: "bg-accent" },
      { code: "MAS3114", name: "Comp. Linear Algebra", section: "001", instructor: "Dr. Wilson", location: "LIT 109", days: ["Tue", "Thu"], startTime: "10:40", endTime: "12:35", color: "bg-chart-3" },
    ],
  },
]

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00",
]

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]

function timeToRow(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  const totalMinutes = hours * 60 + minutes
  const startMinutes = 8 * 60 // 8:00 AM
  return Math.floor((totalMinutes - startMinutes) / 30)
}

function getRowSpan(startTime: string, endTime: string): number {
  const start = timeToRow(startTime)
  const end = timeToRow(endTime)
  return end - start
}

export function ScheduleContent() {
  const [selectedOption, setSelectedOption] = useState<string>("option-1")
  const [selectedTerm, setSelectedTerm] = useState("Summer 2026")

  const currentSchedule = scheduleOptions.find((o) => o.id === selectedOption) || scheduleOptions[0]

  const currentIndex = scheduleOptions.findIndex((o) => o.id === selectedOption)

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedOption(scheduleOptions[currentIndex - 1].id)
    }
  }

  const goToNext = () => {
    if (currentIndex < scheduleOptions.length - 1) {
      setSelectedOption(scheduleOptions[currentIndex + 1].id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schedule Possibilities</h1>
          <p className="text-muted-foreground">
            Compare different schedule options for your semester.
          </p>
        </div>
        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Summer 2026">Summer 2026</SelectItem>
            <SelectItem value="Fall 2026">Fall 2026</SelectItem>
            <SelectItem value="Spring 2027">Spring 2027</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Schedule Options Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Available Schedules</CardTitle>
              <CardDescription>
                {scheduleOptions.length} valid combinations found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {currentIndex + 1} of {scheduleOptions.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                disabled={currentIndex === scheduleOptions.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {scheduleOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all",
                  selectedOption === option.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{option.name}</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3 h-3",
                          i < option.rating ? "text-accent fill-accent" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {option.conflicts === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span>{option.conflicts} conflicts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{option.gaps} gaps</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Timetable</CardTitle>
          <CardDescription>{currentSchedule.name} - {selectedTerm}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header Row */}
            <div className="grid grid-cols-6 gap-1 mb-1">
              <div className="p-2 text-center text-sm font-medium text-muted-foreground">Time</div>
              {days.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium bg-muted rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              <div className="grid grid-cols-6 gap-1">
                {/* Time Labels */}
                <div className="space-y-0">
                  {timeSlots.map((time, index) => (
                    <div
                      key={time}
                      className="h-8 pr-2 text-right text-xs text-muted-foreground flex items-center justify-end"
                    >
                      {index % 2 === 0 ? time : ""}
                    </div>
                  ))}
                </div>

                {/* Day Columns */}
                {days.map((day) => (
                  <div key={day} className="relative bg-muted/20 rounded-lg">
                    {/* Grid lines */}
                    {timeSlots.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-8 border-b",
                          index % 2 === 0 ? "border-border/50" : "border-border/20"
                        )}
                      />
                    ))}

                    {/* Course blocks */}
                    {currentSchedule.courses
                      .filter((course) => course.days.includes(day))
                      .map((course) => {
                        const startRow = timeToRow(course.startTime)
                        const rowSpan = getRowSpan(course.startTime, course.endTime)
                        return (
                          <div
                            key={`${course.code}-${day}`}
                            className={cn(
                              "absolute left-1 right-1 rounded-md p-1.5 text-white overflow-hidden",
                              course.color
                            )}
                            style={{
                              top: `${startRow * 32}px`,
                              height: `${rowSpan * 32 - 4}px`,
                            }}
                          >
                            <p className="text-xs font-semibold truncate">{course.code}</p>
                            <p className="text-xs truncate opacity-90">{course.location}</p>
                          </div>
                        )
                      })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Course Details</CardTitle>
          <CardDescription>Section information for {currentSchedule.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentSchedule.courses.map((course) => (
              <div
                key={course.code}
                className="flex items-center gap-4 p-4 rounded-lg border border-border"
              >
                <div className={cn("w-2 h-12 rounded-full", course.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-primary">{course.code}</p>
                    <Badge variant="secondary">{course.section}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.name}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{course.instructor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{course.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {course.days.join("/")} {course.startTime}-{course.endTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Compare Side by Side</Button>
        <Button>Select This Schedule</Button>
      </div>
    </div>
  )
}
