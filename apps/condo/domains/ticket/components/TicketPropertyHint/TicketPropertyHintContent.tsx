import { get } from 'lodash'
import xss from 'xss'
import React, { CSSProperties } from 'react'
import { TicketPropertyHint } from '@app/condo/schema'

const TICKET_HINT_CONTENT_STYLES: CSSProperties = { maxHeight: '11em', overflow: 'hidden', wordBreak: 'break-word' }

type TicketPropertyHintContentProps = {
    ticketPropertyHint: TicketPropertyHint,
    style?: CSSProperties
}

export const TicketPropertyHintContent: React.FC<TicketPropertyHintContentProps> = ({ ticketPropertyHint, style = {} }) => (
    <div
        dangerouslySetInnerHTML={{
            __html: xss(get(ticketPropertyHint, 'content')),
        }}
        style={{ ...TICKET_HINT_CONTENT_STYLES, ...style }}
    />
)