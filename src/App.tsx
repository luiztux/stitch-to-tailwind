import { useState, useMemo, useEffect } from "react"
import {
  ExternalLink,
  Zap,
  Palette,
  Unlock,
  Copy,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  FileCode,
  Layout,
  Eye,
  Code,
  Droplets,
  Contrast,
  Sun,
  Moon,
  Check,
  X,
  Info,
  FileJson,
  FileType,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Pie, PieChart } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Color types and utilities
interface ColorToken {
  name: string
  hex: string
  category: "primary" | "secondary" | "surface" | "accent"
}

// Input format types
export type InputFormat = "design-md" | "html-stitch" | "unknown"

let type = ""

// Detect input format from text
export const detectInputFormat = (text: string): InputFormat => {
  const trimmed = text.trim().toLowerCase()

  // Check for HTML indicators
  if (
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<!html")
  ) {
    type = "html-stitch"
    return "html-stitch"
  }

  // Check for DESIGN.md indicators
  if (
    trimmed.includes("# design system") ||
    trimmed.includes("## colors") ||
    trimmed.includes("## typography") ||
    trimmed.includes("design.md") ||
    (trimmed.startsWith("#") && trimmed.includes("|"))
  ) {
    type = "design-md"
    return "design-md"
  }

  // Check for tailwind.config.js script tag
  if (trimmed.includes("tailwind.config") && trimmed.includes("<script")) {
    type = "html-stitch"
    return "html-stitch"
  }

  return "unknown"
}

// Parse HTML from Stitch (Tailwind v3) to extract config
export const parseStitchHtmlConfig = (
  html: string
): { theme: string; customCss: string } | null => {
  try {
    // Extract tailwind.config script content
    const configRegex =
      /<script[^>]*id=["']tailwind-config["'][^>]*>[\s\S]*?<\/script>/i
    const configMatch = html.match(configRegex)

    if (!configMatch) {
      return null
    }

    // Extract JS object from the script
    const jsContent = configMatch[0]
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .replace(/tailwind\.config\s*=\s*/, "")
      .trim()

    // Parse the config object (simplified - handle common cases)
    let configObj: Record<string, unknown> = {}

    try {
      // Try to parse as JSON (works for simple configs)
      configObj = JSON.parse(jsContent)
    } catch {
      // Use Function constructor as fallback for more complex configs
      const configFn = new Function(`return ${jsContent}`)
      configObj = configFn()
    }

    const theme = (configObj?.theme as Record<string, unknown>) || {}
    const extend = (theme?.extend as Record<string, unknown>) || {}

    // Build @theme CSS from config
    let themeCss = "@theme {\n"

    // Colors
    const colors = (extend?.colors as Record<string, string>) || {}
    if (Object.keys(colors).length > 0) {
      Object.entries(colors).forEach(([name, value]) => {
        const varName = name.replace(/([A-Z])/g, "-$1").toLowerCase()
        themeCss += `  --color-${varName}: ${value};\n`
      })
    }

    // Font families
    const fontFamily = (extend?.fontFamily as Record<string, string>) || {}
    if (Object.keys(fontFamily).length > 0) {
      Object.entries(fontFamily).forEach(([name, value]) => {
        themeCss += `  --font-${name.toLowerCase()}: "${value}", sans-serif;\n`
      })
    }

    // Border radius
    const borderRadius = (extend?.borderRadius as Record<string, string>) || {}
    if (Object.keys(borderRadius).length > 0) {
      Object.entries(borderRadius).forEach(([name, value]) => {
        if (name !== "DEFAULT") {
          themeCss += `  --radius-${name.toLowerCase()}: ${value};\n`
        } else {
          themeCss += `  --radius: ${value};\n`
        }
      })
    }

    // Spacing, shadows, etc. can be added similarly

    themeCss += "}\n"

    // Extract custom CSS from <style> tags
    const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi
    const styleMatches = html.match(styleRegex) || []
    const customCss = styleMatches
      .map((s) => s.replace(/<style[^>]*>/i, "").replace(/<\/style>/i, ""))
      .join("\n")

    return { theme: themeCss, customCss }
  } catch (error) {
    console.error("Failed to parse Stitch HTML config:", error)
    return null
  }
}

// Extract colors from parsed Stitch HTML
export const extractColorsFromStitchHtml = (html: string): ColorToken[] => {
  const result = parseStitchHtmlConfig(html)
  if (!result) return []

  const colors: ColorToken[] = []
  const configRegex =
    /<script[^>]*id=["']tailwind-config["'][^>]*>[\s\S]*?<\/script>/i
  const configMatch = html.match(configRegex)

  if (configMatch) {
    const jsContent = configMatch[0]
      .replace(/<script[^>]*>/i, "")
      .replace(/<\/script>/i, "")
      .replace(/tailwind\.config\s*=\s*/, "")
      .trim()

    let configObj: Record<string, unknown> = {}
    try {
      configObj = JSON.parse(jsContent)
    } catch {
      try {
        const configFn = new Function(`return ${jsContent}`)
        configObj = configFn()
      } catch {
        return []
      }
    }

    const theme = (configObj?.theme as Record<string, unknown>) || {}
    const extend = (theme?.extend as Record<string, unknown>) || {}
    const colorsObj = (extend?.colors as Record<string, string>) || {}

    Object.entries(colorsObj).forEach(([name, hex]) => {
      let category: ColorToken["category"] = "accent"
      if (name.includes("primary") || name.includes("brand")) {
        category = name.includes("container") ? "secondary" : "primary"
      } else if (name.includes("background") || name.includes("surface")) {
        category = "surface"
      } else if (name.includes("secondary") || name.includes("accent")) {
        category = "secondary"
      }
      colors.push({ name, hex, category })
    })
  }

  return colors
}

const parseColorsFromInput = (text: string): ColorToken[] => {
  const colors: ColorToken[] = []

  // Try to parse from DESIGN.md format: "- name: #hex" or "**Name:** `#hex`"
  const mdColorRegex =
    /(?:^|\n)\s*[-*]?\s*(?:\*\*)?([a-zA-Z0-9_ &]+)(?:\*\*)?:\s*[^#]*(#[0-9a-fA-F]{3,8})/gim
  let match

  while ((match = mdColorRegex.exec(text)) !== null) {
    // Clean up name by removing extra spaces and special chars, turning into valid css variable name
    const name = match[1]
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
    let category: ColorToken["category"] = "accent"

    if (name.includes("primary"))
      category = name.includes("container") ? "secondary" : "primary"
    else if (
      name.includes("secondary") ||
      name.includes("surface") ||
      name.includes("background")
    )
      category = "surface"
    else if (name.includes("accent") || name.includes("tertiary"))
      category = "accent"

    colors.push({ name, hex: match[2], category })
  }

  // If structured list missed the primary color (sometimes it's just mentioned in text like `primary: #fa441b` or "vibrant `#fa441b` primary")
  if (!colors.some((c) => c.name.includes("primary"))) {
    const primaryRegex =
      /(?:primary|brand).*?(#[0-9a-fA-F]{3,8})|(#[0-9a-fA-F]{3,8}).*?(?:primary|brand)/i
    const pMatch = text.match(primaryRegex)
    if (pMatch) {
      colors.unshift({
        name: "primary",
        hex: pMatch[1] || pMatch[2],
        category: "primary",
      })
    }
  }

  // If no colors found, try to parse from output config format: "--color-name: #hex"
  if (colors.length === 0) {
    const configColorRegex = /--color-([a-z-]+):\s*(#[0-9a-fA-F]{3,8})/gi
    while ((match = configColorRegex.exec(text)) !== null) {
      const name = match[1].toLowerCase()
      let category: ColorToken["category"] = "accent"

      if (name.includes("primary"))
        category = name.includes("container") ? "secondary" : "primary"
      else if (name.includes("secondary") || name.includes("surface"))
        category = "surface"
      else if (name.includes("accent") || name.includes("tertiary"))
        category = "accent"

      colors.push({ name, hex: match[2], category })
    }
  }

  return colors
}

// Calculate relative luminance for contrast
const getLuminance = (hex: string): number => {
  const rgb = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((x) => parseInt(x, 16) / 255) || [0, 0, 0]
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Calculate contrast ratio
const getContrastRatio = (hex1: string, hex2: string): number => {
  const l1 = getLuminance(hex1)
  const l2 = getLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Get WCAG rating
const getWcagRating = (
  ratio: number
): { level: string; aa: boolean; aaa: boolean } => {
  return {
    level:
      ratio >= 7
        ? "AAA"
        : ratio >= 4.5
          ? "AA"
          : ratio >= 3
            ? "AA Large"
            : "Fail",
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
  }
}

// Generate shades for a color
const generateShades = (hex: string): string[] => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  const shades = []
  for (let i = 100; i <= 900; i += 100) {
    const factor = i / 100
    const newR = Math.min(255, Math.round(r * factor))
    const newG = Math.min(255, Math.round(g * factor))
    const newB = Math.min(255, Math.round(b * factor))
    shades.push(
      `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
    )
  }
  return shades
}

// Color Distribution Chart Component
function ColorDistributionChart({ colors }: { colors: ColorToken[] }) {
  const chartData = useMemo(() => {
    return colors.map((c) => ({
      name: c.name,
      value: 1,
      fill: c.hex,
    }))
  }, [colors])

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}
    colors.forEach((c) => {
      config[c.name] = {
        label: c.name.charAt(0).toUpperCase() + c.name.slice(1),
        color: c.hex,
      }
    })
    return config
  }, [colors])

  return (
    <div className="flex items-center gap-8">
      <ChartContainer config={chartConfig} className="aspect-square w-[140px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={45}
            outerRadius={70}
            strokeWidth={0}
            paddingAngle={2}
            shape={(props: unknown) => {
              const { cx, cy, outerRadius, fill } = props as {
                cx: number
                cy: number
                outerRadius: number
                fill: string
              }
              return (
                <g>
                  <circle cx={cx} cy={cy} r={outerRadius} fill={fill} />
                </g>
              )
            }}
          />
        </PieChart>
      </ChartContainer>
      <div className="space-y-2">
        {colors.map((color, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div
              className="size-3 rounded-full transition-transform hover:scale-125"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-muted-foreground capitalize">
              {color.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Color Swatch with Shades
function ColorSwatch({ color }: { color: ColorToken }) {
  const shades = useMemo(() => generateShades(color.hex), [color.hex])
  const [showShades, setShowShades] = useState(false)

  return (
    <div className="space-y-3">
      <div
        className="flex cursor-pointer rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        style={{ backgroundColor: color.hex }}
        onClick={() => setShowShades(!showShades)}
      >
        <div className="flex w-full items-center gap-2">
          <Badge
            variant="secondary"
            className="w-full justify-center text-xs font-bold"
          >
            {color.hex.toUpperCase()}
          </Badge>
        </div>
      </div>
      <div
        className={`grid grid-cols-5 gap-1 overflow-hidden transition-all duration-300 ${showShades ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}
      >
        {shades.map((shade, i) => (
          <div
            key={i}
            className="h-6 rounded transition-transform hover:z-10 hover:scale-110"
            style={{ backgroundColor: shade }}
            title={`Shade ${(i + 1) * 100}`}
          />
        ))}
      </div>
    </div>
  )
}

// Contrast Checker Component
function ContrastChecker({ colors }: { colors: ColorToken[] }) {
  const pairs = useMemo(() => {
    const result: {
      bg: ColorToken
      fg: ColorToken
      ratio: number
      rating: ReturnType<typeof getWcagRating>
    }[] = []

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const ratio = getContrastRatio(colors[i].hex, colors[j].hex)
        result.push({
          bg: colors[i],
          fg: colors[j],
          ratio,
          rating: getWcagRating(ratio),
        })
      }
    }

    return result.sort((a, b) => b.ratio - a.ratio).slice(0, 4)
  }, [colors])

  return (
    <div className="space-y-3">
      {pairs.map((pair, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border p-3 transition-all duration-300 hover:shadow-md"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div
            className="flex h-12 w-20 items-center justify-center rounded-lg text-sm font-bold"
            style={{ backgroundColor: pair.bg.hex, color: pair.fg.hex }}
          >
            Aa
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {pair.bg.name} on {pair.fg.name}
              </span>
              <span className="font-mono text-xs font-bold">
                {pair.ratio.toFixed(2)}:1
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={pair.rating.aa ? "default" : "destructive"}
                className={`text-[10px] ${pair.rating.aa ? "bg-green-500" : ""}`}
              >
                {pair.rating.level}
              </Badge>
              {pair.rating.aa ? (
                <Check className="size-3 text-green-500" />
              ) : (
                <X className="size-3 text-red-500" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function App() {
  const [input, setInput] = useState("")
  const [inputFormat, setInputFormat] = useState<InputFormat>("unknown")
  const [isConverting, setIsConverting] = useState(false)
  const [output, setOutput] = useState<{ config: string; css: string } | null>(
    null
  )
  const [activeTab, setActiveTab] = useState("config")

  // Auto-detect input format when input changes
  useEffect(() => {
    if (input.trim()) {
      const format = detectInputFormat(input)
      setInputFormat(format)
    } else {
      setInputFormat("unknown")
    }
  }, [input])

  // Parse colors from input for enhanced preview
  const parsedColors = useMemo((): ColorToken[] => {
    // First try to parse from input
    if (input) {
      const inputColors = parseColorsFromInput(input)
      if (inputColors.length > 0) return inputColors
    }

    // Then try to parse from output config
    if (output?.config) {
      const configColors = parseColorsFromInput(output.config)
      if (configColors.length > 0) return configColors
    }

    // Default colors when no input
    return [
      { name: "primary", hex: "#006067", category: "primary" },
      { name: "container", hex: "#9EEFE8", category: "secondary" },
      { name: "secondary", hex: "#4A6366", category: "surface" },
      { name: "surface", hex: "#FAFDFC", category: "accent" },
    ]
  }, [input, output])

  const handleConvert = () => {
    if (!input.trim()) return

    setIsConverting(true)

    // Dynamically build theme based on input
    setTimeout(() => {
      // Detect format and process accordingly
      const format = detectInputFormat(input)

      if (format === "html-stitch") {
        // Parse HTML from Stitch (Tailwind v3)
        const parsed = parseStitchHtmlConfig(input)

        if (parsed) {
          setOutput({
            config: `/* index.css - Tailwind v4 @theme (converted from Stitch HTML) */\n${parsed.theme}`,
            css: parsed.customCss
              ? `/* Custom styles from Stitch HTML */\n@layer utilities {\n${parsed.customCss}\n}`
              : `/* components.css */\n@layer components {\n  .btn-primary {\n    @apply rounded-lg px-6 py-3 text-white transition-all hover:brightness-110;\n  }\n\n  .glass-panel {\n    background: oklch(1 0 0 / 10%);\n    backdrop-filter: blur(24px);\n    border: 1px solid oklch(1 0 0 / 20%);\n  }\n}`,
          })
          setIsConverting(false)
          toast.success("HTML converted to Tailwind v4!")
          return
        }
      }

      // Default: Parse DESIGN.md format
      const colorsToUse =
        parsedColors.length > 0
          ? parsedColors
          : [
              { name: "primary", hex: "#006067", category: "primary" },
              {
                name: "primary-container",
                hex: "#9EEFE8",
                category: "secondary",
              },
              { name: "secondary", hex: "#4A6366", category: "surface" },
              { name: "surface", hex: "#FAFDFC", category: "accent" },
            ]

      const themeColors = colorsToUse
        .map((c) => `  --color-${c.name.replace(/_/g, "-")}: ${c.hex};`)
        .join("\n")

      // Extract font or fallback
      const fontMatch = input.match(/(?:^|\n)\s*[-*]?\s*font_family:\s*(.+)/i)
      const fontFamily = fontMatch
        ? fontMatch[1].trim()
        : "Nunito Sans Variable"

      setOutput({
        config: `/* index.css - Tailwind v4 @theme */\n@theme {\n${themeColors}\n  \n  --font-sans: "${fontFamily}", sans-serif;\n  --font-heading: "${fontFamily}", sans-serif;\n}`,
        css: `/* components.css */\n@layer components {\n  .btn-primary {\n    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));\n    @apply rounded-lg px-6 py-3 text-white transition-all hover:brightness-110;\n  }\n\n  .glass-panel {\n    background: oklch(1 0 0 / 10%);\n    backdrop-filter: blur(24px);\n    border: 1px solid oklch(1 0 0 / 20%);\n  }\n}`,
      })
      setIsConverting(false)
      toast.success("Conversion complete (Tailwind v4)!")
    }, 1500)
  }

  const handleClear = () => {
    setInput("")
    setOutput(null)
  }

  const handleLoadExample = () => {
    setInput(
      `# Design System: Curated Equilibrium\n\n## Colors\n\n- primary: #006067\n- primary_container: #9EEFE8\n- secondary: #4A6366\n- surface: #FAFDFC\n\n## Typography\n\n- font_family: Manrope\n- heading: 32px / bold\n- body: 16px / regular\n\n## Components\n\n### Button Primary\n\n- background: linear-gradient(135deg, primary, primary_container)\n- border_radius: 8px\n- padding: 12px 24px\n- text_color: white`
    )
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
        <Toaster position="bottom-right" />

        {/* HEADER */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                ST
              </div>
              <h1 className="text-xl font-bold tracking-tight text-primary">
                Stitch{" "}
                <span className="font-normal text-muted-foreground">
                  to Tailwind
                </span>
              </h1>
              <span className="hidden rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
                v4.0
              </span>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <a
                href="#features"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Features
              </a>
              <a
                href="#examples"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Examples
              </a>
              <a
                href="https://github.com/luiztux/stitch-to-tailwind"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary"
              >
                GitHub <ExternalLink className="size-3" />
              </a>
            </nav>

            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <Layout className="size-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 lg:px-8">
          {/* HERO SECTION */}
          <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 py-12 text-center lg:py-20">
            <h2 className="text-3xl leading-tight font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Transform Google Stitch designs into{" "}
              <span className="text-primary italic">Tailwind CSS v4</span>
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Paste your DESIGN.md or HTML exported from Stitch, get{" "}
              production-ready Tailwind{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">@theme</code>{" "}
              configuration in seconds. Built for the next generation of CSS.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20"
                onClick={() =>
                  document
                    .getElementById("converter")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Start Converting
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
                onClick={handleLoadExample}
              >
                Try Example
              </Button>
            </div>
          </section>

          {/* MAIN CONVERTER AREA */}
          <section
            id="converter"
            className="mt-8 mb-16 grid scroll-mt-24 items-stretch gap-8 lg:grid-cols-2"
          >
            {/* INPUT PANEL */}
            <Card className="flex flex-col border-muted shadow-sm transition-all hover:border-muted-foreground/30">
              <div className="flex items-center justify-between border-b bg-muted/30 p-4">
                <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  <FileCode className="size-3" /> Input Content
                </label>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        onClick={handleClear}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear input</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                      >
                        <Upload className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Upload .md file</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {/* Format indicator */}
              <div className="flex items-center justify-between border-b px-4 py-2">
                <div className="flex items-center gap-2">
                  {inputFormat === "html-stitch" && (
                    <Badge variant="default" className="gap-1 bg-blue-600">
                      <FileType className="size-3" /> HTML Stitch (v3)
                    </Badge>
                  )}
                  {inputFormat === "design-md" && (
                    <Badge variant="secondary" className="gap-1">
                      <FileJson className="size-3" /> DESIGN.md
                    </Badge>
                  )}
                  {inputFormat === "unknown" && (
                    <Badge variant="outline" className="gap-1">
                      <Info className="size-3" /> Paste content
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {inputFormat === "html-stitch"
                    ? "Converting from Tailwind v3..."
                    : inputFormat === "design-md"
                      ? "Converting from DESIGN.md..."
                      : "We'll auto-detect your format"}
                </span>
              </div>
              <CardContent className="relative flex-1 p-0">
                <ScrollArea className="h-[600px]">
                  <Textarea
                    placeholder="Paste your DESIGN.md or HTML exported from Stitch..."
                    className="h-full min-h-[400px] resize-none rounded-none border-0 p-6 font-mono text-sm leading-relaxed focus-visible:ring-0"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </ScrollArea>
                <div className="absolute right-4 bottom-2 text-[10px] text-muted-foreground">
                  {input.length} characters
                </div>
              </CardContent>
              <div className="flex justify-center border-t bg-muted/30 p-4">
                <Button
                  className="h-12 w-full min-w-[200px] gap-2 text-base font-bold shadow-md sm:w-auto"
                  onClick={handleConvert}
                  disabled={!input.trim() || isConverting}
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      Generate Tailwind v4{" "}
                      <Zap className="size-4 fill-primary-foreground" />
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* OUTPUT PANEL */}
            <Card className="flex flex-col border-muted shadow-sm">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex h-full flex-col"
              >
                <div className="flex items-center justify-between border-b bg-muted/30 p-2">
                  <TabsList className="h-10 gap-1 bg-transparent">
                    <TabsTrigger
                      value="config"
                      className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <FileCode className="size-4" /> @theme
                    </TabsTrigger>
                    <TabsTrigger
                      value="css"
                      className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Layout className="size-4" /> CSS
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Eye className="size-4" /> Preview
                    </TabsTrigger>
                  </TabsList>

                  {output && activeTab !== "preview" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() =>
                        copyToClipboard(
                          activeTab === "config" ? output.config : output.css,
                          activeTab.toUpperCase()
                        )
                      }
                    >
                      <Copy className="size-3" /> Copy
                    </Button>
                  )}
                </div>

                <div className="min-h-[400px] flex-1">
                  <TabsContent value="config" className="m-0 h-full p-0">
                    {isConverting ? (
                      <div className="space-y-4 p-6">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : output ? (
                      <ScrollArea className="h-[460px] w-full bg-muted/10 p-6 font-mono text-sm">
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {output.config}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center opacity-50">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                          <Zap className="size-8" />
                        </div>
                        <p className="text-sm font-medium">
                          Generate Tailwind v4 to see @theme block here
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="css" className="m-0 h-full p-0">
                    {output ? (
                      <ScrollArea className="h-[460px] w-full bg-muted/10 p-6 font-mono text-sm">
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {output.css}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center opacity-50">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                          <Layout className="size-8" />
                        </div>
                        <p className="text-sm font-medium">
                          Generate Tailwind to see CSS classes here
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="preview" className="m-0 h-full p-0">
                    {output ? (
                      <ScrollArea className="h-[680px] w-full bg-muted/5 p-8">
                        <div className="space-y-10">
                          {/* Color Distribution Chart */}
                          <section className="animate-in duration-500 fade-in slide-in-from-bottom-4">
                            <h4 className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                              <Droplets className="size-4" /> Color Distribution
                            </h4>
                            <Card className="border-muted/50 bg-background/50">
                              <CardContent className="flex items-center justify-center p-6">
                                <ColorDistributionChart colors={parsedColors} />
                              </CardContent>
                            </Card>
                          </section>

                          {/* Enhanced Color Palette */}
                          <section
                            className="animate-in duration-500 fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: "100ms" }}
                          >
                            <h4 className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                              <Palette className="size-4" /> Color Palette (v4)
                            </h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              {parsedColors.map((color, i) => (
                                <div
                                  key={i}
                                  className="animate-in duration-300 zoom-in-95 fade-in"
                                  style={{
                                    animationDelay: `${150 + i * 50}ms`,
                                  }}
                                >
                                  <ColorSwatch color={color} />
                                </div>
                              ))}
                            </div>
                          </section>

                          {/* Contrast Checker */}
                          <section
                            className="animate-in duration-500 fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: "200ms" }}
                          >
                            <h4 className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                              <Contrast className="size-4" /> Contrast Analysis
                            </h4>
                            <Card className="border-muted/50 bg-background/50">
                              <CardHeader className="pb-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Info className="size-3" />
                                  WCAG 2.1 compliance check
                                </div>
                              </CardHeader>
                              <CardContent>
                                <ContrastChecker colors={parsedColors} />
                              </CardContent>
                            </Card>
                          </section>

                          {/* Typography */}
                          <section
                            className="animate-in duration-500 fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: "300ms" }}
                          >
                            <h4 className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                              <Code className="size-4" /> Typography
                            </h4>
                            <div className="space-y-4 rounded-xl border bg-background/50 p-6 transition-all duration-300 hover:shadow-lg">
                              <h3 className="animate-in text-2xl font-bold text-zinc-600">
                                Heading Sample
                              </h3>
                              <p className="text-base leading-relaxed text-muted-foreground">
                                This is a body text sample. Curated Equilibrium
                                focuses on the balance between professional
                                precision and human well-being.
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Sun className="size-3" /> Light text
                                </span>
                                <span className="flex items-center gap-1">
                                  <Moon className="size-3" /> Dark text
                                </span>
                              </div>
                            </div>
                          </section>

                          {/* Component Preview */}
                          <section
                            className="animate-in duration-500 fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: "400ms" }}
                          >
                            <h4 className="mb-6 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                              <Layout className="size-4" /> Component Preview
                            </h4>
                            {(() => {
                              const primaryColor =
                                type === "design-md"
                                  ? parsedColors.find(
                                      (c) =>
                                        c.name === "button" ||
                                        c.name.includes("button")
                                    )?.hex || "#006067"
                                  : parsedColors.find(
                                      (c) =>
                                        c.name === "primary" ||
                                        c.name.includes("primary")
                                    )?.hex || "#006067"
                              const secondaryColor =
                                type === "design-md"
                                  ? parsedColors.find(
                                      (c) =>
                                        c.name.includes("container") ||
                                        c.category === "secondary"
                                    )?.hex || "#9EEFE8"
                                  : parsedColors.find(
                                      (c) =>
                                        c.name.includes("secondary") ||
                                        c.category === "secondary"
                                    )?.hex || "#9EEFE8"

                              return (
                                <div className="grid gap-6 lg:grid-cols-2">
                                  {/* Buttons & Status */}
                                  <Card className="border-muted/50 bg-background/50 shadow-sm transition-all hover:shadow-md">
                                    <CardHeader className="pb-3 text-sm font-semibold text-muted-foreground">
                                      Actions & Status
                                    </CardHeader>
                                    <CardContent className="flex flex-wrap items-center gap-4">
                                      <Button
                                        className="shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:brightness-110"
                                        style={{
                                          backgroundColor: primaryColor,
                                          color: "#ffffff",
                                        }}
                                      >
                                        Primary Button
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="border transition-all duration-300 hover:brightness-110"
                                        style={{
                                          borderColor: primaryColor,
                                          color: primaryColor,
                                          backgroundColor: `${primaryColor}0d`,
                                        }}
                                      >
                                        Ghost Border
                                      </Button>
                                      <Badge
                                        className="pointer-events-none rounded-full px-3 py-1 font-semibold tracking-wider hover:brightness-110"
                                        style={{
                                          backgroundColor: `${primaryColor}20`,
                                          color: primaryColor,
                                        }}
                                      >
                                        Active
                                      </Badge>
                                    </CardContent>
                                  </Card>

                                  {/* Form Elements */}
                                  <Card className="border-muted/50 bg-background/50 shadow-sm transition-all hover:shadow-md">
                                    <CardHeader className="pb-3 text-sm font-semibold text-muted-foreground">
                                      Forms & Inputs
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <Textarea
                                        placeholder="Enter your thoughts..."
                                        className="min-h-[80px] resize-none transition-all duration-300 focus-visible:ring-1 focus-visible:ring-offset-1"
                                        style={
                                          {
                                            borderColor: `${primaryColor}40`,
                                            "--tw-ring-color": primaryColor,
                                          } as React.CSSProperties
                                        }
                                      />
                                    </CardContent>
                                  </Card>

                                  {/* Interactive Elements */}
                                  <Card className="border-muted/50 bg-background/50 shadow-sm transition-all hover:shadow-md">
                                    <CardHeader className="pb-3 text-sm font-semibold text-muted-foreground">
                                      Data & Navigation
                                    </CardHeader>
                                    <CardContent>
                                      <Tabs
                                        defaultValue="tab1"
                                        className="w-full"
                                      >
                                        <TabsList
                                          className="grid w-full grid-cols-2 rounded-xl"
                                          style={{
                                            backgroundColor: `${primaryColor}15`,
                                          }}
                                        >
                                          <TabsTrigger
                                            value="tab1"
                                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                            style={{
                                              color: primaryColor,
                                            }}
                                          >
                                            Overview
                                          </TabsTrigger>
                                          <TabsTrigger
                                            value="tab2"
                                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                            style={{
                                              color: primaryColor,
                                            }}
                                          >
                                            Analytics
                                          </TabsTrigger>
                                        </TabsList>
                                      </Tabs>
                                    </CardContent>
                                  </Card>

                                  {/* Loading States & Surfaces */}
                                  <Card className="border-muted/50 bg-background/50 shadow-sm transition-all hover:shadow-md">
                                    <CardHeader className="pb-3 text-sm font-semibold text-muted-foreground">
                                      Loading & Surfaces
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="space-y-2">
                                        <Skeleton
                                          className="h-4 w-3/4 rounded"
                                          style={{
                                            backgroundColor: `${primaryColor}30`,
                                          }}
                                        />
                                        <Skeleton
                                          className="h-4 w-1/2 rounded"
                                          style={{
                                            backgroundColor: `${primaryColor}20`,
                                          }}
                                        />
                                      </div>
                                      <div
                                        className="flex h-12 w-full cursor-default items-center justify-center rounded-lg font-bold text-white shadow-inner transition-transform hover:scale-[1.02]"
                                        style={{
                                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                        }}
                                      >
                                        Signature Gradient
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )
                            })()}
                          </section>
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center opacity-50">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                          <Eye className="size-8" />
                        </div>
                        <p className="text-sm font-medium">
                          Generate Tailwind to see visual preview here
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </div>

                {output && (
                  <div className="flex flex-wrap justify-center gap-2 border-t bg-muted/30 p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        copyToClipboard(output.config, "Theme config")
                      }
                    >
                      <Copy className="size-3" /> Copy @theme
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => copyToClipboard(output.css, "CSS")}
                    >
                      <Copy className="size-3" /> Copy CSS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
                    >
                      <Download className="size-3" /> Download ZIP
                    </Button>
                  </div>
                )}
              </Tabs>
            </Card>
          </section>

          {/* FEATURES GRID */}
          <section id="features" className="border-t py-20">
            <div className="mb-16 space-y-4 text-center">
              <h3 className="text-3xl font-bold tracking-tight">
                Why use Stitch to Tailwind?
              </h3>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Designed to bridge the gap between editorial design excellence
                and modern web development.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: <Zap className="size-6 text-primary" />,
                  title: "Instant Conversion",
                  desc: "Paste your DESIGN.md, get Tailwind config in <5 seconds. No sign-up, no setup required.",
                },
                {
                  icon: <Palette className="size-6 text-primary" />,
                  title: "Full Design Fidelity",
                  desc: "Supports tokens, components, gradients, glassmorphism, and custom elevation layers.",
                },
                {
                  icon: <Unlock className="size-6 text-primary" />,
                  title: "Open Source & Extensible",
                  desc: "MIT licensed, community-driven. Fork on GitHub to add support for your own design systems.",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="border-muted bg-muted/10 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <CardContent className="space-y-4 p-8">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-bold tracking-tight">
                      {feature.title}
                    </h4>
                    <p className="leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* QUICK START SECTION */}
          <section
            id="examples"
            className="-mx-4 border-t bg-muted/20 px-4 py-20 lg:-mx-8 lg:px-8"
          >
            <div className="mx-auto max-w-4xl space-y-8 text-center">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold">Try it now</h3>
                <p className="text-muted-foreground">
                  Load a sample DESIGN.md to see the magic happen instantly.
                </p>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="group h-14 gap-3 border-primary/20 bg-background px-10 text-lg hover:bg-primary/5"
                onClick={handleLoadExample}
              >
                <RefreshCw className="size-5 transition-transform duration-500 group-hover:rotate-180" />
                Load Example DESIGN.md
              </Button>
            </div>
          </section>
        </main>

        {/* FOOTER */}
        <footer className="mt-auto border-t bg-muted/30 py-12">
          <div className="container mx-auto flex flex-col items-center justify-between gap-8 px-4 text-center md:flex-row md:text-left lg:px-8">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <div className="flex size-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
                  ST
                </div>
                <span className="font-bold text-primary">
                  Stitch to Tailwind
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Built by luiztux</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8">
              <a
                href="https://github.com/luiztux/stitch-to-tailwind"
                className="flex items-center gap-1.5 text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="size-8"
                >
                  <path
                    fill="#525252"
                    d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}

export default App
