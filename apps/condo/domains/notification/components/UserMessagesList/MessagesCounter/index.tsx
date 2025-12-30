import { Badge } from 'antd'
import classnames from 'classnames'
import React, { useEffect, useMemo, useState } from 'react'

import { Bell } from '@open-condo/icons'
import { colors } from '@open-condo/ui/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import styles from './MessagesCounter.module.css'


type MessagesCounterProps = {
    count: number
    disabled?: boolean
}

export const MessagesCounter: React.FC<MessagesCounterProps> = ({ count, disabled }) => {
    const [currentCount, setCurrentCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    const { breakpoints } = useLayoutContext()
    const isSmallScreen = useMemo(() => !breakpoints.TABLET_LARGE, [breakpoints.TABLET_LARGE])

    useEffect(() => {
        if (count === currentCount) {
            return
        }

        // NOTE: reset counter without animation
        if (count === 0) {
            setCurrentCount(count)
        }

        if (count > 0) {
            setIsAnimating(true)

            setTimeout(() => {
                setCurrentCount(count)
                setIsAnimating(false)
            }, 60)
        }
    }, [count, currentCount])

    const badgeProps = useMemo(() => ({
        count: currentCount > 9 ? '∞' : currentCount,
        className: classnames(styles.messagesCounter, {
            [styles.animating]: !isSmallScreen && isAnimating,
        }),
        color: colors.pink[5],
    }), [currentCount, isAnimating, isSmallScreen])

    if (disabled) {
        return (
            <div style={{ display: 'flex' }}>
                <Bell className={styles.disabled} />
            </div>
        )
    }

    if (isSmallScreen) {
        return (
            <div style={{ display: 'flex' }}>
                <Bell
                    className={styles.messagesCounterIcon}
                    size='medium'
                />
                <Badge {...badgeProps} style={{ display: count > 0 ? 'initial' : 'none' }} />
            </div>
        )
    }

    return (
        <Badge {...badgeProps}>
            <Bell className={styles.messagesCounterIcon} />
        </Badge>
    )
}
