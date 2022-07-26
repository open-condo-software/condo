import { useCallback, useMemo } from 'react'
import { Breadcrumb, Typography } from 'antd'
import { BaseType } from 'antd/lib/typography/Base'
import { compact, get } from 'lodash'

import { useIntl } from '@core/next/intl'
import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

const CLASSIFIER_VALUE_STYLE = { fontSize: '16px' }

type TicketClassifierFieldProps = {
    ticket: Ticket
}

export const TicketClassifierField: React.FC<TicketClassifierFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const ClassifierMessage = intl.formatMessage({ id: 'Classifier' })

    const ticketClassifierNames = useMemo(() => compact([
        get(ticket, ['classifierRule', 'place', 'name']),
        get(ticket, ['classifierRule', 'category', 'name']),
        get(ticket, ['classifierRule', 'problem', 'name']),
    ]), [ticket])

    const getClassifierTextType = useCallback(
        (index: number): BaseType => index !== ticketClassifierNames.length - 1 ? null : 'secondary',
        [ticketClassifierNames.length])

    return (
        <PageFieldRow title={ClassifierMessage} ellipsis>
            <Breadcrumb separator="»">
                {
                    ticketClassifierNames.map((name, index) => {
                        return (
                            <Breadcrumb.Item key={name}>
                                <Typography.Text
                                    style={CLASSIFIER_VALUE_STYLE}
                                    strong
                                    type={getClassifierTextType(index)}
                                >
                                    {name}
                                </Typography.Text>
                            </Breadcrumb.Item>
                        )
                    })
                }
            </Breadcrumb>
        </PageFieldRow>
    )
}