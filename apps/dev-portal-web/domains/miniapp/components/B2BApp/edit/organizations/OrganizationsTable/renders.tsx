import { Flex } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Trash, Check } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Typography, Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'

import styles from './renders.module.css'

import { useUpdateB2BAppContextMutation } from '@/gql'
import { B2BAppContextStatus, AllB2BAppContextsQuery, AppEnvironment } from '@/gql'

type ContextType = NonNullable<AllB2BAppContextsQuery['contexts']>['objs'][number]
type OrganizationType = ContextType['organization']

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

    return (
        <Flex vertical>
            <Typography.Text size='medium'>{name}</Typography.Text>
            <Typography.Text type='secondary' size='small'>{TINLabel}: {tin}</Typography.Text>
        </Flex>
    )
}

const ActionsCell: React.FC<{ context: ContextType, appId: string, environment: AppEnvironment }> = ({ context, appId, environment }) => {
    const shouldShowAcceptButton = context.status === B2BAppContextStatus.InProgress

    const onError = useMutationErrorHandler()
    const [updateContextMutation] = useUpdateB2BAppContextMutation({
        onError,
    })

    const handleAccept = useCallback(() => {
        updateContextMutation({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    environment,
                    app: { id: appId },
                    organization: { id: context.organization.id },
                    status: B2BAppContextStatus.Finished,
                },
            },
        })
    }, [updateContextMutation])

    return (
        <Flex align='center' justify='flex-end'>
            {shouldShowAcceptButton && (
                <>
                    <Button type='primary' size='medium' minimal icon={<Check size='small'/>}/>
                    <div className={styles.divider}/>
                </>
            )}
            <Button type='primary' size='medium' minimal danger icon={<Trash size='small'/>}/>
        </Flex>
    )
}

export function statusRender (status: B2BAppContextStatus) {
    return <StatusCell status={status}/>
}

export function organizationRender (organization: OrganizationType) {
    return <OrganizationCell organization={organization}/>
}

export function actionsRender (context: ContextType) {
    return <ActionsCell context={context}/>
}

