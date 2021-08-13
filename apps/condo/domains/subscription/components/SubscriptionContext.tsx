import React, { useContext, useMemo, useState } from 'react'
import { SberIcon } from '../../common/components/icons/SberIcon'
import { useApplySubscriptionModal } from '../hooks/useSubscriptionModal'

type TrialOption = {
    amount: number,
    currency: string,
    description: string | React.ReactElement
    active?: boolean
}

interface ISubscriptionContext {
    daysRemaining?: number
    isSubscriptionActive?: boolean
    activateSubscription?: () => void
    options?: Array<TrialOption>
}

const SubscriptionContext = React.createContext<ISubscriptionContext>({})

export const useSubscriptionContext = () => useContext<ISubscriptionContext>(SubscriptionContext)

export const SubscriptionContextProvider: React.FC = (props) => {
    const [isActive, setIsActive] = useState(false)
    const daysRemaining = 14
    const { setVisible: showApplySubscription, SubscriptionModal } = useApplySubscriptionModal()

    const subscriptionOptions = useMemo(() => {
        return (
            [
                {
                    amount: 0,
                    description: <><span>Если ваш расчетный счет в</span>&nbsp;{<SberIcon/>}</>,
                    currency: '₽',
                    active: true,
                },
                {
                    amount: 3.5,
                    description: 'за 1 лицевой счет, если ваш расчетный счет\n в другом банке',
                    currency: '₽',
                },
            ]
        )
    }, [])

    const activateSubscription = () => setIsActive(true)

    return (
        <SubscriptionContext.Provider value={{
            isSubscriptionActive: isActive,
            options: subscriptionOptions,
            activateSubscription,
            daysRemaining,
        }}>
            {props.children}
        </SubscriptionContext.Provider>
    )
}

