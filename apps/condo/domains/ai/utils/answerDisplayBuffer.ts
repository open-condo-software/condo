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

const DEFAULT_CHARS_PER_SECOND = 100
const TICK_MS = 33

export function createAnswerDisplayBuffer ({
    onFlush,
    charsPerSecond = DEFAULT_CHARS_PER_SECOND,
}: CreateAnswerDisplayBufferOptions): AnswerDisplayBuffer {
    let receivedText = ''
    let displayedText = ''
    let revealedLength = 0
    let intervalId: ReturnType<typeof setInterval> | null = null
    let disposed = false
    let onCaughtUp: (() => void) | null = null
    let finishRequested = false

    const charsPerTick = Math.max(1, Math.round((charsPerSecond * TICK_MS) / 1000))

    const flushDisplayed = () => {
        if (disposed) return
        onFlush(displayedText)
    }

    const stopRevealLoop = () => {
        if (intervalId === null) return
        clearInterval(intervalId)
        intervalId = null
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

    const revealStep = () => {
        if (disposed) {
            stopRevealLoop()
            return
        }

        if (revealedLength >= receivedText.length) {
            paintVisibleFromRevealed()
            stopRevealLoop()
            notifyCaughtUpIfNeeded()
            return
        }

        revealedLength = Math.min(receivedText.length, revealedLength + charsPerTick)
        const visibleDone = paintVisibleFromRevealed()

        if (visibleDone) {
            revealedLength = receivedText.length
            stopRevealLoop()
            notifyCaughtUpIfNeeded()
        }
    }

    const scheduleReveal = () => {
        if (disposed) return
        if (revealedLength >= receivedText.length) {
            paintVisibleFromRevealed()
            notifyCaughtUpIfNeeded()
            return
        }
        if (intervalId !== null) return
        intervalId = setInterval(revealStep, TICK_MS)
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
