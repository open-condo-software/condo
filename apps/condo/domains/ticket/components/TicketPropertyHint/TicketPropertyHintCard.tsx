import styled from '@emotion/styled'
import { Col, ColProps, Typography } from 'antd'
import { get } from 'lodash'
import React, { CSSProperties, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { TicketPropertyHint, TicketPropertyHintProperty } from '@condo/domains/ticket/utils/clientSchema'

import { TicketPropertyHintContent } from './TicketPropertyHintContent'

const StyledAlert = styled(Alert)`
   background-color: ${colors.green[1]} !important;
  
   .condo-alert-description > div {
     overflow: hidden;
     position: relative;
   }
  
  & svg {
    color: ${colors.green[5]} !important;
  }
`

type TicketPropertyHintCardProps = {
    propertyId: string
    hintContentStyle?: CSSProperties
    colProps?: ColProps
}

export const TicketPropertyHintCard: React.FC<TicketPropertyHintCardProps> = ({ propertyId, hintContentStyle, colProps }) => {
    const intl = useIntl()
    const PropertyHintMessage = intl.formatMessage({ id: 'settings.hint.ticketPropertyHint' })

    const { obj: ticketPropertyHintProperty } = TicketPropertyHintProperty.useObject({
        where: {
            property: { id: propertyId },
        },
    })
    const ticketPropertyHintId = useMemo(() => get(ticketPropertyHintProperty, ['ticketPropertyHint', 'id'], null), [ticketPropertyHintProperty])

    const { obj: ticketPropertyHint } = TicketPropertyHint.useObject({
        where: {
            id: ticketPropertyHintId,
        },
    })

    const htmlContent = useMemo(() => get(ticketPropertyHint, 'content'), [ticketPropertyHint])

    const Hint = useMemo(() => (
        <StyledAlert
            message={<Typography.Text strong>{PropertyHintMessage}</Typography.Text>}
            description={
                <TicketPropertyHintContent
                    html={htmlContent}
                    style={hintContentStyle}
                    linkToHint={`/property/${propertyId}/hint`}
                />
            }
            showIcon
            type='info'
        />
    ), [PropertyHintMessage, hintContentStyle, htmlContent, propertyId])

    if (!ticketPropertyHintProperty || !ticketPropertyHint) {
        return null
    }
    
    return colProps ? (<Col {...colProps}>{Hint}</Col>) : Hint
}