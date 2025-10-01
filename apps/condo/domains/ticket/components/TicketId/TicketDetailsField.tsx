import { Ticket } from '@app/condo/schema'
import omit from 'lodash/omit'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Markdown, Typography, Checkbox } from '@open-condo/ui'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

type TicketDetailsFieldProps = {
    ticket: Ticket
}

const MARKDOWN_COMPONENT_OVERRIDES = {
    p: (props) => <Typography.Paragraph {...omit(props, 'ref')} type='primary' />,
    input: (props) => <Checkbox/>,
}

export const TicketDetailsField: React.FC<TicketDetailsFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const TicketDetailsMessage = intl.formatMessage({ id: 'Problem' })

    return (
        <>
            <PageFieldRow title={TicketDetailsMessage} ellipsis lineWrapping='break-spaces'>
                {ticket?.details}
            </PageFieldRow>
            <PageFieldRow title={TicketDetailsMessage} ellipsis>
                <Markdown components={MARKDOWN_COMPONENT_OVERRIDES}>
                    {ticket?.details}
                </Markdown>
            </PageFieldRow>
        </>
    )
}