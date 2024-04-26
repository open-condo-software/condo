import { Col, Progress, Row, Space } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import XLSX from 'xlsx'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Download, FileDown, QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Card, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import {
    fitToColumn,
    IImportWrapperProps,
    ImageContainer,
    IMPORT_EVENT,
    ImportEmitter,
    StyledFocusContainer,
    SuccessModal,
} from '@condo/domains/common/components/Import/Index'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { TrackingEventType, useTracking } from '@condo/domains/common/components/TrackingContext'
import { IMPORT_HELP_MODAL } from '@condo/domains/common/constants/featureflags'
import { useImportHelpModal } from '@condo/domains/common/hooks/useImportHelpModal'
import { MetersDataImporter } from '@condo/domains/meter/components/MetersDataImporter'
import { TOnMetersUpload } from '@condo/domains/meter/components/MetersDataImporterTypes'
import { useMetersImporter } from '@condo/domains/meter/hooks/useMetersImporter'
import { ProcessedRow } from '@condo/domains/meter/utils/metersImporters/AbstractMetersImporter'

export type IMetersImportWrapperProps = Pick<IImportWrapperProps, 'accessCheck' | 'onFinish' | 'uploadButtonLabel' | 'importCardButton'>

type ActiveModalType = null | 'example' | 'progress' | 'partlyLoaded' | 'success' | 'error'

const MetersImportWrapper: React.FC<IMetersImportWrapperProps> = (props) => {
    const {
        accessCheck,
        onFinish: handleFinish,
        uploadButtonLabel,
        importCardButton,
    } = props
    const intl = useIntl()
    const domain = 'meter'

    const ImportGenitiveMessage = intl.formatMessage({ id: `import.${domain}.genitive` })

    const ImportPluralMessage = intl.formatMessage({ id: `import.${domain}.plural` })
    const ChooseFileForUploadLabel = intl.formatMessage({ id: 'import.uploadModal.chooseFileForUpload' })
    const ErrorModalTitle = intl.formatMessage({ id: 'import.errorModal.title' }, { plural: ImportPluralMessage })
    const ErrorsMessage = intl.formatMessage({ id: 'import.Errors' })
    const ExampleLinkMessage = intl.formatMessage({ id: 'import.uploadModal.exampleLinkMessage' }, { genitive: ImportGenitiveMessage.toLowerCase() })
    const GetFailedDataMessage = intl.formatMessage({ id: 'GetFailedData' })
    const ImportDefaultErrorMessage = intl.formatMessage({ id: 'ImportError' })
    const ImportPrepositionalMessage = intl.formatMessage({ id: `import.${domain}.prepositional` })
    const ImportRequiredFieldsMessage = intl.formatMessage({ id: `import.${domain}.requiredFields` })
    const ImportSuccessMessage = intl.formatMessage({ id: 'import.successModal.title' })
    const NeedHelpMessage = intl.formatMessage({ id: 'import.uploadModal.needHelp' })
    const PartlyDataLoadedModalAlertDescription = intl.formatMessage({ id: 'import.partlyDataLoadedModal.alert.description' })
    const PartlyDataLoadedModalAlertMessage = intl.formatMessage({ id: 'import.partlyDataLoadedModal.alert.message' })
    const PartlyDataLoadedModalTitle = intl.formatMessage({ id: 'import.partlyDataLoadedModal.title' })
    const ProgressModalDescription = intl.formatMessage({ id: 'import.progressModal.description' })
    const ProgressModalMessage = intl.formatMessage({ id: 'import.progressModal.message' })
    const ProgressModalTitle = intl.formatMessage({ id: 'import.progressModal.title' })
    const RequiredFieldsTitle = intl.formatMessage({ id: 'import.uploadModal.requiredFields.title' })
    const SuccessModalButtonLabel = intl.formatMessage({ id: 'import.successModal.buttonLabel' })
    const UploadButtonLabel = uploadButtonLabel || intl.formatMessage({ id: 'import.uploadButtonLabel' })
    const UploadModalMessage = intl.formatMessage({ id: 'import.uploadModal.message' }, { prepositional: ImportPrepositionalMessage.toLowerCase() })
    const UploadModalTitle = intl.formatMessage({ id: 'import.uploadModal.title' }, { plural: ImportPluralMessage.toLowerCase() })

    const exampleTemplateLink = useMemo(() => `/import/${domain}/${intl.locale}/${domain}-import-example.xlsx`, [domain, intl.locale])
    const exampleImageSrc = useMemo(() => `/import/${domain}/${intl.locale}/${domain}-import-example.webp`, [domain, intl.locale])

    const { logEvent, getEventName } = useTracking()

    const [activeModal, setActiveModal] = useState<ActiveModalType>(null)

    useEffect(() => {
        if (typeof activeModal !== 'undefined') {
            ImportEmitter.emit(IMPORT_EVENT, { domain: domain, status: activeModal })
        }
    }, [activeModal])

    const { Modal: ImportHelpModal, openImportHelpModal } = useImportHelpModal({ domainName: domain })
    const { useFlag } = useFeatureFlags()
    const isImportHelpModalEnabled = useFlag(IMPORT_HELP_MODAL)

    const totalRowsRef = useRef(0)
    const setTotalRowsRef = (value: number) => {
        totalRowsRef.current = value
    }
    const dataTypeRef = useRef(null)

    const successRowsRef = useRef(0)
    const setSuccessRowsRef = () => {
        successRowsRef.current ++
    }

    const errors = useRef([])
    const clearErrors = () => {
        errors.current.splice(0, errors.current.length)
    }
    const handleRowError = (row: ProcessedRow) => {
        errors.current.push(row)
    }

    const [importData, progress, error, isImported, breakImport, columnsHeadersResolver] = useMetersImporter({
        setTotalRows: setTotalRowsRef,
        setSuccessRows: setSuccessRowsRef,
        handleRowError,
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
    })

    const handleUpload = useCallback<TOnMetersUpload>((dataType, colsData) => {
        setActiveModal('progress')

        totalRowsRef.current = 0
        successRowsRef.current = 0
        dataTypeRef.current = dataType
        if (errors.current.length > 0) clearErrors()
        importData(dataType, colsData)
    }, [importData])

    const handleDownloadPartyLoadedData = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            try {
                const erroredRows = errors.current
                const columnsHeaders = columnsHeadersResolver(dataTypeRef.current)
                const data = []
                if (columnsHeaders) {
                    data.push(columnsHeaders.map(column => column.name).concat([ErrorsMessage]))
                }

                for (let i = 0; i < erroredRows.length; i++) {
                    const line = erroredRows[i].originalRow.map((cell) => {
                        if (!cell) return null
                        return String(cell)
                    })
                    line.push(erroredRows[i].errors ? erroredRows[i].errors.join(', \n') : null)
                    data.push(line)
                }

                const wb = XLSX.utils.book_new()
                const ws = XLSX.utils.aoa_to_sheet(data)
                ws['!cols'] = fitToColumn(data)
                XLSX.utils.book_append_sheet(wb, ws, 'table')
                XLSX.writeFile(wb, `${domain}_failed_data.xlsx`)
            } catch (e) {
                reject(e)
            } finally {
                resolve()
            }
        })
    }, [ErrorsMessage, columnsHeadersResolver])

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
                        <Space size={16} direction='horizontal'>
                            {
                                isImportHelpModalEnabled && (
                                    <LinkWithIcon
                                        title={NeedHelpMessage}
                                        size='medium'
                                        PostfixIcon={QuestionCircle}
                                        onClick={() => {
                                            setActiveModal(null)
                                            openImportHelpModal()
                                        }}
                                    />
                                )
                            }
                            <MetersDataImporter onUpload={handleUpload}>
                                <Button type='primary'>
                                    {ChooseFileForUploadLabel}
                                </Button>
                            </MetersDataImporter>
                        </Space>
                    }
                >
                    <Space direction='vertical' size={24}>
                        <Typography.Text>
                            {UploadModalMessage}
                        </Typography.Text>
                        <ImageContainer>
                            <img alt='example-import-image' src={exampleImageSrc}/>
                        </ImageContainer>
                        <Alert
                            showIcon
                            type='info'
                            message={RequiredFieldsTitle}
                            description={ImportRequiredFieldsMessage}
                        />
                        <Space size={8} align='center'>
                            <Download size='small'/>
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
                                <img alt='progress-image' src='/progressDino.png'/>
                            </Col>
                            <Col>
                                <Space size={16} direction='vertical'>
                                    <Typography.Title level={3}>{ProgressModalMessage}</Typography.Title>
                                    <Typography.Text type='secondary'>{ProgressModalDescription}</Typography.Text>
                                </Space>
                            </Col>
                            <Col span={24}>
                                <Progress
                                    format={(percent) => <Typography.Text
                                        strong>{Math.floor(percent)}%</Typography.Text>}
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
                                .replace('{success}', successRowsRef.current)
                                .replace('{total}', totalRowsRef.current)
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
                        <MetersDataImporter onUpload={handleUpload}>
                            <Button type='primary'>
                                {ChooseFileForUploadLabel}
                            </Button>
                        </MetersDataImporter>
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
                        <img alt='success-image' src='/successDino.webp'/>
                    </StyledFocusContainer>
                </SuccessModal>
                <ImportHelpModal/>
            </>
        )
    )
}

export {
    MetersImportWrapper,
}
