import React, { createContext, useContext } from 'react'

import {
    QualityControlDataType, useTicketQualityControlModal,
    IUseTicketQualityControlModalReturn,
} from '@condo/domains/ticket/hooks/useTicketQualityControlModal'


interface ITicketQualityControlProviderProps { ticketId: string, afterUpdate?: (values: QualityControlDataType) => void }

type TicketQualityControlContextType = IUseTicketQualityControlModalReturn

type UseTicketQualityControlType = () => TicketQualityControlContextType


const Context = createContext<TicketQualityControlContextType>(null)

export const useTicketQualityControl: UseTicketQualityControlType = () => useContext(Context)

export const TicketQualityControlProvider: React.FC<React.PropsWithChildren<ITicketQualityControlProviderProps>> = ({ children, ticketId, afterUpdate }) => {
    const qualityControl = useTicketQualityControlModal({ ticketId, afterUpdate })

    return (
        <Context.Provider value={qualityControl}>
            {children}
        </Context.Provider>
    )
}
