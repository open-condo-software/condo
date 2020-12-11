import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Form, Input, Table } from 'antd'

const DEFAULT_ROW_CONTEXT = { editing: false }
const RowFormContext = React.createContext()
const RowContext = React.createContext()
const TableContext = React.createContext()

function DefaultCellWrapper ({ ...props }) {
    return <td {...props} />
}

function DefaultCellInner ({ children, record, rowIndex, column }) {
    const inputRef = useRef()
    const form = useContext(RowFormContext)
    // const { editable, setRowContext } = useContext(RowContext)
    const [editing, setEditing] = useState(false)

    useEffect(() => {
        if (column.editable && editing && inputRef.current) {
            inputRef.current.focus()
        }
    }, [column, editing, inputRef])

    function toggleEdit () {
        setEditing(!editing)
        form.setFieldsValue({
            // GET
            [column.dataIndex]: record[column.dataIndex],
        })
    }

    async function handleEdited () {
        try {
            const values = await form.validateFields()
            if (column.onEdited) {
                column.onEdited(record, values)
            } else {
                console.warn('no column.onEdited(record, newValues) callback!', record, values)
            }
            toggleEdit()
        } catch (errInfo) {
            console.log('handleEdited() failed:', errInfo)
        }
    }

    if (!column.editable) return children
    if (editing) {
        return <Form.Item
            style={{ margin: 0 }}
            name={column.dataIndex}
        >
            <Input
                ref={inputRef}
                onPressEnter={handleEdited}
                onBlur={handleEdited}
            />
        </Form.Item>
    } else {
        return <div onClick={toggleEdit} key={record[column.dataIndex]}>
            {children}
        </div>
    }
}

function EditableCell ({
    record, rowIndex, column, // onCellExtraProps
    children,
    ...props
}) {
    const { CellWrapper, CellInner } = useContext(TableContext)

    // console.log('EditableCell', rowIndex, record, column, children, props)

    let Wrapper = CellWrapper || DefaultCellWrapper
    let Inner = CellInner || DefaultCellInner

    if (!record || !column) {
        return <td {...props}>{children}</td> // placeholder time!
    }

    return <Wrapper {...props}>
        <Inner children={children} record={record} rowIndex={rowIndex} column={column}/>
    </Wrapper>
}

function DefaultRowWrapper ({ ...props }) {
    return <tr {...props} />
}

function DefaultRowInner ({ children, record, rowIndex }) {
    const form = useContext(RowFormContext)
    return <Form name={`row${rowIndex}`} form={form} component={false}>{children}</Form>
}

function EditableRow ({
    record, rowIndex, // onRowExtraProps
    children,
    ...props
}) {
    // Base logic: provide `rowForm` and `rowContext`
    const { RowWrapper, RowInner, rowContextInitialState } = useContext(TableContext)
    const [form] = Form.useForm()
    const [rowContext, setRowContext] = useState(rowContextInitialState || DEFAULT_ROW_CONTEXT)
    const context = useMemo(() => ({
        ...rowContextInitialState || DEFAULT_ROW_CONTEXT,
        ...rowContext,
        setRowContext,
    }), [rowContext])

    // console.log('EditableRow', rowIndex, record, children, props)

    let Wrapper = RowWrapper || DefaultRowWrapper
    let Inner = RowInner || DefaultRowInner

    if (!record) {
        return <tr {...props}>{children}</tr> // placeholder time!
    }

    return (
        <RowFormContext.Provider value={form}>
            <RowContext.Provider value={context}>
                <Wrapper {...props}>
                    <Inner children={children} record={record} rowIndex={rowIndex}/>
                </Wrapper>
            </RowContext.Provider>
        </RowFormContext.Provider>
    )
}

function EditableBody (props) {
    // console.log('EditableBody', props)
    return <tbody {...props}/>
}

const TABLE_COMPONENTS = {
    body: {
        wrapper: EditableBody,
        row: EditableRow,
        cell: EditableCell,
    },
}

function _addExtraCellProps (columns) {
    // add: record, rowIndex, column
    return columns
        .map(column => {
            return {
                ...column,
                // Set props on per cell
                onCell: (record, rowIndex) => {
                    const baseOnCell = (column.onCell) ? column.onCell(record, rowIndex) : {}
                    return {
                        ...baseOnCell,
                        record,
                        column,
                        rowIndex,
                    }
                },
            }
        })
}

function _addExtraRowProps (columns, onRow = null) {
    // add: record, rowIndex
    return (record, rowIndex) => {
        const baseOnRow = (onRow) ? onRow(record, rowIndex) : {}
        return {
            ...baseOnRow,
            record,
            rowIndex,
        }
    }
}

function FormTable ({ columns, dataSource, pagination, onChangeFilterPaginationSort, rowContextInitialState, tableContextInitialState, RowInner, CellInner }) {
    // Each row has RowContext and RowFormContext!
    if (!columns) throw new Error('columns prop is required')

    const fixedColumns = useMemo(() => _addExtraCellProps(columns), [columns])
    const fixedOnRow = useMemo(() => _addExtraRowProps(columns), [columns])

    // TODO(pahaz): add CellWrapper, RowWrapper if you know any use case?!
    return <TableContext.Provider value={{ ...tableContextInitialState, rowContextInitialState, RowInner, CellInner }}>
        <Table
            rowKey={'id'}
            tableLayout={'fixed'}
            size="small"
            bordered
            components={TABLE_COMPONENTS}
            dataSource={dataSource}
            columns={fixedColumns}
            onRow={fixedOnRow}
            pagination={pagination}
            onChange={onChangeFilterPaginationSort}
        />
    </TableContext.Provider>
}

FormTable.TableContext = TableContext
FormTable.RowFormContext = RowFormContext
FormTable.RowContext = RowContext
export default FormTable
