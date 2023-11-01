import { Col, Form, notification, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, { useState, useCallback } from 'react'

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
import { AcquiringIntegrationContext } from '@condorb/domains/condo/utils/clientSchema'
import { SCOPE_TYPES } from '@condorb/domains/condorb/constants/marketplace'
import { Accept, getOrganizationInfo } from '@condorb/domains/condorb/utils/clientSchema'

import type { RowProps } from 'antd'


const { publicRuntimeConfig: { condoUrl, integrationConfig } } = getConfig()

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
    const OrganizationNotFoundErrorTitle = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.organizationNotFoundError' })
    const OrganizationNotFoundErrorMessage = intl.formatMessage({ id: 'pages.condo.marketplace.settings.offer.organizationNotFoundErrorMessage' })
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
    const integrationId = get(integrationConfig, 'id')
    //TODO: can't get context -- rights?
    const {
        obj: context,
        loading: contextIsLoading,
        refetch: refetchContext,
    } = AcquiringIntegrationContext.useObject(
        { where: { organization: { id: organizationId }, integration: { id: integrationId } } }
    )
    const updateContextAction = AcquiringIntegrationContext.useUpdate({}, () => refetchContext)

    const [rulesAreAccepted, setRulesAreAccepted] = useState<boolean>(false)
    const [loading, setIsLoading] = useState<boolean>(false)
    const [usersEmails, setUsersEmails] = useState<string | null>('')
    const { requiredValidator, multipleEmailsValidator } = useValidations()

    const handleDownload = useCallback(()=> {
        return //TODO: download offer pdf
    }, [])

    const handleSignOffer = useCallback(async (context) => {
        setIsLoading(true)
        const tin = get(context, ['organization', 'tin'])
        const { psrn, organizationName } = await getOrganizationInfo(tin)
        if (!psrn) {
            notification.error({
                message: OrganizationNotFoundErrorTitle,
                description: OrganizationNotFoundErrorMessage,
            })
            setIsLoading(false)
            console.error('context', context)
            throw new Error('Organization not found')
        }
        const accept = await createAcceptAction({
            userId: userId,
            organizationId: get(context, ['organization', 'id']),
            email: usersEmails,
            psrn, organizationName, tin,
            scope: SCOPE_TYPES['marketplace'],
            signDate: dayjs().format('YYYY-MM-DD'),
        })
        await updateContextAction({
            email: usersEmails,
            reason: accept.name,
        }, context)
        setIsLoading(false)
        window.parent.postMessage({ success: true }, condoUrl)
        setIsLoading(false)
    }, [OrganizationNotFoundErrorMessage, OrganizationNotFoundErrorTitle, userId, usersEmails])

    const onUserEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUsersEmails(e.target.value)
    }, [setUsersEmails])

    const onRulesAcceptedChange = useCallback(() => {
        setRulesAreAccepted(prev => !prev)
    }, [setRulesAreAccepted])


    if (contextIsLoading) {
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
                            action={() => handleSignOffer(context)}
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