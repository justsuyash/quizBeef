import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/cn"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      // Sleek Nalanda-styled slider
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[hsl(30,42%,92%)]">
      {/* filled range */}
      <SliderPrimitive.Range className="absolute h-full bg-[hsl(19,85%,38%)]/80" />
    </SliderPrimitive.Track>
    {/* Two thumbs for range selection */}
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-[3px] border-[hsl(30,100%,60%)] bg-white shadow-sm ring-offset-background transition-transform duration-150 ease-out hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(30,100%,60%)]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-[3px] border-[hsl(30,100%,60%)] bg-white shadow-sm ring-offset-background transition-transform duration-150 ease-out hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(30,100%,60%)]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
