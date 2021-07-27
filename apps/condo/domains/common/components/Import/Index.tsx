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

interface IColumnsInfoBoxProps {
    columns: Columns
}

interface IImportProps {
    objectsName: string
    accessCheck: boolean
    onFinish(): void
    columns: Columns
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
}

const InfoBoxContainer = styled.div`
  max-width: 300px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`

const ColumnsInfoBox: React.FC<IColumnsInfoBoxProps> = ({ columns }) => {
    const intl = useIntl()
    const ColumnsFormatMessage = intl.formatMessage({ id: 'ImportRequiredColumnsFormat' })
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
                                    {column.name}
                                </Typography.Text>
                            </>
                        )
                    })
                }
            </InfoBoxContainer>
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
                    <Popover title={ImportPopoverTitle} content={<ColumnsInfoBox columns={columns}/>}>
                        {props.children}
                    </Popover>
                </DataImporter>
                {contextHolder}
            </ModalContext.Provider>
        )
    )
}