import { Row, Col } from 'antd'
import get from 'lodash/get'
import Error from 'next/error'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Typography } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { CollapsibleMenu } from '@/domains/common/components/CollapsibleMenu'
import { InfoSection } from '@/domains/miniapp/components/B2CApp/edit/InfoSection'
import { useB2CMenuItems } from '@/domains/miniapp/hooks/useB2CMenuItems'

import type { SectionType } from '@/domains/miniapp/hooks/useB2CMenuItems'
import type { RowProps, MenuProps } from 'antd'
import type { GetServerSideProps } from 'next'

import { extractApolloState, initializeApollo } from '@/lib/apollo'
import { extractAuthHeadersFromRequest, prefetchAuth, useAuth } from '@/lib/auth'
import { GetB2CAppDocument, GetB2CAppQuery, GetB2CAppQueryVariables, useGetB2CAppQuery } from '@/lib/gql'

const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24
const SECTIONS: { [key in SectionType]: React.FC<{ id: string }> } = {
    'info': InfoSection,
}

const AppSettingsPage: React.FC = () => {
    const intl = useIntl()
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const MyAppsTitle = intl.formatMessage({ id: 'global.navBar.apps.title' })
    const MenuTitle = intl.formatMessage({ id: 'apps.id.menu.title' })

    const router = useRouter()
    const { id } = router.query
    const { user } = useAuth()
    const [section, menuItems] = useB2CMenuItems()

    const { data } = useGetB2CAppQuery({
        variables: {
            creator: { id: user?.id },
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
        return <Error statusCode={404}/>
    }

    const appName = get(data, ['objs', '0', 'name'], id)
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
                    />
                )}
            >
                <Row gutter={TITLE_GUTTER}>
                    <Col span={FULL_COL_SPAN}>
                        <Typography.Title>{appName}</Typography.Title>
                    </Col>
                    <Col span={FULL_COL_SPAN}>
                        <Section id={id}/>
                    </Col>
                </Row>
            </BaseLayout>
        </>
    )
}

export default AppSettingsPage

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
    const { id } = query

    if (!id || Array.isArray(id)) {
        return {
            notFound: true,
        }
    }

    const client = initializeApollo()
    const headers = extractAuthHeadersFromRequest(req)
    const authedUser =  await prefetchAuth(client, { headers })

    if (!authedUser) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    await client.query<GetB2CAppQuery, GetB2CAppQueryVariables>({
        query: GetB2CAppDocument,
        variables: {
            creator: { id: authedUser.id },
            id,
        },
        context: { headers },
    })


    return extractApolloState(client, {
        props: {},
    })
}