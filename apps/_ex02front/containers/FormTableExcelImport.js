import React, { useEffect, useState } from 'react'
import XLSX from 'xlsx'
import { Button, Col, Form, Input, Progress, Row, Select, Table, Tooltip, Typography, Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { defaultValidator, fromExData, reValidateExData, toExData } from '../utils/excel.utils'
import { useIntl } from '@core/next/intl'
import { useImmer } from 'use-immer'
import styled from '@emotion/styled'
import { CreateFormListItemButton } from './FormList'

const SHEET_JS_ACCEPT_FILES = [
    'xlsx', 'xlsb', 'xlsm', 'xls', 'xml', 'csv', 'txt',
    'ods', 'fods', 'uos', 'sylk', 'dif', 'dbf', 'prn',
    'qpw', '123', 'wb*', 'wq*', 'html', 'htm',
].map(function (x) { return '.' + x }).join(',')

const ErrorText = styled.div`
    word-break: break-word;
    background: red;
`

const OkText = styled.div`
    word-break: break-word;
    background: green;
`

const WarnText = styled.div`
    word-break: break-word;
    background: yellow;
`

function MappingForm ({ columns, cols, onChangeMapping, onFinish }) {
    const [form] = Form.useForm()
    const [values, setValues] = useState({})

    const intl = useIntl()
    const ColumnMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.Column' })
    const SelectColumnMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.SelectColumn' })
    const NextStepButtonLabelMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.NextStepButtonLabel' })

    function handleChanges (changedValues, allValues) {
        const titleToIndex = Object.fromEntries(cols.map((col) => [col.title, col.dataIndex]))
        const remapped = Object.fromEntries(
            Object.entries(allValues)
                .filter(([k, v]) => v)
                .map(([k, v]) => [titleToIndex[v], k]),
        )
        setValues(allValues)
        onChangeMapping(remapped)
    }

    {/* disable chrome autofill hack 2 */}
    useEffect(() => {
        document.querySelectorAll('.ant-select-selector input').forEach((e) => {
            e.setAttribute('autocomplete', `stopDamnAutocomplete${Math.random()}`)
        })
    })

    const selectColumnComponent = (
        <Select
            allowClear={true}
            showSearch
            placeholder={SelectColumnMsg}
            optionFilterProp="children"
            filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
        >
            {
                cols.length > 0 ?
                    cols.map((col) => {
                        if (Object.values(values).includes(col.title)) {
                            return null
                        }
                        return <Select.Option key={col.title} value={col.title}>{col.title}</Select.Option>
                    })
                    :
                    null
            }
        </Select>
    )

    return <Form
        layout={'horizontal'}
        size={'small'}
        form={form}
        onValuesChange={handleChanges}
        onFinish={onFinish}
    >
        {/* disable chrome autofill hack 1*/}
        <Form.Item label="Hidden" name="name1" style={{ display: 'none' }}>
            <Input/>
        </Form.Item>
        {columns.map((column, index) => {
            return <Form.Item key={index} label={[ColumnMsg, ' "', column.title, '"']} name={column.dataIndex}>
                {selectColumnComponent}
            </Form.Item>
        })}
        <Form.Item>
            <Button type="primary" htmlType="submit">{NextStepButtonLabelMsg}</Button>
        </Form.Item>
    </Form>
}

function ExcelExporterButton ({ columns, setExportedData }) {
    if (!columns) throw new Error('no columns prop')

    const [step, setStep] = useState(-1)
    const [tableState, setTableState] = useImmer({ data: [], cols: [], mapping: {} })
    const validators = Object.fromEntries(columns.map(column => [column.dataIndex, column.importValidator || defaultValidator]))

    const intl = useIntl()
    const ImportFromFileButtonLabelMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.ImportFromFileButtonLabel' })
    const ClickOrDragImportFileTextMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.ClickOrDragImportFileText' })
    const ClickOrDragImportFileHintMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.ClickOrDragImportFileHint' })
    const Step1TextMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.Step1Text' })
    const Step2TextMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.Step2Text' })
    const Step3TextMsg = intl.formatMessage({ id: 'containers.FormTableExcelImport.Step3Text' })
    const StepHelpText = {
        1: Step1TextMsg,
        2: Step2TextMsg,
        3: Step3TextMsg,
    }

    function handleFile (file/*:File*/) {
        /* Boilerplate to set up FileReader */
        const reader = new FileReader()
        const rABS = !!reader.readAsBinaryString
        reader.onload = (e) => {
            /* Parse data */
            const bstr = e.target.result
            const wb = XLSX.read(bstr, { type: rABS ? 'binary' : 'array' })
            /* Get first worksheet */
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            /* Convert array of arrays */
            const cols = makeAntdCols(ws['!ref'], { render: renderCell })
            const data = makeAntdData(ws)
            setStep(2)
            setTableState((draft) => {
                draft.cols = cols
                draft.data = data
            })
        }
        if (rABS) {
            reader.readAsBinaryString(file)
        } else {
            reader.readAsArrayBuffer(file)
        }
    }

    function handleChangeMapping (mapping) {
        setTableState(draft => {
            console.log('reValidateExData', tableState.mapping, mapping, validators)
            reValidateExData(draft.data, draft.mapping, mapping, validators)
            draft.mapping = mapping
        })
    }

    function handleFinish () {
        setStep(step + 1)
        setExportedData(fromExData(tableState.data, tableState.mapping))
    }

    return <>
        <CreateFormListItemButton
            onClick={() => setStep(1)} label={ImportFromFileButtonLabelMsg}
            style={{ marginBottom: '16px', width: '100%', display: step === -1 ? 'block' : 'none' }}/>
        {(step > 0) ?
            <Progress percent={((step - 0) * 33.33)} strokeColor="#52c41a" showInfo={false}/>
            : null}
        {(StepHelpText[step]) ?
            <Typography.Paragraph>{StepHelpText[step]}</Typography.Paragraph>
            : null}

        <Upload.Dragger
            style={{ marginBottom: '16px', padding: '10px', display: step === 1 ? 'block' : 'none' }}
            accept={SHEET_JS_ACCEPT_FILES}
            showUploadList={false}
            customRequest={() => {}}
            action={handleFile}
        >
            <p className="ant-upload-drag-icon">
                <InboxOutlined/>
            </p>
            <p className="ant-upload-text">{ClickOrDragImportFileTextMsg}</p>
            <p className="ant-upload-hint">{ClickOrDragImportFileHintMsg}</p>
        </Upload.Dragger>

        <div style={{ marginBottom: '16px', display: step === 2 ? 'block' : 'none' }}>
            <Row>
                <Col xs={24} style={{
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    borderBottom: 'none',
                    padding: '8px',
                }}>
                    <MappingForm
                        columns={columns}
                        cols={tableState.cols}
                        onChangeMapping={handleChangeMapping}
                        onFinish={handleFinish}
                    />
                </Col>
            </Row>
            <Row style={{ 'overflowX': 'scroll' }}>
                <Col xs={24}>
                    <Table
                        size={'small'} bordered
                        columns={tableState.cols}
                        dataSource={tableState.data}
                        tableLayout={'fixed'}
                    />
                </Col>
            </Row>
        </div>
    </>
}

function renderCell (obj, record, rowIndex) {
    if (!obj) return null
    if (typeof obj !== 'object') return <ErrorText>!! RENDER-ERROR: {obj} !!</ErrorText>
    if (obj.status) {
        let text = obj.value
        switch (obj.status) {
            case 'ok':
                text = <OkText>{obj.value}</OkText>
                break
            case 'error':
                text = <ErrorText>{obj.value}</ErrorText>
                break
            case 'warn':
                text = <WarnText>{obj.value}</WarnText>
                break
        }
        return <Tooltip title={obj.message}>{text}</Tooltip>
    }
    return obj.value
}

function makeAntdCols (refstr, extra) {
    let o = [], C = XLSX.utils.decode_range(refstr).e.c + 1
    for (let i = 0; i < C; ++i) o[i] = {
        title: XLSX.utils.encode_col(i),
        key: i,
        dataIndex: i,
        ...extra,
    }
    return o
}

function makeAntdData (ws) {
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }).filter((x) => x.length)
    return toExData(data)
}

export default ExcelExporterButton
