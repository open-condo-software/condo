import React from 'react'

import { TicketOrganizationSetting } from '@app/condo/schema'

type TicketSettingContextType = { ticketSetting: TicketOrganizationSetting }

export const TicketSettingContext = React.createContext<TicketSettingContextType>(null)

export const useTicketSettingContext = (): TicketSettingContextType => React.useContext(TicketSettingContext)
