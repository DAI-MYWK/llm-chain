"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { executeSingleStep, type PromptStep } from "./actions/prompt-chain"
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react"

export default function PromptChainPage() {
  const [initialInput, setInitialInput] = useState("")
  const [prompts, setPrompts] = useState([
    { name: "ステップ1: 要約", template: "以下のテキストを簡潔に要約してください:\n\n{input}" },
    { name: "ステップ2: 分析", template: "以下の要約を分析し、主要なポイントを3つ挙げてください:\n\n{input}" },
    {
      name: "ステップ3: 提案",
      template: "以下の分析に基づいて、具体的なアクションプランを提案してください:\n\n{input}",
    },
  ])
  const [steps, setSteps] = useState<PromptStep[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleExecute = async () => {
    if (!initialInput.trim()) return

    setIsProcessing(true)

    const initialSteps: PromptStep[] = prompts.map((p, i) => ({
      id: i + 1,
      name: p.name,
      prompt: p.template,
      input: "",
      output: "",
      status: "pending" as const,
    }))

    setSteps(initialSteps)

    let currentInput = initialInput

    for (let i = 0; i < prompts.length; i++) {
      setSteps((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: "processing", input: currentInput }
        return updated
      })

      try {
        const result = await executeSingleStep(currentInput, prompts[i].template)

        if (result.success) {
          setSteps((prev) => {
            const updated = [...prev]
            updated[i] = { ...updated[i], status: "completed", output: result.output }
            return updated
          })
          currentInput = result.output
        } else {
          setSteps((prev) => {
            const updated = [...prev]
            updated[i] = { ...updated[i], status: "error", output: result.output }
            return updated
          })
          break
        }
      } catch (error) {
        setSteps((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: "error", output: "エラーが発生しました" }
          return updated
        })
        break
      }
    }

    setIsProcessing(false)
  }

  const getStatusIcon = (status: PromptStep["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-muted-foreground" />
      case "processing":
        return <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-pink-500" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-destructive" />
    }
  }

  const getStepStatus = (index: number): "completed" | "processing" | "pending" => {
    const step = steps[index]
    if (!step) return "pending"
    return step.status === "completed" ? "completed" : step.status === "processing" ? "processing" : "pending"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100/50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3 text-balance">LLMプロンプトチェーン</h1>
          <p className="text-gray-600 text-lg text-pretty">3つのプロンプトを順番に処理して、最終的な結果を生成します</p>
        </div>

        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-pink-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-pink-700">初期入力</CardTitle>
            <CardDescription>処理したいテキストを入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="ここにテキストを入力..."
              value={initialInput}
              onChange={(e) => setInitialInput(e.target.value)}
              className="min-h-32 resize-none border-pink-200 focus:border-pink-400"
              disabled={isProcessing}
            />

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700">プロンプト設定</h3>
              {prompts.map((prompt, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">{prompt.name}</Label>
                    {getStepStatus(index) === "completed" && <CheckCircle2 className="w-4 h-4 text-pink-500" />}
                    {getStepStatus(index) === "processing" && (
                      <Loader2 className="w-4 h-4 text-pink-500 animate-spin" />
                    )}
                  </div>
                  <Input
                    value={prompt.template}
                    onChange={(e) => {
                      const newPrompts = [...prompts]
                      newPrompts[index].template = e.target.value
                      setPrompts(newPrompts)
                    }}
                    className="border-pink-200 focus:border-pink-400"
                    disabled={isProcessing}
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleExecute}
              disabled={isProcessing || !initialInput.trim()}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-6 text-lg shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  処理中...
                </>
              ) : (
                "実行する"
              )}
            </Button>
          </CardContent>
        </Card>

        {steps.length > 0 && (
          <div className="space-y-6">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className="bg-white/80 backdrop-blur-sm border-pink-100 shadow-lg transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(step.status)}
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-800">{step.name}</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {step.status === "pending" && "待機中"}
                        {step.status === "processing" && "処理中..."}
                        {step.status === "completed" && "完了"}
                        {step.status === "error" && "エラー"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {step.prompt &&
                    (step.status === "processing" || step.status === "completed" || step.status === "error") && (
                      <div>
                        <Label className="text-sm font-semibold text-gray-600 mb-2 block">プロンプト</Label>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{step.prompt}</p>
                        </div>
                      </div>
                    )}

                  {step.input && (index === 0 || !step.output) && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600 mb-2 block">入力</Label>
                      <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{step.input}</p>
                      </div>
                    </div>
                  )}

                  {step.output && (
                    <div>
                      <Label className="text-sm font-semibold text-gray-600 mb-2 block">出力</Label>
                      <div className="bg-white p-4 rounded-lg border border-pink-200">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{step.output}</p>
                      </div>
                    </div>
                  )}

                  {step.status === "processing" && !step.output && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {steps[steps.length - 1]?.status === "completed" && (
              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6" />
                    最終結果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/95 leading-relaxed whitespace-pre-wrap">{steps[steps.length - 1].output}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
