import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { size?: "sm" | "md" | "lg" }
>(({ className, size = "md", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-lg border border-border bg-secondary items-center justify-center font-medium text-secondary-foreground",
      size === "sm" && "h-6 w-6 text-xs",
      size === "md" && "h-8 w-8 text-sm",
      size === "lg" && "h-10 w-10 text-base",
      className
    )}
    {...props}
  />
))
Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center", className)}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }
