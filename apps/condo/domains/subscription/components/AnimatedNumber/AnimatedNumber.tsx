import React, { useMemo } from 'react'

import styles from './AnimatedNumber.module.css'


const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

type AnimatedNumberProps = {
    value: number
}

/**
 * Rolls each digit to its new position the way a meter or an iOS clock does.
 * This is not decoration: switching between plan cards is meant to be read off these numbers,
 * so the change has to catch the eye rather than silently replace itself.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value }) => {
    const digits = useMemo(() => String(Math.max(0, Math.round(value || 0))).split(''), [value])

    return (
        <span className={styles.number}>
            {/* the readable value for screen readers, the reels below are purely visual */}
            <span className={styles.srOnly}>{digits.join('')}</span>
            {digits.map((digit, index) => (
                <span
                    // keyed from the right so the ones place keeps its reel when the number grows
                    key={`digit-${digits.length - 1 - index}`}
                    className={styles.digit}
                    aria-hidden='true'
                >
                    <span
                        className={styles.reel}
                        style={{ transform: `translateY(-${Number(digit) * 10}%)` }}
                    >
                        {DIGITS.map(reelDigit => (
                            <span key={reelDigit} className={styles.cell}>{reelDigit}</span>
                        ))}
                    </span>
                </span>
            ))}
        </span>
    )
}

/**
 * Translated strings keep the number inside the sentence, so the sentence is split around
 * the first occurrence of the value and only that part is handed to the reels.
 */
export const withAnimatedNumber = (text: string, value: number): React.ReactNode => {
    const printed = String(Math.max(0, Math.round(value || 0)))
    const at = text.indexOf(printed)
    if (at < 0) return text

    return (
        <>
            {text.slice(0, at)}
            <AnimatedNumber value={value} />
            {text.slice(at + printed.length)}
        </>
    )
}
