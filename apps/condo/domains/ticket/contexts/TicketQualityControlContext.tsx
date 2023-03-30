import { Ticket as TicketType } from '@app/condo/schema'
import React, { createContext, useContext } from 'react'

import {
    QualityControlDataType, useTicketQualityControlModal,
    IUseTicketQualityControlModalReturn,
} from '@condo/domains/ticket/hooks/useTicketQualityControlModal'


interface ITicketQualityControlProviderProps { ticket: TicketType, afterUpdate?: (values: QualityControlDataType) => void }

type TicketQualityControlContextType = IUseTicketQualityControlModalReturn

type UseTicketQualityControlType = () => TicketQualityControlContextType


const Context = createContext<TicketQualityControlContextType>(null)

export const useTicketQualityControl: UseTicketQualityControlType = () => useContext(Context)

export const TicketQualityControlProvider: React.FC<ITicketQualityControlProviderProps> = ({ children, ticket, afterUpdate }) => {
    const qualityControl = useTicketQualityControlModal({ ticket, afterUpdate })

    return (
        <Context.Provider value={qualityControl}>
            {children}
        </Context.Provider>
    )
}
