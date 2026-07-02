import { useEffect, useRef, useState } from 'react'

const REVEAL_COMMIT_INTERVAL_MS = 40

type UseStreamRevealOptions = {
    enabled: boolean
}

function pickRevealStep (backlog: number): number {
    if (backlog > 100) {
        return 4
    }

    if (backlog > 30) {
        return 2
    }

    return 1
}

function getPrefersReducedMotion (): boolean {
    if (typeof window === 'undefined') {
        return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useStreamReveal (text: string, { enabled }: UseStreamRevealOptions): string {
    const [displayText, setDisplayText] = useState('')
    const revealedLengthRef = useRef(0)
    const lastCommitTimeRef = useRef(0)
    const prefersReducedMotionRef = useRef(getPrefersReducedMotion())

    useEffect(() => {
        if (!text) {
            revealedLengthRef.current = 0
            lastCommitTimeRef.current = 0
            setDisplayText('')
        }
    }, [text])

    useEffect(() => {
        if (!enabled || prefersReducedMotionRef.current) {
            revealedLengthRef.current = text.length
            setDisplayText(text)
            return
        }

        let rafId = 0

        const tick = (now: number) => {
            const targetLength = text.length

            if (revealedLengthRef.current < targetLength) {
                const backlog = targetLength - revealedLengthRef.current
                revealedLengthRef.current = Math.min(
                    revealedLengthRef.current + pickRevealStep(backlog),
                    targetLength,
                )
            }

            const shouldCommit = (
                now - lastCommitTimeRef.current >= REVEAL_COMMIT_INTERVAL_MS
                || revealedLengthRef.current >= targetLength
            )

            if (shouldCommit) {
                lastCommitTimeRef.current = now
                setDisplayText(text.slice(0, revealedLengthRef.current))
            }

            if (revealedLengthRef.current < targetLength) {
                rafId = requestAnimationFrame(tick)
            }
        }

        rafId = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(rafId)
        }
    }, [text, enabled])

    return displayText
}
