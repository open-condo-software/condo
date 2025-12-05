import { Badge } from 'antd'
import React from 'react'

interface SubscriptionBadgeProps {
    /**
     * Subscription plan type
     */
    type: any
    
    /**
     * Is trial subscription
     */
    isTrial?: boolean
}

/**
 * Badge component to display subscription plan type
 */
export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ type, isTrial }) => {
    const getBadgeConfig = () => {
        if (isTrial) {
            return {
                text: 'Триал',
                color: 'orange',
            }
        }

        switch (type) {
            case 'basic':
                return {
                    text: 'Базовый',
                    color: 'blue',
                }
            case 'extended':
                return {
                    text: 'Расширенный',
                    color: 'green',
                }
            default:
                return {
                    text: type,
                    color: 'default',
                }
        }
    }

    const { text, color } = getBadgeConfig()

    return <Badge color={color} text={text} />
}
