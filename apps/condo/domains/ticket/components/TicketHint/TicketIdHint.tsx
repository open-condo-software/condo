import { InfoCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Alert, Typography } from 'antd'
import Link from 'next/link'
import { TicketHint } from '../../utils/clientSchema'
import { TicketHintContent } from './TicketHintContent'
import { colors } from '@condo/domains/common/constants/style'

const StyledAlert = styled(Alert)`
  background-color: #EBFAEF;
  border: none;
  
  & svg, & > .ant-alert-content > .ant-alert-message {
   color: black; 
  }
`

export const TicketIdHint = ({ propertyId }) => {
    const { obj: ticketHint } = TicketHint.useObject({
        where: {
            properties_some: { id: propertyId },
        },
    })

    const AlertMessage = <Typography.Text style={{ color: colors.successBG }}>Справка по дому</Typography.Text>
    
    return ticketHint && (
        <StyledAlert
            message={AlertMessage}
            description={
                <>
                    <TicketHintContent ticketHint={ticketHint} />
                    <Link href={`/property/${propertyId}/hint`} passHref>
                        <a target={'_blank'}>
                            <Typography.Link underline style={{ color: 'black' }}>
                                Подробнее
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