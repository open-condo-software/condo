import { TicketDocumentGenerationTaskCreateInput, TicketDocumentGenerationTaskFormatType, TicketDocumentGenerationTaskDocumentTypeType }  from '@app/condo/schema'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Dropdown, DropdownProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { SUPPORTED_DOCUMENT_TYPES_BY_LOCALE } from '@condo/domains/ticket/constants/ticketDocument'

import { useTicketDocumentGenerationTaskUIInterface } from './useTicketDocumentGenerationTaskUIInterface'


const isSupportedDocumentTypeByLocale = (documentType: TicketDocumentGenerationTaskDocumentTypeType, locale: string): boolean => {
    const supportedTypes = get(SUPPORTED_DOCUMENT_TYPES_BY_LOCALE, [locale]) || []
    return supportedTypes.includes(documentType)
}

const DROPDOWN_TRIGGER: DropdownProps['trigger'] = ['hover']
const MOBILE_DROPDOWN_TRIGGER: DropdownProps['trigger'] = ['hover', 'click']

type UseTicketDocumentGenerationTaskPropsType = {
    ticketId: string
    userId: string
    timeZone: string
}
type UseTicketDocumentGenerationTaskType = (props: UseTicketDocumentGenerationTaskPropsType) => ({ TicketDocumentGenerationButton: React.FC })
export const useTicketDocumentGenerationTask: UseTicketDocumentGenerationTaskType = ({ ticketId, userId, timeZone }) => {
    const intl = useIntl()
    const CompletionWorksLabel = intl.formatMessage({ id: 'pages.condo.ticket.generateDocument.completionWorks.label' })
    const GenerateDocumentLabel = intl.formatMessage({ id: 'pages.condo.ticket.generateDocument.label' })
    const locale = intl.locale

    const { isMobile } = useLayoutContext()

    const { TicketDocumentGenerationTask: TaskUIInterface } = useTicketDocumentGenerationTaskUIInterface()

    const { loading, handleRunTask } = useTaskLauncher<TicketDocumentGenerationTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        ticket: { connect: { id: ticketId } },
        format: TicketDocumentGenerationTaskFormatType.Docx,
        timeZone,
        user: { connect: { id: userId } },
    })

    const getHandleClick = useCallback((documentType: TicketDocumentGenerationTaskDocumentTypeType) => () => {
        if (loading) return

        handleRunTask({ taskAttrs: { documentType } })
    }, [handleRunTask, loading])

    const buttonItems = useMemo(() => {
        return [
            isSupportedDocumentTypeByLocale(TicketDocumentGenerationTaskDocumentTypeType.CompletionWorks, locale) && {
                label: CompletionWorksLabel,
                key: 'generate-document-of-completion-works',
                onClick: getHandleClick(TicketDocumentGenerationTaskDocumentTypeType.CompletionWorks),
            },
        ].filter(Boolean)
    }, [CompletionWorksLabel, getHandleClick, locale])

    const TicketDocumentGenerationButton = useCallback(() => {
        if (buttonItems.length < 1) return null

        return (
            <Dropdown.Button
                key='generate-ticket-document'
                id='generate-ticket-document'
                type='secondary'
                children={GenerateDocumentLabel}
                items={buttonItems}
                disabled={loading}
                dropdownProps={{
                    trigger: isMobile ? MOBILE_DROPDOWN_TRIGGER : DROPDOWN_TRIGGER,
                    placement: 'top',
                }}
                buttonProps={{ disabled: loading }}
            />
        )
    }, [GenerateDocumentLabel, buttonItems, loading, isMobile])

    return {
        TicketDocumentGenerationButton,
    }
}
