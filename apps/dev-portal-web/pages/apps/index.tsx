import { Row, Col } from 'antd'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntersectionObserver } from '@open-condo/miniapp-utils/hooks/useIntersectionObserver'
import { Typography } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { useCreateAppContext } from '@/domains/common/components/CreateAppContext'
import { EmptyView } from '@/domains/common/components/EmptyView'
import { Spin } from '@/domains/common/components/Spin'
import { initializeApollo, prepareSSRContext, extractApolloState } from '@/domains/common/utils/apollo'
import { InlineAppCard } from '@/domains/miniapp/components/InlineAppCard'
import { mergeApps } from '@/domains/miniapp/utils/merge'
import { prefetchAuth, useAuth } from '@/domains/user/utils/auth'

import type { AppInfo } from '@/domains/miniapp/utils/merge'
import type { RowProps } from 'antd'

import {
    AllB2BAppsQuery,
    AllB2CAppsQuery,
    useAllB2BAppsQuery,
    useAllB2CAppsQuery,
    useAllB2BAppsLazyQuery,
    useAllB2CAppsLazyQuery,
} from '@/gql'


const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const APP_CARD_GUTTER: RowProps['gutter'] = [20, 20]
const FULL_COL_SPAN = 24
const MAX_APPS_TO_SHOW = 100

type B2BAppsType = NonNullable<AllB2BAppsQuery['b2b']>
type B2CAppsType = NonNullable<AllB2CAppsQuery['b2c']>

const MyAppsPage: React.FC = () => {
    const intl = useIntl()
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const PageTitle = intl.formatMessage({ id: 'global.service.sections.apps' })
    const NoAppsTitle = intl.formatMessage({ id: 'pages.apps.index.emptyView.title' })
    const NoAppsDescription = intl.formatMessage({ id: 'pages.apps.index.emptyView.description' })
    const CreateAppLabel = intl.formatMessage({ id: 'global.actions.createApp' })
    const { createApp } = useCreateAppContext()

    const { user } = useAuth()
    const { persistor } = useCachePersistor()

    const [b2bApps, setB2BApps] = useState<B2BAppsType>([])
    const [b2cApps, setB2CApps] = useState<B2CAppsType>([])
    const [appsShown, setAppsShown] = useState<number>(MAX_APPS_TO_SHOW)

    const onB2BAppsCompleted = useCallback((data: AllB2BAppsQuery) => {
        setB2BApps(data.b2b || [])
    }, [])
    const onB2CAppsCompleted = useCallback((data: AllB2CAppsQuery) => {
        setB2CApps(data.b2c || [])
    }, [])

    const { loading: initialB2BLoading, data: initialB2BData } = useAllB2BAppsQuery({
        variables: {
            creator: { id: user?.id },
            first: MAX_APPS_TO_SHOW,
        },
        skip: !persistor,
        onCompleted: onB2BAppsCompleted,
    })
    const { loading: initialB2CLoading, data: initialB2CData } = useAllB2CAppsQuery({
        variables: {
            creator: { id: user?.id },
            first: MAX_APPS_TO_SHOW,
        },
        skip: !persistor,
        onCompleted: onB2CAppsCompleted,
    })

    const [fetchMoreB2BApps, { loading: b2bAppsLoading }] = useAllB2BAppsLazyQuery()
    const [fetchMoreB2CApps, { loading: b2cAppsLoading }] = useAllB2CAppsLazyQuery()

    const apps = useMemo(() => mergeApps(b2bApps, b2cApps).filter((_, idx) => idx < appsShown), [appsShown, b2bApps, b2cApps])

    const loadMoreApps = useCallback(() => {
        const b2cAppsShown = apps.filter(app => app.type === 'b2c').length
        const b2bAppsShown = apps.length - b2cAppsShown
        const b2cAppsLeft = b2cApps.length - b2cAppsShown
        const b2bAppsLeft = b2bApps.length - b2bAppsShown

        const promises: Array<Promise<void>> = []

        if (b2cAppsLeft < MAX_APPS_TO_SHOW) {
            promises.push(
                fetchMoreB2CApps({
                    variables: {
                        creator: { id: user?.id },
                        first: MAX_APPS_TO_SHOW,
                        skip: b2cApps.length,
                    },
                }).then((data) => setB2CApps((prev) => [...prev, ...(data.data?.b2c || [])]))
            )
        }
        if (b2bAppsLeft < MAX_APPS_TO_SHOW) {
            promises.push(
                fetchMoreB2BApps({
                    variables: {
                        creator: { id: user?.id },
                        first: MAX_APPS_TO_SHOW,
                        skip: b2bApps.length,
                    },
                }).then((data) => setB2BApps((prev) => [...prev, ...(data.data?.b2b || [])]))
            )
        }

        Promise.allSettled(promises).then(() => setAppsShown((prev) => prev + MAX_APPS_TO_SHOW))
    }, [apps, b2bApps.length, b2cApps.length, fetchMoreB2BApps, fetchMoreB2CApps, user?.id])

    const { ref } = useIntersectionObserver({
        onChange: (isIntersecting) => {
            if (isIntersecting && !b2bAppsLoading && !b2cAppsLoading) {
                loadMoreApps()
            }
        },
    })

    const PageContent = useMemo(() => {
        if (initialB2BLoading || initialB2CLoading) {
            return <Spin size='large' />
        }

        const apps = mergeApps(b2bApps, b2cApps).filter((_, idx) => idx < appsShown)

        if (!apps.length) {
            return (
                <EmptyView
                    title={NoAppsTitle}
                    description={NoAppsDescription}
                    actionLabel={CreateAppLabel}
                    onAction={createApp}
                />
            )
        }

        const totalB2BApps = initialB2BData?.b2bMeta?.count || 0
        const totalB2CApps = initialB2CData?.b2cMeta?.count || 0
        const hasMoreApps = appsShown < totalB2BApps + totalB2CApps


        return (
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
                        {hasMoreApps && (
                            <Col span={FULL_COL_SPAN} ref={ref}>
                                <Spin size='large'/>
                            </Col>
                        )}
                    </Row>
                </Col>
            </Row>
        )
    }, [
        CreateAppLabel,
        NoAppsDescription,
        NoAppsTitle,
        PageTitle,
        appsShown,
        b2bApps,
        b2cApps,
        createApp,
        initialB2BData?.b2bMeta?.count,
        initialB2BLoading,
        initialB2CData?.b2cMeta?.count,
        initialB2CLoading,
        ref,
    ])


    return (
        <>
            <Head>
                <title>{`${PageTitle} | ${ServiceTitleMessage}`}</title>
            </Head>
            <BaseLayout>
                {PageContent}
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

    return extractApolloState(client, {
        props: {},
    })
}



