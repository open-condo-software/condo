import { Col, Collapse, Divider, notification, Row, Table } from 'antd'
import isEqual from 'lodash/isEqual'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { ChevronDown, ChevronUp, QuestionCircle, ArrowDownUp } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { Alert, Button, Checkbox, Modal, Space, Tooltip, Typography } from '@open-condo/ui'

import { Spin } from '@/domains/common/components/Spin'
import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { GROUPED_PERMISSIONS } from '@/domains/miniapp/constants/b2bAppAccessRightSet'

import styles from './AccessRightSetForm.module.css'
import { DiffContainer } from './DiffContainer'

import type { ListOrMutation, ShowedPermissions, Singular } from '@/domains/miniapp/constants/b2bAppAccessRightSet'
import type { RowProps, TableColumnType, TableProps } from 'antd'
import type { CSSProperties } from 'react'

import {
    AppEnvironment,
    B2BAppAccessRightSetCreateInput,
    B2BAppAccessRightSetStatusType,
    CreateB2BAppAccessRightSetMutation,
    GetB2BAppAccessRightSetsForAppQuery,
    GetB2BAppAccessRightSetsForAppDocument,
    useCreateB2BAppAccessRightSetMutation,
    useGetB2BAppAccessRightSetsForAppQuery,
} from '@/gql'

type RightSetType = NonNullable<NonNullable<GetB2BAppAccessRightSetsForAppQuery['rightSets']>[number]>

type RightSetDiff = {
    added: Array<ShowedPermissions>
    removed: Array<ShowedPermissions>
}

type AccessRightSetFormProps = {
    id: string
    environment: AppEnvironment
}

type RowType = {
    group: keyof typeof GROUPED_PERMISSIONS
    permissions: Array<{
        key: ShowedPermissions
        value: boolean
    }>
}

type PermissionRowType = RowType['permissions'][number]

type GroupHeaderProps  = {
    group: keyof typeof GROUPED_PERMISSIONS
}

type PermissionHeaderProps = {
    permission: ShowedPermissions
}

type PermissionsGroupTableProps = {
    permissions: RowType['permissions']
    onChange: (permission: PermissionRowType) => void
}

const DIVIDER_STYLES: CSSProperties = { marginBottom: 24 }
const BUTTON_GUTTER: RowProps['gutter'] = [48, 48]
const ALERT_GUTTER: RowProps['gutter'] = [24, 24]
const COMPARE_GUTTER: RowProps['gutter'] = [16, 16]
const FULL_COL_SPAN = 24

function _singular<T extends string> (str: T): Singular<T> {
    return str.replace(/ies$/, 'y').replace(/s$/, '') as Singular<T>
}

function _capitalize (input: string) {
    return `${input.charAt(0).toUpperCase()}${input.slice(1)}`
}

function parsePermission (permission: ShowedPermissions): ListOrMutation<ShowedPermissions> {
    return (permission.startsWith('canExecute')
        ? { entityType: 'mutation', entity: permission.replace('canExecute', '') }
        : { entityType: 'list', entity: _singular(permission.replace('canRead', '').replace('canManage', '')) }
    ) as ListOrMutation<ShowedPermissions>
}

function compareRightSets (current: RightSetType, other: RightSetType): RightSetDiff {
    const added: Array<ShowedPermissions> = []
    const removed: Array<ShowedPermissions> = []

    for (const permissionGroup of Object.values(GROUPED_PERMISSIONS)) {
        for (const permission of permissionGroup) {
            const currentValue = current[permission] ?? false
            const otherValue = other[permission] ?? false

            if (currentValue === otherValue) continue
            if (otherValue) {
                added.push(permission)
            } else {
                removed.push(permission)
            }
        }
    }

    return { added, removed }
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ group }) => {
    const intl = useIntl()
    const DomainLabel = intl.formatMessage({ id: `pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.domains.${group}.label` })
    return <Typography.Title level={5}>{DomainLabel}</Typography.Title>
}

const PermissionHeader: React.FC<PermissionHeaderProps> = ({ permission }) => {
    const intl = useIntl()
    const PermissionDescription = intl.formatMessage({ id: `pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.permissions.${permission}.label` })
    const PermissionHint = useMemo(() => {
        const { entity, entityType } = parsePermission(permission)
        const prefix = entityType === 'list'
            ? permission.startsWith('canRead')
                ? 'list.read'
                : 'list.manage'
            : 'mutation'
        const entityName = entityType === 'list' ? _capitalize(entity) : entity
        return intl.formatMessage({ id: `pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.permissions.${prefix}.hint` }, {
            entity: <b>{entityName}</b>,
        })
    }, [intl, permission])

    return (
        <Typography.Text size='medium'>
            <Space size={4} direction='horizontal' wrap>
                <span>{PermissionDescription}</span>
                <Tooltip title={PermissionHint}>
                    <span className={styles.hintIcon}>
                        <QuestionCircle size='small'/>
                    </span>
                </Tooltip>
            </Space>
        </Typography.Text>
    )
}

const PermissionsGroupTable: React.FC<PermissionsGroupTableProps> = ({ permissions, onChange }) => {
    const columns: Array<TableColumnType<PermissionRowType>> = useMemo(() => [
        {
            dataIndex: 'key',
            key: 'key',
            render (key: ShowedPermissions) {
                return <PermissionHeader permission={key}/>
            },
        },
        {
            dataIndex: 'value',
            key: 'value',
            width: 64,
            align: 'center',
            render: (value: boolean) => <Checkbox checked={value}/>,
        },
    ], [])

    const onRow: Required<TableProps<PermissionRowType>>['onRow'] = useCallback((record) => ({
        onClick: () => {
            onChange(record)
        },
        className: styles.clickableRow,
    }), [onChange])

    return (
        <Table
            className={styles.borderlessTable}
            onRow={onRow}
            columns={columns}
            dataSource={permissions}
            bordered={false}
            pagination={false}
            showHeader={false}
        />
    )
}

export const AccessRightSetForm: React.FC<AccessRightSetFormProps> = ({ id, environment }) => {
    const intl = useIntl()
    const SaveButtonLabel = intl.formatMessage({ id: 'global.actions.save' })
    const FormSectionTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.title' })
    const ApprovedSuccessMessageTitle = intl.formatMessage({ id: 'pages.apps.any.id.notifications.successSave.title' })
    const ApprovedSuccessMessageDescription = intl.formatMessage({ id: 'pages.apps.any.id.notifications.successSave.description' })
    const PendingSuccessMessageTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.notifications.pending.success.message' })
    const PendingSuccessMessageDescription = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.notifications.pending.success.description' })

    const { persistor } = useCachePersistor()
    const [initialGroupedPermissions, setInitialGroupedPermissions] = useState<Array<RowType>>(() => {
        const result: Array<RowType> = []
        for (const [group, permissions] of Object.entries(GROUPED_PERMISSIONS)) {
            result.push({
                group: group as keyof typeof GROUPED_PERMISSIONS,
                permissions: permissions.map(permission => ({
                    key: permission,
                    value: false,
                })),
            })
        }
        return result
    })
    const [groupedPermissions, setGroupedPermissions] = useState<Array<RowType>>(initialGroupedPermissions)
    const isPermissionsChanged = useMemo(() => {
        return !isEqual(groupedPermissions, initialGroupedPermissions)
    }, [groupedPermissions, initialGroupedPermissions])

    const rightSetVariables = useMemo(() => ({
        appId: id,
    }), [id])

    const { data, loading } = useGetB2BAppAccessRightSetsForAppQuery({
        variables: rightSetVariables,
        skip: !persistor,
    })

    const appRightSets = useMemo(() => data?.rightSets ?? [], [data?.rightSets])
    const pendingRightSet = useMemo(() => appRightSets.find((rightSet) => rightSet?.status === B2BAppAccessRightSetStatusType.Pending && rightSet?.environment === environment), [appRightSets, environment])
    const approvedRightSet = useMemo(() => appRightSets.find((rightSet) => rightSet?.status === B2BAppAccessRightSetStatusType.Approved && rightSet?.environment === environment), [appRightSets, environment])
    const currentRightSet = useMemo(() => pendingRightSet ?? approvedRightSet, [approvedRightSet, pendingRightSet])

    const otherEnvironment = environment === AppEnvironment.Production ? AppEnvironment.Development : AppEnvironment.Production
    const otherRightSet = useMemo(() => {
        const otherPending = appRightSets.find((rightSet) => rightSet?.status === B2BAppAccessRightSetStatusType.Pending && rightSet?.environment === otherEnvironment)
        const otherApproved = appRightSets.find((rightSet) => rightSet?.status === B2BAppAccessRightSetStatusType.Approved && rightSet?.environment === otherEnvironment)

        return otherPending ?? otherApproved
    }, [appRightSets, otherEnvironment])

    useEffect(() => {
        if (currentRightSet) {
            setGroupedPermissions(prev => {
                const newValue = prev.map(row => ({
                    group: row.group,
                    permissions: row.permissions.map(permission => ({
                        key: permission.key,
                        value: currentRightSet[permission.key] ?? permission.value,
                    })),
                }))
                setInitialGroupedPermissions(newValue)

                return newValue
            })
        }
    }, [currentRightSet])

    const expandIcon = useCallback(({ isActive }: { isActive?: boolean }) => {
        const Component = isActive ? ChevronUp : ChevronDown
        return <Component size='medium'/>
    }, [])

    const onPermissionChange = useCallback((row: PermissionRowType) => {
        setGroupedPermissions(prev => {
            return prev.map(group => {
                return {
                    ...group,
                    permissions: group.permissions.map(permission =>
                        permission.key === row.key ? { ...permission, value: !permission.value } : permission
                    ),
                }
            })
        })
    }, [])

    const onError = useMutationErrorHandler()
    const onCompleted = useCallback((data: CreateB2BAppAccessRightSetMutation) => {
        const message = data.rightSet?.status === B2BAppAccessRightSetStatusType.Approved ? ApprovedSuccessMessageTitle : PendingSuccessMessageTitle
        const description = data.rightSet?.status === B2BAppAccessRightSetStatusType.Approved ? ApprovedSuccessMessageDescription : PendingSuccessMessageDescription
        notification.success({ message, description, duration: 20 })
    }, [ApprovedSuccessMessageDescription, ApprovedSuccessMessageTitle, PendingSuccessMessageDescription, PendingSuccessMessageTitle])
    const [createRightSet] = useCreateB2BAppAccessRightSetMutation({
        refetchQueries: [
            { query: GetB2BAppAccessRightSetsForAppDocument, variables: rightSetVariables },
        ],
        onError,
        onCompleted,
    })

    const onSave = useCallback(() => {
        const payload: B2BAppAccessRightSetCreateInput = {
            dv: 1,
            sender: getClientSideSenderInfo(),
            app: { connect: { id } },
            environment,
        }

        for (const { permissions } of groupedPermissions) {
            for (const { key, value } of permissions) {
                payload[key] = value
            }
        }

        void createRightSet({ variables: { data: payload } })
    }, [createRightSet, environment, groupedPermissions, id])

    const [showModal, modalContextHolder] = Modal.useModal()

    const PendingAlert = useMemo(() => {
        if (currentRightSet?.status !== B2BAppAccessRightSetStatusType.Pending) return null
        
        const AlertMessage = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.alert.pending.message' })
        const AlertDescriptionText = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.alert.pending.description' })
        const ActionLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.alert.pending.actions.viewChanges' })
        const ModalTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.diffContainer.modal.title' })

        const addedPermissions = (currentRightSet.diff?.added ?? []) as Array<ShowedPermissions>
        const removedPermissions = (currentRightSet.diff?.removed ?? []) as Array<ShowedPermissions>
        const onActionClick = () => {
            showModal({
                title: ModalTitle,
                children: <DiffContainer added={addedPermissions} removed={removedPermissions} />,
            })
        }
        const AlertDescription = (
            <Space size={8} direction='vertical'>
                <Typography.Paragraph size='medium'>{AlertDescriptionText}</Typography.Paragraph>
                {Boolean(approvedRightSet?.id && approvedRightSet?.id !== currentRightSet?.id) && (
                    <Typography.Link onClick={onActionClick}>
                        {ActionLabel}
                    </Typography.Link>
                )}
            </Space>
        )

        return (
            <Alert type='warning' showIcon message={AlertMessage} description={AlertDescription}/>
        )
    }, [approvedRightSet?.id, currentRightSet?.diff?.added, currentRightSet?.diff?.removed, currentRightSet?.id, currentRightSet?.status, intl, showModal])

    const CompareMessage = useMemo(() => {
        if (!otherRightSet || !currentRightSet) return null

        const OtherEnvironmentInstrumentalLabel = intl.formatMessage({ id: `global.miniapp.environments.${otherEnvironment}.label.instrumental` })
        const CompareMessage = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.actions.compare' }, {
            environment: OtherEnvironmentInstrumentalLabel.toLowerCase(),
        })
        const OtherEnvironmentPrepositionalLabel = intl.formatMessage({ id: `global.miniapp.environments.${otherEnvironment}.label.prepositional` })
        const ModalTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.compareModal.title' }, {
            environment: OtherEnvironmentPrepositionalLabel.toLowerCase(),
        })
        const ExtraPermissionsLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.compareModal.diffContainer.added.title' })
        const MissingPermissionsLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.compareModal.diffContainer.removed.title' })

        const diff = compareRightSets(currentRightSet, otherRightSet)

        const onClick = () => {
            showModal({
                title: ModalTitle,
                children: <DiffContainer added={diff.added} removed={diff.removed} addedTitle={ExtraPermissionsLabel} removedTitle={MissingPermissionsLabel} />,
            })
        }

        return (
            <Typography.Link onClick={onClick}>
                <Space size={4} direction='horizontal'>
                    <ArrowDownUp size='small'/>
                    {CompareMessage}
                </Space>
            </Typography.Link>
        )
    }, [currentRightSet, intl, otherEnvironment, otherRightSet, showModal])

    return (
        <>
            <Divider orientation='left' orientationMargin={0} style={DIVIDER_STYLES}>
                <Typography.Title level={4}>
                    {FormSectionTitle}
                </Typography.Title>
            </Divider>
            {loading && <Spin size='large'/>}
            {!loading && (
                <Row gutter={ALERT_GUTTER}>
                    {Boolean(PendingAlert) && (
                        <Col span={FULL_COL_SPAN}>
                            {PendingAlert}
                        </Col>
                    )}
                    <Col span={FULL_COL_SPAN}>
                        <Row gutter={BUTTON_GUTTER}>
                            <Col span={FULL_COL_SPAN}>
                                <Row gutter={COMPARE_GUTTER}>
                                    <Col span={FULL_COL_SPAN}>
                                        <Collapse
                                            expandIconPosition='end'
                                            expandIcon={expandIcon}
                                        >
                                            {groupedPermissions.map(group => (
                                                <Collapse.Panel key={group.group} header={<GroupHeader group={group.group}/>} className={styles.collapsePanel}>
                                                    <PermissionsGroupTable permissions={group.permissions} onChange={onPermissionChange}/>
                                                </Collapse.Panel>
                                            ))}
                                        </Collapse>
                                    </Col>
                                    {Boolean(CompareMessage) && (
                                        <Col span={FULL_COL_SPAN}>
                                            {CompareMessage}
                                        </Col>
                                    )}
                                </Row>
                            </Col>
                            <Col span={FULL_COL_SPAN}>
                                <Button
                                    type='primary'
                                    disabled={!isPermissionsChanged}
                                    onClick={onSave}
                                >
                                    {SaveButtonLabel}
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            )}
            {modalContextHolder}
        </>
    )
}