import React, { useEffect, useState } from 'react'

import { TicketOrganizationSetting } from '@app/condo/schema'
import { TicketOrganizationSetting as TicketSetting } from '@condo/domains/ticket/utils/clientSchema'

type TicketFormContextType = {
    ticketSetting: TicketOrganizationSetting,
    isAutoDetectedDeadlineValue: boolean,
    setIsAutoDetectedDeadlineValue: React.Dispatch<React.SetStateAction<boolean>>,
    ticketSettingLoading: boolean,
    isExistedTicket: boolean
}

export const TicketFormContext = React.createContext<TicketFormContextType>(null)

export const useTicketFormContext = (): TicketFormContextType => React.useContext(TicketFormContext)

export const TicketFormContextProvider = ({ children, organizationId, isExistedTicket }) => {
    const [isAutoDetectedDeadlineValue, setIsAutoDetectedDeadlineValue] = useState<boolean>(true)
    const [ticketSetting, setTicketSetting] = useState<TicketOrganizationSetting | null>(null)

    const { obj: newTicketSetting, loading: ticketSettingLoading } = TicketSetting.useObject({
        where: { organization: { id: organizationId } },
    })

    useEffect(() => {
        if (!newTicketSetting) return
        setTicketSetting(newTicketSetting)
    }, [newTicketSetting])

    return (
        <TicketFormContext.Provider
            value={{
                ticketSetting,
                ticketSettingLoading,
                isAutoDetectedDeadlineValue,
                setIsAutoDetectedDeadlineValue,
                isExistedTicket,
            }}
        >
            {children}
        </TicketFormContext.Provider>
    )
}
