import { toDisplayText } from '@condo/domains/ai/utils/aiAnswerPresenter'

export type AnswerDisplayBuffer = {
    append: (chunk: string) => void
    set: (text: string) => void
    finish: (onCaughtUp?: () => void) => void
    dispose: () => void
    getText: () => string
}

type CreateAnswerDisplayBufferOptions = {
    onFlush: (text: string) => void
    charsPerSecond?: number
}

const DEFAULT_CHARS_PER_SECOND = 75
const MAX_FRAME_DELTA_SEC = 0.05

export function createAnswerDisplayBuffer ({
    onFlush,
    charsPerSecond = DEFAULT_CHARS_PER_SECOND,
}: CreateAnswerDisplayBufferOptions): AnswerDisplayBuffer {
    let receivedText = ''
    let displayedText = ''
    let revealedLength = 0
    let rafId: number | null = null
    let lastFrameTs = 0
    let charCarry = 0
    let disposed = false
    let onCaughtUp: (() => void) | null = null
    let finishRequested = false

    const flushDisplayed = () => {
        if (disposed) return
        onFlush(displayedText)
    }

    const stopRevealLoop = () => {
        if (rafId === null) return
        cancelAnimationFrame(rafId)
        rafId = null
        lastFrameTs = 0
        charCarry = 0
    }

    const notifyCaughtUpIfNeeded = () => {
        if (!finishRequested) return
        const callback = onCaughtUp
        onCaughtUp = null
        finishRequested = false
        callback?.()
    }

    const paintVisibleFromRevealed = () => {
        const rawSlice = receivedText.slice(0, revealedLength)
        const nextDisplay = toDisplayText(rawSlice)
        if (nextDisplay !== displayedText) {
            displayedText = nextDisplay
            flushDisplayed()
        }
        return nextDisplay === toDisplayText(receivedText)
    }

    const speedForBacklog = (backlog: number) => {
        if (backlog > 120) return charsPerSecond * 3
        if (backlog > 60) return charsPerSecond * 2
        if (backlog > 24) return charsPerSecond * 1.4
        return charsPerSecond
    }

    const revealFrame = (ts: number) => {
        rafId = null
        if (disposed) return

        if (revealedLength >= receivedText.length) {
            paintVisibleFromRevealed()
            notifyCaughtUpIfNeeded()
            return
        }

        if (!lastFrameTs) lastFrameTs = ts
        const dt = Math.min(MAX_FRAME_DELTA_SEC, (ts - lastFrameTs) / 1000)
        lastFrameTs = ts

        const backlog = receivedText.length - revealedLength
        charCarry += speedForBacklog(backlog) * dt
        const charsToReveal = Math.floor(charCarry)
        if (charsToReveal > 0) {
            charCarry -= charsToReveal
            revealedLength = Math.min(receivedText.length, revealedLength + charsToReveal)
        }

        const visibleDone = paintVisibleFromRevealed()
        if (visibleDone || revealedLength >= receivedText.length) {
            revealedLength = receivedText.length
            lastFrameTs = 0
            charCarry = 0
            notifyCaughtUpIfNeeded()
            return
        }

        rafId = requestAnimationFrame(revealFrame)
    }

    const scheduleReveal = () => {
        if (disposed) return
        if (revealedLength >= receivedText.length) {
            paintVisibleFromRevealed()
            notifyCaughtUpIfNeeded()
            return
        }
        if (rafId !== null) return
        rafId = requestAnimationFrame(revealFrame)
    }

    return {
        append (chunk: string) {
            if (disposed || !chunk) return
            receivedText += chunk
            if (displayedText === toDisplayText(receivedText)) {
                revealedLength = receivedText.length
                notifyCaughtUpIfNeeded()
                return
            }
            scheduleReveal()
        },

        set (nextText: string) {
            if (disposed) return
            receivedText = nextText ?? ''
            revealedLength = receivedText.length
            displayedText = toDisplayText(receivedText)
            stopRevealLoop()
            flushDisplayed()
            notifyCaughtUpIfNeeded()
        },

        finish (callback) {
            if (disposed) {
                callback?.()
                return
            }
            finishRequested = true
            onCaughtUp = callback ?? null

            if (displayedText === toDisplayText(receivedText)) {
                revealedLength = receivedText.length
                stopRevealLoop()
                notifyCaughtUpIfNeeded()
                return
            }

            scheduleReveal()
        },

        dispose () {
            disposed = true
            onCaughtUp = null
            finishRequested = false
            stopRevealLoop()
        },

        getText () {
            return receivedText
        },
    }
}
