import { Badge } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'

import { Bell } from '@open-condo/icons'
import { colors } from '@open-condo/ui/dist/colors'

import './MessagesCounter.css'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'


export const MessagesCounter = ({ count }) => {
    const [currentCount, setCurrentCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    const { breakpoints } = useLayoutContext()

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
        className: `messages-counter${isAnimating ? ' animating' : ''}`,
        color: colors.pink[5],
        showZero: true,
    }), [currentCount, isAnimating])

    return !breakpoints.TABLET_LARGE ? (
        <div style={{ display: 'flex' }}>
            <Bell
                className='messages-counter-icon'
                size='medium'
            />
            <Badge {...badgeProps} />
        </div>
    ) : (
        <Badge {...badgeProps}>
            <Bell className='messages-counter-icon' />
        </Badge>
    )
}
