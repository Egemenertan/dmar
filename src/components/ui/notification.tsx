"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'success' | 'error' | 'warning'
  title: string
  description?: string
  autoClose?: boolean
  duration?: number
}

const notificationIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
}

const notificationStyles = {
  success: {
    bg: "bg-green-50 border-green-200",
    icon: "text-green-600",
    title: "text-green-900",
    description: "text-green-700"
  },
  error: {
    bg: "bg-red-50 border-red-200", 
    icon: "text-red-600",
    title: "text-red-900",
    description: "text-red-700"
  },
  warning: {
    bg: "bg-yellow-50 border-yellow-200",
    icon: "text-yellow-600", 
    title: "text-yellow-900",
    description: "text-yellow-700"
  }
}

export function Notification({ 
  open, 
  onOpenChange, 
  type, 
  title, 
  description, 
  autoClose = true,
  duration = 5000 
}: NotificationProps) {
  const Icon = notificationIcons[type]
  const styles = notificationStyles[type]

  React.useEffect(() => {
    if (open && autoClose) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [open, autoClose, duration, onOpenChange])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-[20%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border rounded-2xl p-6 shadow-2xl duration-300",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            styles.bg
          )}
        >
          <div className="flex items-start gap-4">
            <div className={cn("flex-shrink-0 mt-0.5", styles.icon)}>
              <Icon className="h-6 w-6" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={cn("text-lg font-semibold", styles.title)}>
                {title}
              </h3>
              {description && (
                <p className={cn("mt-2 text-sm", styles.description)}>
                  {description}
                </p>
              )}
            </div>

            <DialogPrimitive.Close className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Kapat</span>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}