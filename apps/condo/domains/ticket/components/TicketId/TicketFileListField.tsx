import React from 'react'
import { isEmpty } from 'lodash'

import { useIntl } from '@core/next/intl'
import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { TicketFile } from '@condo/domains/ticket/utils/clientSchema'

import { TicketFileList } from './TicketFileList'

type TicketFileListFieldProps = {
    ticket: Ticket
}

export const TicketFileListField: React.FC<TicketFileListFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const FilesFieldLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Files' })

    const { objs: files } = TicketFile.useObjects({
        where: { ticket: { id: ticket ? ticket.id : null } },
    }, {
        fetchPolicy: 'network-only',
    })

    return (
        !isEmpty(files) && (
            <PageFieldRow title={FilesFieldLabel} ellipsis>
                <TicketFileList files={files} />
            </PageFieldRow>
        )
    )
}