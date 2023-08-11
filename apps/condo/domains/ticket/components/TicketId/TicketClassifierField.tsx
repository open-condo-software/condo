import { Ticket } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Breadcrumb, Typography } from 'antd'
import { BaseType } from 'antd/lib/typography/Base'
import compact from 'lodash/compact'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

const CLASSIFIER_VALUE_STYLE = { fontSize: '16px' }

const StyledBreadcrumb = styled(Breadcrumb)`
    ol {
      list-style-type: none;
      
      li {
        margin: 0;
        padding: 0;
      }
    }
`

type TicketClassifierFieldProps = {
    ticket: Ticket
}

export const TicketClassifierField: React.FC<TicketClassifierFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const ClassifierMessage = intl.formatMessage({ id: 'classifier' })

    const ticketClassifierNames = useMemo(() => compact([
        get(ticket, ['classifier', 'place', 'name']),
        get(ticket, ['classifier', 'category', 'name']),
        get(ticket, ['classifier', 'problem', 'name']),
    ]), [ticket])

    const getClassifierTextType = useCallback(
        (index: number): BaseType => index !== ticketClassifierNames.length - 1 ? null : 'secondary',
        [ticketClassifierNames.length])

    return (
        <PageFieldRow title={ClassifierMessage} ellipsis>
            <StyledBreadcrumb separator='»'>
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
            </StyledBreadcrumb>
        </PageFieldRow>
    )
}