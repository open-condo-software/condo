import { InfoCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Alert, Typography } from 'antd'
import Link from 'next/link'

import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import { CSSProperties } from 'react'

import { TicketHint } from '../../utils/clientSchema'
import { TicketHintContent } from './TicketHintContent'

const StyledAlert = styled(Alert)`
  background-color: ${colors.successBG};
  border: none;
  
  & svg, & > .ant-alert-content > .ant-alert-message {
   color: ${colors.black}; 
  }
`

const TEXT_STYLES: CSSProperties = { color: colors.black }

export const TicketIdHint = ({ propertyId }) => {
    const intl = useIntl()
    const PropertyHintMessage = intl.formatMessage({ id: 'pages.condo.settings.hint.propertyHint' })
    const ExtraTitleMessage = intl.formatMessage({ id: 'component.statscard.ExtraTitle' })

    const { obj: ticketHint } = TicketHint.useObject({
        where: {
            properties_some: { id: propertyId },
        },
    })

    const AlertMessage = <Typography.Text style={TEXT_STYLES}>{PropertyHintMessage}</Typography.Text>
    
    return ticketHint && (
        <StyledAlert
            message={AlertMessage}
            description={
                <>
                    <TicketHintContent ticketHint={ticketHint} />
                    <Link href={`/property/${propertyId}/hint`} passHref>
                        <a target={'_blank'}>
                            <Typography.Link underline style={TEXT_STYLES}>
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