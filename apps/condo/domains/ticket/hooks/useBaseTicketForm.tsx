import React, { createContext, useContext } from 'react'
import { BaseTicketForm, ITicketFormProps } from '../components/BaseTicketForm'

const BaseTicketFormContext = createContext<React.FC<ITicketFormProps>>(BaseTicketForm)

const useBaseTicketForm = () => useContext(BaseTicketFormContext)

interface BaseTicketFormProviderProps {
    children: React.ReactNode,
    BaseTicketForm: React.FC<ITicketFormProps>,
}

const BaseTicketFormProvider = ({ children, BaseTicketForm }: BaseTicketFormProviderProps) => (
    <BaseTicketFormContext.Provider value={BaseTicketForm}>
        {children}
    </BaseTicketFormContext.Provider>
)

export {
    BaseTicketFormProvider,
    useBaseTicketForm,
}