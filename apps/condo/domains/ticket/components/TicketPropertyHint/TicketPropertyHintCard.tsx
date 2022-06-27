import { InfoCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Alert, Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'
import React, { CSSProperties, useMemo } from 'react'

import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'

import { TicketPropertyHint, TicketPropertyHintProperty } from '../../utils/clientSchema'
import { TicketPropertyHintContent } from './TicketPropertyHintContent'

const StyledAlert = styled(Alert)`
  background-color: ${colors.successBG};
  border: none;
  
  & svg, & > .ant-alert-content > .ant-alert-message {
   color: ${colors.black}; 
  }
`

const TEXT_STYLES: CSSProperties = { color: colors.black }
const LINK_STYLES: CSSProperties = { ...TEXT_STYLES, position: 'relative', bottom: '-7px', fontSize: fontSizes.content }
const TICKET_HINT_CONTENT_STYLES: CSSProperties = { maxHeight: '5em' }

type TicketPropertyHintCardProps = {
    propertyId: string
    hintContentStyle?: CSSProperties
}

export const TicketPropertyHintCard: React.FC<TicketPropertyHintCardProps> = ({ propertyId, hintContentStyle }) => {
    const intl = useIntl()
    const PropertyHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.propertyHint' })
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

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

    const AlertMessage = <Typography.Text strong style={TEXT_STYLES}>{PropertyHintMessage}</Typography.Text>
    
    return ticketPropertyHintProperty && ticketPropertyHint && (
        <StyledAlert
            message={AlertMessage}
            description={
                <>
                    <TicketPropertyHintContent
                        ticketPropertyHint={ticketPropertyHint}
                        style={hintContentStyle}
                    />
                    <Link href={`/property/${propertyId}/hint`} passHref>
                        <a target={'_blank'}>
                            <Typography.Link underline style={LINK_STYLES}>
                                {ExtraTitleMessage}
                            </Typography.Link>
                        </a>
                    </Link>
                </>
            }
            showIcon
            icon={<InfoCircleOutlined/>}
        />
    )
}