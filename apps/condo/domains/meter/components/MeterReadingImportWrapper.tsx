import { Col, Progress, Row, Space } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isDate from 'lodash/isDate'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import XLSX from 'xlsx'

import { Download, FileDown } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Card, CardBodyProps, CardHeaderProps, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { DataImporter } from '@condo/domains/common/components/DataImporter'
import { ImageContainer, StyledFocusContainer, SuccessModal } from '@condo/domains/common/components/Import/Index'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { Columns, MutationErrorsToMessagesType } from '@condo/domains/common/utils/importer'
import { useMeterImporter } from '@condo/domains/meter/hooks/useMeterImporter'
import { useProcessMeterReadings } from '@condo/domains/meter/hooks/useProcessMeterReadings'
import { ObjectsCreator, ProcessedChunk } from '@condo/domains/meter/utils/meterImporter'

export interface IMeterReadingImportWrapperProps {
    accessCheck: boolean
    onFinish: (variables: unknown) => void
    columns: Columns
    objectsCreator?: ObjectsCreator
    mutationErrorsToMessages?: MutationErrorsToMessagesType
    uploadButtonLabel?: string
    domainName: string
    importCardButton?: {
        header: Pick<CardHeaderProps, 'emoji' | 'headingTitle'>,
        body: Pick<CardBodyProps, 'description'>
    }
}

function fitToColumn (arrayOfArray) {
    return arrayOfArray[0].map((_, index) => (
        { wch: Math.max(...arrayOfArray.map(row => row[index] ? row[index].toString().length : 0)) }
    ))
}

type ActiveModalType = null | 'example' | 'progress' | 'partlyLoaded' | 'success' | 'error'

const MeterReadingImportWrapper: React.FC<IMeterReadingImportWrapperProps> = (props) => {
    const {
        accessCheck,
        columns,
        objectsCreator,
        onFinish: handleFinish,
        mutationErrorsToMessages,
        uploadButtonLabel,
        domainName,
        importCardButton,
    } = props
    const intl = useIntl()
    const ImportPluralMessage = intl.formatMessage({ id: `import.${domainName}.plural` })
    const ImportGenitiveMessage = intl.formatMessage({ id: `import.${domainName}.genitive` })
    const ImportPrepositionalMessage = intl.formatMessage({ id: `import.${domainName}.prepositional` })
    const ImportRequiredFieldsMessage = intl.formatMessage({ id: `import.${domainName}.requiredFields` })
    const ImportSuccessMessage = intl.formatMessage({ id: 'import.successModal.title' })
    const ImportDefaultErrorMessage = intl.formatMessage({ id: 'ImportError' })
    const GetFailedDataMessage = intl.formatMessage({ id: 'GetFailedData' })
    const UploadButtonLabel = uploadButtonLabel || intl.formatMessage({ id: 'import.uploadButtonLabel' })
    const UploadModalTitle = intl.formatMessage({ id: 'import.uploadModal.title' }, { plural: ImportPluralMessage.toLowerCase() })
    const ChooseFileForUploadLabel = intl.formatMessage({ id: 'import.uploadModal.chooseFileForUpload' })
    const RequiredFieldsTitle = intl.formatMessage({ id: 'import.uploadModal.requiredFields.title' })
    const UploadModalMessage = intl.formatMessage({ id: 'import.uploadModal.message' }, { prepositional: ImportPrepositionalMessage.toLowerCase() })
    const ExampleLinkMessage = intl.formatMessage({ id: 'import.uploadModal.exampleLinkMessage' }, { genitive: ImportGenitiveMessage.toLowerCase() })
    const ProgressModalTitle = intl.formatMessage({ id: 'import.progressModal.title' })
    const ProgressModalMessage = intl.formatMessage({ id: 'import.progressModal.message' })
    const ProgressModalDescription = intl.formatMessage({ id: 'import.progressModal.description' })
    const PartlyDataLoadedModalTitle = intl.formatMessage({ id: 'import.partlyDataLoadedModal.title' })
    const PartlyDataLoadedModalAlertMessage = intl.formatMessage({ id: 'import.partlyDataLoadedModal.alert.message' })
    const PartlyDataLoadedModalAlertDescription = intl.formatMessage({ id: 'import.partlyDataLoadedModal.alert.description' })
    const ErrorModalTitle = intl.formatMessage({ id: 'import.errorModal.title' }, { plural: ImportPluralMessage })
    const SuccessModalButtonLabel = intl.formatMessage({ id: 'import.successModal.buttonLabel' })
    const ErrorsMessage = intl.formatMessage({ id: 'import.Errors' })

    const exampleTemplateLink = useMemo(() => `/import/${domainName}/${intl.locale}/${domainName}-import-example.xlsx`, [domainName, intl.locale])
    const exampleImageSrc = useMemo(() => `/import/${domainName}/${intl.locale}/${domainName}-import-example.webp`, [domainName, intl.locale])

    const { logEvent, getEventName } = useTracking()

    const [activeModal, setActiveModal] = useState<ActiveModalType>(null)

    const totalRef = useRef(0)
    const setTotalRef = (value: number) => {
        totalRef.current = value
    }

    const successRef = useRef(0)
    const setSuccessRef = (n = 50) => {
        successRef.current = successRef.current + n
    }

    const errors = useRef([])
    const clearErrors = () => {
        errors.current.splice(0, errors.current.length)
    }
    const handleChunkError = (chunk: ProcessedChunk) => {
        errors.current.push(chunk)
    }

    const [processMeterReadings] = useProcessMeterReadings()

    const [importData, progress, error, breakImport] = useMeterImporter({
        columns,
        objectsCreator,
        setTotal: setTotalRef,
        setSuccess: setSuccessRef,
        handleError: handleChunkError,
        onFinish: () => {
            setActiveModal(errors.current.length > 0 ? 'partlyLoaded' : 'success')

            const eventName = getEventName(TrackingEventType.ImportComplete)
            logEvent({ eventName })
            if (isFunction(handleFinish)) {
                handleFinish()
            }
        },
        onError: () => {
            setActiveModal('error')
        },
        mutationErrorsToMessages,
    })

    const handleUpload = useCallback((file) => {
        setActiveModal('progress')

        const processedReadings = processMeterReadings(file.data)

        totalRef.current = 0
        successRef.current = 0
        if (errors.current.length > 0) clearErrors()

        importData(processedReadings)
    }, [importData, processMeterReadings])

    const handleDownloadPartyLoadedData = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                const erroredRows = errors.current
                const data = [columns.map(column => column.name).concat([ErrorsMessage])]

                for (let i = 0; i < erroredRows.length; i++) {
                    const line = erroredRows[i].originalRow.map(cell => {
                        if (!cell.value) return null
                        if (isDate(cell.value)) {
                            return dayjs(cell.value).format('DD.MM.YYYY')
                        }
                        return String(cell.value)
                    })
                    line.push(erroredRows[i].errors ? erroredRows[i].errors.join(', \n') : null)
                    data.push(line)
                }

                const wb = XLSX.utils.book_new()
                const ws = XLSX.utils.aoa_to_sheet(data)
                ws['!cols'] = fitToColumn(data)
                XLSX.utils.book_append_sheet(wb, ws, 'table')
                XLSX.writeFile(wb, `${domainName}_failed_data.xlsx`)
            } catch (e) {
                reject(e)
            } finally {
                resolve()
            }
        })
    }, [ErrorsMessage, columns, domainName])

    const closeModal = useCallback(() => setActiveModal(null), [])

    const handleBreakImport = useCallback(() => {
        closeModal()
        breakImport()
        if (isFunction(handleFinish)) {
            handleFinish()
        }
    }, [breakImport, closeModal, handleFinish])

    return (
        accessCheck && (
            <>
                {
                    importCardButton ? (
                        <Card.CardButton
                            {...importCardButton}
                            onClick={() => setActiveModal('example')}
                        />
                    ) : (
                        <Button
                            type='secondary'
                            icon={<FileDown size='medium'/>}
                            onClick={() => setActiveModal('example')}
                        >
                            {UploadButtonLabel}
                        </Button>
                    )
                }
                <Modal
                    title={UploadModalTitle}
                    onCancel={closeModal}
                    open={activeModal === 'example'}
                    footer={
                        <DataImporter onUpload={handleUpload}>
                            <Button type='primary'>
                                {ChooseFileForUploadLabel}
                            </Button>
                        </DataImporter>
                    }
                >
                    <Space direction='vertical' size={24}>
                        <Typography.Text>
                            {UploadModalMessage}
                        </Typography.Text>
                        <ImageContainer>
                            <img alt='example-import-image' src={exampleImageSrc} />
                        </ImageContainer>
                        <Alert
                            showIcon
                            type='info'
                            message={RequiredFieldsTitle}
                            description={ImportRequiredFieldsMessage}
                        />
                        <Space size={8} align='center'>
                            <Download size='small' />
                            <Typography.Link
                                href={exampleTemplateLink}
                                target='_blank'
                            >
                                {ExampleLinkMessage}
                            </Typography.Link>
                        </Space>
                    </Space>
                </Modal>
                <Modal
                    title={ProgressModalTitle}
                    open={activeModal === 'progress'}
                    onCancel={handleBreakImport}
                >
                    <StyledFocusContainer>
                        <Row gutter={[0, 32]} justify='center' align='middle'>
                            <Col>
                                <img alt='progress-image' src='/progressDino.png' />
                            </Col>
                            <Col>
                                <Space size={16} direction='vertical'>
                                    <Typography.Title level={3}>{ProgressModalMessage}</Typography.Title>
                                    <Typography.Text type='secondary'>{ProgressModalDescription}</Typography.Text>
                                </Space>
                            </Col>
                            <Col span={24}>
                                <Progress
                                    format={(percent) => <Typography.Text strong>{Math.floor(percent)}%</Typography.Text>}
                                    percent={progress}
                                    status='active'
                                    strokeColor={colors.brandGradient[5]}
                                />
                            </Col>
                        </Row>
                    </StyledFocusContainer>
                </Modal>
                <Modal
                    title={PartlyDataLoadedModalTitle}
                    open={activeModal === 'partlyLoaded'}
                    onCancel={closeModal}
                    footer={
                        <Button
                            type='primary'
                            onClick={handleDownloadPartyLoadedData}
                        >
                            {GetFailedDataMessage}
                        </Button>
                    }
                >
                    <Alert
                        type='warning'
                        showIcon
                        message={
                            PartlyDataLoadedModalAlertMessage
                                .replace('{success}', successRef.current)
                                .replace('{total}', totalRef.current)
                                .replace('{genitive}', ImportGenitiveMessage.toLowerCase())
                        }
                        description={PartlyDataLoadedModalAlertDescription}
                    />
                </Modal>
                <Modal
                    title={ErrorModalTitle}
                    open={activeModal === 'error'}
                    onCancel={closeModal}
                    footer={
                        <DataImporter onUpload={handleUpload}>
                            <Button type='primary'>
                                {ChooseFileForUploadLabel}
                            </Button>
                        </DataImporter>
                    }
                >
                    <Alert
                        type='error'
                        showIcon
                        message={get(error, 'title')}
                        description={get(error, 'message', ImportDefaultErrorMessage)}
                    />
                </Modal>
                <SuccessModal
                    title={ImportSuccessMessage}
                    open={activeModal === 'success'}
                    onCancel={closeModal}
                    footer={
                        <Button
                            type='primary'
                            onClick={closeModal}
                        >
                            {SuccessModalButtonLabel}
                        </Button>
                    }
                >
                    <StyledFocusContainer>
                        <img alt='success-image' src='/successDino.webp' />
                    </StyledFocusContainer>
                </SuccessModal>
            </>
        )
    )
}

export {
    MeterReadingImportWrapper,
}
