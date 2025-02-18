import { Badge } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'

import { Bell } from '@open-condo/icons'
import { colors } from '@open-condo/ui/dist/colors'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import './MessagesCounter.css'


export const MessagesCounter = ({ count }) => {
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
        className: `messages-counter${!isSmallScreen && isAnimating ? ' animating' : ''}`,
        color: colors.pink[5],
        showZero: true,
    }), [currentCount, isAnimating, isSmallScreen])

    if (isSmallScreen) {
        return (
            <div style={{ display: 'flex' }}>
                <Bell
                    className='messages-counter-icon'
                    size='medium'
                />
                {count > 0 && <Badge {...badgeProps} />}
            </div>
        )
    }

    if (count === 0) {
        return  <Bell className='messages-counter-icon' />
    }

    return (
        <Badge {...badgeProps}>
            <Bell className='messages-counter-icon' />
        </Badge>
    )
}
