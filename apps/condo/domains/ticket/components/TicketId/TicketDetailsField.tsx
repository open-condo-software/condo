import { Ticket } from '@app/condo/schema'
import omit from 'lodash/omit'
import React, {useState} from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Markdown, Typography } from '@open-condo/ui'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

type TicketDetailsFieldProps = {
    ticket: Ticket
}

const MARKDOWN_COMPONENT_OVERRIDES = {
    p: (props) => <Typography.Paragraph {...omit(props, 'ref')} type='primary' />,
    h1: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
    h2: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
    h3: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
}

export const TicketDetailsField: React.FC<TicketDetailsFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const TicketDetailsMessage = intl.formatMessage({ id: 'Problem' })

    const [markdownState, setMarkdownState] = useState(ticket?.details)

    return (
        <>
            <PageFieldRow title={TicketDetailsMessage} ellipsis lineWrapping='break-spaces'>
                {ticket?.details}
            </PageFieldRow>
            <PageFieldRow title={TicketDetailsMessage} ellipsis>
                <Markdown onCheckboxChange = {setMarkdownState} components={MARKDOWN_COMPONENT_OVERRIDES}>
                    {markdownState}
                </Markdown>
            </PageFieldRow>
        </>
    )
}