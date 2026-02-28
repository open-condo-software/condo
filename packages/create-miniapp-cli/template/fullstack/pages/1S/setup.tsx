import { Col, Form, Row, type RowProps } from 'antd'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import bridge from '@open-condo/bridge'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Space, Typography, Input } from '@open-condo/ui'

import { AppFrameWrapper } from '@billing-connector/domains/common/components/containers/AppFrameWrapper'
import { AuthRequired } from '@billing-connector/domains/common/components/containers/AuthRequired'
import Loader  from '@billing-connector/domains/common/components/Loader'
import { useLaunchParams } from '@billing-connector/domains/common/hooks/useLaunchParams'
import { useValidations } from '@billing-connector/domains/common/hooks/useValidations'
import { BillingContext, UserHelpRequest, B2BAppContext, User } from '@billing-connector/domains/condo/utils/clientSchema'
import { CONTEXT_FINISHED_STATUS } from '@billing-connector/domains/selfservice/constants'
import { SETUP_1S_INTEGRATION_MUTATION } from '@billing-connector/domains/selfservice/gql'
import { useIntegrationSetup } from '@billing-connector/domains/selfservice/hooks/useIntegrationSetup'
import { downloadBase64Content } from '@billing-connector/domains/selfservice/utils/clientSchema'

const { publicRuntimeConfig: { integrationConfig, helpRequisites, condoUrl, oneSb2bAppId } } = getConfig()

const VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const VERTICAL_TEXT_GUTTER: RowProps['gutter'] = [0, 12]

interface ISetupPage extends React.FC {
    requiredAccess?: React.FC
}

const SetupPage: ISetupPage = () => {
    const intl = useIntl()
    const SetupPageTitle = intl.formatMessage({ id: '1S.setup.Title' })
    const SetupPageText = intl.formatMessage({ id: '1S.setup.Text' })
    const AssistedSetupTitle = intl.formatMessage({ id: '1S.setup.assistedSetup.Title' })
    const AssistedSetupText = intl.formatMessage({ id: '1S.setup.assistedSetup.Text' })
    const SelfSetupTitle = intl.formatMessage({ id: '1S.setup.selfSetup.Title' })
    const SelfSetupText = intl.formatMessage({ id: '1S.setup.selfSetup.Text' })
    const AssistedSetupInstruction = intl.formatMessage({ id: '1S.setup.assistedSetup.Instruction' })
    const AssistedSetupDescription = intl.formatMessage({ id: '1S.setup.assistedSetup.Description' })
    const PhoneLabel = intl.formatMessage({ id: '1S.setup.Form.Phone.Label' })
    const EmailLabel = intl.formatMessage({ id: '1S.setup.Form.Email.Label' })
    const SelfSetupInstructionText = intl.formatMessage({ id: '1S.setup.selfSetup.Instruction.Text' })
    const ApplyForAssistedSetupButton = intl.formatMessage({ id: '1S.setup.assistedSetup.Apply.Button' })
    const NextStepButton = intl.formatMessage({ id: '1S.setup.selfSetup.NextStep.Button' })
    const AssistedSetupOnCompleteTitle = intl.formatMessage({ id: '1S.setup.assistedSetup.connected.Title' })
    const AssistedSetupOnCompleteText = intl.formatMessage({ id: '1S.setup.assistedSetup.onCompleted.Text' })

    const { context: launchContext, loading: launchParamsAreLoading } = useLaunchParams()
    const organizationId = useMemo(() => launchContext?.condoContextEntityId || null, [launchContext])
    const userId = useMemo(() => launchContext?.condoUserId || null, [launchContext])
    const integrationId = integrationConfig?.id
    const [isAssistedSetupChosen, setIsAssistedSetupChosen] = useState(true)
    const [loading, setIsLoading] = useState<boolean>(false)
    const { requiredValidator, phoneValidator, emailValidator } = useValidations()
    const updateContextAction = BillingContext.useUpdate({})
    const createUserHelpRequestAction = UserHelpRequest.useCreate({
        organization: { connect:  { id: organizationId } },
        billingIntegration: { connect: { id: integrationId } },
        type: 'integrationSetup',
    })
    const [form] = Form.useForm()
    const setupIntegration = useIntegrationSetup({ mutation: SETUP_1S_INTEGRATION_MUTATION, organizationId })

    const handleDownloadInstruction = useCallback( async  () => {
        const instruction = await setupIntegration()
        await downloadBase64Content(instruction)
    }, [setupIntegration])

    const SelfSetupInstruction = useMemo(() => intl.formatMessage({ id: '1S.setup.selfSetup.Instruction' }, {
        instructionLink:
            <Typography.Link onClick={handleDownloadInstruction}>
                {SelfSetupInstructionText}
            </Typography.Link>,
    }), [SelfSetupInstructionText, handleDownloadInstruction, intl])

    const {
        obj: billingContext,
        loading: billingContextLoading,
        error: billingContextError,
    } = BillingContext.useObject(
        { where: { organization: { id: organizationId }, integration: { id: integrationId } } },
        { skip: !organizationId || !integrationId },
    )

    const { obj: user } = User.useObject({ where: { id: userId } }, { skip: !userId })

    const {
        obj: b2bAppContext,
        loading: b2bAppContextLoading,
        error: b2bAppContextError,
        refetch: refetchB2BAppContext,
    } = B2BAppContext.useObject(
        { where: { organization: { id: organizationId }, app: { id: oneSb2bAppId } } },
        { skip: !organizationId || !oneSb2bAppId },
    )

    const createB2BAppContextAction = B2BAppContext.useCreate({
        app: { connect: { id: oneSb2bAppId } },
        organization: { connect: { id: organizationId } },
        status: CONTEXT_FINISHED_STATUS,
    }, async () => await refetchB2BAppContext())

    const onSetupTypeChange = useCallback((isAssisted) => {
        setIsAssistedSetupChosen(isAssisted)
    }, [])

    const assistedSetupNotification = useCallback(async () => {
        await bridge.send('CondoWebAppShowNotification', {
            type: 'info',
            message: AssistedSetupOnCompleteTitle,
            description: AssistedSetupOnCompleteText,
        })
    }, [AssistedSetupOnCompleteTitle, AssistedSetupOnCompleteText])

    const handleNextStep = useCallback(async (values, context) => {
        setIsLoading(true)
        if (isAssistedSetupChosen) {
            await updateContextAction({ settings: { ...context?.settings, isAssistedSetup: true, isSetupCompleted: false } }, { id: context?.id } )
            await createUserHelpRequestAction({
                phone: values.phone,
                email: values.email,
            })
            await setupIntegration({ isAssistedSetup: true })
            await assistedSetupNotification()
        } else {
            const { isAssistedSetup, isSetupCompleted, ...updatedContext } = context.settings
            await updateContextAction({ settings: { ...updatedContext } }, { id: context?.id } )
            await createUserHelpRequestAction({
                phone: user.phone,
            })
        }
        window.parent.postMessage({ success: true }, condoUrl)
        setIsLoading(false)
    }, [assistedSetupNotification, createUserHelpRequestAction, isAssistedSetupChosen, setupIntegration, updateContextAction, user])

    useEffect(() => {
        if (!b2bAppContext && !b2bAppContextLoading && !b2bAppContextError && organizationId) {
            createB2BAppContextAction({})
        }
    }, [b2bAppContextLoading])

    useEffect(() => {
        if (user) {
            form.setFieldsValue({ phone: user.phone })
        }
    }, [user, form])

    const isLoading = launchParamsAreLoading || billingContextLoading || b2bAppContextLoading || !billingContext || !b2bAppContext
    if (isLoading) {
        return <Loader loading={isLoading} size='large' />
    }

    if (billingContextError || b2bAppContextError) {
        return <Typography.Title>{billingContextError || b2bAppContextError}</Typography.Title>
    }

    return (
        <AppFrameWrapper>
            <Row gutter={VERTICAL_GUTTER}>
                <Col lg={13} span={24}>
                    <Row gutter={VERTICAL_TEXT_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {SetupPageTitle}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Typography.Paragraph type='secondary'>
                                {SetupPageText}
                            </Typography.Paragraph>
                        </Col>
                    </Row>
                </Col>
                <Col lg={13} span={24}>
                    <Row justify='space-between' wrap gutter={VERTICAL_GUTTER}>
                        <Col sm={11}>
                            <Card
                                hoverable
                                onClick={onSetupTypeChange}
                                active={isAssistedSetupChosen}
                            >
                                <Space direction='vertical' size={8}>
                                    <Typography.Title level={3}>
                                        {AssistedSetupTitle}
                                    </Typography.Title>
                                    <Typography.Paragraph type='secondary' size='medium'>
                                        {AssistedSetupText}
                                    </Typography.Paragraph>
                                </Space>
                            </Card>
                        </Col>
                        <Col sm={11}>
                            <Card
                                hoverable
                                onClick={() => onSetupTypeChange(false)}
                                active={!isAssistedSetupChosen}
                            >
                                <Space direction='vertical' size={8}>
                                    <Typography.Title level={3}>
                                        {SelfSetupTitle}
                                    </Typography.Title>
                                    <Typography.Paragraph type='secondary' size='medium'>
                                        {SelfSetupText}
                                    </Typography.Paragraph>
                                </Space>
                            </Card>
                        </Col>
                    </Row>
                </Col>
                <Col lg={13} span={24}>
                    <Row gutter={VERTICAL_TEXT_GUTTER}>
                        <Col span={24}>
                            <Typography.Paragraph type='secondary'>
                                {isAssistedSetupChosen ? AssistedSetupInstruction : SelfSetupInstruction}
                            </Typography.Paragraph>
                        </Col>
                        {isAssistedSetupChosen && (
                            <Col span={24}>
                                <Typography.Paragraph type='secondary'>
                                    {AssistedSetupDescription}
                                </Typography.Paragraph>
                            </Col>
                        )}
                    </Row>
                </Col>
                <Col lg={13} span={24}>
                    <Row gutter={VERTICAL_TEXT_GUTTER}>
                        <Col span={24}>
                            <Form
                                form={form}
                                layout='vertical'
                                onFinish={(values) => handleNextStep(values, billingContext)}
                                validateTrigger={['onBlur', 'onSubmit']}
                                initialValues={{ phone: user?.phone || '' }}>
                                <Row gutter={VERTICAL_GUTTER}>
                                    {isAssistedSetupChosen && (
                                        <>
                                            <Col span={24}>
                                                <Form.Item
                                                    name='phone'
                                                    rules={[requiredValidator, phoneValidator]}
                                                    required
                                                    label={PhoneLabel}
                                                >
                                                    <Input
                                                        type='tel'
                                                        placeholder='+7 900 000 00 00'
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={24}>
                                                <Form.Item
                                                    name='email'
                                                    rules={[requiredValidator, emailValidator]}
                                                    required
                                                    label={EmailLabel}
                                                >
                                                    <Input
                                                        type='email'
                                                        placeholder='example@example.com'
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>)}
                                    <Col span={24}>
                                        <Space direction = 'horizontal' size={16} wrap>
                                            <Button onClick={form.submit} loading={loading} type='primary'>
                                                {isAssistedSetupChosen ? ApplyForAssistedSetupButton : NextStepButton}
                                            </Button>
                                        </Space>
                                    </Col>
                                </Row>
                            </Form>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </AppFrameWrapper>
    )
}

SetupPage.requiredAccess = AuthRequired

export default SetupPage
