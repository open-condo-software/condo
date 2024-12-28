import { Badge } from 'antd'
import React, { useEffect, useState } from 'react'

import { Bell } from '@open-condo/icons'
import { colors } from '@open-condo/ui/dist/colors'

import './MessagesCounter.css'


export const MessagesCounter = ({ count }) => {
    const [currentCount, setCurrentCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (count && count !== currentCount) {
            setIsAnimating(true)

            setTimeout(() => {
                setCurrentCount(count)
                setIsAnimating(false)
            }, 60)
        }
    }, [count, currentCount])

    return (
        <Badge
            count={currentCount > 9 ? '∞' : currentCount}
            // overflowCount={9}
            className={`messages-counter${isAnimating ? ' animating' : ''}`}
            color={colors.pink[5]}
            showZero
        >
            <Bell className='messages-counter-icon' />
        </Badge>
    )
}
