import { InfoCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Alert, Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'

import { colors, fontSizes } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import { CSSProperties, useMemo } from 'react'

import { TicketHint, TicketHintProperty } from '../../utils/clientSchema'
import { TicketHintContent } from './TicketHintContent'

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

export const TicketIdHintCard = ({ propertyId }) => {
    const intl = useIntl()
    const PropertyHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.propertyHint' })
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const { obj: ticketHintProperty } = TicketHintProperty.useObject({
        where: {
            property: { id: propertyId },
        },
    })
    const ticketHintId = useMemo(() => get(ticketHintProperty, ['ticketHint', 'id'], null), [ticketHintProperty])

    const { obj: ticketHint } = TicketHint.useObject({
        where: {
            id: ticketHintId,
        },
    })

    const AlertMessage = <Typography.Text style={TEXT_STYLES}>{PropertyHintMessage}</Typography.Text>
    
    return ticketHintProperty && ticketHint && (
        <StyledAlert
            message={AlertMessage}
            description={
                <>
                    <TicketHintContent ticketHint={ticketHint} style={TICKET_HINT_CONTENT_STYLES} />
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