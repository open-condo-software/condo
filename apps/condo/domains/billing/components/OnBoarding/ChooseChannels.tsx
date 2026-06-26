import { SortBillingIntegrationOrganizationContextsBy, SortBillingIntegrationsBy, SortAcquiringIntegrationsBy, type BillingIntegration as BillingIntegrationType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Row, Col, Space } from 'antd'
import get from 'lodash/get'
import Router from 'next/router'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'
import { Button, Checkbox, Modal, Radio, Typography } from '@open-condo/ui'

import { AcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingDescriptionModalContent } from '@condo/domains/billing/components/OnBoarding/BillingDescriptionModalContent'
import { INTEGRATION_TYPE_BILLING } from '@condo/domains/billing/constants/constants'
import useSelectBillingPromoBanner from '@condo/domains/billing/hooks/useSelectBillingPromoBanner'
import { BillingIntegrationOrganizationContext as BillingContext, BillingIntegration } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { MIN_CARD_WIDTH, AppCard } from '@condo/domains/miniapp/components/AppCard'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'

import { useIntegrationContext } from '@condo/domains/billing/hooks/useIntegrationContext'

import type { RowProps  } from 'antd'


const CARD_GAP = 40
const MAX_CARDS = 4
const FULL_SPAN = 24
const ROW_GUTTER: RowProps['gutter'] = [CARD_GAP, CARD_GAP]

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

type AcquiringCardProps = Pick<React.ComponentProps<typeof AppCard>, 'logoUrl' | 'name' | 'description'> & {
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

type BillingCardProps = Pick<React.ComponentProps<typeof AppCard>, 'logoUrl' | 'name' | 'description' | 'connected'> & {
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
                {...appCardProps}
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

    const orgId = get(organization, 'id', null)

    const [spawnModal, SetupBillingModal] = Modal.useModal()
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(width)
    const { Banner, SetupPromoAppModal, shouldShowBanner } = useSelectBillingPromoBanner()

    const [chosenAcquirings, setChosenAcquirings] = useState<string[]>([])
    const [chosenBillingId, setChosenBillingId] = useState<string | null>(null)
    const isDefaultAcquiringsSelected = useRef(false)

    const handleToggleAcquiring = useCallback((acquiringId: string) => {
        setChosenAcquirings((prev) => {
            return prev.includes(acquiringId)
                ? prev.filter(id => id !== acquiringId)
                : [...prev, acquiringId]
        })
    }, [])
    const { loading, handleSetupClick } = useIntegrationContext({ integrationType: INTEGRATION_TYPE_BILLING, integrationId: chosenBillingId })


    const moveToTheNextStep = useCallback(async () => {
        await handleSetupClick()
        await router.push('/billing/setup?step=1')
    }, [handleSetupClick, router])

    const { objs: connectedContexts, loading: ctxLoading, error: ctxError } = BillingContext.useObjects({
        where: {
            organization: { id: orgId },
            status: CONTEXT_FINISHED_STATUS,
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

    useEffect(() => {
        if (acquiringsLoading || isDefaultAcquiringsSelected.current) return

        setChosenAcquirings(acquirings.map(({ id }) => id))
        isDefaultAcquiringsSelected.current = true
    }, [acquirings, acquiringsLoading])

    useEffect(() => {
        if (billingsLoading || chosenBillingId || !billings[0]?.id) return

        setChosenBillingId(billings[0].id)
    }, [billings, billingsLoading, chosenBillingId])

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


    if (ctxError || billingsError || acquiringsError) {
        return <Typography.Title>{ctxError || billingsError || acquiringsError}</Typography.Title>
    }

    if (ctxLoading || billingsLoading || acquiringsLoading) {
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
                    <Button
                        key='submit'
                        type='primary'
                        htmlType='submit'
                        loading={loading}
                        onClick={moveToTheNextStep}
                    >
                        Далее
                    </Button>
                </Row>
            </Space>
            {SetupBillingModal}
            {SetupPromoAppModal}
        </>
    )
}
