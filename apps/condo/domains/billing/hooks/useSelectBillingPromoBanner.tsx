import { useGetB2BAppByIdQuery, useGetB2BAppContextQuery } from '@app/condo/gql'
import { Col, Row, Image, type RowProps } from 'antd'
import classNames from 'classnames'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tag, Typography, Modal } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { BillingDescriptionModalContent } from '@condo/domains/billing/components/OnBoarding/BillingDescriptionModalContent'
import { INTEGRATION_TYPE_B2B_APP } from '@condo/domains/billing/constants/constants'
import styles from '@condo/domains/billing/hooks/useSelectBillingPromoBanner.module.css'
import { useMarkdownTemplate } from '@condo/domains/common/hooks/useMarkdownTemplate'
import { CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/miniapp/constants'

const { publicRuntimeConfig: { globalHints } } = getConfig()
const FALLBACK_IMAGE_URL = '/homeWithSun.svg'

interface PromoAppConfigI18n {
    // NOTE(@abshnko): you can wrap words in titles that should be highlighted like {{ word(s) }}
    appDisconnectedTitle: string
    appBeingConnectedTitle: string
    tag: string
    detailedDescription: string
    price: string
    // You can add an override common fields here if you really need it
}

export interface PromoAppConfig {
    appId: string
    modalBannerColor: string
    bannerTextColor: string
    modalBannerPromoImageUrl: string
    appDisconnectedImageUrl: string
    appBeingConnectedImageUrl: string
    titleHighlightColor: string
    backgroundColor: string
    i18n: Record<string, PromoAppConfigI18n>
}

const HIGHLIGHT_TEXT_OPENING_BRACKETS = '{{'
const HIGHLIGHT_TEXT_CLOSING_BRACKETS = '}}'

// NOTE(@abshnko): highlights parts of title that look like {{ words to highlight }} 
function TitleWithHighlightedWords ({ title = '', color = 'black' }) {
    const parts = []
    let i = 0
    const len = title.length

    while (i < len) {
        const openIdx = title.indexOf(HIGHLIGHT_TEXT_OPENING_BRACKETS, i)
        if (openIdx === -1) {
            parts.push({ text: title.slice(i), highlight: false })
            break
        }

        if (openIdx > i) {
            parts.push({ text: title.slice(i, openIdx), highlight: false })
        }

        const closeIdx = title.indexOf(HIGHLIGHT_TEXT_CLOSING_BRACKETS, openIdx + 2)
        if (closeIdx === -1) {
            parts.push({ text: title.slice(openIdx), highlight: false })
            break
        }

        const inner = title.slice(openIdx + 2, closeIdx)
        parts.push({ text: inner, highlight: true })

        i = closeIdx + 2
    }

    return parts.map((p, idx) =>
        p.highlight ? (
            <span key={idx} style={{ color }}>
                {p.text}
            </span>
        ) : (
            <span key={idx}>{p.text}</span>
        )
    )
}

const ITEMS_GUTTER: RowProps['gutter'] = [0, 56]

const useSelectBillingPromoBanner = () => {
    const intl = useIntl()
    const locale = intl.locale
    const { route } = useRouter()
    const { organization } = useOrganization()
    const { user } = useAuth()
    const persistor = useCachePersistor()
    const CardButtonLabel = intl.formatMessage({ id: 'miniapps.appCard.notConnected.label' })
    const ModalButtonLabel = intl.formatMessage({ id: 'accrualsAndPayments.billingModal.leaveApplicationLabel' })
    const [spawnModal, SetupPromoAppModal] = Modal.useModal()
    const promoB2BAppConfig: PromoAppConfig = useMemo(() => {
        return globalHints?.pages?.find(page => page?.routeTemplate === route)?.promoB2BApp || {}
    }, [route])

    const { data: promoB2BAppData } = useGetB2BAppByIdQuery({ 
        variables: { 
            id: promoB2BAppConfig?.appId,
        },
        skip: !promoB2BAppConfig?.appId || !persistor,
    })

    const { data: promoB2BAppContextData, refetch } = useGetB2BAppContextQuery({ 
        variables: { 
            appId: promoB2BAppConfig?.appId,
            organizationId: organization?.id,
        },
        skip: !promoB2BAppConfig?.appId || !persistor || !organization?.id,
    })

    const promoB2BApp = promoB2BAppData?.b2bApp
    const promoB2BAppContext = promoB2BAppContextData?.contexts?.[0]
    const contextStatus = promoB2BAppContext?.status
    const appAlreadyConnected = contextStatus === CONTEXT_FINISHED_STATUS
    const appIsBeingConnected = contextStatus === CONTEXT_IN_PROGRESS_STATUS
    const localizedTexts = promoB2BAppConfig?.i18n?.[locale]
    const title = appIsBeingConnected ? localizedTexts?.appBeingConnectedTitle : localizedTexts?.appDisconnectedTitle
    const detailedDescription = useMarkdownTemplate(localizedTexts?.detailedDescription || '', {
        phoneNumber: user?.phone,
    })
    const shouldShowBanner = !appAlreadyConnected && Boolean(localizedTexts?.appDisconnectedTitle) && Boolean(localizedTexts?.detailedDescription)
    const shouldShowModal = !appIsBeingConnected

    const handleBannerClick = useCallback(() => {
        if (!promoB2BApp || !shouldShowModal) return
        const modal = spawnModal({
            width: 'big',
            children: (
                <BillingDescriptionModalContent
                    id={promoB2BApp.id}
                    name={promoB2BApp.name}
                    bannerColor={promoB2BAppConfig.modalBannerColor}
                    bannerTextColor={promoB2BAppConfig.bannerTextColor}
                    targetDescription={promoB2BApp.shortDescription}
                    bannerPromoImageUrl={promoB2BAppConfig.modalBannerPromoImageUrl}
                    detailedDescription={detailedDescription}
                    integrationType={INTEGRATION_TYPE_B2B_APP}
                    servicePrice={localizedTexts?.price}
                    setupButtonLabel={ModalButtonLabel}
                    onCompleted={async () => {
                        modal.destroy()
                        await refetch()
                    }}
                />
            ),
        })
    }, [ModalButtonLabel, detailedDescription, localizedTexts?.price, promoB2BApp, promoB2BAppConfig.bannerTextColor, promoB2BAppConfig.modalBannerColor, promoB2BAppConfig.modalBannerPromoImageUrl, refetch, shouldShowModal, spawnModal])

    const Banner = useMemo(() => {
        return <div
            className={styles.promo}
            style={{ backgroundColor: promoB2BAppConfig.backgroundColor }}
        >
            <Image
                src={promoB2BAppConfig.appDisconnectedImageUrl}
                fallback={FALLBACK_IMAGE_URL}
                preview={false}
                draggable={false}
                wrapperClassName={classNames({
                    [styles.promoImageWrapper]: true,
                    [styles.imageHidden]: appIsBeingConnected,
                    [styles.imageVisible]: !appIsBeingConnected,
                })}
            />

            <Image
                src={promoB2BAppConfig.appBeingConnectedImageUrl}
                fallback={FALLBACK_IMAGE_URL}
                preview={false}
                draggable={false}
                wrapperClassName={classNames({
                    [styles.promoImageWrapper]: true,
                    [styles.imageHidden]: !appIsBeingConnected,
                    [styles.imageVisible]: appIsBeingConnected,
                })}
            />
            <Row gutter={ITEMS_GUTTER}>
                <Col span={24}>
                    <Space direction='vertical' size={24} className={styles.title}>
                        {localizedTexts?.tag && (
                            <Tag textColor={colors.white} bgColor={colors.blue[5]}>
                                {localizedTexts?.tag}
                            </Tag>
                        )}
                        <Typography.Title level={2}>
                            <TitleWithHighlightedWords title={title} color={promoB2BAppConfig.titleHighlightColor}/>
                        </Typography.Title>
                    </Space>
                </Col>
                {!appIsBeingConnected && <Col span={24} onClick={handleBannerClick}>
                    <Button type='primary' block>
                        {CardButtonLabel}
                    </Button>
                </Col>}
            </Row>
        </div>
    }, [CardButtonLabel, appIsBeingConnected, handleBannerClick, localizedTexts?.tag, promoB2BAppConfig.appBeingConnectedImageUrl, promoB2BAppConfig.appDisconnectedImageUrl, promoB2BAppConfig.backgroundColor, promoB2BAppConfig.titleHighlightColor, title])

    return {
        Banner,
        SetupPromoAppModal,
        shouldShowBanner,
    }
}

export default useSelectBillingPromoBanner