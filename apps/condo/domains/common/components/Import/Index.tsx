import styled from '@emotion/styled'
import { Col, Progress, Row, Space } from 'antd'
import dayjs from 'dayjs'
import { EventEmitter } from 'eventemitter3'
import get from 'lodash/get'
import isDate from 'lodash/isDate'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import XLSX from 'xlsx'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Download, FileDown, QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Card, CardBodyProps, CardHeaderProps, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { DataImporter } from '@condo/domains/common/components/DataImporter'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { IMPORT_HELP_MODAL } from '@condo/domains/common/constants/featureflags'
import { useImporter } from '@condo/domains/common/hooks/useImporter'
import { useImportHelpModal } from '@condo/domains/common/hooks/useImportHelpModal'
import {
    Columns,
    RowNormalizer,
    RowValidator,
    ObjectCreator,
    ProcessedRow,
    MutationErrorsToMessagesType,
} from '@condo/domains/common/utils/importer'


export interface IImportWrapperProps {
    accessCheck: boolean
    onFinish: (variables: unknown) => void
    columns: Columns
    rowNormalizer: RowNormalizer
    rowValidator: RowValidator
    objectCreator: ObjectCreator
    mutationErrorsToMessages?: MutationErrorsToMessagesType
    uploadButtonLabel?: string
    domainName: string
    importCardButton?: {
        header: Pick<CardHeaderProps, 'emoji' | 'headingTitle'>,
        body: Pick<CardBodyProps, 'description'>
    }
}

const ImageContainer = styled.div`
  height: 150px;
  width: 100%;
  border-radius: 12px;
  padding: 16px;
  background-color: ${colors.gray[3]};
  display: flex;
  align-items: center;
  justify-content: center;
  
  & img {
    width: 100%;
    height: 120px;
    border-radius: 12px;
  }
`

const StyledFocusContainer = styled(FocusContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: 32px 24px;
  text-align: center;

  & img {
    height: 240px;
  }
`

const SuccessModal = styled(Modal)`
  &.condo-modal > .condo-modal-content {
    & > .condo-modal-body {
      padding-bottom: 20px;
    }

    & > .condo-modal-footer {
      border-top: none;
    }
  }
`

function fitToColumn (arrayOfArray) {
    return arrayOfArray[0].map((_, index) => (
        { wch: Math.max(...arrayOfArray.map(row => row[index] ? row[index].toString().length : 0)) }
    ))
}

const eventEmitter = new EventEmitter()
export const IMPORT_EVENT = 'ImportEvent'
export const ImportEmitter = {
    addListener: (event, fn) => eventEmitter.addListener(event, fn),
    removeListener: (event, fn) => eventEmitter.removeListener(event, fn),
    emit: (event, payload) => eventEmitter.emit(event, payload),
}

type ActiveModalType = null | 'example' | 'progress' | 'partlyLoaded' | 'success' | 'error'

const ImportWrapper: React.FC<IImportWrapperProps> = (props) => {
    const {
        accessCheck,
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
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
    const NeedHelpMessage = intl.formatMessage({ id: 'import.uploadModal.needHelp' })

    const exampleTemplateLink = useMemo(() => `/import/${domainName}/${intl.locale}/${domainName}-import-example.xlsx`, [domainName, intl.locale])
    const exampleImageSrc = useMemo(() => `/import/${domainName}/${intl.locale}/${domainName}-import-example.webp`, [domainName, intl.locale])

    const { logEvent, getEventName } = useTracking()

    const [activeModal, setActiveModal] = useState<ActiveModalType>()

    useEffect(() => {
        if (typeof activeModal !== 'undefined') {
            ImportEmitter.emit(IMPORT_EVENT, { domain: domainName, status: activeModal })
        }
    }, [activeModal])

    const { Modal: ImportHelpModal, openImportHelpModal } = useImportHelpModal({ domainName })
    const { useFlag } = useFeatureFlags()
    const isImportHelpModalEnabled = useFlag(IMPORT_HELP_MODAL)

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

    const [importData, progress, error, isImported, breakImport] = useImporter({
        columns,
        rowNormalizer,
        rowValidator,
        objectCreator,
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
        mutationErrorsToMessages,
    })

    const handleUpload = useCallback((file) => {
        setActiveModal('progress')

        totalRowsRef.current = 0
        successRowsRef.current = 0
        if (errors.current.length > 0) clearErrors()
        importData(file.data)
    }, [importData])

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
                            <DataImporter onUpload={handleUpload}>
                                <Button type='primary'>
                                    {ChooseFileForUploadLabel}
                                </Button>
                            </DataImporter>
                        </Space>
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
                        <LinkWithIcon
                            title={ExampleLinkMessage}
                            size='medium'
                            PrefixIcon={Download}
                            href={exampleTemplateLink}
                            target='_blank'
                        />
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
                <ImportHelpModal />
            </>
        )
    )
}

export {
    ImportWrapper,
}
