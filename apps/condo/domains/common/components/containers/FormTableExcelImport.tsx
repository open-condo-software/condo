import { InboxOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Button, Col, Form, Progress, Row, Table, Typography, Upload } from 'antd'
import React, { useEffect, useState } from 'react'
import { useImmer } from 'use-immer'
import XLSX from 'xlsx'

import { useIntl } from '@open-condo/next/intl'

import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { TABLE_UPLOAD_ACCEPT_FILES } from '@condo/domains/common/constants/fileExtensions'
import {
    defaultValidator,
    fromExData,
    makeAntdCols,
    makeAntdData,
    reValidateExData,
} from '@condo/domains/common/utils/excel.utils'

import { CreateFormListItemButton } from './FormList'

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
    const intl = useIntl()
    const ColumnMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.column' })
    const SelectColumnMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.selectColumn' })
    const NextStepButtonLabel = intl.formatMessage({ id: 'containers.formTableExcelImport.nextStepButtonLabel' })

    const [form] = Form.useForm()
    const [values, setValues] = useState({})

    function handleChanges (changedValues, allValues: Record<string, string>) {
        const titleToIndex = Object.fromEntries(cols.map((col) => [col.title, col.dataIndex]))
        const remapped = Object.fromEntries(
            Object.entries(allValues)
                .filter(([, v]) => v)
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
            placeholder={SelectColumnMessage}
            optionFilterProp='children'
            filterOption={(input, option) =>
                String(option.children).toLowerCase().indexOf(input.toLowerCase()) >= 0
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
        layout='horizontal'
        size='small'
        form={form}
        onValuesChange={handleChanges}
        onFinish={onFinish}
    >
        {/* disable chrome autofill hack 1*/}
        <Form.Item label='Hidden' name='name1' style={{ display: 'none' }}>
            <Input/>
        </Form.Item>
        {columns.map((column, index) => {
            return <Form.Item key={index} label={[ColumnMessage, ' "', column.title, '"']} name={column.dataIndex}>
                {selectColumnComponent}
            </Form.Item>
        })}
        <Form.Item>
            <Button type='primary' htmlType='submit'>{NextStepButtonLabel}</Button>
        </Form.Item>
    </Form>
}

function ExcelExporterButton ({ columns, setExportedData }) {
    if (!columns) throw new Error('no columns prop')

    const intl = useIntl()
    const ImportFromFileButtonLabel = intl.formatMessage({ id: 'containers.formTableExcelImport.importFromFileButtonLabel' })
    const ClickOrDragImportFileTextMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.clickOrDragImportFileText' })
    const ClickOrDragImportFileHintMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.clickOrDragImportFileHint' })
    const Step1TextMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.step1Text' })
    const Step2TextMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.step2Text' })
    const Step3TextMessage = intl.formatMessage({ id: 'containers.formTableExcelImport.step3Text' })
    const StepHelpText = {
        1: Step1TextMessage,
        2: Step2TextMessage,
        3: Step3TextMessage,
    }

    const [step, setStep] = useState(-1)
    const [tableState, setTableState] = useImmer({ data: [], cols: [], mapping: {} })
    const validators = Object.fromEntries(columns.map(column => [column.dataIndex, column.importValidator || defaultValidator]))

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
            // @ts-ignore
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

        return ''
    }

    function handleChangeMapping (mapping) {
        setTableState(draft => {
            reValidateExData(draft.data, draft.mapping, mapping, validators)
            draft.mapping = mapping
        })
    }

    function handleFinish () {
        setStep(step + 1)
        setExportedData(fromExData(tableState.data, tableState.mapping))
    }

    const formattedFiles = TABLE_UPLOAD_ACCEPT_FILES.map(function (x) { return '.' + x }).join(',')

    // @ts-ignore
    return <>
        <CreateFormListItemButton
            onClick={() => setStep(1)} label={ImportFromFileButtonLabel}
            style={{ marginBottom: '16px', width: '100%', display: step === -1 ? 'block' : 'none' }}/>
        {(step > 0) ?
            <Progress percent={(step * 33.33)} strokeColor='#52c41a' showInfo={false}/>
            : null}
        {(StepHelpText[step]) ?
            <Typography.Paragraph>{StepHelpText[step]}</Typography.Paragraph>
            : null}

        <Upload.Dragger
            style={{ marginBottom: '16px', padding: '10px', display: step === 1 ? 'block' : 'none' }}
            accept={formattedFiles}
            showUploadList={false}
            // TODO(pahaz): is the customRequest required?: customRequest={() => {}}
            action={handleFile}
        >
            <p className='ant-upload-drag-icon'>
                <InboxOutlined/>
            </p>
            <p className='ant-upload-text'>{ClickOrDragImportFileTextMessage}</p>
            <p className='ant-upload-hint'>{ClickOrDragImportFileHintMessage}</p>
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
                        size='small' bordered
                        columns={tableState.cols}
                        dataSource={tableState.data}
                        tableLayout='fixed'
                    />
                </Col>
            </Row>
        </div>
    </>
}

function renderCell (obj) {
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

export default ExcelExporterButton
