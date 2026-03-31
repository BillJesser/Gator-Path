"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, BookOpen, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  catalogLegend,
  catalogNote,
  electiveCourses,
  electiveSourceLabels,
  electiveSources,
  requiredCoreCourses,
  requiredGroups,
  type CourseDifficulty,
} from "@/lib/course-catalog"

function getDifficultyColor(difficulty: CourseDifficulty) {
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

export function CourseworkContent() {
  const [requiredSearch, setRequiredSearch] = useState("")
  const [selectedRequiredGroup, setSelectedRequiredGroup] = useState("All")
  const [electiveSearch, setElectiveSearch] = useState("")
  const [selectedElectiveSource, setSelectedElectiveSource] =
    useState<(typeof electiveSources)[number]>("All")
  const [selectedElectiveGroup, setSelectedElectiveGroup] = useState("All")

  const filteredRequired = requiredCoreCourses.filter((course) => {
    const matchesGroup =
      selectedRequiredGroup === "All" || course.group === selectedRequiredGroup
    const query = requiredSearch.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      course.code.toLowerCase().includes(query) ||
      course.displayCode.toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)

    return matchesGroup && matchesSearch
  })

  const availableElectiveGroups = [
    "All",
    ...Array.from(
      new Set(
        electiveCourses
          .filter(
            (course) =>
              selectedElectiveSource === "All" || course.source === selectedElectiveSource
          )
          .map((course) => course.group)
      )
    ).sort(),
  ]

  const filteredElectives = electiveCourses.filter((course) => {
    const matchesSource =
      selectedElectiveSource === "All" || course.source === selectedElectiveSource
    const matchesGroup = selectedElectiveGroup === "All" || course.group === selectedElectiveGroup
    const query = electiveSearch.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      course.code.toLowerCase().includes(query) ||
      course.displayCode.toLowerCase().includes(query) ||
      course.name.toLowerCase().includes(query)

    return matchesSource && matchesGroup && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Coursework</h1>
        <p className="text-muted-foreground">
          Browse the local course catalog loaded from repo JSON instead of a database.
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Local Catalog Source</CardTitle>
          <CardDescription>
            This proof of concept reads course data from <code>data/course-catalog.json</code>,
            generated from the UF curriculum workbook you provided.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {catalogLegend.map((item) => (
              <Badge
                key={item.difficulty}
                variant="secondary"
                className={cn("text-xs", getDifficultyColor(item.difficulty))}
                title={item.description}
              >
                {item.difficulty}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{catalogNote}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="required" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="required">Required Courses</TabsTrigger>
          <TabsTrigger value="electives">Electives</TabsTrigger>
        </TabsList>

        <TabsContent value="required" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search required courses by code or name..."
              value={requiredSearch}
              onChange={(event) => setRequiredSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {requiredGroups.map((group) => (
              <Button
                key={group}
                variant={selectedRequiredGroup === group ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRequiredGroup(group)}
                className={selectedRequiredGroup !== group ? "bg-transparent" : ""}
              >
                {group}
              </Button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredRequired.length} required courses from the spreadsheet.
          </p>

          <div className="space-y-3">
            {filteredRequired.map((course) => (
              <Card key={course.code} className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-primary">{course.displayCode}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {course.group}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", getDifficultyColor(course.difficulty))}
                        >
                          {course.difficulty}
                        </Badge>
                      </div>
                      <p className="font-medium">{course.name}</p>
                      {course.notes && (
                        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          <span>{course.notes}</span>
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Add to Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="electives" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search electives by code or name..."
                value={electiveSearch}
                onChange={(event) => setElectiveSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={selectedElectiveGroup}
              onValueChange={setSelectedElectiveGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                {availableElectiveGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {electiveSources.map((source) => (
              <Button
                key={source}
                variant={selectedElectiveSource === source ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedElectiveSource(source)
                  setSelectedElectiveGroup("All")
                }}
                className={selectedElectiveSource !== source ? "bg-transparent" : ""}
              >
                {electiveSourceLabels[source]}
              </Button>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {filteredElectives.length} electives from the spreadsheet-backed catalog.
          </p>

          <div className="space-y-3">
            {filteredElectives.map((course) => (
              <Card key={`${course.source}-${course.code}`} className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-primary">{course.displayCode}</h3>
                      <Badge variant="outline">{electiveSourceLabels[course.source]}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {course.group}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", getDifficultyColor(course.difficulty))}
                      >
                        {course.difficulty}
                      </Badge>
                    </div>

                    <p className="font-medium">{course.name}</p>

                    {course.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{course.notes}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
