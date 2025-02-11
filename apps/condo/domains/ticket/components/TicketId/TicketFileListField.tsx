import { useGetTicketFilesQuery } from '@app/condo/gql'
import { SortTicketFilesBy, Ticket } from '@app/condo/schema'
import { isEmpty } from 'lodash'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { TicketFile } from '@condo/domains/ticket/utils/clientSchema'

import { TicketFileList } from './TicketFileList'

type TicketFileListFieldProps = {
    ticket: Ticket
}

export const TicketFileListField: React.FC<TicketFileListFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const FilesFieldLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Files' })

    // const { objs: files } = TicketFile.useObjects({
    //     where: { ticket: { id: ticket ? ticket.id : null } },
    //     sortBy: [SortTicketFilesBy.CreatedAtAsc],
    // }, {
    //     fetchPolicy: 'network-only',
    // })
    // Почему только network-only? В кэше не могут это храниться?
    const {
        data,
    } = useGetTicketFilesQuery({
        variables: {
            where: { ticket: { id: ticket?.id || null } },
            sortBy: [SortTicketFilesBy.CreatedAtAsc],
            first: 100,
        },
        skip: !ticket?.id,
        fetchPolicy: 'network-only',
    })
    console.log('data', data)
    const files = useMemo(() => data?.ticketFiles.filter(Boolean) || [], [data?.ticketFiles])
    console.log('files', files)
    console.log('isEmpty', isEmpty(files))
    return (
        !isEmpty(files) && (
            <PageFieldRow title={FilesFieldLabel} ellipsis>
                <TicketFileList files={files} />
            </PageFieldRow>
        )
    )
}