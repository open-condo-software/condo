import { SortAcquiringIntegrationsBy } from '@app/condo/schema'
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

import { CONTEXT_FINISHED_STATUS as ACQUIRING_CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS as ACQUIRING_CONTEXT_IN_PROGRESS_STATUS, CONTEXT_VERIFICATION_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext as AcquiringContext, AcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema'
import { useOnboardingProgress } from '@condo/domains/billing/hooks/useOnboardingProgress'
import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'
import { PageHeader, PageWrapper, TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { UI_BILLING_SPP_COMBINED_PAGE } from '@condo/domains/common/constants/featureflags'

import { ChooseChannels } from './ChooseChannels'
import styles from './index.module.css'
import { SetupAcquiring } from './SetupAcquiring'
import { SetupBilling } from './SetupBilling'
import { Verification } from './Verification'
import { WelcomeModal } from './WelcomeModal'

import type { RowProps } from 'antd'


const STEPS_GUTTER: RowProps['gutter'] = [60, 60]
const FULL_COL_SPAN = 24
const MODAL_STORAGE_KEY = 'isBillingModalShown'
const EMPTY_ACQUIRINGS_QUERY_VALUE = 'none'

type BillingOnboardingPageProps = {
    onFinish: () => void
    withVerification?: boolean
}

export const BillingOnboardingCombinedFlowPage: React.FC<BillingOnboardingPageProps> = ({ onFinish, withVerification }) => {
    const intl = useIntl()
    const PageTitleCombinedFlow = 'Настройка платежей для физлиц'
    const PageTitleOrdinaryFlow = intl.formatMessage({ id: 'accrualsAndPayments.setup.title' })

    const VerificationTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationStep.title' })
    const StepNoReturnMessage = intl.formatMessage({ id: 'accrualsAndPayments.setup.noReturn' })
    const ChooseChannelsTitle = 'Каналы для публикации' //intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseChannelsTitle' })
    const IntegrationSetupTitle = 'Настройка интеграции' //intl.formatMessage({ id: 'accrualsAndPayments.setup.chooseChannelsTitle' })

    const { useFlag } = useFeatureFlags()

    const isCombinedFlow = useFlag(UI_BILLING_SPP_COMBINED_PAGE)

    const PageTitle = isCombinedFlow ? PageTitleCombinedFlow : PageTitleOrdinaryFlow

    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const router = useRouter()
    const [welcomeShown, setWelcomeShown] = useState(false)

    useEffect(() => {
        setWelcomeShown(Boolean(localStorage.getItem(MODAL_STORAGE_KEY)))
    }, [])

    const { objs: activeAcquiringContexts, loading: activeAcquiringContextsLoading, error: activeAcquiringContextsError } = AcquiringContext.useObjects({
        where: {
            organization: { id: orgId },
            status_in: [ACQUIRING_CONTEXT_IN_PROGRESS_STATUS, ACQUIRING_CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS],
        },
    })
    const { objs: acquiringIntegrations, loading: acquiringIntegrationsLoading, error: acquiringIntegrationsError } = AcquiringIntegration.useObjects({
        where: {
            isHidden: false,
        },
        sortBy: [
            SortAcquiringIntegrationsBy.DisplayPriorityAsc,
        ],
    })

    const selectedAcquiringIntegrationIds = useMemo(() => {
        const acquiringsQueryValue = Array.isArray(router.query.acquirings)
            ? router.query.acquirings[0]
            : router.query.acquirings

        if (typeof acquiringsQueryValue === 'string') {
            if (acquiringsQueryValue === EMPTY_ACQUIRINGS_QUERY_VALUE) {
                return []
            }

            return Array.from(new Set(acquiringsQueryValue.split(',').filter(Boolean)))
        }

        return Array.from(new Set(activeAcquiringContexts.map(({ integration }) => integration?.id).filter(Boolean)))
    }, [activeAcquiringContexts, router.query.acquirings])
    const selectedAcquiringIntegrations = useMemo(() => {
        const selectedIds = new Set(selectedAcquiringIntegrationIds)
        return acquiringIntegrations.filter(({ id }) => selectedIds.has(id))
    }, [acquiringIntegrations, selectedAcquiringIntegrationIds])

    const acquiringStepsStart = 2
    const verificationStep = acquiringStepsStart + selectedAcquiringIntegrations.length
    const totalSteps = (activeAcquiringContextsLoading || acquiringIntegrationsLoading)
        ? 10
        : 2 + selectedAcquiringIntegrations.length + (withVerification ? 1 : 0)
    const [currentStep] = useOnboardingProgress(withVerification, totalSteps)

    const stepItems: Array<StepItem> = useMemo(() => {
        const steps: Array<StepItem> = [
            { title: ChooseChannelsTitle },
            { title: IntegrationSetupTitle, breakPoint: true  },
            ...selectedAcquiringIntegrations.map((integration) => ({
                title: integration.setupTitle || integration.name,
                breakPoint: true,
            })),
        ]
        if (withVerification) {
            steps.push({ title: VerificationTitle })
        }
        return steps
    }, [ChooseChannelsTitle, IntegrationSetupTitle, selectedAcquiringIntegrations, withVerification, VerificationTitle])

    const handleReturn = useCallback((newStep: number) => {
        router.push({ query: { ...router.query, step: newStep } }, undefined, { shallow: true })
    }, [router])

    const handleCloseWelcomeModal = useCallback(() => {
        localStorage.setItem(MODAL_STORAGE_KEY, 'true')
        setWelcomeShown(true)
    }, [])

    const handleAcquiringDone = useCallback(() => {
        const isLastAcquiringStep = currentStep >= verificationStep - 1

        if (withVerification && isLastAcquiringStep) {
            router.push({ query: { ...router.query, step: verificationStep } }, undefined, { shallow: true })
            return
        }

        if (!isLastAcquiringStep) {
            router.push({ query: { ...router.query, step: currentStep + 1 } }, undefined, { shallow: true })
            return
        }

        onFinish()
    }, [currentStep, onFinish, router, verificationStep, withVerification])

    const currentScreen = useMemo(() => {
        if (currentStep === 1) {
            return <SetupBilling/>
        }

        const currentAcquiringIntegration = selectedAcquiringIntegrations[currentStep - acquiringStepsStart]
        if (currentAcquiringIntegration) {
            return (
                <SetupAcquiring
                    integrationId={currentAcquiringIntegration.id}
                    onFinish={onFinish}
                    onDone={handleAcquiringDone}
                    verificationStep={verificationStep}
                />
            )
        }

        if (withVerification && currentStep === verificationStep) {
            return <Verification/>
        }

        if (activeAcquiringContextsLoading || acquiringIntegrationsLoading) {
            return <Loader fill size='large'/>
        }

        return <ChooseChannels/>
    }, [
        activeAcquiringContextsLoading,
        acquiringIntegrationsLoading,
        currentStep,
        handleAcquiringDone,
        onFinish,
        selectedAcquiringIntegrations,
        verificationStep,
        withVerification,
    ])

    if (!canManageIntegrations) {
        return <AccessDeniedPage />
    }

    if (activeAcquiringContextsError || acquiringIntegrationsError) {
        return <Typography.Title>{activeAcquiringContextsError || acquiringIntegrationsError}</Typography.Title>
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
