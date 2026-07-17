import React, { useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import styles from './AIChatThinkingStatus.module.css'

const DOTS_INTERVAL_MS = 400
const MAX_DOTS = 3

/**
 * "Thinking" label with cycling ellipsis while waiting for the first tokens.
 */
export const AIChatThinkingStatus: React.FC = () => {
    const intl = useIntl()
    const label = intl.formatMessage({ id: 'ai.chat.loading' })
    const [dotsCount, setDotsCount] = useState(1)

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDotsCount((prev) => (prev % MAX_DOTS) + 1)
        }, DOTS_INTERVAL_MS)

        return () => clearInterval(intervalId)
    }, [])

    return (
        <div className={styles.thinkingStatus} aria-live='polite'>
            <Typography.Text type='primary'>
                {label}
                <span className={styles.dots} aria-hidden>
                    {'.'.repeat(dotsCount)}
                </span>
            </Typography.Text>
        </div>
    )
}
