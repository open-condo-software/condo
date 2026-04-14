import styled from '@emotion/styled'
import { Col, Progress, Row, Space, Upload } from 'antd'
import React, { useCallback, useRef } from 'react'

import { Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Modal, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'

import { useDebtClaimGeneration } from '@condo/domains/billing/hooks/useDebtClaimGeneration'


const DEBT_CLAIMS_TEMPLATE_LINK = '/billing/debtClaims/debtors-template.xlsx'

const StyledFocusContainer = styled(FocusContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
  padding: 32px 24px;
  text-align: center;
  & img {
    height: 200px;
  }
`

type DebtClaimGenerationModalProps = {
    open: boolean
    organizationId: string
    userId: string
    onClose: () => void
    onSuccess?: () => void
}

export const DebtClaimGenerationModal: React.FC<DebtClaimGenerationModalProps> = ({
    open,
    organizationId,
    userId,
    onClose,
    onSuccess,
}) => {
    const intl = useIntl()
    const UploadModalTitle = intl.formatMessage({ id: 'billing.debtClaims.modal.upload.title' })
    const UploadModalMessage = intl.formatMessage({ id: 'billing.debtClaims.modal.upload.message' })
    const TemplateLinkLabel = intl.formatMessage({ id: 'billing.debtClaims.modal.upload.templateLink' })
    const ChooseFileLabel = intl.formatMessage({ id: 'billing.debtClaims.modal.upload.chooseFile' })
    const ProgressModalTitle = intl.formatMessage({ id: 'billing.debtClaims.modal.progress.title' })
    const ProgressModalMessage = intl.formatMessage({ id: 'billing.debtClaims.modal.progress.message' })
    const ProgressModalDescription = intl.formatMessage({ id: 'billing.debtClaims.modal.progress.description' })
    const ErrorModalTitle = intl.formatMessage({ id: 'billing.debtClaims.modal.error.title' })
    const ErrorModalDescription = intl.formatMessage({ id: 'billing.debtClaims.modal.error.description' })
    const ChooseAnotherFileLabel = intl.formatMessage({ id: 'billing.debtClaims.modal.error.chooseAnotherFile' })
    const DownloadZipLabel = intl.formatMessage({ id: 'billing.debtClaims.modal.success.downloadZip' })
    const DownloadErrorsLabel = intl.formatMessage({ id: 'billing.debtClaims.modal.success.downloadErrors' })
    const PaymentPotentialMessage = intl.formatMessage({ id: 'billing.debtClaims.modal.success.paymentPotential' })

    const { status, progress, meta, resultFileUrl, resultFileName, errorFileUrl, errorFileName, generateClaims, reset } = useDebtClaimGeneration({ organizationId, userId })

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = useCallback((file: File) => {
        if (!file) return
        generateClaims(file).then(() => {
            if (onSuccess) onSuccess()
        })
    }, [generateClaims, onSuccess])

    const handleUpload = useCallback((info) => {
        const file = info?.file?.originFileObj || info?.file
        if (file) handleFileSelect(file)
        return false
    }, [handleFileSelect])

    const handleClose = useCallback(() => {
        reset()
        onClose()
    }, [reset, onClose])

    const successCount = meta?.successCount || 0
    const failedCount = meta?.failedCount || 0
    const totalAmount = meta?.totalAmount || 0
    const hasErrors = failedCount > 0
    const hasSuccess = successCount > 0

    const SuccessTitle = hasErrors
        ? intl.formatMessage({ id: 'billing.debtClaims.modal.success.titlePartial' }, { count: successCount })
        : intl.formatMessage({ id: 'billing.debtClaims.modal.success.title' }, { count: successCount })

    const SuccessContent = hasErrors
        ? intl.formatMessage(
            { id: 'billing.debtClaims.modal.success.contentPartial' },
            { successCount, failedCount, amount: totalAmount.toLocaleString('ru-RU') }
        )
        : `${PaymentPotentialMessage} ${totalAmount.toLocaleString('ru-RU')} руб.`

    const filePickerButton = (
        <Upload
            accept='.xlsx,.xls'
            showUploadList={false}
            maxCount={1}
            customRequest={() => undefined}
            onChange={handleUpload}
            beforeUpload={() => false}
        >
            <Button type='primary'>{ChooseFileLabel}</Button>
        </Upload>
    )

    const anotherFilePickerButton = (
        <Upload
            accept='.xlsx,.xls'
            showUploadList={false}
            maxCount={1}
            customRequest={() => undefined}
            onChange={handleUpload}
            beforeUpload={() => false}
        >
            <Button type='secondary'>{ChooseAnotherFileLabel}</Button>
        </Upload>
    )

    if (status === 'idle') {
        return (
            <Modal
                title={UploadModalTitle}
                open={open}
                onCancel={handleClose}
                footer={
                    <Space size={16} direction='horizontal'>
                        <LinkWithIcon
                            title={TemplateLinkLabel}
                            size='medium'
                            PrefixIcon={Download}
                            href={DEBT_CLAIMS_TEMPLATE_LINK}
                            target='_blank'
                        />
                        {filePickerButton}
                    </Space>
                }
            >
                <Typography.Text>{UploadModalMessage}</Typography.Text>
            </Modal>
        )
    }

    if (status === 'processing') {
        return (
            <Modal
                title={ProgressModalTitle}
                open={open}
                onCancel={handleClose}
                footer={null}
            >
                <StyledFocusContainer>
                    <Row gutter={[0, 32]} justify='center' align='middle'>
                        <Col>
                            <img alt='progress' src='/progressDino.png' />
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
        )
    }

    if (status === 'error') {
        return (
            <Modal
                title={ErrorModalTitle}
                open={open}
                onCancel={handleClose}
                footer={anotherFilePickerButton}
            >
                <Alert
                    type='error'
                    showIcon
                    message={ErrorModalTitle}
                    description={meta?.error || ErrorModalDescription}
                />
            </Modal>
        )
    }

    if (status === 'completed') {
        return (
            <Modal
                title={SuccessTitle}
                open={open}
                onCancel={handleClose}
                footer={
                    <Space size={16} direction='horizontal' wrap>
                        {hasErrors && errorFileUrl && (
                            <Button type='secondary'>
                                <a href={errorFileUrl} download={errorFileName || 'errors.xlsx'} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {DownloadErrorsLabel}
                                </a>
                            </Button>
                        )}
                        {hasSuccess && resultFileUrl && (
                            <Button type='primary'>
                                <a href={resultFileUrl} download={resultFileName || 'debt_claims.zip'} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {DownloadZipLabel}
                                </a>
                            </Button>
                        )}
                    </Space>
                }
            >
                <Space direction='vertical' size={16}>
                    <Typography.Text>{SuccessContent}</Typography.Text>
                    {hasErrors && (
                        <Alert
                            type='warning'
                            showIcon
                            message={intl.formatMessage(
                                { id: 'billing.debtClaims.modal.success.errorsAlert' },
                                { failedCount }
                            )}
                        />
                    )}
                </Space>
            </Modal>
        )
    }

    return null
}
