import React, { useLayoutEffect, useRef } from 'react'

import { Markdown } from '@open-condo/ui'

import styles from './AIChat.module.css'

type StreamingAssistantTextProps = {
    text: string
    isStreaming: boolean
    className?: string
}

export const StreamingAssistantText: React.FC<StreamingAssistantTextProps> = ({
    text,
    isStreaming,
    className,
}) => {
    const previousTextRef = useRef('')

    const previousText = previousTextRef.current
    const stableText = text.startsWith(previousText) ? previousText : ''
    const tailText = text.slice(stableText.length)

    useLayoutEffect(() => {
        previousTextRef.current = text
    }, [text])

    if (!isStreaming) {
        return (
            <div className={className}>
                <Markdown type='inline'>{text}</Markdown>
            </div>
        )
    }

    return (
        <div className={className}>
            <span className={styles.streamingPlainText}>
                {stableText}
                {tailText ? (
                    <span key={text.length} className={styles.streamTailFade}>
                        {tailText}
                    </span>
                ) : null}
                <span className={styles.streamCursor} aria-hidden>▍</span>
            </span>
        </div>
    )
}
