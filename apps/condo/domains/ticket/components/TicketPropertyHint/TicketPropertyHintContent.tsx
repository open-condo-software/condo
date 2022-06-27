import { get } from 'lodash'
import xss from 'xss'
import React, { CSSProperties } from 'react'
import styled from '@emotion/styled'

import { TicketPropertyHint } from '@app/condo/schema'

import { colors } from '@condo/domains/common/constants/style'

export const StyledTicketPropertyHintContent = styled.div`
  overflow: hidden;
  word-break: break-word;
  
  a {
    color: ${colors.black};
    text-decoration: underline;
  }
`

type TicketPropertyHintContentProps = {
    ticketPropertyHint: TicketPropertyHint,
    style?: CSSProperties
}

export const TicketPropertyHintContent: React.FC<TicketPropertyHintContentProps> = ({ ticketPropertyHint, style = {} }) => (
    <StyledTicketPropertyHintContent
        dangerouslySetInnerHTML={{
            __html: xss(get(ticketPropertyHint, 'content')),
        }}
        style={style}
    />
)