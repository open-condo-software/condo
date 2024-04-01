import styled from '@emotion/styled'
import { Col, Collapse, Row, RowProps } from 'antd'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { ChevronDown, ChevronUp, Download, ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import {
    PageContent,
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'


const {
    publicRuntimeConfig,
} = getConfig()

const { guideModalCardLink } = publicRuntimeConfig

const MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const LARGE_GUTTER: RowProps['gutter'] = [0, 60]

const ABOUT_APP_CARD_TYPES = ['payments', 'costs', 'quality', 'communication'] as const
type AboutAppCardType = typeof ABOUT_APP_CARD_TYPES[number] | null

const getNextCardType = (cardType: AboutAppCardType) => {
    const currentTypeIndex = ABOUT_APP_CARD_TYPES.indexOf(cardType)
    const isLastIndex = currentTypeIndex === ABOUT_APP_CARD_TYPES.length - 1

    return isLastIndex ? null : ABOUT_APP_CARD_TYPES[currentTypeIndex + 1]
}

const CardsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
  overflow-x: auto;
  padding: 8px 0;

  .condo-card {
    width: 268px;
    height: 290px;
    min-width: 268px;

    display: flex;
    flex-direction: column;

    .condo-card-body {
      flex-grow: 1;

      .condo-card-body-content {
        height: 100%;
        display: flex;
        justify-content: space-between;
      }
    }
  }
`
const BANNER_IMAGE_STYLES: CSSProperties = { height: '100%' }
const CARD_IMAGE_STYLES: CSSProperties = { height: '30px' }

const getTextWithAccent = (text) => {
    const parts = text.split(/\{accent\}(.*?)\{\/accent\}/)

    return parts.map((part, index) => {
        if (index % 2 === 0) {
            return <Typography.Text type='secondary'>{part}</Typography.Text>
        } else {
            return <Typography.Text type='primary'>{part}</Typography.Text>
        }
    })
}

const AboutAppBlock = () => {
    const intl = useIntl()
    const BlockTitle = intl.formatMessage({ id: 'tour.guide.aboutApp.title' })
    const InMoreDetailMessage = intl.formatMessage({ id: 'InMoreDetail' })
    const NextMessage = intl.formatMessage({ id: 'Next' })
    const CloseMessage = intl.formatMessage({ id: 'Close' })
    const ModalCardLinkMessage = intl.formatMessage({ id: 'tour.guide.aboutApp.modal.card.link' })

    const { breakpoints } = useLayoutContext()
    const locale = useMemo(() => get(intl, 'locale'), [intl])

    const modalImageBgStyles: CSSProperties = useMemo(() => ({
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '320px',
        color: colors.white,
        borderRadius: '12px',
        padding: breakpoints.TABLET_LARGE ? '40px 70px 0 40px' : '40px',
    }), [breakpoints])

    const [openModal, setOpenModal] = useState<AboutAppCardType>(null)

    const typeToModalBgColor = useMemo(() => ({
        payments: colors.cyan[5],
        costs: colors.orange[5],
        quality: colors.blue[5],
        communication: colors.pink[5],
    }), [])


    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Col span={24}>
                <Typography.Title level={2}>{BlockTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <CardsWrapper>
                    {
                        ABOUT_APP_CARD_TYPES.map(type => (
                            <Card.CardButton
                                key={type}
                                header={{
                                    image: {
                                        src: `/onboarding/guide/aboutApp/${locale}/${type}/cardImage.png`,
                                        size: 'big',
                                    },
                                }}
                                body={{
                                    description: intl.formatMessage({ id: `tour.guide.aboutApp.${type}.card.body` }),
                                    button: {
                                        type: 'secondary',
                                        children: InMoreDetailMessage,
                                        onClick: () => setOpenModal(type),
                                    },
                                }}
                            />
                        ))
                    }
                </CardsWrapper>
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
                                    {intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.picText` })}
                                </Typography.Title>
                                {
                                    breakpoints.TABLET_LARGE && (
                                        <img
                                            style={BANNER_IMAGE_STYLES}
                                            src={`/onboarding/guide/aboutApp/${locale}/${type}/modalImage.png`}
                                        />
                                    )
                                }
                            </div>
                            <Row gutter={[40, 40]}>
                                <Col xs={24} md={12}>
                                    <Typography.Paragraph type='secondary'>
                                        {getTextWithAccent(intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.body` }))}
                                    </Typography.Paragraph>
                                    {
                                        type === 'payments' && (
                                            <Typography.Paragraph type='secondary'>
                                                {getTextWithAccent(intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.body.secondParagraph` }))}
                                            </Typography.Paragraph>
                                        )
                                    }
                                </Col>
                                {
                                    get(guideModalCardLink, [locale, type]) && (
                                        <Col xs={24} md={12}>
                                            <Card title={(
                                                <img
                                                    src={`/onboarding/guide/aboutApp/${locale}/${type}/modalLogo.png`}
                                                    style={CARD_IMAGE_STYLES}
                                                />
                                            )}
                                            >
                                                <Card.CardBody
                                                    description={intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.card.body` })}
                                                    mainLink={{
                                                        href: get(guideModalCardLink, [locale, type]),
                                                        PreIcon: ExternalLink,
                                                        label: ModalCardLinkMessage,
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

const BADGE_STYLES: CSSProperties = {
    color: 'white',
    borderRadius: '100px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 16px',
    background: colors.brandGradient[7],
    whiteSpace: 'nowrap',
}

const Badge = ({ title }) => {
    return (
        <div style={BADGE_STYLES}>
            <Typography.Title level={5} type='inherit'>{title}</Typography.Title>
        </div>
    )
}

// TODO(DOMA-8714): Move Accordion to UI-kit component
const StyledCollapse = styled(Collapse)`
  & > .ant-collapse-item {
    padding: 0;
    flex-flow: column;
    border-radius: 12px;
    border: 1px solid ${colors.gray[3]};

    .ant-collapse-header {
      padding: 24px;
    }

    & > .ant-collapse-content > .ant-collapse-content-box {
      padding: 16px 24px 24px 24px;
    }
  }
`
const REF_HANDLER_STYLES: CSSProperties = { marginBottom: '8px' }
const PANEL_IMAGE_STYLES: CSSProperties = { maxHeight: '300px', maxWidth: '100%' }
const STEP_TEXT_CONTAINER_STYLES: CSSProperties = { maxWidth: '630px' }

const { Panel } = Collapse

const INTRODUCE_APP_STEP_TYPES = ['announcement', 'chats', 'layout', 'banner', 'socialNetworks', 'leaflet', 'stickers'] as const

const IntroduceAppBlock = () => {
    const intl = useIntl()
    const BlockTitle = intl.formatMessage({ id: 'tour.guide.introduceApp.title' })
    const DownloadPicsMessage = intl.formatMessage({ id: 'tour.guide.introduceApp.step.socialNetworks.downloadPics' })
    const DownloadTextMessage = intl.formatMessage({ id: 'tour.guide.introduceApp.step.socialNetworks.downloadText' })

    const { breakpoints } = useLayoutContext()
    const locale = useMemo(() => get(intl, 'locale'), [intl])

    const scrollRefs = React.useRef(INTRODUCE_APP_STEP_TYPES.reduce((acc, type) => {
        acc[type] = React.createRef()
        return acc
    }, {}))

    const executeScroll = useCallback((index) => {
        if (!index) return

        scrollRefs.current[index].current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        })
    }, [])

    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Col span={24}>
                <Typography.Title level={2}>{BlockTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <StyledCollapse
                    accordion
                    ghost
                    expandIconPosition='end'
                    expandIcon={({ isActive }) => isActive ? <ChevronUp/> : <ChevronDown/>}
                    onChange={(type) => window.setTimeout(() => executeScroll(type), 300)}
                >
                    {
                        INTRODUCE_APP_STEP_TYPES.map((type, index) => (
                            <>
                                <div ref={scrollRefs.current[type]} style={REF_HANDLER_STYLES} />
                                <Panel
                                    header={(
                                        <Space size={12}>
                                            <Badge title={`Шаг ${index + 1}`} />
                                            <Typography.Title level={3}>
                                                {intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.title` })}
                                            </Typography.Title>
                                        </Space>
                                    )}
                                    key={type}
                                >
                                    <Space size={40} direction='vertical'>
                                        <img style={PANEL_IMAGE_STYLES} src={`/onboarding/guide/introduceApp/${locale}/${type}/panelImage.png`}/>
                                        <div style={STEP_TEXT_CONTAINER_STYLES}>
                                            <Typography.Paragraph type='secondary'>
                                                {getTextWithAccent(intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.body` }))}
                                            </Typography.Paragraph>
                                            {
                                                type === 'announcement' || type === 'layout' && (
                                                    <Typography.Paragraph type='secondary'>
                                                        {getTextWithAccent(intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.body.secondParagraph` }))}
                                                    </Typography.Paragraph>
                                                )
                                            }
                                            {
                                                type === 'layout' && (
                                                    <Typography.Paragraph type='secondary'>
                                                        {getTextWithAccent(intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.body.thirdParagraph` }))}
                                                    </Typography.Paragraph>
                                                )
                                            }
                                        </div>
                                        {
                                            type === 'socialNetworks' ? (
                                                <Space size={16} direction={breakpoints.TABLET_LARGE ? 'horizontal' : 'vertical'}>
                                                    <a href={`/onboarding/guide/introduceApp/${locale}/socialNetworks/socialNetworks-pics.zip`}>
                                                        <Button type='secondary' icon={<Download />}>
                                                            {DownloadPicsMessage}
                                                        </Button>
                                                    </a>
                                                    <a href={`/onboarding/guide/introduceApp/${locale}/socialNetworks/socialNetworks-text.zip`}>
                                                        <Button type='secondary' icon={<Download />}>
                                                            {DownloadTextMessage}
                                                        </Button>
                                                    </a>
                                                </Space>
                                            ) : (
                                                <a href={`/onboarding/guide/introduceApp/${locale}/${type}/${type}-materials.zip`}>
                                                    <Button type='primary' icon={<Download />}>
                                                        {intl.formatMessage({ id: `tour.guide.introduceApp.step.${type}.downloadMaterials` })}
                                                    </Button>
                                                </a>
                                            )
                                        }
                                    </Space>
                                </Panel>
                            </>
                        ))
                    }
                </StyledCollapse>
            </Col>
        </Row>
    )
}

const GuidePage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'tour.guide.title' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader spaced title={<Typography.Title>{PageTitle}</Typography.Title>}/>
                <PageContent>
                    <Row gutter={LARGE_GUTTER}>
                        <Col span={24}>
                            <AboutAppBlock/>
                        </Col>
                        <Col span={24}>
                            <IntroduceAppBlock/>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

GuidePage.requiredAccess = AuthRequired

export default GuidePage