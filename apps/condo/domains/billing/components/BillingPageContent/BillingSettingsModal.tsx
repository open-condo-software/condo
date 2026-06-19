import { useCreateUserHelpRequestMutation, useGetOrganizationBillingRecipientsQuery } from '@app/condo/gql'
import { BillingRecipient as BillingRecipientType, UserHelpRequestTypeType } from '@app/condo/schema'
import { Col, Form, Row, notification } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'

import { ChevronDown, ChevronUp } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Input, List, Modal, Typography } from '@open-condo/ui'

import { useBillingSettingsIntegrationParameters } from '@condo/domains/billing/hooks/useBillingSettingsIntegrationParameters'
import { useRecipientDetails } from '@condo/domains/billing/hooks/useRecipientDetails'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import styles from './BillingSettingsModal.module.css'

import type { RowProps } from 'antd'

const DEFAULT_VISIBLE_RECIPIENTS_COUNT = 2
const SETTINGS_REQUEST_MAX_LENGTH = 500
const SECTION_ROW_GUTTER: RowProps['gutter'] = [0, 32]
const LIST_ROW_GUTTER: RowProps['gutter'] = [0, 16]
const FULL_WIDTH_SPAN = 24

type BillingSettingsModalProps = {
    open: boolean
    onClose: () => void
}

const RecipientDetailsBlock: React.FC<{
    recipient: BillingRecipientType
}> = ({ recipient }) => {
    const details = useRecipientDetails(recipient)

    return (
        <List className={styles.recipientDetailsList} dataSource={details} />
    )
}

export const BillingSettingsModal: React.FC<BillingSettingsModalProps> = ({ open, onClose }) => {
    const intl = useIntl()
    const IntegrationParametersTitle = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.integrationParameters' })
    const MoneyDestinationTitle = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.moneyDestination' })
    const CollapseButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.hideMoreAccounts' })
    const RequestChangesTitle = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.requestChanges.title' })
    const RequestChangesPlaceholder = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.requestChanges.placeholder' })
    const RequestChangesButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.requestChanges.submit' })
    const NoDataMessage = intl.formatMessage({ id: 'NoData' })
    const ServerErrorMessage = intl.formatMessage({ id: 'global.errors.serverError.title' })
    const integrationParametersDataSource = useBillingSettingsIntegrationParameters()

    const [form] = Form.useForm()
    const [isExpanded, setIsExpanded] = useState(false)
    const requestMessage = Form.useWatch('message', form)
    const { user } = useAuth()
    const { organization } = useOrganization()
    const { trimValidator, maxLengthValidator } = useValidations()

    const ModalTitle = intl.formatMessage({
        id: 'accrualsAndPayments.combined.settings.modal.title',
    }, {
        organizationName: organization?.name || '-',
    })

    const canCreateHelpRequest = Boolean(organization?.id && user?.phone)

    const {
        data: billingRecipientsData,
        loading: recipientsLoading,
    } = useGetOrganizationBillingRecipientsQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !open || !organization?.id,
    })
    const recipients = useMemo(() => billingRecipientsData?.recipients?.filter(Boolean) || [], [billingRecipientsData?.recipients])

    const visibleRecipients = useMemo(() => recipients.slice(0, DEFAULT_VISIBLE_RECIPIENTS_COUNT), [recipients])
    const hiddenRecipients = useMemo(() => recipients.slice(DEFAULT_VISIBLE_RECIPIENTS_COUNT), [recipients])

    const [createUserHelpRequest] = useCreateUserHelpRequestMutation()

    const handleClose = useCallback(() => {
        form.resetFields()
        setIsExpanded(false)
        onClose()
    }, [form, onClose])

    const handleToggleExpanded = useCallback(() => {
        setIsExpanded((isExpanded) => !isExpanded)
    }, [])

    const handleSubmit = useCallback(async ({ message }) => {
        if (!organization?.id || !user?.phone) {
            throw new Error('Cannot create billing settings change request without organization and phone')
        }

        try {
            await createUserHelpRequest({
                variables: {
                    data: {
                        type: UserHelpRequestTypeType.BillingSettingsChange,
                        organization: { connect: { id: organization.id } },
                        phone: user.phone,
                        email: user?.email ?? null,
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        meta: {
                            message,
                            source: 'combinedBillingSettingsModal',
                        },
                    },
                },
            })
        } catch (error) {
            notification.error({
                message: (
                    <Typography.Title level={4}>
                        {ServerErrorMessage}
                    </Typography.Title>
                ),
                description: error instanceof Error ? error.message : ServerErrorMessage,
            })
            throw error
        }

        handleClose()
    }, [ServerErrorMessage, createUserHelpRequest, handleClose, organization?.id, user?.email, user?.phone])

    const expandButtonText = isExpanded ? CollapseButtonLabel : intl.formatMessage({
        id: 'accrualsAndPayments.combined.settings.showMoreAccounts',
    }, {
        count: hiddenRecipients.length,
    })
    const recipientsToRender = isExpanded ? recipients : visibleRecipients
    const isSubmitDisabled = !requestMessage?.trim() || !canCreateHelpRequest
    let recipientsContent = null

    if (!recipientsLoading) {
        recipientsContent = recipients.length ? (
            <Row gutter={LIST_ROW_GUTTER}>
                {recipientsToRender.map((recipient) => (
                    <Col key={recipient.id} span={FULL_WIDTH_SPAN}>
                        <RecipientDetailsBlock recipient={recipient} />
                    </Col>
                ))}
                {hiddenRecipients.length > 0 && (
                    <Col span={FULL_WIDTH_SPAN}>
                        <Button
                            type='primary'
                            minimal
                            compact
                            onClick={handleToggleExpanded}
                            icon={isExpanded ? <ChevronUp size='small' /> : <ChevronDown size='small' />}
                        >
                            {expandButtonText}
                        </Button>
                    </Col>
                )}
            </Row>
        ) : (
            <Typography.Text type='secondary'>{NoDataMessage}</Typography.Text>
        )
    }

    return (
        <FormWithAction
            action={handleSubmit}
            formInstance={form}
            layout='vertical'
            validateTrigger={['onBlur', 'onSubmit']}
            isNonFieldErrorHidden
        >
            {({ handleSave, isLoading }) => (
                <Modal
                    open={open}
                    onCancel={handleClose}
                    title={ModalTitle}
                    width='small'
                    destroyOnClose={false}
                    footer={(
                        <Button
                            type='primary'
                            disabled={isSubmitDisabled}
                            loading={isLoading}
                            onClick={handleSave}
                        >
                            {RequestChangesButtonLabel}
                        </Button>
                    )}
                >
                    <Row gutter={SECTION_ROW_GUTTER}>
                        <Col span={FULL_WIDTH_SPAN}>
                            <Row gutter={LIST_ROW_GUTTER}>
                                <Col span={FULL_WIDTH_SPAN}>
                                    <Typography.Title level={4}>{IntegrationParametersTitle}</Typography.Title>
                                </Col>
                                <Col span={FULL_WIDTH_SPAN}>
                                    <List className={styles.integrationParametersList} dataSource={integrationParametersDataSource} />
                                </Col>
                            </Row>
                        </Col>

                        <Col span={FULL_WIDTH_SPAN}>
                            <Row gutter={LIST_ROW_GUTTER}>
                                <Col span={FULL_WIDTH_SPAN}>
                                    <Typography.Title level={4}>{MoneyDestinationTitle}</Typography.Title>
                                </Col>
                                <Col span={FULL_WIDTH_SPAN}>
                                    {recipientsContent}
                                </Col>
                            </Row>
                        </Col>

                        <Col span={FULL_WIDTH_SPAN}>
                            <Row gutter={LIST_ROW_GUTTER}>
                                <Col span={FULL_WIDTH_SPAN}>
                                    <Typography.Title level={4}>{RequestChangesTitle}</Typography.Title>
                                </Col>
                                <Col span={FULL_WIDTH_SPAN}>
                                    <Form.Item
                                        name='message'
                                        rules={[trimValidator, maxLengthValidator(SETTINGS_REQUEST_MAX_LENGTH)]}
                                    >
                                        <Input.TextArea
                                            autoSize={{ minRows: 2 }}
                                            maxLength={SETTINGS_REQUEST_MAX_LENGTH}
                                            placeholder={RequestChangesPlaceholder}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Modal>
            )}
        </FormWithAction>
    )
}
