import { TicketSourceTypeType, TicketSourceWhereInput } from '@app/condo/schema'

export const VISIBLE_TICKET_SOURCE_TYPES: TicketSourceWhereInput['type_in'] = [
    TicketSourceTypeType.Call,
    TicketSourceTypeType.MobileApp,
    TicketSourceTypeType.RemoteSystem,
    TicketSourceTypeType.Visit,
    TicketSourceTypeType.Email,
    TicketSourceTypeType.CrmImport,
    TicketSourceTypeType.WebApp,
    TicketSourceTypeType.MobileAppStaff,
    TicketSourceTypeType.Messenger,
    TicketSourceTypeType.Domclick,
]

export const VISIBLE_TICKET_SOURCE_TYPES_IN_TICKET_FORM: TicketSourceWhereInput['type_in'] = [
    ...VISIBLE_TICKET_SOURCE_TYPES,
]
