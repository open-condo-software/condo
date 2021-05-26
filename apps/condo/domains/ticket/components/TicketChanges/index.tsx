import React from 'react'
import { TicketChange as TicketChangeSchema } from '../../utils/clientSchema'
import { TicketChange } from './TicketChange'

interface ITicketChangesProps {
    ticketId: string
}

export const TicketChanges: React.FC<ITicketChangesProps> = ({ ticketId }) => {
    // TODO(antonal): get rid of separate GraphQL query for TicketChanges
    const { objs, error } = TicketChangeSchema.useObjects({ where: { ticket: { id: ticketId } } })
    return (
        <div>
            {!error && objs && (
                objs.map(ticketChange => (
                    <TicketChange
                        key={ticketChange.id}
                        ticketChange={ticketChange}
                    />
                ))
            )}
        </div>
    )
}
