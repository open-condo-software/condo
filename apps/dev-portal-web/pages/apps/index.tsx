import { Row, Col } from 'antd'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import React from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { Typography } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { useCreateAppContext } from '@/domains/common/components/CreateAppContext'
import { EmptyView } from '@/domains/common/components/EmptyView'
import { initializeApollo, prepareSSRContext, extractApolloState } from '@/domains/common/utils/apollo'
import { InlineAppCard } from '@/domains/miniapp/components/InlineAppCard'
import { mergeApps } from '@/domains/miniapp/utils/merge'
import { prefetchAuth, useAuth } from '@/domains/user/utils/auth'

import type { AppInfo } from '@/domains/miniapp/utils/merge'
import type { RowProps } from 'antd'

import { useAllAppsQuery, AllAppsDocument, AllAppsQuery, AllAppsQueryVariables } from '@/gql'


const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const APP_CARD_GUTTER: RowProps['gutter'] = [20, 20]
const FULL_COL_SPAN = 24
const MAX_APPS_TO_SHOW = 100

const MyAppsPage: React.FC = () => {
    const intl = useIntl()
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const PageTitle = intl.formatMessage({ id: 'global.service.sections.apps' })
    const NoAppsTitle = intl.formatMessage({ id: 'apps.emptyView.title' })
    const NoAppsDescription = intl.formatMessage({ id: 'apps.emptyView.description' })
    const CreateAppLabel = intl.formatMessage({ id: 'global.actions.createApp' })
    const { createApp } = useCreateAppContext()

    const { user } = useAuth()
    const { persistor } = useCachePersistor()

    const { data } = useAllAppsQuery({
        variables: {
            creator: { id: user?.id },
            first: MAX_APPS_TO_SHOW,
        },
        skip: !persistor,
    })

    const apps: Array<AppInfo> = mergeApps(data)


    return (
        <>
            <Head>
                <title>{`${PageTitle} | ${ServiceTitleMessage}`}</title>
            </Head>
            <BaseLayout>
                {apps.length ? (
                    <Row gutter={TITLE_GUTTER}>
                        <Col span={FULL_COL_SPAN}>
                            <Typography.Title>{PageTitle}</Typography.Title>
                        </Col>
                        <Col span={FULL_COL_SPAN}>
                            <Row gutter={APP_CARD_GUTTER}>
                                {apps.map(app => (
                                    <Col span={FULL_COL_SPAN} key={`${app.type}:${app.id}`}>
                                        <InlineAppCard {...app}/>
                                    </Col>
                                ))}
                            </Row>
                        </Col>
                    </Row>
                ) : (
                    <EmptyView
                        title={NoAppsTitle}
                        description={NoAppsDescription}
                        actionLabel={CreateAppLabel}
                        onAction={createApp}
                    />
                )}
            </BaseLayout>
        </>
    )
}

export default MyAppsPage

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
    const { headers, defaultContext } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers, defaultContext })
    const authedUser = await prefetchAuth(client)

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
            first: MAX_APPS_TO_SHOW,
        },
    })

    return extractApolloState(client, {
        props: {},
    })
}



