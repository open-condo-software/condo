import { Col, Row, RowProps } from 'antd'
import isEmpty from 'lodash/isEmpty'
import getConfig from 'next/config'
import Head from 'next/head'
import React, { CSSProperties, useMemo, useState } from 'react'

import { Download, ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Space, Typography, Carousel, Banner } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import {
    PageContent,
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { PageComponentType } from '@condo/domains/common/types'


const {
    publicRuntimeConfig,
} = getConfig()

// NOTE: Best to replace all of these variables on one
const { guideAboutAppBlock, guideIntroduceAppBlock, guideModalCardReviews } = publicRuntimeConfig

const MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const LARGE_GUTTER: RowProps['gutter'] = [0, 60]

const ABOUT_APP_CARD_TYPES = ['payments', 'costs', 'quality', 'extraIncome'] as const

const getNextCardType = (cardType: typeof ABOUT_APP_CARD_TYPES[number] | null) => {
    const currentTypeIndex = ABOUT_APP_CARD_TYPES.indexOf(cardType)
    const isLastIndex = currentTypeIndex === ABOUT_APP_CARD_TYPES.length - 1

    return isLastIndex ? null : ABOUT_APP_CARD_TYPES[currentTypeIndex + 1]
}

const getTextWithAccent = (text: string) => {
    const parts = text.split(/\{accent}(.*?)\{\/accent}/)

    return parts.map((part, index) => {
        if (index % 2 === 0) {
            return <Typography.Text type='secondary'>{part}</Typography.Text>
        } else {
            return <Typography.Text type='primary'>{part}</Typography.Text>
        }
    })
}

const CARD_IMAGE_STYLES: CSSProperties = { height: '30px' }
const BANNER_IMAGE_STYLES: CSSProperties = { width: '50%', height: '100%', objectFit: 'cover' }

const AboutAppBlock = () => {
    const intl = useIntl()
    const InMoreDetailMessage = intl.formatMessage({ id: 'InMoreDetail' })
    const NextMessage = intl.formatMessage({ id: 'Next' })
    const CloseMessage = intl.formatMessage({ id: 'Close' })

    const { breakpoints } = useLayoutContext()
    const locale = useMemo(() => intl?.locale, [intl])

    const aboutAppBanner = useMemo(() => guideAboutAppBlock?.[locale]?.types ?? {}, [locale])
    const availableBanners = useMemo(
        () => ABOUT_APP_CARD_TYPES.filter(type => Boolean(aboutAppBanner[type])
        ), [aboutAppBanner])

    const cardReviews = useMemo(() => guideModalCardReviews?.[locale]?.types ?? {}, [locale])

    const [openModal, setOpenModal] = useState<typeof availableBanners[number]>(null)

    const modalImageBgStyles: CSSProperties = useMemo(() => ({
        display: 'flex',
        width: '100%',
        height: '320px',
        color: colors.white,
        borderRadius: '12px',
        padding: breakpoints.TABLET_LARGE ? '40px 40px 0 40px' : '40px',
    }), [breakpoints])

    const typeToModalBgColor = useMemo(() => ({
        payments: colors.cyan[5],
        costs: colors.orange[5],
        quality: colors.blue[5],
        extraIncome: colors.pink[5],
    }), [])

    if (isEmpty(aboutAppBanner)) {
        return null
    }

    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Col span={24}>
                <Carousel
                    effect='fade'
                    autoplay
                >
                    {
                        availableBanners.map((type) => (
                            <Banner
                                id={type}
                                key={type}
                                actionText={InMoreDetailMessage}
                                size='medium'
                                title={aboutAppBanner?.[type]?.title}
                                subtitle={aboutAppBanner?.[type]?.bannerText}
                                onClick={() => setOpenModal(type)}
                                imgUrl={aboutAppBanner?.[type]?.imageUrl}
                                backgroundColor={typeToModalBgColor[type]}
                                invertText={true}
                            />
                        ))
                    }
                </Carousel>
            </Col>
            {
                availableBanners.map(type => (
                    <Modal
                        key={type}
                        width='big'
                        open={openModal === type}
                        onCancel={() => setOpenModal(null)}
                        footer={(
                            <Button
                                type='primary'
                                onClick={() => {
                                    const nextType = getNextCardType(type)
                                    setOpenModal(nextType)
                                }}
                            >
                                {getNextCardType(type) ? NextMessage : CloseMessage}
                            </Button>
                        )}
                    >
                        <Space size={40} direction='vertical'>
                            <div style={{ ...modalImageBgStyles, backgroundColor: typeToModalBgColor[type] }}>
                                <Typography.Title type='inherit' level={2}>
                                    {aboutAppBanner?.[type]?.title}
                                </Typography.Title>
                                {
                                    breakpoints.TABLET_LARGE && (
                                        <img
                                            src={aboutAppBanner?.[type]?.imageUrl}
                                            alt={aboutAppBanner?.[type]?.title}
                                            style={BANNER_IMAGE_STYLES}
                                        />
                                    )
                                }
                            </div>
                            <Row gutter={[40, 40]}>
                                <Col xs={24} md={12}>
                                    <Typography.Paragraph type='secondary'>
                                        {getTextWithAccent(aboutAppBanner?.[type]?.modalText)}
                                    </Typography.Paragraph>
                                    {
                                        type === 'payments' && (
                                            <Typography.Paragraph type='secondary'>
                                                {getTextWithAccent(aboutAppBanner?.[type]?.['modalText.secondParagraph'])}
                                            </Typography.Paragraph>
                                        )
                                    }
                                </Col>
                                {
                                    cardReviews?.[type] && (
                                        <Col xs={24} md={12}>
                                            <Card title={(
                                                <img
                                                    src={cardReviews?.[type]?.imageUrl ?? ''}
                                                    style={CARD_IMAGE_STYLES}
                                                    alt={cardReviews?.[type]?.text ?? ''}
                                                />
                                            )}
                                            >
                                                <Card.CardBody
                                                    description={cardReviews?.[type]?.text ?? ''}
                                                    mainLink={{
                                                        href: cardReviews?.[type]?.blogUrl,
                                                        PreIcon: ExternalLink,
                                                        label: guideModalCardReviews?.[locale]?.textLink ?? '',
                                                        openInNewTab: true,
                                                    }}
                                                />
                                            </Card>
                                        </Col>
                                    )
                                }
                            </Row>
                        </Space>
                    </Modal>
                ))
            }
        </Row>
    )
}

const PANEL_IMAGE_STYLES: CSSProperties = { maxWidth: '100%' }
const APP_CARD_IMAGE_STYLES: CSSProperties = { width: '100%' }

const INTRODUCE_APP_STEP_TYPES = ['announcement', 'chats', 'layout', 'banner', 'socialNetworks', 'leaflet', 'stickers'] as const
const CARD_GAP = 40
const CONTENT_SPACING: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const MIN_CARD_WIDTH = 380
const getCardsAmount = (width: number) => {
    return Math.max(1, Math.floor(width / (MIN_CARD_WIDTH + CARD_GAP)))
}

const IntroduceAppBlock = () => {
    const { locale } = useIntl()

    const [{ width }, refCallback] = useContainerSize<HTMLDivElement>()
    const cardsPerRow = getCardsAmount(width)

    const stepMaterials = useMemo(() => guideIntroduceAppBlock?.[locale]?.types ?? {}, [locale])
    const availableSteps = useMemo(
        () => INTRODUCE_APP_STEP_TYPES.filter(type => Boolean(stepMaterials[type])
        ), [stepMaterials])

    const [openModal, setOpenModal] = useState<typeof availableSteps[number]>(null)

    if (isEmpty(stepMaterials)) {
        return null
    }

    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Col span={24}>
                <Typography.Title level={2}>{guideIntroduceAppBlock?.[locale]?.title ?? ''}</Typography.Title>
            </Col>
            <Row gutter={CONTENT_SPACING} ref={refCallback}>
                {
                    availableSteps.map(type => (
                        <Col span={Math.floor(24 / cardsPerRow)} key={type}>
                            <Card.CardButton
                                key={type}
                                onClick={() => setOpenModal(type)}
                                header={{
                                    headingTitle: stepMaterials?.[type]?.title,
                                }}
                                body={{
                                    image: {
                                        src: stepMaterials?.[type]?.imageUrl ?? '',
                                        style: APP_CARD_IMAGE_STYLES,
                                    },
                                }}
                            />
                        </Col>
                    ))
                }
                {
                    availableSteps.map(type => (
                        <Modal
                            key={type}
                            open={openModal === type}
                            onCancel={() => setOpenModal(null)}
                            title={stepMaterials?.[type]?.title}
                            footer={(
                                <a href={stepMaterials?.[type]?.materialsUrl ?? ''} target='_blank' rel='noreferrer'>
                                    <Button type='primary' icon={<Download/>}>
                                        {stepMaterials?.[type]?.downloadMaterials}
                                    </Button>
                                </a>
                            )}
                        >
                            <Space size={40} direction='vertical'>
                                <img style={PANEL_IMAGE_STYLES} src={stepMaterials?.[type]?.imageUrl ?? ''} alt={stepMaterials?.[type]?.downloadMaterials}/>
                                <Row>
                                    <Typography.Paragraph type='secondary'>
                                        {getTextWithAccent(stepMaterials?.[type]?.body)}
                                    </Typography.Paragraph>
                                    {
                                        (type === 'announcement' || type === 'layout') && (
                                            <Typography.Paragraph type='secondary'>
                                                {getTextWithAccent(stepMaterials?.[type]?.['body.secondParagraph'])}
                                            </Typography.Paragraph>
                                        )
                                    }
                                    {
                                        type === 'layout' && (
                                            <Typography.Paragraph type='secondary'>
                                                {getTextWithAccent(stepMaterials?.[type]?.['body.thirdParagraph'])}
                                            </Typography.Paragraph>
                                        )
                                    }
                                </Row>
                            </Space>
                        </Modal>
                    ))
                }
            </Row>
        </Row>
    )
}

const GuidePage: PageComponentType = () => {
    const { locale } = useIntl()
    const PageTitle = useMemo(() => guideAboutAppBlock?.[locale]?.title ?? '', [locale])

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader spaced title={<Typography.Title>{PageTitle}</Typography.Title>} />
                <PageContent>
                    <Row gutter={LARGE_GUTTER}>
                        <Col span={24}>
                            <AboutAppBlock />
                        </Col>
                        <Col span={24}>
                            <IntroduceAppBlock />
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

GuidePage.requiredAccess = AuthRequired

export default GuidePage
