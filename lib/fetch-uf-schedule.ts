import { type UfScheduleBatchResponse } from "@/lib/uf-schedule"

export async function fetchUfScheduleBatch(term: string, courseCodes: string[]) {
  const response = await fetch("/api/uf-schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ term, courseCodes }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error || "Unable to load UF schedule data.")
  }

  return response.json() as Promise<UfScheduleBatchResponse>
}
