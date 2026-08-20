"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const toast = ToastPrimitive.createToastManager()

function ToastProvider({
  ...props
}) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({
  ...props
}) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-3 top-[72px] z-50 mx-auto w-[calc(100vw-1.5rem)] max-w-md outline-none sm:top-20 sm:right-5 sm:left-auto sm:mx-0 sm:max-w-sm",
        className
      )}
      {...props} />
  );
}

function Toast({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 top-0 z-[calc(1000-var(--toast-index))] w-full min-h-[56px] h-auto origin-top rounded-2xl border p-0.5 shadow-2xl will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*1+calc(var(--toast-index)*var(--gap)*1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "min-h-(--height) [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+(var(--toast-index)*var(--peek))+(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "data-expanded:min-h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        className
      )}
      {...props} />
  );
}

function ToastContent({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex min-h-[52px] w-full items-center gap-3 p-3.5 sm:p-4 text-sm sm:text-base font-bold transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props} />
  );
}

function ToastTitle({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm sm:text-base font-black leading-snug break-words", className)}
      {...props} />
  );
}

function ToastDescription({
  className,
  ...props
}) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-xs font-semibold opacity-90", className)}
      {...props} />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props} />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={cn(
        "relative shrink-0 text-white/80 hover:text-white after:absolute after:-inset-2 after:content-['']",
        className
      )}
      {...props}>
      {children ?? (
        <XIcon aria-hidden="true" className="size-5 stroke-[2.5]" />
      )}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({
  type
}) {
  let icon = null

  if (type === "success") {
    icon = (
      <CircleCheckIcon className="size-6 shrink-0 stroke-[2.5]" aria-hidden="true" />
    )
  }

  if (type === "info") {
    icon = (
      <InfoIcon className="size-6 shrink-0 stroke-[2.5]" aria-hidden="true" />
    )
  }

  if (type === "warning") {
    icon = (
      <TriangleAlertIcon className="size-6 shrink-0 stroke-[2.5]" aria-hidden="true" />
    )
  }

  if (type === "error") {
    icon = (
      <OctagonXIcon className="size-6 shrink-0 stroke-[2.5]" aria-hidden="true" />
    )
  }

  if (type === "loading") {
    icon = (
      <Loader2Icon className="size-6 shrink-0 animate-spin" aria-hidden="true" />
    )
  }

  if (!icon) {
    return null
  }

  return (
    <span
      data-slot="toast-icon"
      className="shrink-0">
      {icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  const getToastStyle = (type) => {
    if (type === 'error') {
      return 'bg-destructive text-white border-destructive shadow-2xl shadow-rose-900/30';
    }
    if (type === 'info') {
      return 'bg-primary text-primary-foreground border-primary shadow-2xl shadow-primary/30';
    }
    // Default success: vibrant emerald green
    return 'bg-emerald-600 text-white border-emerald-500 shadow-2xl shadow-emerald-900/30';
  };

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem} className={getToastStyle(toastItem.type)}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
