import { useGetTicketFilesQuery } from '@app/condo/gql'
import { Ticket } from '@app/condo/schema'
import isEmpty from 'lodash/isEmpty'
import React, { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

import { TicketFileList } from './TicketFileList'

type TicketFileListFieldProps = {
    ticket: Ticket
}

export const TicketFileListField: React.FC<TicketFileListFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const FilesFieldLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Files' })
    const { persistor } = useCachePersistor()

    const {
        data: ticketFilesData,
    } = useGetTicketFilesQuery({
        variables: {
            ticketId: ticket?.id,
        },
        skip: !ticket?.id || !persistor,
    })

    const files = useMemo(() => ticketFilesData?.ticketFiles.filter(Boolean) || [], [ticketFilesData?.ticketFiles])

    return (
        !isEmpty(files) && (
            <PageFieldRow title={FilesFieldLabel} ellipsis>
                <TicketFileList files={files} />
            </PageFieldRow>
        )
    )
}