import { Row, Col } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Steps } from '@open-condo/ui'
import type { StepItem } from '@open-condo/ui'

import { useOnboardingProgress } from '@condo/domains/billing/hooks/useOnboardingProgress'
import { PageHeader, PageWrapper, TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'

import { SelectBilling } from './SelectBilling'
import { SetupAcquiring } from './SetupAcquiring'
import { SetupBilling } from './SetupBilling'
import { WelcomeModal } from './WelcomeModal'


import type { RowProps } from 'antd'

const STEPS_GUTTER: RowProps['gutter'] = [60, 60]
const FULL_COL_SPAN = 24

type BillingOnboardingPageProps = {
    onFinish: () => void
}

export const BillingOnboardingPage: React.FC<BillingOnboardingPageProps> = ({ onFinish }) => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.title' })
    const BillingSelectTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseBillingStep.title' })
    const SetupBillingTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.setupBillingStep.title' })
    const SetupAcquiringTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.setupAcquiringStep.title' })
    const StepNoReturnMessage = intl.formatMessage({ id: 'accrualsAndPayments.setup.noReturn' })
    const NoPermissionMessage = intl.formatMessage({ id:'global.noPageViewPermission' })

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const router = useRouter()
    const [welcomeShown, setWelcomeShown] = useState(false)

    const [currentStep] = useOnboardingProgress()

    const stepItems: Array<StepItem> = useMemo(() => {
        return [
            { title: BillingSelectTitle },
            { title: SetupBillingTitle, breakPoint: true },
            { title: SetupAcquiringTitle },
        ]
    }, [BillingSelectTitle, SetupBillingTitle, SetupAcquiringTitle])

    const handleReturn = useCallback((newStep: number) => {
        router.push({ query: { ...router.query, step: newStep } })
    }, [router])

    const handleCloseWelcomeModal = useCallback(() => {
        setWelcomeShown(true)
    }, [])

    const currentScreen = useMemo(() => {
        if (currentStep === 1) {
            return <SetupBilling/>
        } else if (currentStep === 2) {
            return <SetupAcquiring onFinish={onFinish}/>
        }

        return <SelectBilling/>
    }, [currentStep, onFinish])

    if (!canManageIntegrations) {
        return <LoadingOrErrorPage error={NoPermissionMessage}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>}/>
                <TablePageContent>
                    <Row gutter={STEPS_GUTTER}>
                        <Col span={FULL_COL_SPAN}>
                            <Steps
                                onChange={handleReturn}
                                items={stepItems}
                                current={currentStep}
                                noReturnMessage={StepNoReturnMessage}
                            />
                        </Col>
                        <Col span={FULL_COL_SPAN}>
                            {currentScreen}
                        </Col>
                    </Row>
                </TablePageContent>
                {!welcomeShown && (
                    <WelcomeModal open={!welcomeShown} onCancel={handleCloseWelcomeModal}/>
                )}
            </PageWrapper>
        </>
    )
}