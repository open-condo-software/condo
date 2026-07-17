import { toDisplayText } from '@condo/domains/ai/utils/aiAnswerPresenter'

export type AnswerDisplayBuffer = {
    append: (chunk: string) => void
    set: (text: string) => void
    /** Keep revealing until visible UI text catches up, then call onCaughtUp. */
    finish: (onCaughtUp?: () => void) => void
    dispose: () => void
    getText: () => string
}

type CreateAnswerDisplayBufferOptions = {
    onFlush: (text: string) => void
    /**
     * How fast visible text catches up to received text.
     * Lower = slower. Default: 72 chars/sec.
     */
    charsPerSecond?: number
}

const DEFAULT_CHARS_PER_SECOND = 100
const TICK_MS = 33

/**
 * Holds the full received answer and reveals it to the UI at a steady rate.
 * Transport can be fast; UI catches up smoothly without dumping token packs.
 */
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
        // Visible part is done once markers start (or full text is shown).
        return toDisplayText(rawSlice) === toDisplayText(receivedText)
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
            // Keep receiving the suggestions tail silently; do not paint it.
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
        // Only the interval reveals text. Immediate reveal on every append caused jumps
        // when many NATS tokens arrived in one burst.
        if (intervalId !== null) return
        intervalId = setInterval(revealStep, TICK_MS)
    }

    return {
        append (chunk: string) {
            if (disposed || !chunk) return
            receivedText += chunk
            // If visible answer is already complete, just accumulate the suggestions tail.
            if (toDisplayText(displayedText) === toDisplayText(receivedText)) {
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

            if (toDisplayText(displayedText) === toDisplayText(receivedText)) {
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
