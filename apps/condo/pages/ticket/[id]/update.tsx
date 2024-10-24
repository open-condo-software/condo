import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState } from '@condo/domains/common/utils/next/ssr'
import { TicketReadAndManagePermissionRequired } from '@condo/domains/ticket/components/PageAccess'
import { TicketForm } from '@condo/domains/ticket/components/TicketForm'

import type { GetServerSideProps } from 'next'


const TicketUpdatePage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.ticket.index.EditTicketModalTitle' })
    const { query } = useRouter()

    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 20]} style={{ height: '100%' }}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <TicketForm id={query.id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

TicketUpdatePage.requiredAccess = TicketReadAndManagePermissionRequired

export default TicketUpdatePage

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
}
