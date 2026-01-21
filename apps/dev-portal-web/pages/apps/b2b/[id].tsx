import { Col, type MenuProps, Row, RowProps } from 'antd'
import get from 'lodash/get'
import NextError from 'next/error'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Typography } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { CollapsibleMenu } from '@/domains/common/components/CollapsibleMenu'
import { extractApolloState, initializeApollo, prepareSSRContext } from '@/domains/common/utils/apollo'
import { InfoSection } from '@/domains/miniapp/components/B2BApp/edit/info/InfoSection'
import { PublishingSection } from '@/domains/miniapp/components/B2BApp/edit/publishing/PublishingSection'
import { OIDCClientSection } from '@/domains/miniapp/components/OIDC/edit/OIDCClientSection'
import { useB2BMenuItems } from '@/domains/miniapp/hooks/useB2BMenuItems'
import { prefetchAuth } from '@/domains/user/utils/auth'

import type { SectionType } from '@/domains/miniapp/hooks/useB2BMenuItems'
import type { GetServerSideProps } from 'next'

import {
    GetB2BAppDocument,
    GetB2BAppQuery,
    GetB2BAppQueryVariables,
    useGetB2BAppQuery,
} from '@/gql'

const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24

const SECTIONS: { [key in SectionType]: React.FC<{ id: string }> } = {
    'info': InfoSection,
    'oidc': OIDCClientSection,
    'publishing': PublishingSection,
}

const AppSettingsPage: React.FC = () => {
    const intl = useIntl()
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const MyAppsTitle = intl.formatMessage({ id: 'global.service.sections.apps' })
    const MenuTitle = intl.formatMessage({ id: 'pages.apps.any.id.menu.title' })

    const router = useRouter()
    const { id } = router.query

    const [section, menuItems] = useB2BMenuItems()

    const { data } = useGetB2BAppQuery({
        variables: {
            id: id && !Array.isArray(id) ? id : '',
        },
    })

    const handleMenuClick = useCallback<Required<MenuProps>['onClick']>((section) => {
        return router.replace({
            query: { id: router.query.id, section: section.key },
        }, undefined, { locale: router.locale })
    }, [router])

    const Section = useMemo(() => SECTIONS[section], [section])

    if (!id || Array.isArray(id)) {
        return <NextError statusCode={404}/>
    }

    const appName = get(data, ['app', 'name'], id)
    const PageTitle = [appName, MyAppsTitle, ServiceTitleMessage].join(' | ')

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <BaseLayout
                menuElement={(
                    <CollapsibleMenu
                        menuTitle={MenuTitle}
                        items={menuItems}
                        mode='inline'
                        onClick={handleMenuClick}
                        selectedKeys={[section]}
                    />
                )}
            >
                <Row gutter={TITLE_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Typography.Title>{appName}</Typography.Title>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Section id={id} key={id}/>
                    </Col>
                </Row>
            </BaseLayout>
        </>
    )
}

export default AppSettingsPage

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
    const { id } = query

    if (!id || Array.isArray(id)) {
        return {
            notFound: true,
        }
    }

    const { headers, defaultContext } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers, defaultContext })

    const authedUser =  await prefetchAuth(client)

    if (!authedUser) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    // Common info prefetch
    await client.query<GetB2BAppQuery, GetB2BAppQueryVariables>({
        query: GetB2BAppDocument,
        variables: {
            id,
        },
    })


    return extractApolloState(client, {
        props: {},
    })
}

