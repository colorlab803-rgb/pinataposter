
'use client'

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

type Step = {
  id: string
  name: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progreso" className="w-full">
      <ol role="list" className="flex items-center gap-2 sm:gap-3">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={cn('relative', stepIdx !== steps.length - 1 ? 'flex-1' : '')}>
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 hidden sm:flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary" title={step.name}>
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 hidden sm:flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-primary bg-background" aria-current="step" title={step.name}>
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-primary" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 hidden sm:flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="group relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 bg-background" title={step.name}>
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-transparent" aria-hidden="true" />
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
