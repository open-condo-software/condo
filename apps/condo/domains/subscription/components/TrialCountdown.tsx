import React from 'react'

import { Clock } from '@open-condo/icons'
import { Typography, Space } from '@open-condo/ui'

const { Text } = Typography

interface TrialCountdownProps {
    /**
     * Days remaining in trial
     */
    daysRemaining: number
}

/**
 * Component to display trial countdown
 */
export const TrialCountdown: React.FC<TrialCountdownProps> = ({ daysRemaining }) => {
    const getColor = () => {
        if (daysRemaining <= 3) return 'danger'
        if (daysRemaining <= 7) return 'warning'
        return 'secondary'
    }

    const getMessage = () => {
        if (daysRemaining === 0) {
            return 'Триал истёк'
        }
        if (daysRemaining === 1) {
            return 'Остался 1 день триала'
        }
        if (daysRemaining <= 4) {
            return `Осталось ${daysRemaining} дня триала`
        }
        return `Осталось ${daysRemaining} дней триала`
    }

    return (
        <Space size={8}>
            <Clock />
            <Text type={getColor()}>{getMessage()}</Text>
        </Space>
    )
}
