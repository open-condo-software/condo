import { SortBillingIntegrationsBy, SortAcquiringIntegrationsBy, type BillingIntegration as BillingIntegrationType } from '@app/condo/schema'
import { Row, Col, Space } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Checkbox, Modal, Radio, Typography, Tooltip } from '@open-condo/ui'

import { useIntegrationContexts } from '@condo/domains/acquiring/hooks/useIntegrationContexts'
import { AcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { BillingDescriptionModalContent } from '@condo/domains/billing/components/OnBoarding/BillingDescriptionModalContent'
import { CONTEXT_FINISHED_STATUS as BILLING_CONTEXT_FINISHED_STATUS, INTEGRATION_TYPE_BILLING } from '@condo/domains/billing/constants/constants'
import { useIntegrationContext } from '@condo/domains/billing/hooks/useIntegrationContext'
import useSelectBillingPromoBanner from '@condo/domains/billing/hooks/useSelectBillingPromoBanner'
import { BillingIntegration } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { MIN_CARD_WIDTH, AppCard } from '@condo/domains/miniapp/components/AppCard'

import styles from './ChooseChannels.module.css'

import type { RowProps  } from 'antd'

const { publicRuntimeConfig: { sppConfig, registryUploadIntegrationId  } } = getConfig()

const billingGroup = new Set([sppConfig.BillingIntegrationId, registryUploadIntegrationId])

const CARD_GAP = 40
const MAX_CARDS = 4
const FULL_SPAN = 24
const ROW_GUTTER: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const EMPTY_ACQUIRINGS_QUERY_VALUE = 'none'

type AcquiringCardProps = Pick<React.ComponentProps<typeof AppCard>, 'logoUrl' | 'name' | 'description' > & {
    checked: boolean
    onClick: () => void
}

const AcquiringCard: React.FC<AcquiringCardProps> = ({ checked, onClick, ...appCardProps }) => {
    return (
        <div className={styles['acquiring-card-wrapper']}>
            <div className={styles['acquiring-card-checkbox-wrapper']} >
                <Checkbox checked={checked} />
            </div>
            <AppCard
                {...appCardProps}
                onClick={onClick}
                noExtendedInfo
            />
        </div>
    )
}

type BillingCardProps = Pick<React.ComponentProps<typeof AppCard>, 'logoUrl' | 'name' | 'description' | 'connected' > & {
    checked: boolean
    onSelect: () => void
    onOpen: () => void
}

const BillingCard: React.FC<BillingCardProps> = ({ checked, onSelect, onOpen, ...appCardProps }) => {
    const handleCardClick = useCallback((e?: React.MouseEvent) => {
        const target = e?.target as HTMLElement | undefined
        if (target && target.closest('button')) {
            onOpen()
            return
        }
        onSelect()
    }, [onOpen, onSelect])

    return (
        <div className={styles['billing-card-wrapper']}>
            <div
                className={styles['billing-card-radio-wrapper']}
            >
                <Radio checked={checked} onChange={onSelect}/>
            </div>
            <AppCard
                {...appCardProps }
                onClick={handleCardClick}
            />
        </div>
    )
}


const getCardsAmount = (width: number) => {
    const canFit = Math.max(1, Math.floor((width + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP)))
    return Math.min(MAX_CARDS, canFit)
}

interface IChooseChannels {
    onFinish: () => Promise<unknown>
}

export const ChooseChannels: React.FC<IChooseChannels> = ({ onFinish }) => {
    const router = useRouter()
    const intl = useIntl()

    const ChooseAcquiringChannels = intl.formatMessage({ id: 'pages.billing.setup.chooseAcquirings.title' })
    const ChooseBillingChannel = intl.formatMessage({ id: 'pages.billing.setup.chooseBillings.title' })
    const NextButtonLabel = intl.formatMessage({ id: 'pages.billing.setup.chooseNext.button.label' })
    const ChooseAcquiringChannelsMessage = intl.formatMessage({ id: 'pages.billing.setup.chooseAcquirings.tooltip' })

    const [spawnModal, SetupBillingModal] = Modal.useModal()
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(width)
    const { Banner, SetupPromoAppModal, shouldShowBanner } = useSelectBillingPromoBanner()

    const [chosenAcquirings, setChosenAcquirings] = useState<string[]>([])
    const [chosenBillingId, setChosenBillingId] = useState<string | null>(null)
    const [isSppFlow, setIsSppFlow] = useState(false)

    const isDefaultSelectionsApplied = useRef(false)
    const updateChosenAcquirings = useCallback((chosenAcquirings: string[]) => {
        setChosenAcquirings(chosenAcquirings)
        if (chosenAcquirings.includes(sppConfig.AcquiringIntegrationId)) {
            setIsSppFlow(true)
        } else {
            setIsSppFlow(false)
        }
    }, [setChosenAcquirings, setIsSppFlow])

    const handleToggleAcquiring = useCallback((acquiringId: string) => {
        updateChosenAcquirings(chosenAcquirings.includes(acquiringId)
            ? chosenAcquirings.filter(id => id !== acquiringId)
            : [...chosenAcquirings, acquiringId])
    }, [chosenAcquirings, updateChosenAcquirings])

    const { loading: billingLoading, handleSetupClick: handleBillingSetupClick } = useIntegrationContext({ integrationType: INTEGRATION_TYPE_BILLING, integrationId: chosenBillingId, isSppFlow })
    const { loading: acquiringLoading, handleSetupClick: handleAcquiringSetupClick } = useIntegrationContexts({ integrationIds: chosenAcquirings })

    const moveToTheNextStep = useCallback(async () => {
        await handleBillingSetupClick()
        await handleAcquiringSetupClick()
        await onFinish()
        await router.push({ query: { ...router.query, step: 1 } }, undefined, { shallow: true })
    }, [handleAcquiringSetupClick, handleBillingSetupClick, onFinish, router])

    const { billingContexts, acquiringContexts } = useBillingAndAcquiringContexts()

    const connectedContexts = useMemo(() => {
        return billingContexts.filter(({ status }) => status === BILLING_CONTEXT_FINISHED_STATUS)
    }, [billingContexts])

    const { objs: billings, loading: billingsLoading } = BillingIntegration.useObjects({
        where: { isHidden: false, setupUrl_not: null }, sortBy: [ SortBillingIntegrationsBy.DisplayPriorityAsc ],
    })
    
    const { objs: acquirings, loading: acquiringsLoading } = AcquiringIntegration.useObjects({
        where: { isHidden: false, setupUrl_not: null }, sortBy: [ SortAcquiringIntegrationsBy.DisplayPriorityAsc ],
    })

    useEffect(() => {
        if (billingsLoading || acquiringsLoading || isDefaultSelectionsApplied.current) return
        const activeAcquiringIntegrationIds = Array.from(
            new Set(acquiringContexts.map(({ integration }) => integration?.id).filter(Boolean))
        )
        const chosenAcquiringIds = activeAcquiringIntegrationIds.length > 0
            ? activeAcquiringIntegrationIds
            : acquirings.map(({ id }) => id)
        const chosenBillingIntegrationId = billingContexts[0]?.integration?.id || billings[0]?.id || null
        updateChosenAcquirings(chosenAcquiringIds)
        setChosenBillingId(chosenBillingIntegrationId)
        isDefaultSelectionsApplied.current = true
    }, [acquiringContexts, acquirings, acquiringsLoading, billingContexts, billings, billingsLoading, updateChosenAcquirings])

    useEffect(() => {
        if (!isDefaultSelectionsApplied.current) return
        const nextAcquiringsQueryValue = chosenAcquirings.length > 0
            ? chosenAcquirings.join(',')
            : EMPTY_ACQUIRINGS_QUERY_VALUE
        const currentAcquiringsQueryValue = Array.isArray(router.query.acquirings)
            ? router.query.acquirings.join(',')
            : router.query.acquirings
        if (currentAcquiringsQueryValue === nextAcquiringsQueryValue) return
        router.replace({ query: { ...router.query, acquirings: nextAcquiringsQueryValue } }, undefined, { shallow: true })
    }, [chosenAcquirings, router])

    const connectedCtx = connectedContexts[0] || null
    const connectedContextId = connectedCtx?.id

    const handleCardClick = useCallback((billing: BillingIntegrationType) => {
        return function openModal () {
            spawnModal({
                width: 'big',
                children: (
                    <BillingDescriptionModalContent
                        id={billing.id}
                        name={billing.name}
                        bannerColor={billing.bannerColor}
                        bannerTextColor={billing.bannerTextColor}
                        targetDescription={billing.targetDescription}
                        bannerPromoImageUrl={billing.bannerPromoImage?.publicUrl}
                        receiptsLoadingTime={billing.receiptsLoadingTime}
                        detailedDescription={billing.detailedDescription}
                        integrationType={INTEGRATION_TYPE_BILLING}
                        noSetupButton={true}
                    />
                ),
            })
        }
    }, [spawnModal])

    // NOTE: If already connected billing = skip to final step
    useEffect(() => {
        if (connectedContextId  && acquiringContexts.length) {
            router.replace({ query: { ...router.query, step: 2 } }, undefined, { shallow: true })
        }
    }, [router, connectedContextId, acquiringContexts])

    if (billingsLoading || acquiringsLoading) {
        return <Loader fill size='large'/>
    }

    return (
        <>
            <Space className={styles['full-width-space']} direction='vertical' size={40}>
                <Space className={styles['full-width-space']} direction='vertical' size={24}>
                    <Row>
                        <Typography.Title level={2}>{ChooseAcquiringChannels}</Typography.Title>
                    </Row>
                    <Row gutter={ROW_GUTTER} ref={setRef}>
                        {acquirings.map((acquiring) => (
                            <Col key={acquiring.id} span={FULL_SPAN / cardsPerRow}>
                                <AcquiringCard
                                    logoUrl={acquiring.logo?.publicUrl}
                                    checked={chosenAcquirings.includes(acquiring.id)}
                                    onClick={() => handleToggleAcquiring(acquiring.id)}
                                    name={acquiring.name}
                                    description={acquiring.shortDescription}
                                />
                            </Col>
                        ))}
                    </Row>
                </Space>
                <Space className={styles['full-width-space']} direction='vertical' size={24}>
                    <Row>
                        <Typography.Title level={2}>{ChooseBillingChannel}</Typography.Title>
                    </Row>
                    <Row gutter={ROW_GUTTER} ref={setRef}>
                        {shouldShowBanner && (
                            <Col span={FULL_SPAN / cardsPerRow}>
                                {Banner}
                            </Col>
                        )}
                        {billings.map((billing) => (
                            <Col key={billing.id} span={FULL_SPAN / cardsPerRow}>
                                <BillingCard
                                    logoUrl={billing.logo?.publicUrl}
                                    connected={false}
                                    checked={chosenBillingId === billing.id || billingGroup.has(billing.id) && billingGroup.has(chosenBillingId)}
                                    onSelect={() => setChosenBillingId(billing.id)}
                                    onOpen={handleCardClick(billing)}
                                    name={billing.name}
                                    description={billing.shortDescription}
                                />
                            </Col>
                        ))}
                    </Row>
                </Space>
                <Row>
                    <Tooltip title={ chosenAcquirings.length === 0 ? ChooseAcquiringChannelsMessage : undefined }>
                        <Col span={4}>
                            <Button
                                key='submit'
                                type='primary'
                                htmlType='submit'
                                loading={billingLoading || acquiringLoading}
                                onClick={moveToTheNextStep}
                                disabled={chosenAcquirings.length === 0}
                            >
                                {NextButtonLabel}
                            </Button>
                        </Col>
                    </Tooltip>
                </Row>
            </Space>
            {SetupBillingModal}
            {SetupPromoAppModal}
        </>
    )
}
