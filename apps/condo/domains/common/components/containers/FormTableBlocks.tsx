// @ts-nocheck
import React, { useContext, useEffect } from 'react'
import { Button, Form, Input, Space } from 'antd'
import { useIntl } from '@core/next/intl'
import ExcelExporterButton from './FormTableExcelImport'
import { CreateFormListItemButton, ExtraDropdownActionsMenu } from './FormList'
import FormTable from './FormTable'
import { useAuth } from '@core/next/auth'
import { useImmerReducer } from 'use-immer'
import { DeleteOutlined, QuestionCircleOutlined, SaveOutlined } from '@ant-design/icons'
import Router from 'next/router'
import get from 'lodash/get'

const _USE_TABLE_INITIAL_STATE = {
    actions: {}, // { Create: ({values, item, form, ...}) => { ... }
    // forms: {},
    data: [],
    loading: false,
    pagination: {
        total: undefined,
        current: 1,
        pageSize: 20,
    },
    filters: {},
    sorter: {},
}

function createNewGQLItem () {
    return {
        isUnsavedNew: true,
        isBlocked: false,
    }
}

function _tableStateReducer (draft, action) {
    switch (action.type) {
        case 'reset': {
            return _USE_TABLE_INITIAL_STATE
        }
        case 'set': {
            const { key, value } = action
            draft[key] = value
            return undefined
        }
        case 'merge': {
            const { key, value } = action
            draft[key] = { ...draft[key], ...value }
            return undefined
        }
        case 'remove': {
            const { where } = action
            const keys = Object.keys(where)
            const indexes = []
            draft.data.forEach((x, index) => {
                if (keys.every((k) => x[k] === where[k])) {
                    indexes.push(index)
                }
            })
            indexes.reverse()
            for (const index of indexes) {
                draft.data.splice(index, 1)
            }
            return undefined
        }
        case 'query': {
            const { pagination, filters, sorter } = action
            if (pagination) draft['pagination'] = { ...draft['pagination'], ...pagination }
            if (filters) draft['filters'] = { ...draft['filters'], ...filters }
            if (sorter) draft['sorter'] = { ...draft['sorter'], ...sorter }
            return undefined
        }
    }
}

function useTable () {
    const [state, dispatch] = useImmerReducer(_tableStateReducer, _USE_TABLE_INITIAL_STATE)

    return {
        state,
        setData: (value) => dispatch({ type: 'set', key: 'data', value }),
        updateFilterPaginationSort: (pagination, filters, sorter) => dispatch({
            type: 'query',
            pagination,
            filters,
            sorter,
        }),
        updateActions: (value) => dispatch({ type: 'merge', key: 'actions', value }),
        action: (name, args) => state.actions[name](args),
        reset: () => dispatch({ type: 'reset' }),
        remove: (where) => dispatch({ type: 'remove', where }),
    }
}

function _useTableRowForm () {
    const form = useContext(FormTable.RowFormContext)
    const { table } = useContext(FormTable.TableContext)
    const { editing, loading, hidden, setRowContext } = useContext(FormTable.RowContext)

    function setEditing (value) {
        return setRowContext(x => ({ ...x, editing: value }))
    }

    function setLoading (value) {
        return setRowContext(x => ({ ...x, loading: value }))
    }

    function setHidden (value) {
        return setRowContext(x => ({ ...x, hidden: value }))
    }

    function action (name, args) {
        return table.action(name, args)
    }

    function remove (where) {
        table.remove(where)
    }

    return {
        action, remove,
        form, editing, loading, hidden,
        setEditing,
        setLoading,
        setHidden,
    }
}

function RenderActionsColumn (text, item, index) {
    const intl = useIntl()
    const AreYouSureMessage = intl.formatMessage({ id: 'AreYouSure' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const EditMessage = intl.formatMessage({ id: 'Edit' })

    const { user } = useAuth()

    const { isUnsavedNew } = item
    const { action, remove, form, setEditing, setLoading, editing, loading } = _useTableRowForm()

    function validateFields () {
        setLoading(true)
        return form.validateFields()
            .then((values) => action('CreateOrUpdate', { values, item, form }))
            .then(() => (isUnsavedNew) ? remove({ id: item.id }) : null)
            .then(() => (isUnsavedNew) ? null : setEditing(false))
            .finally(() => setLoading(false))
    }

    function deleteRow () {
        setLoading(false)
        setEditing(false)
        remove({ id: item.id })
    }

    return <Space>
        {(isUnsavedNew || editing) ?
            <Button size="small" type={'primary'} onClick={validateFields} loading={loading}>
                <SaveOutlined/>
            </Button>
            : null}
        {(isUnsavedNew) ?
            <Button size="small" type={'primary'} onClick={deleteRow}>
                <DeleteOutlined/>
            </Button>
            :
            <ExtraDropdownActionsMenu actions={[
                (item.user && item.user.id === user.id) ? null : {
                    confirm: {
                        title: AreYouSureMessage,
                        icon: <QuestionCircleOutlined style={{ color: 'red' }}/>,
                    },
                    label: DeleteMessage,
                    action: () => action('Delete', { values: { id: item.id }, item, form }),
                },
                {
                    label: EditMessage,
                    action: () => {
                        setEditing(true)
                    },
                },
            ]}/>
        }
    </Space>
}

function toGQLSortBy (sorter) {
    if (sorter) {
        const { field } = sorter
        let { order } = sorter
        if (field && order) {
            order = order.toLowerCase()
            if (order === 'asc' || order === 'ascend') order = 'ASC'
            else order = 'DESC'
            return `${field}_${order}`
        }
    }
    return undefined
}

function toGQLWhere (filters) {
    const where = {}
    Object.keys(filters).forEach((key) => {
        const v = filters[key]
        if (v && v.length === 1) {
            Object.assign(where, JSON.parse(v[0]))
        } else if (v && v.length >= 1) {
            if (where.OR) {
                // TODO(pahaz): it looks a problem in case of multiple OR
                throw new Error('Multiple OR query! Does not support!')
            }
            Object.assign(where, { OR: v.map(JSON.parse) })
        }
    })
    return where
}

function TableCellInner ({ children, record, rowIndex, column }) {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })

    const { editable, dataIndex, rules, normalize, editableInput } = column
    const { form, editing } = _useTableRowForm()

    useEffect(() => {
        form.setFieldsValue({
            // TODO(pahaz): think about normalize!
            [dataIndex]: (normalize) ? normalize(record[dataIndex]) : record[dataIndex],
        })
    }, [])

    if (!editable || !editing) return children
    const input = (editableInput) ? editableInput() : <Input/>

    return <Form.Item
        style={{ margin: 0 }}
        key={dataIndex}
        name={dataIndex}
        normalize={normalize}
        rules={rules || [
            {
                required: true,
                message: FieldIsRequiredMessage,
            },
        ]}
    >
        {input}
    </Form.Item>
}

function NewOrExportTableBlock ({ columns, table }) {
    const intl = useIntl()
    const CreateMessage = intl.formatMessage({ id: 'Create' })

    const data = table.state.data
    const setData = table.setData

    function handleSetExportData (data) {
        setData(data.map(x => {
            return { ...createNewGQLItem(), ...x }
        }))
    }

    function handleAdd () {
        setData([...data, createNewGQLItem()])
    }

    return <>
        <ExcelExporterButton columns={columns.filter((x => x.importFromFile))} setExportedData={handleSetExportData}/>
        <CreateFormListItemButton
            onClick={handleAdd} label={CreateMessage}
            style={{ marginBottom: '16px', width: '100%' }}/>
        {(data.length) ?
            <Space direction="vertical">
                <FormTable
                    dataSource={data}
                    columns={columns.filter((x => x.create))}
                    CellInner={TableCellInner}
                    rowContextInitialState={{ editing: true, loading: false }}
                    tableContextInitialState={{ table }}
                />
            </Space>
            : null}
    </>
}

function ViewOrEditTableBlock ({ columns, table }) {
    const data = table.state.data
    const pagination = table.state.pagination
    const onChangeFilterPaginationSort = table.updateFilterPaginationSort

    const onRow = (record) => {
        return {
            onClick: () => {
                const employeeId = get(record, 'id')

                Router.push(`/employee/${employeeId}`)
            },
        }
    }

    return <FormTable
        dataSource={data}
        columns={columns}
        CellInner={TableCellInner}
        rowContextInitialState={{ editing: false, loading: false }}
        tableContextInitialState={{ table }}
        onChangeFilterPaginationSort={onChangeFilterPaginationSort}
        pagination={pagination}
        onRow={onRow}
    />
}

export {
    useTable,
    RenderActionsColumn,
    toGQLSortBy,
    toGQLWhere,
    NewOrExportTableBlock,
    ViewOrEditTableBlock,
}
