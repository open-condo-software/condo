import styled from '@emotion/styled'
import { Col, Row, RowProps } from 'antd'
import Head from 'next/head'
import React, { CSSProperties, useMemo, useState } from 'react'

import { ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Card, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'


const MEDIUM_GUTTER: RowProps['gutter'] = [0, 40]
const LARGE_GUTTER: RowProps['gutter'] = [0, 60]

const ABOUT_APP_CARD_TYPES = ['payments', 'costs', 'quality', 'communication'] as const
type AboutAppCardType = typeof ABOUT_APP_CARD_TYPES[number] | null

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

const MODAL_IMAGE_BG_STYLES: CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '320px',
    color: colors.white,
    borderRadius: '12px',
    padding: '40px 70px 0 40px',
}

const MODAL_TYPE_TO_CARD_LINK = {
    payments: 'https://doma.ai/blog/business_start',
    costs: 'https://doma.ai/blog/free_to_use',
    quality: 'https://doma.ai/blog/communication',
    communication: 'https://doma.ai/blog/business_start',
}

const AboutAppBlock = () => {
    const intl = useIntl()
    const BlockTitle = intl.formatMessage({ id: 'tour.guide.aboutApp.title' })
    const InMoreDetailMessage = intl.formatMessage({ id: 'InMoreDetail' })
    const NextMessage = intl.formatMessage({ id: 'Next' })
    const ModalCardLinkMessage = intl.formatMessage({ id: 'tour.guide.aboutApp.modal.card.link' })

    const [openModal, setOpenModal] = useState<AboutAppCardType>(null)

    const typeToModalBgColor = useMemo(() => ({
        payments: colors.cyan[5],
        costs: colors.orange[5],
        quality: colors.blue[5],
        communication: colors.pink[5],
    }), [])

    return (
        <Row gutter={MEDIUM_GUTTER}>
            <Typography.Title level={2}>{BlockTitle}</Typography.Title>
            <CardsWrapper>
                {
                    ABOUT_APP_CARD_TYPES.map(type => (
                        <Card.CardButton
                            key={type}
                            header={{
                                image: {
                                    src: `/onboarding/guide/aboutApp/${type}/cardImage.png`,
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
                                    const currentTypeIndex = ABOUT_APP_CARD_TYPES.indexOf(type)
                                    const nextModalTypeIndex = currentTypeIndex + 1 === ABOUT_APP_CARD_TYPES.length
                                        ? 0 : currentTypeIndex + 1
                                    setOpenModal(ABOUT_APP_CARD_TYPES[nextModalTypeIndex])
                                }}
                            >
                                {NextMessage}
                            </Button>
                        )}
                    >
                        <Space size={40} direction='vertical'>
                            <div style={{ ...MODAL_IMAGE_BG_STYLES, backgroundColor: typeToModalBgColor[type] }}>
                                <Typography.Title type='inherit' level={2}>
                                    {intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.picText` })}
                                </Typography.Title>
                                <img style={{ height: '100%' }} src={`/onboarding/guide/aboutApp/${type}/modalImage.png`} />
                            </div>
                            <Row gutter={[40, 0]}>
                                <Col span={12}>
                                    <Typography.Text type='secondary'>
                                        {intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.body` })}
                                    </Typography.Text>
                                </Col>
                                <Col span={12}>
                                    <Card title={(
                                        <img src={`/onboarding/guide/aboutApp/${type}/modalLogo.png`} style={{ height: '29px' }} />
                                    )}
                                    >
                                        <Card.CardBody
                                            description={intl.formatMessage({ id: `tour.guide.aboutApp.${type}.modal.card.body` })}
                                            mainLink={{ href: MODAL_TYPE_TO_CARD_LINK[type], PreIcon: ExternalLink, label: ModalCardLinkMessage, openInNewTab: true }}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </Space>
                    </Modal>
                )) 
            }
        </Row>
    )
}

const IntroduceAppBlock = () => {

    return <></>
}

const GuidePageContent = () => {

    return (
        <Row gutter={LARGE_GUTTER}>
            <Col span={24}>
                <AboutAppBlock/>
            </Col>
            <Col span={24}>
                <IntroduceAppBlock/>
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
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>}/>
                <PageContent>
                    <GuidePageContent/>
                </PageContent>
            </PageWrapper>
        </>
    )
}

GuidePage.requiredAccess = AuthRequired

export default GuidePage