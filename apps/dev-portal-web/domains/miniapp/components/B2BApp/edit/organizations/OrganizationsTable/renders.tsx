import { Flex } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { Check, Trash, Close } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Button, Typography, Modal } from '@open-condo/ui'

import { HighlightedText } from '@/domains/common/components/HighlightedText'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useSearch } from '@/domains/common/hooks/useSearch'

import styles from './renders.module.css'

import {
    AllB2BAppContextsQuery,
    AppEnvironment,
    B2BAppContextAction,
    B2BAppContextStatus,
    useUpdateB2BAppContextMutation,
    useGetB2BAppQuery,
} from '@/gql'

type ContextType = NonNullable<AllB2BAppContextsQuery['contexts']>['objs'][number]
type OrganizationType = ContextType['organization']

const ELLIPSIS_ROWS = { rows: 2 }

const StatusCell: React.FC<{ status: B2BAppContextStatus }> = ({ status }) => {
    const intl = useIntl()
    const StatusTitle = intl.formatMessage({ id: `pages.apps.b2b.id.sections.organizations.table.columns.status.options.${status}.title` })

    const textType = useMemo(() => {
        if (status === B2BAppContextStatus.Finished) {
            return 'success'
        } else if (status === B2BAppContextStatus.InProgress) {
            return 'warning'
        }

        return 'danger'
    }, [status])

    return (
        <Typography.Text type={textType} size='medium'>{StatusTitle}</Typography.Text>
    )
}

const OrganizationCell: React.FC<{ organization: OrganizationType }> = ({ organization }) => {
    const intl = useIntl()
    const TINLabel = intl.formatMessage({ id: 'global.terms.tin' })

    const { name, tin } = organization
    const [search] = useSearch()

    return (
        <div className={styles.organizationCellContainer}>
            {name && (
                <Typography.Paragraph size='medium' ellipsis={ELLIPSIS_ROWS}>
                    <HighlightedText text={name} highlight={search}/>
                </Typography.Paragraph>
            )}
            {tin && (
                <Typography.Paragraph type='secondary' size='small' ellipsis={ELLIPSIS_ROWS}>
                    {TINLabel}: <HighlightedText text={tin} highlight={search}/>
                </Typography.Paragraph>
            )}
        </div>
    )
}

type ActionCellProps = {
    context: ContextType
    environment: AppEnvironment
    appId: string
    refetch: () => Promise<unknown>
}

const ActionsCell: React.FC<ActionCellProps> = ({ context, environment, appId, refetch }) => {
    const intl = useIntl()

    const isNotConnected = context.status === B2BAppContextStatus.InProgress
    const modalActionType = isNotConnected ? 'reject' : 'delete'

    const { data } = useGetB2BAppQuery({
        variables: {
            id: appId,
        },
    })

    const ModalTitle = intl.formatMessage({ id: `pages.apps.b2b.id.sections.organizations.table.columns.actions.deletionModal.${modalActionType}.title` })
    const ModalDescription = intl.formatMessage({ id: `pages.apps.b2b.id.sections.organizations.table.columns.actions.deletionModal.${modalActionType}.description` }, {
        organizationName: String(context.organization.name),
        appName: String(data?.app?.name),
    })
    const ModalContinueActionLabel = intl.formatMessage({ id: `pages.apps.b2b.id.sections.organizations.table.columns.actions.deletionModal.${modalActionType}.actions.continue` })
    const ModalCancelActionLabel = intl.formatMessage({ id: `pages.apps.b2b.id.sections.organizations.table.columns.actions.deletionModal.${modalActionType}.actions.cancel` })



    const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false)

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback(() => {
        void refetch()
    }, [refetch])
    const [updateContextMutation] = useUpdateB2BAppContextMutation({
        onError,
        onCompleted,
    })

    const handleAccept = useCallback(() => {
        void updateContextMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    environment,
                    id: context.id,
                    action: B2BAppContextAction.Connect,
                },
            },
        })
    }, [context.id, environment, updateContextMutation])

    const handleConfirmDeletion = useCallback(() => {
        updateContextMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    environment,
                    id: context.id,
                    action: B2BAppContextAction.Disconnect,
                },
            },
        }).then(() => {
            setIsDeletionModalOpen(false)
        })
    }, [context.id, environment, updateContextMutation])

    const handleDelete = useCallback(() => {
        setIsDeletionModalOpen(true)
    }, [])

    const DeletionIcon = isNotConnected ? Close : Trash

    const handleCancelDeletion = useCallback(() => {
        setIsDeletionModalOpen(false)
    }, [])

    return (
        <>
            <Flex align='center' justify='flex-end'>
                {isNotConnected && (
                    <>
                        <Button type='primary' size='medium' minimal icon={<Check size='small'/>} onClick={handleAccept}/>
                        <div className={styles.divider}/>
                    </>
                )}
                <Button type='primary' size='medium' minimal danger icon={<DeletionIcon size='small'/>} onClick={handleDelete}/>
            </Flex>
            {isDeletionModalOpen && (
                <Modal
                    title={ModalTitle}
                    open={isDeletionModalOpen}
                    onCancel={handleCancelDeletion}
                    footer={[
                        <Button
                            key='cancel'
                            onClick={handleCancelDeletion}
                            type='secondary'
                        >

                            {ModalCancelActionLabel}
                        </Button>,
                        <Button
                            key='continue'
                            type='secondary'
                            danger
                            onClick={handleConfirmDeletion}
                        >
                            {ModalContinueActionLabel}
                        </Button>,
                    ]}
                >
                    <Typography.Paragraph>{ModalDescription}</Typography.Paragraph>
                </Modal>
            )}
        </>
    )
}

export function statusRender (status: B2BAppContextStatus) {
    return <StatusCell status={status}/>
}

export function organizationRender (organization: OrganizationType) {
    return <OrganizationCell organization={organization}/>
}

export function getActionsRender (appId: string, environment: AppEnvironment, refetch: () => Promise<unknown>) {
    return function actionsRender (context: ContextType) {
        return <ActionsCell context={context} appId={appId} environment={environment} refetch={refetch}/>
    }
}

