import { useIntl } from '@condo/next/intl'

import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { colors } from '../../../common/constants/style'
import { Typography } from 'antd'

type TicketDetailsFieldProps = {
    ticket: Ticket
}

export const TicketDetailsField: React.FC<TicketDetailsFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const TicketDetailsMessage = intl.formatMessage({ id: 'Problem' })
    return (
        <PageFieldRow title={TicketDetailsMessage} ellipsis>
            <pre style={{ 
                background: `${colors.white}`, 
                border:'none', 
                margin:'0px', 
                padding:'0px', 
                fontFamily:'inherit' }}>
                <Typography.Text style={{ fontSize: '16px' }}>
                    {ticket.details}
                </Typography.Text>
            </pre>
        </PageFieldRow>
    )
}