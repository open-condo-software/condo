import { SortAcceptsBy } from '@app/condorb/schema'
import { Col, Form, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { useCallback, useEffect, useState } from 'react'

import bridge from '@open-condo/bridge'
import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Space, Typography } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { Loader } from '@condo/domains/common/components/Loader'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MARKETPLACE_OFFER_LINK, MARKETPLACE_RULES_LINK } from '@condo/domains/marketplace/constants'
import { Organization } from '@condorb/domains/condo/utils/clientSchema'
import { ACCEPT_SCOPE_ACQUIRING, ACCEPT_SCOPE_MARKETPLACE } from '@condorb/domains/condorb/constants/marketplace'
import { Accept } from '@condorb/domains/condorb/utils/clientSchema'

import type { RowProps } from 'antd'

const { publicRuntimeConfig: { condoUrl } } = getConfig()

const FORM_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']

const VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]
const VERTICAL_TEXT_GUTTER: RowProps['gutter'] = [0, 12]

type LaunchContextType = {
    condoContextEntityId?: string
    condoUserId?: string
}

export const OfferSetup: React.FC<{ launchContext: LaunchContextType }> = ({ launchContext = {} }) => {
    const intl = useIntl()
    const OfferCommissionTitle = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.subtitle' })
    const OfferCommissionText = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.subtitle.text' })
    const InfoAboutPayment = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.info.title' })
    const InfoBlockText = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.info.text' })
    const EmailTip = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.email' })
    const RulesLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.rules.rulesLink' })
    const OfferLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.rules.offerlink' })
    const signOffer = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.signOfferButton' })
    const downloadOffer = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.downloadOfferButton' })

    const [form] = Form.useForm()

    const Rules = intl.formatMessage(
        { id: 'pages.condo.marketplace.settings.offer.rules' },
        {
            rulesLink: (
                <Typography.Link href={MARKETPLACE_RULES_LINK} target='_blank'>
                    {RulesLinkMessage}
                </Typography.Link>
            ),
            offerLink: (
                <Typography.Link href={MARKETPLACE_OFFER_LINK} target='_blank'>
                    {OfferLinkMessage}
                </Typography.Link>
            ),
        })
    const organizationId = get(launchContext, 'condoContextEntityId', null)
    const userId = get(launchContext, 'condoUserId', null)
    const createAcceptAction = Accept.useCreate({})
    const {
        obj: organization,
        loading: organizationIsLoading,
    } = Organization.useObject({ where: { id: organizationId } })

    const {
        obj: acquiringOffer,
        loading: isAcquiringOfferLoading,
    } = Accept.useObject({
        where: { scope: ACCEPT_SCOPE_ACQUIRING, organizationId },
        sortBy: [SortAcceptsBy.CreatedAtDesc],
        first: 1,
    })

    const [rulesAreAccepted, setRulesAreAccepted] = useState<boolean>(false)
    const [loading, setIsLoading] = useState<boolean>(false)
    const { requiredValidator, multipleEmailsValidator } = useValidations()

    const handleDownload = useCallback(async () => {
        await bridge.send('CondoWebAppRedirect', { url: MARKETPLACE_OFFER_LINK, target: '_blank' })
    }, [])

    const handleSignOffer = useCallback(async (values) => {
        setIsLoading(true)
        const tin = get(organization, 'tin')
        await createAcceptAction({
            userId: userId,
            organizationId: organizationId,
            email: values.email,
            tin,
            scope: ACCEPT_SCOPE_MARKETPLACE,
            signDate: dayjs().format('YYYY-MM-DD'),
        })
        setIsLoading(false)
        window.parent.postMessage({ success: true }, condoUrl)
    }, [createAcceptAction, organization, organizationId, userId])

    const onRulesAcceptedChange = useCallback(() => {
        setRulesAreAccepted(prev => !prev)
    }, [setRulesAreAccepted])

    useEffect(() => {
        if (acquiringOffer && !isAcquiringOfferLoading) {
            form.setFieldValue('email', get(acquiringOffer, 'email', ''))
        }
    }, [acquiringOffer, form, isAcquiringOfferLoading])

    if (organizationIsLoading) {
        return <Loader fill size='large'/>
    }

    return (
        <Row gutter={VERTICAL_GUTTER}>
            <Col lg={13} span={24}>
                <Row gutter={VERTICAL_TEXT_GUTTER}>
                    <Col span={24}>
                        <Typography.Title level={3}>
                            {OfferCommissionTitle}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph type='secondary'>
                            {OfferCommissionText}
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Col>
            <Col lg={13} span={24}>
                <Row gutter={VERTICAL_TEXT_GUTTER}>
                    <Col>
                        <Typography.Title level={4}>
                            {InfoAboutPayment}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph type='secondary'>
                            {InfoBlockText}
                        </Typography.Paragraph>
                    </Col>
                    <Col span={24}>
                        <Form
                            form={form}
                            layout='vertical'
                            onFinish={handleSignOffer}
                            validateTrigger={FORM_VALIDATE_TRIGGER}
                        >
                            <Row gutter={VERTICAL_GUTTER}>
                                <Col span={24}>
                                    <Form.Item
                                        name='email'
                                        rules={[requiredValidator, multipleEmailsValidator(form.getFieldValue('email'))]}
                                        required
                                        label={EmailTip}
                                    >
                                        <Input
                                            type='email'
                                            placeholder='name@example.com, example@example.com'
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Space size={8}>
                                        <Checkbox checked={rulesAreAccepted} onChange={onRulesAcceptedChange}/>
                                        <Typography.Paragraph size='small' type='secondary'>
                                            {Rules}
                                        </Typography.Paragraph>
                                    </Space>
                                </Col>
                                <Col span={24}>
                                    <Space direction='horizontal' size={16} wrap>
                                        <Button
                                            key='submit'
                                            htmlType='submit'
                                            loading={loading}
                                            disabled={!rulesAreAccepted}
                                            type='primary'
                                        >
                                            {signOffer}
                                        </Button>
                                        <Button onClick={handleDownload} type='secondary'>
                                            {downloadOffer}
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Form>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}
