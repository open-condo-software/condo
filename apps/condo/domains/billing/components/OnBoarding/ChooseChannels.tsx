import { SortBillingIntegrationOrganizationContextsBy, SortBillingIntegrationsBy, SortAcquiringIntegrationsBy, type BillingIntegration as BillingIntegrationType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Row, Col, Space } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'
import { Button, Checkbox, Modal, Radio, Typography, Tooltip } from '@open-condo/ui'

import { CONTEXT_FINISHED_STATUS as ACQUIRING_CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS as ACQUIRING_CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/acquiring/constants/context'
import { useIntegrationContexts } from '@condo/domains/acquiring/hooks/useIntegrationContexts'
import { AcquiringIntegrationContext as AcquiringContext, AcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingDescriptionModalContent } from '@condo/domains/billing/components/OnBoarding/BillingDescriptionModalContent'
import { CONTEXT_FINISHED_STATUS as BILLING_CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS as BILLING_CONTEXT_IN_PROGRESS_STATUS, INTEGRATION_TYPE_BILLING } from '@condo/domains/billing/constants/constants'
import { useIntegrationContext } from '@condo/domains/billing/hooks/useIntegrationContext'
import useSelectBillingPromoBanner from '@condo/domains/billing/hooks/useSelectBillingPromoBanner'
import { BillingIntegrationOrganizationContext as BillingContext, BillingIntegration } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { MIN_CARD_WIDTH, AppCard } from '@condo/domains/miniapp/components/AppCard'

import type { RowProps  } from 'antd'


const CARD_GAP = 40
const MAX_CARDS = 4
const FULL_SPAN = 24
const ROW_GUTTER: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const EMPTY_ACQUIRINGS_QUERY_VALUE = 'none'

const AcquiringCardWrapper = styled.div`
  position: relative;
`

const AcquiringCardCheckboxWrapper = styled.div`
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-end: 0.75rem;
  z-index: 1;
`

const BillingCardWrapper = styled.div`
  position: relative;
`

const BillingCardRadioWrapper = styled.div`
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-end: 0.75rem;
  z-index: 1;
`

type AcquiringCardProps = Pick<React.ComponentProps<typeof AppCard>, 'logoUrl' | 'name' | 'description' > & {
    checked: boolean
    onClick: () => void
}

const AcquiringCard: React.FC<AcquiringCardProps> = ({ checked, onClick, ...appCardProps }) => {
    return (
        <AcquiringCardWrapper>
            <AcquiringCardCheckboxWrapper
                onClick={(event) => {
                    event.stopPropagation()
                    onClick()
                }}
            >
                <Checkbox checked={checked} />
            </AcquiringCardCheckboxWrapper>
            <AppCard
                {...appCardProps}
                onClick={onClick}
                noExtendedInfo
            />
        </AcquiringCardWrapper>
    )
}

type BillingCardProps = Pick<React.ComponentProps<typeof AppCard>, 'logoUrl' | 'name' | 'description' | 'connected' > & {
    checked: boolean
    onSelect: () => void
    onOpen: () => void
}

const BillingCard: React.FC<BillingCardProps> = ({ checked, onSelect, onOpen, ...appCardProps }) => {
    const handleCardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement

        if (target.closest('.condo-btn,button,a')) {
            onOpen()
            return
        }

        onSelect()
    }, [onOpen, onSelect])

    return (
        <BillingCardWrapper onClick={handleCardClick}>
            <BillingCardRadioWrapper
                onClick={(event) => {
                    event.stopPropagation()
                    onSelect()
                }}
            >
                <Radio checked={checked} />
            </BillingCardRadioWrapper>
            <AppCard
                {...appCardProps }
            />
        </BillingCardWrapper>
    )
}


const getCardsAmount = (width: number) => {
    const canFit = Math.max(1, Math.floor((width + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP)))
    return Math.min(MAX_CARDS, canFit)
}

export const ChooseChannels: React.FC = () => {
    const router = useRouter()
    const { organization } = useOrganization()

    const ChooseAcquiringChannels = 'Куда будем публиковать начисления'//intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })
    const ChooseBillingChannel = 'Откуда будете получать данные по начислениям'//intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })
    const NextButtonLabel = 'Далее'//intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })
    const ChooseAcquiringChannelsMessage = 'Укажите куда будут публиковаться начисления'//intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })

    const orgId = get(organization, 'id', null)

    const [spawnModal, SetupBillingModal] = Modal.useModal()
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(width)
    const { Banner, SetupPromoAppModal, shouldShowBanner } = useSelectBillingPromoBanner()

    const [chosenAcquirings, setChosenAcquirings] = useState<string[]>([])
    const [chosenBillingId, setChosenBillingId] = useState<string | null>(null)
    const isDefaultSelectionsApplied = useRef(false)

    const handleToggleAcquiring = useCallback((acquiringId: string) => {
        setChosenAcquirings((prev) => {
            return prev.includes(acquiringId)
                ? prev.filter(id => id !== acquiringId)
                : [...prev, acquiringId]
        })
    }, [])
    const { loading: billingLoading, handleSetupClick: handleBillingSetupClick } = useIntegrationContext({ integrationType: INTEGRATION_TYPE_BILLING, integrationId: chosenBillingId })
    const { loading: acquiringLoading, handleSetupClick: handleAcquiringSetupClick } = useIntegrationContexts({ integrationIds: chosenAcquirings })


    const moveToTheNextStep = useCallback(async () => {
        await handleBillingSetupClick()
        await handleAcquiringSetupClick()
        await router.push({
            query: {
                ...router.query,
                step: 1,
            },
        }, undefined, { shallow: true })
    }, [handleAcquiringSetupClick, handleBillingSetupClick, router])

    const { objs: connectedContexts, loading: ctxLoading, error: ctxError } = BillingContext.useObjects({
        where: {
            organization: { id: orgId },
            status: BILLING_CONTEXT_FINISHED_STATUS,
        },
        sortBy: [
            SortBillingIntegrationOrganizationContextsBy.UpdatedAtDesc,
            SortBillingIntegrationOrganizationContextsBy.IdDesc,
        ],
    })
    const { objs: activeBillingContexts, loading: activeBillingContextsLoading, error: activeBillingContextsError } = BillingContext.useObjects({
        where: {
            organization: { id: orgId },
            status_in: [BILLING_CONTEXT_IN_PROGRESS_STATUS, BILLING_CONTEXT_FINISHED_STATUS],
        },
        sortBy: [
            SortBillingIntegrationOrganizationContextsBy.UpdatedAtDesc,
            SortBillingIntegrationOrganizationContextsBy.IdDesc,
        ],
    })
    const { objs: billings, loading: billingsLoading, error: billingsError } = BillingIntegration.useObjects({
        where: {
            isHidden: false,
        },
        sortBy: [
            SortBillingIntegrationsBy.DisplayPriorityAsc,
        ],
    })
    
    const { objs: acquirings, loading: acquiringsLoading, error: acquiringsError } = AcquiringIntegration.useObjects({
        where: {
            isHidden: false,
        },
        sortBy: [
            SortAcquiringIntegrationsBy.DisplayPriorityAsc,
        ],
    })
    const { objs: activeAcquiringContexts, loading: activeAcquiringContextsLoading, error: activeAcquiringContextsError } = AcquiringContext.useObjects({
        where: {
            organization: { id: orgId },
            status_in: [ACQUIRING_CONTEXT_IN_PROGRESS_STATUS, ACQUIRING_CONTEXT_FINISHED_STATUS],
        },
    })

    useEffect(() => {
        if (activeBillingContextsLoading || activeAcquiringContextsLoading || isDefaultSelectionsApplied.current) return

        const activeAcquiringIntegrationIds = Array.from(
            new Set(activeAcquiringContexts.map(({ integration }) => integration?.id).filter(Boolean))
        )
        const chosenAcquiringIds = activeAcquiringIntegrationIds.length > 0
            ? activeAcquiringIntegrationIds
            : acquirings.map(({ id }) => id)
        const chosenBillingIntegrationId = activeBillingContexts[0]?.integration?.id || billings[0]?.id || null

        setChosenAcquirings(chosenAcquiringIds)
        setChosenBillingId(chosenBillingIntegrationId)
        isDefaultSelectionsApplied.current = true
    }, [acquirings, activeAcquiringContexts, activeAcquiringContextsLoading, activeBillingContexts, activeBillingContextsLoading, billings])

    useEffect(() => {
        if (!isDefaultSelectionsApplied.current) return

        const nextAcquiringsQueryValue = chosenAcquirings.length > 0
            ? chosenAcquirings.join(',')
            : EMPTY_ACQUIRINGS_QUERY_VALUE
        const currentAcquiringsQueryValue = Array.isArray(router.query.acquirings)
            ? router.query.acquirings.join(',')
            : router.query.acquirings

        if (currentAcquiringsQueryValue === nextAcquiringsQueryValue) return

        router.replace({
            query: {
                ...router.query,
                acquirings: nextAcquiringsQueryValue,
            },
        }, undefined, { shallow: true })
    }, [chosenAcquirings, router])

    const connectedCtx = connectedContexts[0] || null
    const connectedContextId = get(connectedCtx, 'id', null)

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
                        bannerPromoImageUrl={get(billing, ['bannerPromoImage', 'publicUrl'])}
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
        if (!ctxLoading && !ctxError && connectedContextId) {
            router.replace({ query: { ...router.query, step: 2 } }, undefined, { shallow: true })
        }
    }, [router, ctxLoading, ctxError, connectedContextId])


    if (ctxError || activeBillingContextsError || billingsError || acquiringsError || activeAcquiringContextsError) {
        return <Typography.Title>{ctxError || activeBillingContextsError || billingsError || acquiringsError || activeAcquiringContextsError}</Typography.Title>
    }

    if (ctxLoading || activeBillingContextsLoading || billingsLoading || acquiringsLoading || activeAcquiringContextsLoading) {
        return <Loader fill size='large'/>
    }

    return (
        <>
            <Space direction='vertical' size={40} style={{ width: '100%' }}>
                <Space direction='vertical' size={24} style={{ width: '100%' }}>
                    <Row>
                        <Typography.Title level={2}>{ChooseAcquiringChannels}</Typography.Title>
                    </Row>
                    <Row gutter={ROW_GUTTER} ref={setRef}>
                        {acquirings.map((acquiring) => (
                            <Col key={acquiring.id} span={FULL_SPAN / cardsPerRow}>
                                <AcquiringCard
                                    logoUrl={get(acquiring, ['logo', 'publicUrl'])}
                                    checked={chosenAcquirings.includes(acquiring.id)}
                                    onClick={() => handleToggleAcquiring(acquiring.id)}
                                    name={acquiring.name}
                                    description={acquiring.shortDescription}
                                />
                            </Col>
                        ))}
                    </Row>
                </Space>
                <Space direction='vertical' size={24} style={{ width: '100%' }}>
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
                                    logoUrl={get(billing, ['logo', 'publicUrl'])}
                                    connected={false}
                                    checked={chosenBillingId === billing.id}
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
                    <Tooltip title={ chosenAcquirings.length === 0 ? ChooseAcquiringChannelsMessage : 'муму' }>
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
