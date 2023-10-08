import { DownloadOutlined } from '@ant-design/icons'
import { Modal, Popover, Typography, Space } from 'antd'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import { useImporter } from '@condo/domains/common/hooks/useImporter'
import {
    Columns,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    ProcessedRow,
    MutationErrorsToMessagesType,
} from '@condo/domains/common/utils/importer'


import {
    ModalContext,
    getUploadSuccessModalConfig,
    getUploadErrorModalConfig,
    getUploadProgressModalConfig,
    getPartlyLoadedModalConfig,
} from './ModalConfigs'

import { Button } from '../Button'
import { DataImporter } from '../DataImporter'



interface IColumnsInfoBoxProps {
    columns: Columns
    domainTranslate: string
    exampleTemplateLink?: string | null
}

interface IImportWrapperProps {
    objectsName: string
    accessCheck: boolean
    onFinish: (variables: unknown) => void
    columns: Columns
    maxTableLength?: number
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
    domainTranslate: string
    exampleTemplateLink?: string | null
    mutationErrorsToMessages?: MutationErrorsToMessagesType
}

const ColumnsInfoBox: React.FC<IColumnsInfoBoxProps> = ({ columns, domainTranslate, exampleTemplateLink }) => {
    const intl = useIntl()
    const ColumnsFormatMessage = intl.formatMessage({ id: 'ImportRequiredColumnsFormat' }, {
        domain: domainTranslate,
    })
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

    const fieldsString = columns.filter(({ required }) => required).map(column => `"${column.name}"`).join(', ')

    return (
        <Space direction='vertical' size={10} style={{ maxWidth: 300 }}>
            <Typography.Text>
                {ColumnsFormatMessage}
            </Typography.Text>
            <Typography.Text>{RequiredFieldsMessage}: {fieldsString}</Typography.Text>
            {
                exampleTemplateLink !== null && (
                    <Button
                        onClick={downloadExample}
                        icon={<DownloadOutlined />}
                        type='inlineLink'
                    >{DownloadExampleTitle}</Button>
                )
            }
        </Space>
    )
}

const ImportWrapper: React.FC<IImportWrapperProps> = (props) => {
    const {
        objectsName,
        accessCheck,
        columns,
        maxTableLength,
        rowNormalizer,
        rowValidator,
        objectCreator,
        onFinish: handleFinish,
        domainTranslate,
        exampleTemplateLink = null,
        mutationErrorsToMessages,
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

    const { logEvent, getEventName } = useTracking()

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
    const handleRowError = (row: ProcessedRow) => {
        errors.current.push(row)
    }

    const destroyActiveModal = () => {
        if (activeModal.current) {
            activeModal.current.destroy()
            activeModal.current = null
        }
    }
    const [importData, progress, error, isImported, breakImport] = useImporter({
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
        maxTableLength,
        setTotalRows: setTotalRowsRef,
        setSuccessRows: setSuccessRowsRef,
        handleRowError,
        onFinish: () => {
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
            const eventName = getEventName(TrackingEventType.ImportComplete)
            logEvent({ eventName })
            if (isFunction(handleFinish)) {
                handleFinish()
            }
        },
        onError: () => {
            destroyActiveModal()
            const config = getUploadErrorModalConfig(ImportTitle, ImportDefaultErrorMessage, ImportOKMessage)
            activeModal.current = modal.error(config)
        },
        mutationErrorsToMessages,
    })

    const handleUpload = useCallback((file) => {
        destroyActiveModal()
        const config = getUploadProgressModalConfig(ImportTitle, ImportProcessingMessage, ImportBreakButtonMessage,
            () => {
                breakImport()
                if (isFunction(handleFinish)) {
                    handleFinish()
                }
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
                        content={<ColumnsInfoBox
                            columns={columns}
                            exampleTemplateLink={exampleTemplateLink}
                            domainTranslate={domainTranslate}
                        />}
                    >
                        {props.children}
                    </Popover>
                </DataImporter>
                {contextHolder}
            </ModalContext.Provider>
        )
    )
}

ImportWrapper.defaultProps = {
    maxTableLength: DEFAULT_RECORDS_LIMIT_FOR_IMPORT,
}

export {
    ImportWrapper,
}
