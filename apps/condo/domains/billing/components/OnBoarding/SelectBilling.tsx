import { Row, Col } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { useOrganization } from '@open-condo/next/organization'
import { Typography, Modal } from '@open-condo/ui'


import { BillingIntegrationOrganizationContext as BillingContext, BillingIntegration } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { MIN_CARD_WIDTH, AppCard } from '@condo/domains/miniapp/components/AppCard'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'

import { BillingDescriptionModalContent } from './BillingDescriptionModalContent'


import type { BillingIntegration as BillingIntegrationType } from '@app/condo/schema'
import type { RowProps } from 'antd'

const CARD_GAP = 40
const MAX_CARDS = 4
const FULL_SPAN = 24
const ROW_GUTTER: RowProps['gutter'] = [CARD_GAP, CARD_GAP]

const getCardsAmount = (width: number) => {
    const canFit = Math.max(1, Math.floor((width + CARD_GAP) / (MIN_CARD_WIDTH + CARD_GAP)))
    return Math.min(MAX_CARDS, canFit)
}

export const SelectBilling: React.FC = () => {
    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    const [spawnModal, BillingModalContext] = Modal.useModal()
    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(width)

    const { obj: connectedCtx, loading: ctxLoading, error: ctxError } = BillingContext.useObject({
        where: {
            organization: { id: orgId },
            status: CONTEXT_FINISHED_STATUS,
        },
    })
    const { objs: billings, loading: billingsLoading, error: billingsError } = BillingIntegration.useObjects({
        where: { isHidden: false },
    })

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
                    />
                ),
            })
        }
    }, [spawnModal])

    // NOTE: If already connected billing = skip to final step
    useEffect(() => {
        if (!ctxLoading && !ctxError && connectedContextId) {
            router.replace({ query: { ...router.query, step: 2 } })
        }
    }, [router, ctxLoading, ctxError, connectedContextId])


    if (ctxError || billingsError) {
        return <Typography.Title>{ctxError || billingsError}</Typography.Title>
    }

    if (ctxLoading || billingsLoading) {
        return <Loader fill size='large'/>
    }

    return (
        <>
            <Row gutter={ROW_GUTTER} ref={setRef}>
                {billings.map((billing) => (
                    <Col key={billing.id} span={FULL_SPAN / cardsPerRow}>
                        <AppCard
                            logoUrl={get(billing, ['logo', 'publicUrl'])}
                            connected={false}
                            name={billing.name}
                            description={billing.shortDescription}
                            onClick={handleCardClick(billing)}
                        />
                    </Col>
                ))}
            </Row>
            {BillingModalContext}
        </>
    )
}