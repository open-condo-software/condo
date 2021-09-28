import React, { useCallback, useRef } from 'react'
import {
    Columns,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    ProcessedRow,
} from '@condo/domains/common/utils/importer'
import { Modal, Popover, Typography, Space } from 'antd'
import { useImporter } from '@condo/domains/common/hooks/useImporter'
import { useIntl } from '@core/next/intl'
import {
    ModalContext,
    getUploadSuccessModalConfig,
    getUploadErrorModalConfig,
    getUploadProgressModalConfig,
    getPartlyLoadedModalConfig,
} from './ModalConfigs'
import { DataImporter } from '../DataImporter'
import styled from '@emotion/styled'
import { Button } from '../Button'
import { DownloadOutlined } from '@ant-design/icons'

interface IColumnsInfoBoxProps {
    columns: Columns
    exampleTemplateLink?: string | null
}

interface IImportProps {
    objectsName: string
    accessCheck: boolean
    onFinish(): void
    columns: Columns
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
    exampleTemplateLink?: string | null
}

const InfoBoxContainer = styled.div`
  max-width: 300px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`

const ColumnsInfoBox: React.FC<IColumnsInfoBoxProps> = ({ columns, exampleTemplateLink }) => {
    const intl = useIntl()
    const ColumnsFormatMessage = intl.formatMessage({ id: 'ImportRequiredColumnsFormat' })
    const RequiredFieldsMessage = intl.formatMessage({ id: 'ImportRequiredFields' })
    const DownloadExampleTitle = intl.formatMessage({ id: 'ImportDownloadExampleTitle' })

    const downloadExample = useCallback(
        (event) => {
            event.stopPropagation()
            const link = document.createElement('a')
            link.href = exampleTemplateLink
            link.target = '_blank'
            link.hidden = true
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
        },
        [exampleTemplateLink],
    )

    return (
        <Space direction={'vertical'} size={10}>
            <Typography.Text>
                {ColumnsFormatMessage}
            </Typography.Text>
            <InfoBoxContainer>
                {
                    columns.map((column, index) => {
                        return (
                            <>
                                {index !== 0 && ', '}
                                <Typography.Text keyboard key={column.name}>
                                    {column.required && (
                                        <Typography.Text type={'danger'} style={{ marginRight: 3 }}>
                                            <sup>*</sup>
                                        </Typography.Text>
                                    )}
                                    {column.name}
                                </Typography.Text>
                            </>
                        )
                    })
                }
            </InfoBoxContainer>
            <Typography.Text>
                <Typography.Text type={'danger'} style={{ marginRight: 3 }}>
                    <sup>*</sup>
                </Typography.Text>
                {` - ${RequiredFieldsMessage}`}
            </Typography.Text>
            {
                exampleTemplateLink !== null && (
                    <Button
                        onClick={downloadExample}
                        icon={<DownloadOutlined />}
                        type={'inlineLink'}
                    >{DownloadExampleTitle}</Button>
                )
            }
        </Space>
    )
}

export const ImportWrapper: React.FC<IImportProps> = (props) => {
    const {
        objectsName,
        accessCheck,
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
        onFinish,
        exampleTemplateLink = null,
    } = props
    const intl = useIntl()
    const ImportTitle = intl.formatMessage({ id:'Import' })
    const ImportSuccessMessage = intl.formatMessage({ id: 'ImportSuccess' },  { objects: objectsName })
    const ImportOKMessage = intl.formatMessage({ id: 'Continue' })
    const ImportDefaultErrorMessage = intl.formatMessage({ id: 'ImportError' })
    const ImportProcessingMessage = intl.formatMessage({ id:'ImportProcessing' })
    const ImportBreakButtonMessage = intl.formatMessage({ id:'Break' })
    const ImportPopoverTitle = intl.formatMessage({ id: 'containers.FormTableExcelImport.ClickOrDragImportFileHint' })
    const GetFailedDataMessage = intl.formatMessage({ id: 'GetFailedData' })
    const CloseMessage = intl.formatMessage({ id: 'Close' })

    const [modal, contextHolder] = Modal.useModal()
    const activeModal = useRef(null)

    const totalRowsRef = useRef(0)
    const setTotalRowsRef = (value: number) => {
        totalRowsRef.current = value
    }

    const successRowsRef = useRef(0)
    const setSuccessRowsRef = () => {
        successRowsRef.current = successRowsRef.current + 1
    }

    const errors = useRef([])
    const clearErrors = () => {
        errors.current.splice(0, errors.current.length)
    }
    const addError = (row: ProcessedRow) => {
        errors.current.push(row)
    }

    const destroyActiveModal = () => {
        if (activeModal.current) {
            activeModal.current.destroy()
            activeModal.current = null
        }
    }
    const [importData, progress, error, isImported, breakImport] = useImporter(
        columns, rowNormalizer, rowValidator, objectCreator,
        setTotalRowsRef, setSuccessRowsRef, addError,
        () => {
            const message = `${ImportSuccessMessage} [${successRowsRef.current}/${totalRowsRef.current}]`
            destroyActiveModal()
            if (errors.current.length > 0) {
                const config = getPartlyLoadedModalConfig(ImportTitle, message, GetFailedDataMessage, CloseMessage,
                    errors.current, columns)
                activeModal.current = modal.confirm(config)
            } else {
                const config = getUploadSuccessModalConfig(ImportTitle, message, ImportOKMessage)
                activeModal.current = modal.success(config)
            }
        },
        () => {
            destroyActiveModal()
            const config = getUploadErrorModalConfig(ImportTitle, ImportDefaultErrorMessage, ImportOKMessage)
            activeModal.current = modal.error(config)
        }
    )

    const handleUpload = useCallback((file) => {
        destroyActiveModal()
        const config = getUploadProgressModalConfig(ImportTitle, ImportProcessingMessage, ImportBreakButtonMessage,
            () => {
                breakImport()
                onFinish()
            })
        // @ts-ignore
        activeModal.current = modal.info(config)
        totalRowsRef.current = 0
        successRowsRef.current = 0
        if (errors.current.length > 0) clearErrors()
        importData(file.data)
    }, [])

    return (
        accessCheck && (
            <ModalContext.Provider value={{ progress, error, isImported }}>
                <DataImporter onUpload={handleUpload}>
                    <Popover
                        title={<Typography.Text style={{ fontWeight: 'bold' }}>{ImportPopoverTitle}</Typography.Text>}
                        content={<ColumnsInfoBox columns={columns} exampleTemplateLink={exampleTemplateLink}/>}
                    >{props.children}</Popover>
                </DataImporter>
                {contextHolder}
            </ModalContext.Provider>
        )
    )
}
