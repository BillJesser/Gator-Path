import { NextResponse } from "next/server"
import {
  buildUfScheduleUrl,
  normalizeCourseCode,
  normalizeUfSchedulePayload,
  type UfCourseRecord,
} from "@/lib/uf-schedule"

type RequestBody = {
  term?: string
  courseCodes?: string[]
}

const requestCache = new Map<string, Promise<UfCourseRecord[]>>()

async function fetchCourse(courseCode: string, term: string) {
  const cacheKey = `${term}:${courseCode}`
  const cached = requestCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const request = fetch(buildUfScheduleUrl(courseCode, term), {
    // Route-level proxying keeps the browser off the UF origin and lets the app share one normalizer.
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: "https://one.uf.edu/",
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`UF schedule request failed for ${courseCode}: ${response.status}`)
      }

      return normalizeUfSchedulePayload(await response.json())
    })
    .catch((error) => {
      requestCache.delete(cacheKey)
      throw error
    })

  requestCache.set(cacheKey, request)
  return request
}

export async function POST(request: Request) {
  let body: RequestBody

  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const term = typeof body.term === "string" ? body.term.trim() : ""
  const courseCodes = Array.isArray(body.courseCodes)
    ? Array.from(new Set(body.courseCodes.map((code) => normalizeCourseCode(String(code))).filter(Boolean)))
    : []

  if (!term) {
    return NextResponse.json({ error: "A term code is required." }, { status: 400 })
  }

  if (courseCodes.length === 0) {
    return NextResponse.json({ error: "At least one course code is required." }, { status: 400 })
  }

  const results = await Promise.allSettled(courseCodes.map((courseCode) => fetchCourse(courseCode, term)))
  const courses: UfCourseRecord[] = []
  const warnings: string[] = []

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      courses.push(...result.value)
      return
    }

    warnings.push(`Unable to load ${courseCodes[index]} from the UF public schedule endpoint.`)
  })

  return NextResponse.json({
    term,
    fetchedAt: new Date().toISOString(),
    courses,
    warnings,
  })
}
