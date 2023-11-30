import { Col, Form, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { useState, useCallback } from 'react'

import bridge from '@open-condo/bridge'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Checkbox, Space } from '@open-condo/ui'
import { Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Loader } from '@condo/domains/common/components/Loader'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import {
    MARKETPLACE_RULES_LINK,
    MARKETPLACE_OFFER_LINK,
} from '@condo/domains/marketplace/constants'
import { Organization } from '@condorb/domains/condo/utils/clientSchema'
import { SCOPE_TYPES } from '@condorb/domains/condorb/constants/marketplace'
import { Accept } from '@condorb/domains/condorb/utils/clientSchema'

import type { RowProps } from 'antd'

const { publicRuntimeConfig: { condoUrl } } = getConfig()

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
    } = Organization.useObject(
        { where: { id: organizationId } }
    )

    const [rulesAreAccepted, setRulesAreAccepted] = useState<boolean>(false)
    const [loading, setIsLoading] = useState<boolean>(false)
    const [usersEmails, setUsersEmails] = useState<string | null>('')
    const { requiredValidator, multipleEmailsValidator } = useValidations()

    const handleDownload = useCallback(() => {
        bridge.send('CondoWebAppRedirect', { url: MARKETPLACE_OFFER_LINK, target: '_blank' })
    }, [])

    const handleSignOffer = useCallback(async () => {
        setIsLoading(true)
        const tin = get(organization, 'tin')
        await createAcceptAction({
            userId: userId,
            organizationId: organizationId,
            email: usersEmails,
            tin,
            scope: SCOPE_TYPES['marketplace'],
            signDate: dayjs().format('YYYY-MM-DD'),
        })
        setIsLoading(false)
        window.parent.postMessage({ success: true }, condoUrl)
        setIsLoading(false)
    }, [createAcceptAction, organization, organizationId, userId, usersEmails])

    const onUserEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUsersEmails(e.target.value)
    }, [setUsersEmails])

    const onRulesAcceptedChange = useCallback(() => {
        setRulesAreAccepted(prev => !prev)
    }, [setRulesAreAccepted])

    if (organizationIsLoading) {
        return <Loader fill size='large' />
    }

    return (<>
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
                        <FormWithAction
                            action={() => handleSignOffer()}
                            validateTrigger={['onBlur', 'onSubmit']}
                            OnCompletedMsg={null}
                            children={({ handleSave }) => (
                                <Row gutter={VERTICAL_GUTTER}>
                                    <Col span={24}>
                                        <Form.Item
                                            name='email'
                                            rules={[requiredValidator, multipleEmailsValidator(usersEmails)]}
                                            required
                                            label={EmailTip}
                                        >
                                            <Input
                                                type='email'
                                                placeholder='name@example.com, example@example.com'
                                                value={usersEmails}
                                                onChange={onUserEmailChange}
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
                                        <Space direction = 'horizontal' size={16} wrap>
                                            <Button onClick={handleSave} loading={loading} disabled={!rulesAreAccepted} type='primary'>
                                                {signOffer}
                                            </Button>
                                            <Button onClick={handleDownload} type='secondary'>
                                                {downloadOffer}
                                            </Button>
                                        </Space>
                                    </Col>
                                </Row>
                            )}
                        />
                    </Col>
                </Row>
            </Col>
        </Row>
    </>
    )
}
