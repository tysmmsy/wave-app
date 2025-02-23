"use client"

import { useEffect, useRef, useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { motion, AnimatePresence } from "framer-motion"

interface Wave {
  x: number
  y: number
  time: number
  lifetime: number
  direction: { x: number; y: number }
  colors?: {
    start: { h: number; s: number; l: number }
    end: { h: number; s: number; l: number }
  }
}

type WaveMode = "default" | "rainbow"

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wavesRef = useRef<Wave[]>([])
  const [mode, setMode] = useState<WaveMode>("default")
  const [showFlash, setShowFlash] = useState(false)

  // モード変更時のエフェクト
  const handleModeChange = (value: WaveMode | undefined) => {
    if (!value) return
    setMode(value)
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const generateRandomHSL = () => ({
      h: Math.random() * 360,
      s: 100,
      l: 50,
    })

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      wavesRef.current.push({
        x,
        y,
        time: 0,
        lifetime: 2,
        direction: {
          x: 3,
          y: 2,
        },
        colors:
          mode === "rainbow"
            ? {
                start: generateRandomHSL(),
                end: generateRandomHSL(),
              }
            : undefined,
      })
    }

    const drawHalftoneWave = () => {
      const gridSize = 20
      const rows = Math.ceil(canvas.height / gridSize)
      const cols = Math.ceil(canvas.width / gridSize)

      ctx.fillStyle = "rgb(0, 0, 0)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const centerX = x * gridSize
          const centerY = y * gridSize

          wavesRef.current.forEach((wave) => {
            const distanceFromClick = Math.sqrt(Math.pow(centerX - wave.x, 2) + Math.pow(centerY - wave.y, 2))
            const waveProgress = wave.time * 2
            const waveWidth = 200
            const clickWaveEffect = Math.max(0, 1 - Math.abs(distanceFromClick - waveProgress * 500) / waveWidth)
            const fadeOut = 1 - wave.time / wave.lifetime
            const waveStrength = clickWaveEffect * fadeOut

            if (waveStrength > 0) {
              const size = gridSize * Math.min(waveStrength, 1) * 0.8

              if (mode === "rainbow" && wave.colors) {
                const normalizedDistance = distanceFromClick / (waveProgress * 500 + waveWidth)
                const { start, end } = wave.colors

                const h = start.h + (((end.h - start.h + 540) % 360) - 180) * normalizedDistance
                const s = start.s + (end.s - start.s) * normalizedDistance
                const l = start.l + (end.l - start.l) * normalizedDistance

                ctx.beginPath()
                ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${waveStrength * 0.5})`
                ctx.fill()
              } else {
                ctx.beginPath()
                ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${waveStrength * 0.5})`
                ctx.fill()
              }
            }
          })
        }
      }

      wavesRef.current = wavesRef.current
        .map((wave) => {
          const nextX = wave.x + wave.direction.x
          const nextY = wave.y + wave.direction.y

          const newDirection = { ...wave.direction }
          if (nextX <= 0 || nextX >= canvas.width) {
            newDirection.x = -wave.direction.x
          }
          if (nextY <= 0 || nextY >= canvas.height) {
            newDirection.y = -wave.direction.y
          }

          return {
            ...wave,
            x: nextX <= 0 ? 0 : nextX >= canvas.width ? canvas.width : nextX,
            y: nextY <= 0 ? 0 : nextY >= canvas.height ? canvas.height : nextY,
            time: wave.time + 0.016,
            direction: newDirection,
          }
        })
        .filter((wave) => wave.time < wave.lifetime)
    }

    const animate = () => {
      drawHalftoneWave()
      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    canvas.addEventListener("click", handleClick)

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
      canvas.removeEventListener("click", handleClick)
    }
  }, [mode])

  return (
    <div className="relative w-full h-screen">
      <canvas ref={canvasRef} className="w-full h-screen bg-black" />

      {/* モード切り替え時のフラッシュエフェクト */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-sm mb-2 text-center"
        >
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-500/50 p-2 rounded-lg backdrop-blur-sm"
        >
          <ToggleGroup type="single" value={mode} onValueChange={handleModeChange}>
            <ToggleGroupItem
              value="default"
              aria-label="Default wave"
              className={`${
                mode === "default" ? "bg-white text-black" : "text-white hover:bg-white/20 transition-colors"
              }`}
            >
              White
            </ToggleGroupItem>
            <ToggleGroupItem
              value="rainbow"
              aria-label="Rainbow wave"
              className={`${
                mode === "rainbow"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "text-white hover:bg-white/20 transition-colors"
              }`}
            >
              Rainbow
            </ToggleGroupItem>
          </ToggleGroup>
        </motion.div>
      </div>
    </div>
  )
}

