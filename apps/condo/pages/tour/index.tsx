import styled from '@emotion/styled'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'

import { ArrowLeft } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Card, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'


const TourWrapper = styled.div`
  background-color: ${colors.gray[1]};
  padding: 40px;
  border-radius: 12px;
`

const CardVideo = () => {
    return (
        <Card>
            <Space size={24} direction='vertical'>
                <div style={{ borderRadius: '12px', overflow: 'hidden', width: '450px', height: '250px' }}>
                    <iframe width='100%' height='100%' src='https://www.youtube.com/embed/xNRJwmlRBNU?si=iryPQNp7dhipnWC-'
                        title='YouTube video player' frameBorder='0'
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                        allowFullScreen>
                    </iframe>
                </div>
            </Space>
        </Card>
    )
}

const ResidentAppCard = () => {
    return <></>
}

const TechnicAppCard = () => {
    return <></>
}

const BackLink = () => {
    const intl = useIntl()
    const BackMessage = intl.formatMessage({ id: 'Back' })

    return (
        <Link href='/tour'>
            <Typography.Link>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <ArrowLeft size='small' />
                    {BackMessage}
                </div>
            </Typography.Link>
        </Link>
    )
}

const TourPage = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'tour.title' })
    const TourSubtitle = intl.formatMessage({ id: 'tour.subtitle' })
    const TourDescription = intl.formatMessage({ id: 'tour.description' })
    const BackMessage = intl.formatMessage({ id: 'Back' })

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>}/>
                <PageContent>
                    <Space size={52} direction='horizontal' align='start'>
                        <TourWrapper>
                            <Space size={32} direction='vertical'>
                                <BackLink />
                                <Space size={8} direction='vertical'>
                                    <Typography.Title level={2}>{TourSubtitle}</Typography.Title>
                                    <Typography.Paragraph type='secondary'>{TourDescription}</Typography.Paragraph>
                                </Space>
                            </Space>

                        </TourWrapper>
                        <Space size={24} direction='horizontal'>
                            <CardVideo/>
                            <Space size={8} direction='horizontal'>
                                <ResidentAppCard/>
                                <TechnicAppCard/>
                            </Space>
                        </Space>
                    </Space>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default TourPage