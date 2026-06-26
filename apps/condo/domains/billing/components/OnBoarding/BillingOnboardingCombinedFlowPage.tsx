import { Row, Col } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Steps } from '@open-condo/ui'
import type { StepItem } from '@open-condo/ui'

import { useOnboardingProgress } from '@condo/domains/billing/hooks/useOnboardingProgress'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageHeader, PageWrapper, TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'

import { ChooseChannels } from './ChooseChannels'
import styles from './index.module.css'
import { SelectBilling } from './SelectBilling'
import { SetupAcquiring } from './SetupAcquiring'
import { SetupBilling } from './SetupBilling'
import { Verification } from './Verification'
import { WelcomeModal } from './WelcomeModal'

import type { RowProps } from 'antd'


const STEPS_GUTTER: RowProps['gutter'] = [60, 60]
const FULL_COL_SPAN = 24
const MODAL_STORAGE_KEY = 'isBillingModalShown'

type BillingOnboardingPageProps = {
    onFinish: () => void
    withVerification?: boolean
}

export const BillingOnboardingCombinedFlowPage: React.FC<BillingOnboardingPageProps> = ({ onFinish, withVerification }) => {
    const intl = useIntl()
    const BillingSelectTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseBillingStep.title' })
    const PageTitleCombinedFlow = 'Настройка платежей для физлиц'
    const PageTitleOrdinaryFlow = intl.formatMessage({ id: 'accrualsAndPayments.setup.title' })

    const SetupBillingTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.setupBillingStep.title' })
    const SetupAcquiringTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.setupAcquiringStep.title' })
    const VerificationTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationStep.title' })
    const StepNoReturnMessage = intl.formatMessage({ id: 'accrualsAndPayments.setup.noReturn' })
    const ChooseChannelsTitle = 'Каналы для публикации' //intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseChannelsTitle' })
    const IntegrationSetupTitle = 'Настройка интеграции' //intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseChannelsTitle' })
    const BankIntegrationSetupTitle = 'Настройка Сбера' //intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseChannelsTitle' })
    const AcceptOfferTitle = 'Подписание оферты' //intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseChannelsTitle' })

    const { useFlag } = useFeatureFlags()

    const isCombinedFlow = useFlag(UI_BILLING_SPP_COMBINED_PAGE)

    const PageTitle = isCombinedFlow ? PageTitleCombinedFlow : PageTitleOrdinaryFlow

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const router = useRouter()
    const [welcomeShown, setWelcomeShown] = useState(false)

    useEffect(() => {
        setWelcomeShown(Boolean(localStorage.getItem(MODAL_STORAGE_KEY)))
    }, [])

    const [currentStep] = useOnboardingProgress(withVerification)

    const stepItems: Array<StepItem> = useMemo(() => {
        const steps: Array<StepItem> =
            [
                { title: ChooseChannelsTitle },
                { title: IntegrationSetupTitle, breakPoint: true  },
                { title: BankIntegrationSetupTitle, breakPoint: true  },
                { title: AcceptOfferTitle, breakPoint: true  },
            ]
        if (withVerification) {
            steps.push({ title: VerificationTitle })
        }
        return steps
    }, [withVerification, VerificationTitle])

    const handleReturn = useCallback((newStep: number) => {
        router.push({ query: { ...router.query, step: newStep } }, undefined, { shallow: true })
    }, [router])

    const handleCloseWelcomeModal = useCallback(() => {
        localStorage.setItem(MODAL_STORAGE_KEY, 'true')
        setWelcomeShown(true)
    }, [])

    const currentScreen = useMemo(() => {
        if (currentStep === 1) {
            return <SetupBilling/>
        } else if (currentStep === 2) {
            return <SetupAcquiring onFinish={onFinish}/>
        } else if (currentStep === 3) {
            return <Verification/>
        }
        if (isCombinedFlow) {
            return <ChooseChannels/>
        } else {
            return <SelectBilling />
        }
    }, [currentStep, isCombinedFlow, onFinish])

    if (!canManageIntegrations) {
        return <AccessDeniedPage />
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
                                className={isCombinedFlow ? styles['compact-steps'] : ''}
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
