"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface PromptStep {
  id: number
  name: string
  prompt: string
  input: string
  output: string
  status: "pending" | "processing" | "completed" | "error"
}

export async function executeSingleStep(input: string, promptTemplate: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: promptTemplate.replace("{input}", input),
      maxOutputTokens: 2000,
      temperature: 0.7,
    })

    return { success: true, output: text }
  } catch (error) {
    return {
      success: false,
      output: error instanceof Error ? error.message : "エラーが発生しました",
    }
  }
}
