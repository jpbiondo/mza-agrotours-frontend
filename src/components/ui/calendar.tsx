"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"

/**
 * Calendario Agrotours sobre react-day-picker. Locale español, semana desde
 * lunes; los estilos usan los tokens de la marca (verde para el día seleccionado,
 * green-050 en hover). El look de los días se aplica al <button> vía `[&>button]`
 * porque RDP pone los modificadores (selected/today/…) en el <td>.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn("p-1", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: cn("relative flex flex-col gap-3", defaults.months),
        month: cn("flex flex-col gap-3", defaults.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaults.nav
        ),
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-md border border-outline-variant bg-surface text-fg-2 transition-colors hover:bg-cream-tert disabled:pointer-events-none disabled:opacity-40",
          defaults.button_previous
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-md border border-outline-variant bg-surface text-fg-2 transition-colors hover:bg-cream-tert disabled:pointer-events-none disabled:opacity-40",
          defaults.button_next
        ),
        month_caption: cn(
          "flex h-8 items-center justify-center",
          defaults.month_caption
        ),
        caption_label: cn(
          "font-display text-[15px] font-semibold text-fg-1",
          defaults.caption_label
        ),
        dropdowns: cn(
          "flex items-center justify-center gap-1.5",
          defaults.dropdowns
        ),
        dropdown_root: cn(
          "relative inline-flex items-center rounded-md border border-outline-variant bg-surface px-2 py-1 font-display text-sm font-semibold text-fg-1 transition-colors hover:bg-cream-tert focus-within:border-green-800",
          defaults.dropdown_root
        ),
        dropdown: cn("absolute inset-0 cursor-pointer opacity-0", defaults.dropdown),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn(
          "w-9 text-[11px] font-bold tracking-wide text-fg-3 uppercase",
          defaults.weekday
        ),
        week: cn("mt-0.5 flex w-full", defaults.week),
        day: cn(
          "size-9 p-0 text-center [&>button]:font-bold [&>button]:text-fg-1",
          defaults.day
        ),
        day_button: cn(
          "flex size-9 items-center justify-center rounded-md text-sm font-medium text-fg-1 transition-colors hover:bg-green-050 disabled:pointer-events-none disabled:opacity-35",
          defaults.day_button
        ),
        today: cn(
          "[&:not([data-selected=true])>button]:font-bold [&:not([data-selected=true])>button]:text-green-800",
          defaults.today
        ),
        selected: cn(
          "[&>button]:bg-green-800 [&>button]:font-bold [&>button]:text-white [&>button]:hover:bg-green-800",
          defaults.selected
        ),
        outside: cn("[&>button]:text-fg-3/40", defaults.outside),
        disabled: cn("[&>button]:text-fg-3 [&>button]:opacity-35", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: cls, ...rest }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className={cn("size-4", cls)} {...rest} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
