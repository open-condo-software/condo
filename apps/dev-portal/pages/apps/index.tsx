import { Row, Col } from 'antd'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { Typography } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { InlineAppCard } from '@/domains/miniapp/components/InlineAppCard'

import type { RowProps } from 'antd'

import { initializeApollo } from '@/lib/apollo'
import { extractAuthHeadersFromRequest, prefetchAuth, useAuth } from '@/lib/auth'
import { useAllAppsQuery, AllAppsDocument, AllAppsQuery, AllAppsQueryVariables } from '@/lib/gql'


const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const APP_CARD_GUTTER: RowProps['gutter'] = [24, 24]
const FULL_COL_SPAN = 24

type AppInfo = {
    id: string
    name: string
    type: 'b2c' | 'b2b'
}

const MyAppsPage: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.navBar.apps.title' })
    const { user } = useAuth()
    const [apps, setApps] = useState<Array<AppInfo>>([])

    const { data } = useAllAppsQuery({
        variables: {
            creator: { id: user?.id },
        },
    })

    useDeepCompareEffect(() => {
        if (data) {
            const b2cApps = data.b2c || []
            const allApps: Array<AppInfo> = []
            b2cApps.reduce((acc, app) => {
                if (app && app.name && app.createdAt) {
                    acc.push({ type: 'b2c', name: app.name, id: app.id })
                }
                return acc
            }, allApps)
            setApps(allApps)
        } else {
            setApps([])
        }
    }, [data])


    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <BaseLayout>
                <Row gutter={TITLE_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Typography.Title>{PageTitle}</Typography.Title>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        {apps.length ? (
                            <Row gutter={APP_CARD_GUTTER}>
                                {apps.map(app => (
                                    <Col span={FULL_COL_SPAN} key={`${app.type}:${app.id}`}>
                                        <InlineAppCard name={app.name} type={app.type}/>
                                    </Col>
                                ))}
                            </Row>
                        ) : (
                            '123123'
                        )}
                    </Col>
                </Row>
            </BaseLayout>
        </>
    )
}

export default MyAppsPage

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const client = initializeApollo()
    const headers = extractAuthHeadersFromRequest(req)
    const authedUser = await prefetchAuth(client, { headers })

    if (!authedUser) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    await client.query<AllAppsQuery, AllAppsQueryVariables>({
        query: AllAppsDocument,
        variables: {
            creator: { id: authedUser.id },
        },
        context: { headers },
    })

    return {
        props: {},
    }
}



