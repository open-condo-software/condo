import styled from '@emotion/styled'
import { Col, Progress, Row, Space } from 'antd'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { Download, QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Card, CardBodyProps, CardHeaderProps, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { useImportHelpModal } from '@condo/domains/common/hooks/useImportHelpModal'

const ImageContainer = styled.div`
  height: 150px;
  width: 100%;
  border-radius: 12px;
  padding: 16px;
  background-color: ${colors.gray[1]};
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

export type ActiveModalType = null | 'example' | 'progress' | 'partlyLoaded' | 'success' | 'error'
export type ExtraModalContentType = Record<Extract<ActiveModalType, 'example'>, JSX.Element>

type TBaseImportWrapperProps = {
    importCardButton?: {
        header: Pick<CardHeaderProps, 'emoji' | 'headingTitle'>
        body: Pick<CardBodyProps, 'description'>
    }
    setActiveModal: (type: ActiveModalType) => void
    domainName: string
    uploadButtonLabel?: string
    closeModal: () => void
    activeModal: ActiveModalType
    handleBreakImport: () => void
    progress: any
    handleDownloadPartyLoadedData: () => Promise<void>
    successRowsRef: React.MutableRefObject<number>
    totalRowsRef: React.MutableRefObject<number>
    error: any
    dataImporter: JSX.Element
    extraModalContent?: ExtraModalContentType
}

const BaseImportWrapper: React.FC<TBaseImportWrapperProps> = (props) => {
    const {
        importCardButton,
        setActiveModal,
        domainName,
        uploadButtonLabel,
        closeModal,
        activeModal,
        handleBreakImport,
        progress,
        handleDownloadPartyLoadedData,
        successRowsRef,
        totalRowsRef,
        error,
        dataImporter,
        extraModalContent = {},
    } = props

    const intl = useIntl()
    const ImportPluralMessage = intl.formatMessage({ id: `import.${domainName}.plural` as FormatjsIntl.Message['ids'] })
    const ImportGenitiveMessage = intl.formatMessage({ id: `import.${domainName}.genitive` as FormatjsIntl.Message['ids'] })
    const ImportRequiredFieldsMessage = intl.formatMessage({ id: `import.${domainName}.requiredFields` as FormatjsIntl.Message['ids'] })
    const ImportSuccessMessage = intl.formatMessage({ id: 'import.successModal.title' })
    const ImportDefaultErrorMessage = intl.formatMessage({ id: 'ImportError' })
    const GetFailedDataMessage = intl.formatMessage({ id: 'GetFailedData' })
    const UploadButtonLabel = uploadButtonLabel || intl.formatMessage({ id: 'import.uploadButtonLabel' })
    const UploadModalTitle = intl.formatMessage({ id: 'import.uploadModal.title' }, { plural: ImportPluralMessage.toLowerCase() })
    const RequiredFieldsTitle = intl.formatMessage({ id: 'import.uploadModal.requiredFields.title' })
    const UploadModalMessage = intl.formatMessage({ id: 'import.uploadModal.message' })
    const ExampleLinkMessage = intl.formatMessage({ id: 'import.uploadModal.exampleLinkMessage' }, { genitive: ImportGenitiveMessage.toLowerCase() })
    const ProgressModalTitle = intl.formatMessage({ id: 'import.progressModal.title' })
    const ProgressModalMessage = intl.formatMessage({ id: 'import.progressModal.message' })
    const ProgressModalDescription = intl.formatMessage({ id: 'import.progressModal.description' })
    const PartlyDataLoadedModalTitle = intl.formatMessage({ id: 'import.partlyDataLoadedModal.title' })
    const PartlyDataLoadedModalAlertMessage = intl.formatMessage({ id: 'import.partlyDataLoadedModal.alert.message' })
    const PartlyDataLoadedModalAlertDescription = intl.formatMessage({ id: 'import.partlyDataLoadedModal.alert.description' })
    const ErrorModalTitle = intl.formatMessage({ id: 'import.errorModal.title' }, { plural: ImportPluralMessage })
    const SuccessModalButtonLabel = intl.formatMessage({ id: 'import.successModal.buttonLabel' })
    const NeedHelpMessage = intl.formatMessage({ id: 'import.uploadModal.needHelp' })

    const exampleTemplateLink = useMemo(() => `/import/${domainName}/${intl.locale}/${domainName}-import-example.xlsx`, [domainName, intl.locale])
    const exampleImageSrc = useMemo(() => `/import/${domainName}/${intl.locale}/${domainName}-import-example.webp`, [domainName, intl.locale])

    const { Modal: ImportHelpModal, openImportHelpModal } = useImportHelpModal({ domainName })

    return (
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
                        <LinkWithIcon
                            title={NeedHelpMessage}
                            size='medium'
                            PostfixIcon={QuestionCircle}
                            onClick={() => {
                                setActiveModal(null)
                                openImportHelpModal()
                            }}
                        />
                        {dataImporter}
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
                    {get(extraModalContent, 'example')}
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
                            .replace('{success}', String(successRowsRef.current))
                            .replace('{total}', String(totalRowsRef.current))
                            .replace('{genitive}', ImportGenitiveMessage.toLowerCase())
                    }
                    description={PartlyDataLoadedModalAlertDescription}
                />
            </Modal>
            <Modal
                title={ErrorModalTitle}
                open={activeModal === 'error'}
                onCancel={closeModal}
                footer={dataImporter}
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
}

export { BaseImportWrapper }
