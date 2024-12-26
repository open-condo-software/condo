import React, { useEffect, useState } from 'react'

import './NotificationCounter.css'
import { Bell } from '@open-condo/icons'


export const NotificationCounter = ({ count }) => {
    const [currentCount, setCurrentCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (count !== currentCount) {
            setIsAnimating(true)

            setTimeout(() => {
                setCurrentCount(count)
                setIsAnimating(false)
            }, 60)
        }
    }, [count, currentCount])

    return (
        <div className='notification-counter-container'>
            <div className={`notification-counter-bell ${isAnimating ? 'shake' : ''}`}>
                <Bell />
            </div>
            <div className={`notification-counter-badge ${isAnimating ? 'scale' : ''}`}>
                <span className={`notification-counter-badge-text ${isAnimating ? 'hidden' : ''}`}>
                    {currentCount > 9 ? '∞' : currentCount}
                </span>
            </div>
        </div>
    )
}
