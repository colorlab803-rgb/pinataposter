import { cn } from "@/lib/utils"
import React from "react"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  as?: React.ElementType
}

export function Container({
  children,
  as: Component = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "container-responsive mx-auto w-full max-w-7xl",
        "px-4 xs:px-6 sm:px-8 md:px-10",
        "py-4 xs:py-6 sm:py-8 md:py-10",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
