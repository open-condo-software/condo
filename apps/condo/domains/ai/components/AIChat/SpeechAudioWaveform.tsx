import React, { useEffect, useRef } from 'react'

import styles from './SpeechAudioWaveform.module.css'

const DEFAULT_BAR_COUNT = 32
const COMPACT_BAR_COUNT = 5
const FFT_SIZE = 256

type SpeechAudioWaveformProps = {
    stream: MediaStream
    compact?: boolean
}

export const SpeechAudioWaveform: React.FC<SpeechAudioWaveformProps> = ({
    stream,
    compact = false,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const sizeRef = useRef({ width: 0, height: 0 })
    const barCount = compact ? COMPACT_BAR_COUNT : DEFAULT_BAR_COUNT

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = 0.75
        source.connect(analyser)

        if (audioContext.state === 'suspended') {
            void audioContext.resume()
        }

        const frequencyData = new Uint8Array(analyser.frequencyBinCount)
        const context = canvas.getContext('2d')
        if (!context) {
            void audioContext.close()
            return
        }

        const barColor = getComputedStyle(canvas).getPropertyValue('--condo-global-color-gray-7').trim()
            || '#707A8A'

        const draw = () => {
            const { width, height } = sizeRef.current
            if (width <= 0 || height <= 0) {
                animationFrameRef.current = requestAnimationFrame(draw)
                return
            }

            analyser.getByteFrequencyData(frequencyData)
            context.clearRect(0, 0, width, height)

            const barWidth = width / barCount
            const gap = Math.max(1, barWidth * (compact ? 0.4 : 0.35))
            const usableWidth = Math.max(1, barWidth - gap)

            for (let i = 0; i < barCount; i++) {
                // Focus on lower/mid frequencies that better reflect speech energy
                const dataIndex = Math.floor((i / barCount) * (frequencyData.length * 0.45))
                const value = frequencyData[dataIndex] / 255
                const minHeight = height * (compact ? 0.28 : 0.12)
                const barHeight = Math.max(minHeight, value * height * 0.9)
                const x = i * barWidth + gap / 2
                const y = (height - barHeight) / 2

                context.fillStyle = barColor
                context.beginPath()
                if (typeof context.roundRect === 'function') {
                    context.roundRect(x, y, usableWidth, barHeight, usableWidth / 2)
                } else {
                    context.rect(x, y, usableWidth, barHeight)
                }
                context.fill()
            }

            animationFrameRef.current = requestAnimationFrame(draw)
        }

        const resize = () => {
            const parent = canvas.parentElement
            if (!parent) return
            const ratio = window.devicePixelRatio || 1
            const displayWidth = parent.clientWidth
            const displayHeight = parent.clientHeight || (compact ? 16 : 40)
            sizeRef.current = { width: displayWidth, height: displayHeight }
            canvas.width = Math.floor(displayWidth * ratio)
            canvas.height = Math.floor(displayHeight * ratio)
            canvas.style.width = `${displayWidth}px`
            canvas.style.height = `${displayHeight}px`
            context.setTransform(ratio, 0, 0, ratio, 0, 0)
        }

        resize()
        window.addEventListener('resize', resize)
        draw()

        return () => {
            window.removeEventListener('resize', resize)
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            source.disconnect()
            analyser.disconnect()
            void audioContext.close()
        }
    }, [barCount, compact, stream])

    return (
        <div
            className={compact ? styles.waveformCompact : styles.waveform}
            aria-hidden
        >
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
    )
}
