"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale,
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit p-1", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 z-10",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 rounded-xl p-0 select-none border-border bg-card text-foreground hover:bg-primary/15 hover:text-primary transition-all shadow-xs",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 rounded-xl p-0 select-none border-border bg-card text-foreground hover:bg-primary/15 hover:text-primary transition-all shadow-xs",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-8",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-1.5 text-sm font-black",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn("relative rounded-xl", defaultClassNames.dropdown_root),
        dropdown: cn("absolute inset-0 bg-popover opacity-0", defaultClassNames.dropdown),
        caption_label: cn("font-black text-base text-foreground capitalize tracking-tight select-none", defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse mt-2", defaultClassNames.month_grid),
        weekdays: cn("flex mb-1", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-xl text-center py-1 text-xs font-bold text-primary uppercase tracking-wider select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full gap-1", defaultClassNames.week),
        week_number_header: cn("w-9 select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-xs text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-xl p-0 text-center select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-xl bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-xl bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "font-black text-primary border-2 border-primary/40 rounded-xl",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/30 font-normal",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-40", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (<div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />);
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (<ChevronLeftIcon className={cn("size-5 text-primary stroke-[2.5]", className)} {...props} />);
          }

          if (orientation === "right") {
            return (<ChevronRightIcon className={cn("size-5 text-primary stroke-[2.5]", className)} {...props} />);
          }

          return (<ChevronDownIcon className={cn("size-5 text-primary stroke-[2.5]", className)} {...props} />);
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div
                className="flex size-9 items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props} />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelected =
    modifiers.selected ||
    props['aria-selected'] === true ||
    props['aria-selected'] === 'true' ||
    Boolean(props['data-selected-single']);

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelected}
      className={cn(
        "relative isolate z-10 flex aspect-square size-9 items-center justify-center rounded-xl border-0 font-bold text-sm transition-all duration-200",
        isSelected
          ? "bg-linear-to-tr from-primary via-primary to-cyan-500 text-white font-black shadow-md scale-105 ring-2 ring-primary/30"
          : modifiers.today
            ? "border-2 border-primary/50 text-primary font-black bg-primary/10 hover:bg-primary/20"
            : "text-foreground hover:bg-primary/15 hover:text-primary",
        modifiers.outside && "text-muted-foreground/30 font-normal opacity-40 hover:bg-transparent hover:text-muted-foreground/30",
        className
      )}
      {...props} />
  );
}

export { Calendar, CalendarDayButton }
