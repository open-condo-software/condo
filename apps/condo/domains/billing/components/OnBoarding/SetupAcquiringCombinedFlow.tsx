import { SortAcquiringIntegrationContextsBy, AcquiringIntegrationTypeType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Space, Button } from '@open-condo/ui'

import { AcquiringIntegrationContext as AcquiringContext } from '@condo/domains/acquiring/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { LoginWithSBBOLButton } from '@condo/domains/common/components/LoginWithSBBOLButton'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'
import { SBBOL_IMPORT_NAME } from '@condo/domains/organization/integrations/sbbol/constants'

import type { RowProps } from 'antd'

type SetupAcquiringProps = {
    onFinish: () => void
    integrationId: string
    onDone?: () => void
    verificationStep?: number
}

const AUTH_BUTTON_GUTTER: RowProps['gutter'] = [0, 40]
const AUTH_TITLE_SPACE = 12
const PARAGRAPH_SPACE = 16
const HALF_COL_SPAN = 12
const CERTIFICATES_INFO_LINK = 'https://help.doma.ai/article/262-minc'
const CONNECT_EMAIL = 'sales@doma.ai'

export const SetupAcquiringCombinedFlow: React.FC<SetupAcquiringProps> = ({ onFinish, integrationId }) => {
    const intl = useIntl()
    const [verificationSkipped, skippVerification] = useState<boolean>(false)
    const AuthRequiredTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationNeeded.title' })
    const AuthRequiredLink = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationNeeded.link' })
    const AuthRequiredCertMessage = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationNeeded.message.certs' }, {
        link: <Typography.Link href={CERTIFICATES_INFO_LINK} target='_blank'>{AuthRequiredLink}</Typography.Link>,
    })
    const AuthRequiredContactMessage = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationNeeded.message.contact' }, {
        email: <Typography.Link href={`mailto:${CONNECT_EMAIL}`}>{CONNECT_EMAIL}</Typography.Link>,
    })

    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const remoteSystem = get(organization, 'importRemoteSystem', null)
    const isOrgVerified = remoteSystem === SBBOL_IMPORT_NAME

    const { objs: acquiringContexts, loading: acquiringCtxLoading } = AcquiringContext.useObjects({
        where: {
            organization: { id: orgId },
            integration: { id: integrationId },
            deletedAt: null,
        },
        sortBy: [
            SortAcquiringIntegrationContextsBy.UpdatedAtDesc,
            SortAcquiringIntegrationContextsBy.IdDesc,
        ],
    }, { skip: !integrationId || !orgId })

    const acquiringCtx = acquiringContexts[0] || null
    const setupUrl = acquiringCtx?.integration?.setupUrl || ''
    const setupOrigin = extractOrigin(setupUrl)
    const handleDoneMessage = useCallback((event: MessageEvent) => {
        if (event.origin === setupOrigin && get(event.data, 'success') === true) {
            onFinish()
        }
    }, [onFinish, setupOrigin])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', handleDoneMessage)

            return () => window.removeEventListener('message', handleDoneMessage)
        }
    }, [handleDoneMessage])

    // If no context found, return to step 0
    useEffect(() => {
        if (!acquiringCtxLoading && !acquiringCtx) {
            router.replace({ query: { ...router.query, step: 0 } }, undefined, { shallow: true })
        }
    }, [acquiringCtx, acquiringCtxLoading, router])

    if (acquiringCtxLoading || !setupUrl) {
        return <Loader fill size='large'/>
    }

    if (!isOrgVerified && acquiringCtx?.integration?.type === AcquiringIntegrationTypeType.OnlineProcessing) {
        if (!verificationSkipped) {
            return (
                <Row gutter={AUTH_BUTTON_GUTTER}>
                    <Row gutter={AUTH_BUTTON_GUTTER}>
                        <Col span={HALF_COL_SPAN}>
                            <Space size={AUTH_TITLE_SPACE} direction='vertical'>
                                <Typography.Title level={3}>{AuthRequiredTitle}</Typography.Title>
                                <Space size={PARAGRAPH_SPACE} direction='vertical'>
                                    <Typography.Paragraph type='secondary'>
                                        {AuthRequiredCertMessage}
                                    </Typography.Paragraph>
                                    <Typography.Paragraph type='secondary'>
                                        {AuthRequiredContactMessage}
                                    </Typography.Paragraph>
                                </Space>
                            </Space>
                        </Col>
                    </Row>
                    <Row gutter={AUTH_BUTTON_GUTTER}>
                        <Col span={HALF_COL_SPAN}>
                            <Space size={20}>
                                <LoginWithSBBOLButton redirect={router.asPath} checkTlsCert/>
                                <Button type='secondary' onClick={() => skippVerification(true)} >Войду позже</Button>
                            </Space>
                        </Col>
                    </Row>
                </Row>
            )
        }
    }

    return (
        <B2BAppFrame
            src={setupUrl}
            initialHeight={400}
            actions={true}
        />
    )
}
