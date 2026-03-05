"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Star,
  ChevronRight,
  Filter,
  X,
  Heart,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ───── REQUIRED COURSES DATA ───── */

type RequiredCourse = {
  code: string
  name: string
  credits: number
  category: string
  prereqs: string[]
  status: "remaining" | "in-progress"
}

const requiredCourses: RequiredCourse[] = [
  { code: "COP4600", name: "Operating Systems", credits: 3, category: "Major", prereqs: ["COP3530"], status: "remaining" },
  { code: "CEN3031", name: "Intro to Software Engineering", credits: 3, category: "Major", prereqs: ["COP3503C"], status: "remaining" },
  { code: "COP4533", name: "Algorithm Abstraction & Design", credits: 3, category: "Major", prereqs: ["COP3530", "MAS3114"], status: "remaining" },
  { code: "CNT4007", name: "Computer Network Fundamentals", credits: 3, category: "Major", prereqs: ["COP3530"], status: "remaining" },
  { code: "ENC3246", name: "Professional Communication", credits: 3, category: "Writing", prereqs: [], status: "remaining" },
  { code: "MAS3114", name: "Computational Linear Algebra", credits: 3, category: "Minor", prereqs: ["MAC2312"], status: "in-progress" },
  { code: "STA3032", name: "Engineering Statistics", credits: 3, category: "Minor", prereqs: ["MAC2312"], status: "remaining" },
  { code: "QUE2000", name: "Quest 2 (select from options)", credits: 3, category: "Quest", prereqs: [], status: "remaining" },
  { code: "CIS4914", name: "Senior Project", credits: 3, category: "Major", prereqs: ["CEN3031"], status: "remaining" },
  { code: "CIS4301", name: "Information & Database Systems", credits: 3, category: "Major", prereqs: ["COP3530"], status: "remaining" },
]

const requiredCategories = ["All", "Major", "Minor", "Writing", "Quest", "General Requirements"]

/* ───── ELECTIVES DATA ───── */

type Interest = {
  id: string
  name: string
  selected: boolean
}

type Elective = {
  code: string
  name: string
  credits: number
  description: string
  tags: string[]
  workload: "Low" | "Medium" | "High"
  rating: number
  enrollment: number
  matchScore: number
  interests: string[]
  satisfies: string[]
  prereqs: string[]
}

const interests: Interest[] = [
  { id: "ai", name: "Artificial Intelligence", selected: true },
  { id: "graphics", name: "Computer Graphics", selected: true },
  { id: "security", name: "Cybersecurity", selected: false },
  { id: "data", name: "Data Science", selected: false },
  { id: "web", name: "Web Development", selected: false },
  { id: "mobile", name: "Mobile Development", selected: false },
  { id: "game", name: "Game Development", selected: true },
  { id: "entrepreneurship", name: "Entrepreneurship", selected: false },
]

const electives: Elective[] = [
  {
    code: "CAP4630",
    name: "Artificial Intelligence",
    credits: 3,
    description: "Introduction to AI concepts including search, knowledge representation, machine learning, and neural networks.",
    tags: ["Counts for major", "Project-based"],
    workload: "Medium",
    rating: 4.5,
    enrollment: 45,
    matchScore: 95,
    interests: ["ai"],
    satisfies: ["Major Elective", "Technical Elective"],
    prereqs: ["COP3530"],
  },
  {
    code: "CAP4720",
    name: "Computer Graphics",
    credits: 3,
    description: "Fundamentals of 2D and 3D graphics, rendering techniques, shaders, and real-time graphics programming.",
    tags: ["Counts for major", "Project-based"],
    workload: "High",
    rating: 4.7,
    enrollment: 30,
    matchScore: 92,
    interests: ["graphics", "game"],
    satisfies: ["Major Elective"],
    prereqs: ["COP3530", "MAS3114"],
  },
  {
    code: "CIS4930",
    name: "Deep Learning",
    credits: 3,
    description: "Neural network architectures, training techniques, CNNs, RNNs, and practical applications using PyTorch.",
    tags: ["Counts for major", "High demand"],
    workload: "High",
    rating: 4.8,
    enrollment: 60,
    matchScore: 90,
    interests: ["ai", "data"],
    satisfies: ["Major Elective", "Technical Elective"],
    prereqs: ["CAP4630"],
  },
  {
    code: "CAP4053",
    name: "AI for Game Programming",
    credits: 3,
    description: "Game AI techniques including pathfinding, behavior trees, decision making, and procedural content generation.",
    tags: ["Counts for major", "Project-based", "Low workload"],
    workload: "Low",
    rating: 4.6,
    enrollment: 25,
    matchScore: 88,
    interests: ["ai", "game"],
    satisfies: ["Major Elective"],
    prereqs: ["COP3530"],
  },
  {
    code: "COP4331",
    name: "Object-Oriented Programming",
    credits: 3,
    description: "Advanced OOP concepts, design patterns, and software architecture principles.",
    tags: ["Counts for major"],
    workload: "Medium",
    rating: 4.2,
    enrollment: 80,
    matchScore: 75,
    interests: ["web"],
    satisfies: ["Major Elective"],
    prereqs: ["COP3503C"],
  },
  {
    code: "CEN4721",
    name: "Human-Computer Interaction",
    credits: 3,
    description: "User interface design principles, usability testing, accessibility, and user experience research.",
    tags: ["Counts for major", "Low workload"],
    workload: "Low",
    rating: 4.4,
    enrollment: 35,
    matchScore: 70,
    interests: ["web", "game"],
    satisfies: ["Major Elective", "Technical Elective"],
    prereqs: [],
  },
]

function getWorkloadColor(workload: string) {
  switch (workload) {
    case "High":
      return "bg-destructive/10 text-destructive"
    case "Medium":
      return "bg-accent/20 text-accent"
    case "Low":
      return "bg-green-100 text-green-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Major":
      return "bg-primary/10 text-primary"
    case "Minor":
      return "bg-chart-3/20 text-chart-3"
    case "Writing":
      return "bg-accent/20 text-accent"
    case "Quest":
      return "bg-chart-5/20 text-chart-5"
    case "General Requirements":
      return "bg-green-100 text-green-700"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function CourseworkContent() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [requiredSearch, setRequiredSearch] = useState("")
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    interests.filter((i) => i.selected).map((i) => i.id)
  )
  const [electiveSearch, setElectiveSearch] = useState("")
  const [savedElectives, setSavedElectives] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(true)

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSaved = (code: string) => {
    setSavedElectives((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const filteredRequired = requiredCourses.filter((c) => {
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory
    const matchesSearch =
      !requiredSearch ||
      c.code.toLowerCase().includes(requiredSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(requiredSearch.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const filteredElectives = electives
    .filter((e) => {
      if (electiveSearch) {
        const query = electiveSearch.toLowerCase()
        return (
          e.code.toLowerCase().includes(query) ||
          e.name.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => b.matchScore - a.matchScore)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Coursework</h1>
        <p className="text-muted-foreground">
          Browse required courses and discover electives that match your interests.
        </p>
      </div>

      <Tabs defaultValue="required" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="required">Required Courses</TabsTrigger>
          <TabsTrigger value="electives">Electives</TabsTrigger>
        </TabsList>

        {/* ───── TAB 1: REQUIRED COURSES ───── */}
        <TabsContent value="required" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by course code or name..."
              value={requiredSearch}
              onChange={(e) => setRequiredSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {requiredCategories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory !== cat ? "bg-transparent" : ""}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Results */}
          <p className="text-sm text-muted-foreground">
            Showing {filteredRequired.length} remaining required courses
          </p>

          {/* Course Cards */}
          <div className="space-y-3">
            {filteredRequired.map((course) => (
              <Card key={course.code} className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-primary">{course.code}</h3>
                        <Badge variant="secondary" className={getCategoryColor(course.category)}>
                          {course.category}
                        </Badge>
                        {course.status === "in-progress" && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium">{course.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>{course.credits} credits</span>
                        </div>
                        {course.prereqs.length > 0 && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-accent" />
                            <span>Prereqs: {course.prereqs.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" disabled={course.status === "in-progress"}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequired.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No courses found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search or category filter
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ───── TAB 2: ELECTIVES ───── */}
        <TabsContent value="electives" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Your Interests
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                    </Button>
                  </div>
                  <CardDescription>
                    Select interests for personalized recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className={cn("space-y-3", !showFilters && "hidden lg:block")}>
                  {interests.map((interest) => (
                    <div key={interest.id} className="flex items-center gap-3">
                      <Checkbox
                        id={`interest-${interest.id}`}
                        checked={selectedInterests.includes(interest.id)}
                        onCheckedChange={() => toggleInterest(interest.id)}
                      />
                      <label
                        htmlFor={`interest-${interest.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {interest.name}
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses by code or name..."
                  value={electiveSearch}
                  onChange={(e) => setElectiveSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredElectives.length} recommended electives
                </p>
                {savedElectives.length > 0 && (
                  <Badge variant="secondary">
                    {savedElectives.length} saved
                  </Badge>
                )}
              </div>

              {/* Elective Cards */}
              <div className="space-y-4">
                {filteredElectives.map((elective) => (
                  <Card
                    key={elective.code}
                    className={cn(
                      "transition-all hover:shadow-md",
                      savedElectives.includes(elective.code) && "ring-2 ring-primary/20"
                    )}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-primary">{elective.code}</h3>
                                <Badge
                                  variant="secondary"
                                  className="bg-primary/10 text-primary"
                                >
                                  {elective.matchScore}% match
                                </Badge>
                              </div>
                              <p className="text-lg font-medium">{elective.name}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => toggleSaved(elective.code)}
                            >
                              <Heart
                                className={cn(
                                  "w-5 h-5",
                                  savedElectives.includes(elective.code)
                                    ? "fill-destructive text-destructive"
                                    : "text-muted-foreground"
                                )}
                              />
                            </Button>
                          </div>

                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {elective.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {elective.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{elective.credits} credits</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <Badge
                                variant="secondary"
                                className={cn("text-xs", getWorkloadColor(elective.workload))}
                              >
                                {elective.workload} workload
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-accent fill-accent" />
                              <span>{elective.rating}/5</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{elective.enrollment} enrolled</span>
                            </div>
                            {elective.prereqs.length > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4 text-accent" />
                                <span>Prereqs: {elective.prereqs.join(", ")}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Satisfies:</span>{" "}
                              {elective.satisfies.join(", ")}
                            </p>
                          </div>
                        </div>

                        <div className="sm:w-auto w-full">
                          <Button className="w-full sm:w-auto" size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Add to Plan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredElectives.length === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium">No courses found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your search or interests
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
