import { Col, Row, RowProps } from 'antd'
import isEmpty from 'lodash/isEmpty'
import getConfig from 'next/config'
import Head from 'next/head'
import React, { CSSProperties, useMemo, useState } from 'react'

import { Download, ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Space, Typography, Carousel, Banner } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import {
    PageContent,
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'


const {
    publicRuntimeConfig,
} = getConfig()

const { guideModalCardReviews, guideIntroduceAppMaterials } = publicRuntimeConfig

const MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const LARGE_GUTTER: RowProps['gutter'] = [0, 60]

const ABOUT_APP_CARD_TYPES = ['payments', 'costs', 'quality', 'extraIncome'] as const
type AboutAppCardType = typeof ABOUT_APP_CARD_TYPES[number] | null

const getNextCardType = (cardType: AboutAppCardType) => {
    const currentTypeIndex = ABOUT_APP_CARD_TYPES.indexOf(cardType)
    const isLastIndex = currentTypeIndex === ABOUT_APP_CARD_TYPES.length - 1

    return isLastIndex ? null : ABOUT_APP_CARD_TYPES[currentTypeIndex + 1]
}

const CARD_IMAGE_STYLES: CSSProperties = { height: '30px' }

const AboutAppBlock = () => {
    const intl = useIntl()
    const InMoreDetailMessage = intl.formatMessage({ id: 'InMoreDetail' })
    const NextMessage = intl.formatMessage({ id: 'Next' })
    const CloseMessage = intl.formatMessage({ id: 'Close' })

    const { breakpoints } = useLayoutContext()
    const locale = useMemo(() => intl?.locale, [intl])
    const [openModal, setOpenModal] = useState<AboutAppCardType>(null)

    const modalImageBgStyles: CSSProperties = useMemo(() => ({
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '320px',
        color: colors.white,
        borderRadius: '12px',
        padding: breakpoints.TABLET_LARGE ? '40px 70px 0 40px' : '40px',
    }), [breakpoints])

    const typeToModalBgColor = useMemo(() => ({
        payments: colors.cyan[5],
        costs: colors.orange[5],
        quality: colors.blue[5],
        extraIncome: colors.pink[5],
    }), [])

    const CAROUSEL_AUTOPLAY_SPEED = 5000

    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Col span={24}>
                <Carousel
                    effect='fade'
                    autoplay
                    autoplaySpeed={CAROUSEL_AUTOPLAY_SPEED}
                >
                    {
                        ABOUT_APP_CARD_TYPES.map((type) => (
                            <Banner
                                id={type}
                                key={type}
                                actionText={InMoreDetailMessage}
                                size='medium'
                                title={intl.formatMessage({ id: `tour.guide.aboutApp.${type}.title` })}
                                subtitle={intl.formatMessage({ id: `tour.guide.aboutApp.${type}.banner.body` })}
                                onClick={() => setOpenModal(type)}
                                imgUrl={`/onboarding/guide/aboutApp/${locale}/${type}/modalImage.webp`}
                                backgroundColor={typeToModalBgColor[type]}
                                invertText={true}
                            />
                        ))
                    }
                </Carousel>
            </Col>
            {
                ABOUT_APP_CARD_TYPES.map(type => (
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
                                    {intl.formatMessage({ id: `tour.guide.aboutApp.${type}.title` })}
                                </Typography.Title>
                                {
                                    breakpoints.TABLET_LARGE && (
                                        <img
                                            src={`/onboarding/guide/aboutApp/${locale}/${type}/modalImage.webp`}
                                            alt={intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.picText` })}
                                        />
                                    )
                                }
                            </div>
                            <Row gutter={[40, 40]}>
                                <Col xs={24} md={12}>
                                    <Typography.Paragraph type='secondary'>
                                        {intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.body` })}
                                    </Typography.Paragraph>
                                    {
                                        type === 'payments' && (
                                            <Typography.Paragraph type='secondary'>
                                                {intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.body.secondParagraph` })}
                                            </Typography.Paragraph>
                                        )
                                    }
                                </Col>
                                {
                                    guideModalCardReviews?.[locale]?.types?.[type] && (
                                        <Col xs={24} md={12}>
                                            <Card title={(
                                                <img
                                                    src={guideModalCardReviews?.[locale]?.types?.[type]?.imageUrl ?? ''}
                                                    style={CARD_IMAGE_STYLES}
                                                    alt={guideModalCardReviews?.[locale]?.types?.[type]?.text ?? ''}
                                                />
                                            )}
                                            >
                                                <Card.CardBody
                                                    description={guideModalCardReviews?.[locale]?.types?.[type]?.text ?? ''}
                                                    mainLink={{
                                                        href: guideModalCardReviews?.[locale]?.types?.[type]?.blogUrl,
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

const INTRODUCE_APP_STEP_TYPES = ['announcement', 'chats', 'layout', 'banner', 'socialNetworks', 'leaflet', 'stickers'] as const

const IntroduceAppBlock = () => {
    const intl = useIntl()
    const BlockTitle = intl.formatMessage({ id: 'tour.guide.introduceApp.title' })

    const locale = useMemo(() => intl?.locale, [intl])

    const stepMaterials = useMemo(() => guideIntroduceAppMaterials?.[locale] ?? {}, [locale])
    const availableSteps = useMemo(
        () => INTRODUCE_APP_STEP_TYPES.filter(type => Boolean(stepMaterials[type])
        ), [stepMaterials])

    const [openModal, setOpenModal] = useState<typeof availableSteps[number]>(null)

    if (isEmpty(stepMaterials)) {
        return null
    }
    const APP_CARD_IMAGE_STYLES: CSSProperties = { width: '336px' }
    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Col span={24}>
                <Typography.Title level={2}>{BlockTitle}</Typography.Title>
            </Col>
            <Col span={24} style={{ display: 'flex', flexWrap: 'wrap', rowGap: '40px', columnGap: '24px', justifyContent: 'center' }}>
                {
                    availableSteps.map((type) => (
                        <Col key={type}>
                            <Card.CardButton
                                key={type}
                                onClick={() => setOpenModal(type)}
                                header={{
                                    headingTitle: intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.title` }),
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
                            title={intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.title` })}
                            footer={(
                                <a href={stepMaterials?.[type]?.materialsUrl ?? ''} target='_blank' rel='noreferrer'>
                                    <Button type='primary' icon={<Download/>}>
                                        {intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.downloadMaterials` })}
                                    </Button>
                                </a>
                            )}
                        >
                            <Space size={40} direction='vertical'>
                                <img style={PANEL_IMAGE_STYLES} src={stepMaterials?.[type]?.imageUrl ?? ''} alt={intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.title` })}/>
                                <Row>
                                    <Typography.Paragraph type='secondary'>
                                        {intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.body` })}
                                    </Typography.Paragraph>
                                    {
                                        (type === 'announcement' ?? type === 'layout') && (
                                            <Typography.Paragraph type='secondary'>
                                                {intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.body.secondParagraph` })}
                                            </Typography.Paragraph>
                                        )
                                    }
                                    {
                                        type === 'layout' && (
                                            <Typography.Paragraph type='secondary'>
                                                {intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.body.thirdParagraph` })}
                                            </Typography.Paragraph>
                                        )
                                    }
                                </Row>
                            </Space>
                        </Modal>
                    ))
                }
            </Col>
        </Row>
    )
}

const GuidePage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'tour.guide.title' })

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
