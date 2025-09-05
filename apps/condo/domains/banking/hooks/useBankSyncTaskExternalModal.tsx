import { BankSyncTaskCreateInput }  from '@app/condo/schema'
import isNull from 'lodash/isNull'
import React, { useCallback, useState, useMemo, useEffect } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Modal, Button, Typography, Space, Alert } from '@open-condo/ui'

import { SBBOL } from '@condo/domains/banking/constants'
import { useBankSyncTaskUIInterface } from '@condo/domains/banking/hooks/useBankSyncTaskUIInterface'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { useTaskLauncher } from '@condo/domains/common/components/tasks/TaskLauncher'

import type { BankAccount } from '@app/condo/schema'


const BANK_SYNC_TASK_DATE_FORMAT = 'YYYY-MM-DD'

interface IUseBankSyncTaskExternalModal {
    ({ propertyId, bankAccount }: { propertyId: string, bankAccount: BankAccount }): ({
        ModalComponent: React.ReactElement
        handleOpen: () => void
    })
}

export const useBankSyncTaskExternalModal: IUseBankSyncTaskExternalModal = (props) => {
    const intl = useIntl()
    const SyncSbbolTransactions = intl.formatMessage({ id: 'pages.banking.report.sbbolSyncTitle' })
    const SyncSbbolModalTitle = intl.formatMessage({ id: 'pages.banking.report.sbbolSyncModal.title' })
    const SyncSbbolModalDescription = intl.formatMessage({ id: 'pages.banking.report.sbbolSyncModal.description' })
    const SyncSbbolModalHintTitle = intl.formatMessage({ id: 'pages.banking.report.sbbolSyncModalHint.title' })
    const SyncSbbolModalHintDescription = intl.formatMessage({ id: 'pages.banking.report.sbbolSyncModalHint.description' })

    const [open, setOpen] = useState(false)
    const [dateRange, setDateRange] = useState(null)

    const { user } = useAuth()
    const { BankSyncTask: TaskUIInterface } = useBankSyncTaskUIInterface()
    const { handleRunTask, loading } = useTaskLauncher<BankSyncTaskCreateInput>(TaskUIInterface, {
        dv: 1,
        sender: getClientSideSenderInfo(),
        user: { connect: { id: user?.id } },
        property: { connect: { id: props.propertyId } },
        account: { connect: { id: props?.bankAccount?.id } },
        organization: { connect: { id: props?.bankAccount?.organization?.id } },
        integrationContext: { connect: { id: props?.bankAccount?.integrationContext?.id } },
        options: {
            type: SBBOL,
            dateFrom: isNull(dateRange) ? null : dateRange[0].format(BANK_SYNC_TASK_DATE_FORMAT),
            dateTo: isNull(dateRange) ? null : dateRange[1].format(BANK_SYNC_TASK_DATE_FORMAT),
        },
    })

    const handleCancel = useCallback(() => {
        if (!isNull(dateRange)) setDateRange(null)

        setOpen(false)
    }, [dateRange])
    const handleOpen = useCallback(() => setOpen(true), [])
    const handleClick = useCallback(() => handleRunTask(), [handleRunTask])
    const modalFooter = useMemo(() => (
        <Button
            type='primary'
            onClick={handleClick}
            loading={loading}
            disabled={isNull(dateRange)}
        >
            {SyncSbbolTransactions}
        </Button>
    ), [SyncSbbolTransactions, dateRange, handleClick, loading])

    useEffect(() => {
        if (loading) {
            setOpen(false)
            setDateRange(null)
        }
    }, [loading])

    const ModalComponent = useMemo(() => {
        return (
            <Modal open={open} title={SyncSbbolModalTitle} footer={modalFooter} onCancel={handleCancel}>
                <Space direction='vertical' size={40}>
                    <Space direction='vertical' size={24}>
                        <Typography.Text>{SyncSbbolModalDescription}</Typography.Text>
                        <DateRangePicker value={dateRange} onChange={setDateRange} format='DD.MM.YYYY' />
                    </Space>
                    <Alert
                        showIcon
                        type='warning'
                        message={SyncSbbolModalHintTitle}
                        description={SyncSbbolModalHintDescription}
                    />
                </Space>
            </Modal>
        )}, [open, SyncSbbolModalTitle, handleCancel, modalFooter, SyncSbbolModalDescription,
        dateRange, SyncSbbolModalHintTitle, SyncSbbolModalHintDescription])

    return {
        ModalComponent,
        handleOpen,
    }
}
