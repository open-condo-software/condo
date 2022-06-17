import xss from 'xss'
import React, { CSSProperties } from 'react'
import { TicketHint } from '@app/condo/schema'

const TICKET_HINT_CONTENT_STYLES: CSSProperties = { maxHeight: '11em', overflow: 'hidden', wordBreak: 'break-word' }

type TicketHintContentProps = {
    ticketHint: TicketHint,
    style?: CSSProperties
}

export const TicketHintContent: React.FC<TicketHintContentProps> = ({ ticketHint, style = {} }) => (
    <div
        dangerouslySetInnerHTML={{
            __html: xss(ticketHint.content),
        }}
        style={{ ...TICKET_HINT_CONTENT_STYLES, ...style }}
    />
)