import React, { useMemo } from 'react'

import styles from './HighlightedText.module.css'

type HighlightedTextProps = {
    text: string
    highlight?: string
}

type TextPart = {
    text: string
    isHighlighted: boolean
}

function splitTextByHighlight (text: string, highlight?: string): TextPart[] {
    if (!highlight || !highlight.trim()) {
        return [{ text, isHighlighted: false }]
    }

    // Escape special regex characters in the search term
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // Split text by the search term (case-insensitive)
    // Note: Using capturing group () in regex makes split() include the matched parts in the result array
    // Example: "Hello World".split(/(world)/gi) => ["Hello ", "World", ""]
    // NOTE: client code + regex is static
    // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
    const regex = new RegExp(`(${escapedHighlight})`, 'gi')
    const splitParts = text.split(regex)

    return splitParts
        .filter((part) => part.length > 0)
        .map((part) => ({
            text: part,
            isHighlighted: part.toLowerCase() === highlight.toLowerCase(),
        }))
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight }) => {
    const parts = useMemo(() => splitTextByHighlight(text, highlight || ''), [text, highlight])

    return (
        <>
            {parts.map((part, index) => 
                part.isHighlighted ? (
                    <span key={index} className={styles.highlightedText}>
                        {part.text}
                    </span>
                ) : (
                    <span key={index}>{part.text}</span>
                )
            )}
        </>
    )
}