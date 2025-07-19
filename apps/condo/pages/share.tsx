import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import Router from 'next/router'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { PageComponentType } from '@condo/domains/common/types'
import { unpackShareData } from '@condo/domains/ticket/utils/shareDataPacker'
import { PosterLayout } from '@condo/domains/user/components/containers/PosterLayout'

function RedirectToTicket ({ ticketId }) {
    const intl = useIntl()
    const RedirectingMessage = intl.formatMessage({ id: 'Redirecting' })

    useEffect(() => {
        const clearHandle = setTimeout(() => {
            Router.push(`/ticket/${ticketId}`)
        }, 0)
        return () => {
            clearTimeout(clearHandle)
        }
    })

    return <h1>{RedirectingMessage}</h1>
}

const ShareMeta = ({ title, desc, image }) => (
    <Head>
        <meta property='og:site_name' content={title} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={desc} />
        <meta property='og:updated_time' content='14400000' />
        <meta property='og:image' content={image} />
    </Head>
)

const TicketPublicInfo = ({ date, number, details, ticketId }) => {
    const [redirect, setRedirect] = useState(false)

    const intl = useIntl()
    const locale = get(LOCALES, intl.locale)
    const localizedDate = locale ? dayjs(date || 0).locale(locale) : dayjs(date || 0)
    const dateFormatted = localizedDate.format('D MMMM YYYY')

    const MainPagesMessageButton = intl.formatMessage({ id: 'ticket.shareSeeDetailsButton' })

    const ShareTitleMessage = intl.formatMessage({ id: 'ticket.shareTitle' }, { number })

    const CreatedMessage = intl.formatMessage({ id: 'CreatedDate' })

    const ProblemMessage = intl.formatMessage({ id: 'Problem' })

    if (redirect) {
        return <RedirectToTicket ticketId={ticketId} />
    }

    return (
        <Row justify='start'>
            <Col span={24}>
                <Row gutter={[0, 80]}>
                    <Row gutter={[0, 16]}>
                        <Col span={24}>
                            <Typography.Title>{ShareTitleMessage}</Typography.Title>
                        </Col>
                        <PageFieldRow title={CreatedMessage} ellipsis>
                            <Typography.Text strong>{dateFormatted}</Typography.Text>
                        </PageFieldRow>
                        <PageFieldRow title={ProblemMessage} ellipsis>
                            <Typography.Text strong>{details}</Typography.Text>
                        </PageFieldRow>
                    </Row>
                    <Col>
                        <Button
                            key='submit'
                            type='primary'
                            htmlType='submit'
                            onClick={() => setRedirect(true)}
                            block
                        >
                            {MainPagesMessageButton}
                        </Button>
                    </Col>
                </Row>
            </Col>
        </Row>
    )
}

interface ShareProps {
    number: string
    details: string
    id: string
    date: string
}

const Share: PageComponentType<ShareProps> = (props) => {
    const {
        date, 
        number, 
        details, 
        id,
    } = props
    const { query: { redirectToTicketPage } } = useRouter()
    const { publicRuntimeConfig: { displayTicketInfoOnShare } } = getConfig()

    const shouldRedirect = (redirectToTicketPage === 'true' || redirectToTicketPage === 'false')
        ? redirectToTicketPage === 'true'      
        : !displayTicketInfoOnShare

    const intl = useIntl()
    const locale = get(LOCALES, intl.locale)
    const localizedDate = locale ? dayjs(date || 0).locale(locale) : dayjs(date || 0)
    const dateFormatted = localizedDate.format('D MMMM YYYY')

    const ShareTitleMessage = intl.formatMessage({ id: 'ticket.shareTitleWithDate' }, {
        date: dateFormatted,
        number,
    })
    const ShareDetailsMessage = intl.formatMessage({ id: 'ticket.shareDetails' }, {
        details,
    })

    let origin = 'http://localhost:3000'
    if (typeof window !== 'undefined') {
        origin = window.location.origin
    } else {
        ({
            publicRuntimeConfig: { serverUrl: origin },
        } = getConfig())
    }

    const HeadWithMeta = () => <ShareMeta
        title={ShareTitleMessage}
        desc={ShareDetailsMessage}
        image={`${origin}/logoSnippet.png`}
    />

    return (
        <>
            <HeadWithMeta />
            {
                shouldRedirect
                    ? <RedirectToTicket ticketId={id} />
                    : <TicketPublicInfo date={date} details={details} number={number} ticketId={id}/>
            }
        </>
    )
}

export const getServerSideProps = ({ query }) => {
    const { q = '' } = query
    const packedData  = q.replace(/\s/gm, '+')
    const shareParams = JSON.parse(unpackShareData(packedData))

    return {
        props: { ...shareParams },
    }
}

const SrcAuthPoster = { main: '/authPoster.webp', placeholder: '/authPosterPlaceholder.jpg' }

const ShareLayout = (props): React.ReactElement => <PosterLayout
    {...props}
    image={SrcAuthPoster}
/>

Share.container = ShareLayout
Share.skipUserPrefetch = true

export default Share
