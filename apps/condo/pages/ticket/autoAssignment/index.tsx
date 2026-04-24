/**
 * This page is not visible to users!
 * This is a service page!
 * This page is available only:
 * 1) Users with direct access (canManageTicketAutoAssignments and canReadTicketAutoAssignments)
 * 2) Employee with permission canManageTicketAutoAssignments and if enabled feature flag "ticket-auto-assignment-management"
 */

import {
    SortTicketAutoAssignmentsBy,
    TicketAutoAssignment as ITicketAutoAssignment,
    TicketAutoAssignmentCreateInput as ITicketAutoAssignmentCreateInput,
    TicketAutoAssignmentUpdateInput as ITicketAutoAssignmentUpdateInput,
    TicketClassifier as ITicketClassifier,
} from '@app/condo/schema'
import { Button, Col, Form, Popconfirm, Row, Select, Table, notification } from 'antd'
import { FormItemProps } from 'antd/lib/form/FormItem'
import { gql } from 'graphql-tag'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isUndefined from 'lodash/isUndefined'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useQuery, useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { TICKET_AUTO_ASSIGNMENT_MANAGEMENT } from '@condo/domains/common/constants/featureflags'
import { PageComponentType } from '@condo/domains/common/types'
import { PermissionsRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { TicketAutoAssignment } from '@condo/domains/ticket/utils/clientSchema'
import { ClassifiersQueryLocal } from '@condo/domains/ticket/utils/clientSchema/classifierSearch'


interface Item {
    key?: string
    id?: string
    organization?: string
    classifier?: string
    assignee?: string
    executor?: string
}

interface EditableCellProps {
    editing?: boolean
    children?: React.ReactNode
    inputNode?: React.ReactNode
    cellProps?: React.HTMLAttributes<HTMLElement>
    formItemProps?: FormItemProps
}

const RELATIONS = ['assignee', 'organization', 'executor', 'classifier']
const DISCONNECT_ON_NULL = ['executor', 'assignee']

type MutationType = ITicketAutoAssignmentCreateInput | ITicketAutoAssignmentUpdateInput
function formValuesProcessor (formValues: Item): MutationType {
    const result: MutationType = {}
    for (const key of Object.keys(formValues)) {
        const isRelation = RELATIONS.includes(key)
        if (isRelation) {
            if (DISCONNECT_ON_NULL.includes(key) && formValues[key] === null) {
                result[key] = { disconnectAll: true }
            } else if (formValues[key]) {
                result[key] = { connect: { id: formValues[key] } }
            }
        } else if (!isUndefined(formValues[key])) {
            result[key] = formValues[key]
        }
    }

    return result
}

const EditableCell: React.FC<EditableCellProps> = ({
    editing,
    children,
    inputNode,
    formItemProps,
    ...cellProps
}) => {
    return (
        <td {...cellProps}>
            {editing ? (
                <Form.Item
                    style={{ margin: 0, padding: 0, maxWidth: '100%', width: '100%' }}
                    {...formItemProps}
                >
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    )
}

const getClassifierName = (classifier) => {
    const place = get(classifier, 'place.name', '').trim()
    const category = get(classifier, 'category.name', '').trim()
    const problem = get(classifier, 'problem.name', '').trim()
    return [place, category, problem].filter(Boolean).join(' » ')
}

const EMPTY_TABLE_DATA = [{}]

const TicketAutoAssignmentPage: PageComponentType = () => {
    const intl = useIntl()
    const NoMessage = intl.formatMessage({ id: 'No' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const DeleteConfirmMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.deleteConfirm.message' })
    const CancelConfirmMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.cancelConfirm.message' })
    const ClassifierMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.columns.classifier.title' })
    const AssigneeMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.columns.assignee.title' })
    const ExecutorMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.columns.executor.title' })
    const OperationsMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.columns.operations.title' })
    const CreateMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.create.label' })
    const CancelMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.cancel.label' })
    const RefreshMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.refresh.label' })
    const SaveMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.save.label' })
    const EditMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.edit.label' })
    const DeleteMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.delete.label' })
    const DeleteEverythingMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.button.deleteEverything.label' })
    const SaveNotificationMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.notifications.save.message' })
    const DeleteNotificationMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.notifications.delete.message' })
    const ErrorNotificationMessage = intl.formatMessage({ id: 'pages.ticket.autoAssignment.notifications.error.message' })

    const { organization } = useOrganization()
    const organizationId = useMemo(() => get(organization, 'id', null), [organization])

    const client = useApolloClient()
    const ClassifierLoader = useMemo(() => new ClassifiersQueryLocal(client), [client])
    const [classifierLoading, setClassifierLoading] = useState<boolean>(true)
    const [classifiers, setClassifiers] = useState<Array<ITicketClassifier>>([])

    const [api, contextHolder] = notification.useNotification()

    const [form] = Form.useForm<Item>()

    const updateTicketAutoAssignment = TicketAutoAssignment.useUpdate({})
    const createTicketAutoAssignment = TicketAutoAssignment.useCreate({})
    const deleteTicketAutoAssignment = TicketAutoAssignment.useSoftDelete()
    const deleteManyTicketAutoAssignment = TicketAutoAssignment.useSoftDeleteMany()
    const { objs: rules, refetch: refetchRoles, allDataLoaded: rulesLoaded, error: rolesError, loading: rolesLoading } = TicketAutoAssignment.useAllObjects({
        where: {
            organization: { id: organizationId },
        },
        sortBy: [SortTicketAutoAssignmentsBy.CreatedAtDesc, SortTicketAutoAssignmentsBy.IdDesc],
    }, {
        fetchPolicy: 'network-only',
        skip: !organizationId,
    })
    const { loading: employeesLoading, objs: employees, error: employeesError } = OrganizationEmployee.useObjects({
        where: {
            organization: { id: organizationId },
        },
    }, { skip: !organizationId })

    const [editingKey, setEditingKey] = useState('')
    const [creating, setCreating] = useState<boolean>(false)
    const isEditing = useCallback((record: ITicketAutoAssignment) => record.id === editingKey, [editingKey])
    const [saving, setSaving] = useState(false)

    const loading = classifierLoading || !rulesLoaded || employeesLoading || rolesLoading
    const error = rolesError || employeesError

    const edit = useCallback((record: Partial<ITicketAutoAssignment>) => {
        form.setFieldsValue({
            classifier: get(record, 'classifier.id', null),
            assignee: get(record, 'assignee.id', null),
            executor: get(record, 'executor.id', null),
        })
        setEditingKey(record.id)
    }, [form])

    const cancel = useCallback(() => {
        setEditingKey('')
        setCreating(false)
        form.resetFields()
    }, [form])

    const save = useCallback(async (prevRecord: ITicketAutoAssignment) => {
        try {
            if (saving) return
            setSaving(true)
            const prevClassifierId = get(prevRecord, 'classifier.id', null)
            const prevExecutorId = get(prevRecord, 'executor.id', null)
            const prevAssigneeId = get(prevRecord, 'assignee.id', null)
            const id = get(prevRecord, 'id')
            const row = (await form.validateFields()) as Item
            const classifier = get(row, 'classifier', null)
            const executor = get(row, 'executor', null)
            const assignee = get(row, 'assignee', null)
            const newData = { classifier, executor, assignee }

            const hasChanges = id && (prevClassifierId !== classifier || prevExecutorId !== executor || prevAssigneeId !== assignee)

            if (creating) {
                await createTicketAutoAssignment(formValuesProcessor({ ...newData, organization: organizationId }))
            } else if (hasChanges) {
                await updateTicketAutoAssignment(formValuesProcessor(newData), { id })
            }
            if (creating || hasChanges) {
                await refetchRoles()
            }
            api.success({
                message: SaveNotificationMessage,
            })
        } catch (error) {
            api.error({
                message: ErrorNotificationMessage,
                description: error.message,
            })
            console.error('Failed to save data:', error)
        } finally {
            cancel()
            setSaving(false)
        }
    }, [saving, form, creating, api, SaveNotificationMessage, organizationId, ErrorNotificationMessage, cancel])

    const deleteItem = useCallback(async (item) => {
        try {
            if (saving) return
            setSaving(true)
            await deleteTicketAutoAssignment({ id: item.id })
            await refetchRoles()
            api.success({
                message: DeleteNotificationMessage,
            })
            cancel()
        } catch (error) {
            api.error({
                message: ErrorNotificationMessage,
                description: error.message,
            })
            console.error('Failed to delete data:', error)
        } finally {
            setSaving(false)
        }
    }, [DeleteNotificationMessage, ErrorNotificationMessage, api, cancel, saving])

    const deleteAll = useCallback(async () => {
        try {
            if (saving) return
            setSaving(true)
            const chunks = chunk(rules, 50)
            for (const chunk of chunks) {
                await deleteManyTicketAutoAssignment(chunk)
            }
            api.success({
                message: DeleteNotificationMessage,
            })
        } catch (error) {
            api.error({
                message: ErrorNotificationMessage,
                description: error.message,
            })
            console.error('Failed to delete all data:', error)
        } finally {
            setSaving(false)
        }
    }, [DeleteNotificationMessage, ErrorNotificationMessage, api, rules, saving])

    const handleSaveClick = useCallback((record) => () => save(record), [save])

    const employeeOptions = useMemo(() => employees.map(item => ({
        value: item.id,
        label: item.name,
    })), [employees])

    const classifierOptions = useMemo(() => classifiers.map(item => ({
        value: item.id,
        label: getClassifierName(item),
    })), [classifiers])

    const classifierFilters = useMemo(
        () => classifierOptions.map(item => ({ ...item, text: item.label })).sort((a, b) => a.label.localeCompare(b.label)),
        [classifierOptions]
    )

    const getVisibleClassifiers = useCallback((record: ITicketAutoAssignment) => {
        return classifierOptions.filter((option) => {
            const isCurrentClassifier = option.value === get(record, 'classifier.id')
            const notUsedClassifier = !rules.find(rule => rule.classifier.id === option.value)
            return isCurrentClassifier || notUsedClassifier
        })
    }, [rules, classifierOptions])

    const renderClassifierInput = useCallback((record: ITicketAutoAssignment) => (
        <Select
            style={{ maxWidth: 300 }}
            showSearch
            optionFilterProp='label'
            defaultValue={record.id}
            options={getVisibleClassifiers(record)}
            allowClear
            filterSort={(a, b) => a.label.localeCompare(b.label)}
        />
    ), [getVisibleClassifiers])

    const renderEmployeeInput = useCallback((record: ITicketAutoAssignment) => (
        <Select
            style={{ maxWidth: 250 }}
            showSearch
            defaultValue={record.id}
            options={employeeOptions}
            allowClear
            optionFilterProp='label'
            filterSort={(a, b) => a.label.localeCompare(b.label)}
        />
    ), [employeeOptions])

    const columns = useMemo(() => [
        {
            title: ClassifierMessage,
            dataIndex: ['classifier', 'id'],
            key: 'classifier',
            width: 300,
            editable: true,
            render: (_, item: ITicketAutoAssignment) => getClassifierName(item.classifier),
            inputNode: renderClassifierInput,
            formItemProps: {
                name: 'classifier',
                rules: [{
                    required: true,
                    message: 'Required',
                }],
            },
            sorter: (a, b) => {
                return getClassifierName(a.classifier).localeCompare(getClassifierName(b.classifier))
            },
            defaultSortOrder: 'ascend',
            filters: classifierFilters,
            filterSearch: true,
            onFilter: (value: string, record: ITicketAutoAssignment) => {
                return get(record, 'classifier.id') === value
            },
        },
        {
            title: ExecutorMessage,
            dataIndex: ['executor', 'name'],
            key: 'executor',
            inputNode: renderEmployeeInput,
            formItemProps: {
                name: 'executor',
            },
            width: 250,
            editable: true,
            sorter: (a, b) => {
                const aName = get(a, 'executor.name')
                const bName = get(b, 'executor.name')
                if (!aName || !bName) return !aName ? 1 : -1
                return aName.localeCompare(bName)
            },
            filterSearch: true,
            filters: employeeOptions.map(item => ({ ...item, text: item.label })).sort((a, b) => a.label.localeCompare(b.label)),
            onFilter: (value: string, record) => {
                return get(record, 'executor.id') === value
            },
        },
        {
            title: AssigneeMessage,
            dataIndex: ['assignee', 'name'],
            key: 'assignee',
            width: 250,
            editable: true,
            inputNode: renderEmployeeInput,
            formItemProps: {
                name: 'assignee',
            },
            filterSearch: true,
            filters: employeeOptions.map(item => ({ ...item, text: item.label })).sort((a, b) => a.label.localeCompare(b.label)),
            onFilter: (value: string, record) => {
                return get(record, 'assignee.id') === value
            },
            sorter: (a, b) => {
                const aName = get(a, 'assignee.name')
                const bName = get(b, 'assignee.name')
                if (!aName || !bName) return !aName ? 1 : -1
                return aName.localeCompare(bName)
            },
        },
        {
            title: OperationsMessage,
            dataIndex: 'operation',
            key: 'operation',
            width: 100,
            render: (_, record: ITicketAutoAssignment) => {
                const editable = isEditing(record)
                const disabled = saving
                return editable ? (
                    <span>
                        <Typography.Link disabled={disabled} onClick={() => save(record)} style={{ marginRight: 8 }}>
                            {SaveMessage}
                        </Typography.Link>
                        <Popconfirm
                            disabled={disabled}
                            title={CancelConfirmMessage}
                            onConfirm={cancel}
                            cancelText={NoMessage}
                            okText={YesMessage}
                        >
                            <a>{CancelMessage}</a>
                        </Popconfirm>
                    </span>
                ) : (
                    <span>
                        <Typography.Link disabled={disabled} onClick={() => edit(record)} style={{ marginRight: 8 }}>
                            {EditMessage}
                        </Typography.Link>
                        <Popconfirm
                            title={DeleteConfirmMessage}
                            disabled={disabled}
                            onConfirm={() => deleteItem(record)}
                            cancelText={NoMessage}
                            okText={YesMessage}
                        >
                            <a>{DeleteMessage}</a>
                        </Popconfirm>
                    </span>
                )
            },
        },
    ], [AssigneeMessage, CancelConfirmMessage, CancelMessage, ClassifierMessage, DeleteConfirmMessage, DeleteMessage, EditMessage, ExecutorMessage, NoMessage, OperationsMessage, SaveMessage, YesMessage, cancel, classifierFilters, deleteItem, edit, employeeOptions, isEditing, renderClassifierInput, renderEmployeeInput, save, saving])

    const columnsForData = useMemo(() => columns.map((col) => {
        if (!col.editable) return col

        return {
            ...col,
            onCell: (record: ITicketAutoAssignment) => {
                return {
                    formItemProps: col.formItemProps,
                    editing: isEditing(record),
                    inputNode: col.inputNode(record),
                }
            },
        }
    }), [columns, isEditing])

    const columnsForCreating = useMemo(() => columns.map((col) => {
        if (!col.editable && col.key !== 'operation') return col

        if (col.key === 'operation') {
            return {
                ...col,
                render: (_, record: ITicketAutoAssignment) => {
                    const disabled = saving
                    return (
                        <span>
                            <Typography.Link disabled={disabled} onClick={handleSaveClick(record)} style={{ marginRight: 8 }}>
                                {SaveMessage}
                            </Typography.Link>
                            <Popconfirm disabled={disabled} title={CancelConfirmMessage} onConfirm={cancel}>
                                <a>{CancelMessage}</a>
                            </Popconfirm>
                        </span>
                    )
                },
            }
        }

        return {
            ...col,
            onCell: (record: ITicketAutoAssignment) => {
                return {
                    formItemProps: col.formItemProps,
                    editing: true,
                    inputNode: col.inputNode(record),
                }
            },
        }
    }), [CancelConfirmMessage, CancelMessage, SaveMessage, cancel, columns, handleSaveClick, saving])

    useEffect(() => {
        setClassifierLoading(true)
        ClassifierLoader.init().then(async () => {
            const values = await ClassifierLoader.search('', 'rules', null, 500)
            setClassifiers(values)
            setClassifierLoading(false)
        })
        return () => {
            ClassifierLoader.clear()
        }
    }, [])

    if (error) {
        return <LoadingOrErrorPage error={error} />
    }

    return (
        <>
            {contextHolder}
            <Form form={form} component={false}>
                <Row style={{ width: '100%', paddingLeft: 24, paddingRight: 24, paddingBottom: 48 }}>
                    <Col span={24}>
                        <Button
                            disabled={!!creating || !!editingKey || loading || saving}
                            onClick={() => setCreating(true)}
                        >
                            {CreateMessage}
                        </Button>
                        <Button
                            disabled={loading || saving}
                            onClick={() => cancel()}
                        >
                            {CancelMessage}
                        </Button>
                        <Button
                            disabled={loading || saving}
                            onClick={() => refetchRoles()}
                        >
                            {RefreshMessage}
                        </Button>
                        <Popconfirm
                            title={DeleteConfirmMessage}
                            disabled={!!creating || !!editingKey || loading || saving}
                            onConfirm={deleteAll}
                            cancelText={NoMessage}
                            okText={YesMessage}
                        >
                            <Button>{DeleteEverythingMessage}</Button>
                        </Popconfirm>
                    </Col>
                    {
                        creating && (
                            <Col span={24}>
                                <Table
                                    components={{
                                        body: {
                                            cell: EditableCell,
                                        },
                                    }}
                                    loading={loading || saving}
                                    columns={columnsForCreating as any}
                                    dataSource={EMPTY_TABLE_DATA}
                                    pagination={false}
                                />
                            </Col>
                        )
                    }
                    <Col span={24}>
                        <Table
                            components={{
                                body: {
                                    cell: EditableCell,
                                },
                            }}
                            loading={loading || saving}
                            columns={columnsForData as any}
                            dataSource={rules}
                            scroll={{ x: true }}
                        />
                    </Col>
                </Row>
            </Form>
        </>
    )
}

const USER_WITH_RIGHTS_SET = gql`
    query GetUserWithUserRightsSet ($userId: ID!) {
        objs: allUsers(where: {id: $userId}) {
            id
            rightsSet { canManageTicketAutoAssignments canReadTicketAutoAssignments }
        }
    }
`

const TicketAutoAssignmentPermissionRequired: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user } = useAuth()
    const userId = get(user, 'id', null)

    const { useFlag } = useFeatureFlags()
    const hasTicketAutoAssignmentManagementFeature = useFlag(TICKET_AUTO_ASSIGNMENT_MANAGEMENT)

    const { loading, error, data } = useQuery(USER_WITH_RIGHTS_SET, {
        variables: {
            userId: userId,
        },
        skip: !user,
    })
    const userWithRightSets = useMemo(() => {
        if (!data && (loading || error)) return null
        const objs = get(data, 'objs')
        if (!isArray(objs) || objs.length !== 1) {
            console.warn('Should be 1 item userWithRightSets')
            return null
        }
        return objs[0]
    }, [data, error, loading])

    const canDirectlyManage = useMemo(
        () => get(userWithRightSets, 'rightsSet.canManageTicketAutoAssignments')
            && get(userWithRightSets, 'rightsSet.canReadTicketAutoAssignments'),
        [userWithRightSets]
    )

    if (loading || error) {
        return <LoadingOrErrorPage loading={loading} error={error} />
    }

    if (canDirectlyManage || hasTicketAutoAssignmentManagementFeature) {
        return <PermissionsRequired permissionKeys={[]} children={children} />
    }

    return <AccessDeniedPage />
}

TicketAutoAssignmentPage.requiredAccess = TicketAutoAssignmentPermissionRequired

export default TicketAutoAssignmentPage
