import React, { useContext, useEffect, useRef, useState } from 'react'
import { Empty, Form, Input, Table } from 'antd'
import { useIntl } from '@core/next/intl'

const RowFormContext = React.createContext()
const RowContext = React.createContext()
const TableContext = React.createContext()

function defaultRenderCellWrapper ({ dataIndex, record, column, children, form }) {
    const inputRef = useRef()
    const [editing, setEditing] = useState(false)
    const { editable } = column

    useEffect(() => {
        if (editing) {
            inputRef.current.focus()
        }
    }, [editing])

    function toggleEdit () {
        setEditing(!editing)
        form.setFieldsValue({
            // GET
            [dataIndex]: record[dataIndex],
        })
    }

    async function handleEdited () {
        try {
            const values = await form.validateFields()
            const newRecord = { ...record }
            Object.entries(values).forEach(([k, v]) => {
                record[k] = v
                newRecord[k] = v
            })
            // SET
            toggleEdit()
        } catch (errInfo) {
            console.log('Save failed:', errInfo)
        }
    }

    if (!editing || !editable) return children

    return <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
    >
        <Input
            ref={inputRef}
            onPressEnter={handleEdited}
            onBlur={handleEdited}
        />
    </Form.Item>
}

function EditableRow ({ ...props }) {
    const { rowContextInitialState } = useContext(TableContext)
    const [rowContext, setRowContext] = useState(rowContextInitialState || {})
    const [form] = Form.useForm()
    return (
        <Form form={form} component={false}>
            <RowFormContext.Provider value={form}>
                <RowContext.Provider value={{ ...rowContext, setRowContext }}>
                    <tr {...props} />
                </RowContext.Provider>
            </RowFormContext.Provider>
        </Form>
    )
}

function EditableCell ({
    column,
    record,
    children,
    ...restProps
}) {
    const form = useContext(RowFormContext)
    const { renderCellWrapper } = useContext(TableContext)
    if (!column || !record || !children || !form) return null
    const render = record.renderCellWrapper || column.renderCellWrapper || renderCellWrapper || defaultRenderCellWrapper
    return <td {...restProps}>{render({ column, record, children, form })}</td>
}

function EditableWrapper (props) {
    return <tbody {...props}/>
}

function FormTable ({ dataSource, renderItem, renderCellWrapper, rowContextInitialState, columns, onEdited, ...extra }) {
    if (!columns) throw new Error('columns prop is required')
    if (!renderItem) throw new Error('renderItem prop is required')
    const intl = useIntl()
    const NoDataMsg = intl.formatMessage({ id: 'NoData' })

    const components = {
        body: {
            wrapper: EditableWrapper,
            row: EditableRow,
            cell: EditableCell,
        },
    }
    const editableColumns = columns
        .map(column => {
            return {
                ...column,
                // Set props on per cell
                onCell: (record) => {
                    const baseOnCell = (column.onCell) ? column.onCell(record) : {}
                    return {
                        ...baseOnCell,
                        record,
                        column,
                    }
                },
            }
        })

    return <TableContext.Provider value={{ rowContextInitialState, renderCellWrapper }}>
        <Table
            rowKey={'id'}
            size="small"
            components={components}
            bordered
            dataSource={dataSource && dataSource.map(renderItemWrapper)}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={NoDataMsg}/> }}
            columns={editableColumns}
            {...extra}
        />
    </TableContext.Provider>

    function renderItemWrapper (item) {
        const values = renderItem(item)
        return { ...values, __item: item }
    }
}

FormTable.RowFormContext = RowFormContext
FormTable.RowContext = RowContext
export default FormTable
