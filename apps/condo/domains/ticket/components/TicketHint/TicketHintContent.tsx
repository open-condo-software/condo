import xss from 'xss'
import React, { CSSProperties } from 'react'

const TICKET_HINT_CONTENT_STYLES: CSSProperties = { maxHeight: '100px', overflow: 'hidden', wordBreak: 'break-word' }

export const TicketHintContent = ({ ticketHint }) => (
    <div
        dangerouslySetInnerHTML={{
            __html: xss(ticketHint.content),
        }}
        style={TICKET_HINT_CONTENT_STYLES}
    />
)