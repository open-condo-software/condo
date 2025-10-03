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
import { initializeApollo, prepareSSRContext, extractApolloState } from '@/domains/common/utils/apollo'
import { BuildsSection } from '@/domains/miniapp/components/B2CApp/edit/builds/BuildsSection'
import { InfoSection } from '@/domains/miniapp/components/B2CApp/edit/info/InfoSection'
import { PropertiesSection } from '@/domains/miniapp/components/B2CApp/edit/properties/PropertiesSection'
import { PublishingSection } from '@/domains/miniapp/components/B2CApp/edit/publishing/PublishingSection'
import { ServiceUserSection } from '@/domains/miniapp/components/B2CApp/edit/service-user/ServiceUserSection'
import { OIDCClientSection } from '@/domains/miniapp/components/OIDC/edit/OIDCClientSection'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'
import { getCurrentSection, useB2CMenuItems } from '@/domains/miniapp/hooks/useB2CMenuItems'
import { getCurrentPage, getEnvironment } from '@/domains/miniapp/utils/query'
import { prefetchAuth } from '@/domains/user/utils/auth'

import type { SectionType } from '@/domains/miniapp/hooks/useB2CMenuItems'
import type { RowProps, MenuProps } from 'antd'
import type { GetServerSideProps } from 'next'

import {
    GetB2CAppDocument,
    GetB2CAppQuery,
    GetB2CAppQueryVariables,
    AllB2CAppBuildsDocument,
    AllB2CAppBuildsQuery,
    AllB2CAppBuildsQueryVariables,
    AllB2CAppAccessRightsDocument,
    AllB2CAppAccessRightsQuery,
    AllB2CAppAccessRightsQueryVariables,
    useGetB2CAppQuery,
} from '@/gql'

const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN = 24
const SECTIONS: { [key in SectionType]: React.FC<{ id: string }> } = {
    'info': InfoSection,
    'builds': BuildsSection,
    'properties': PropertiesSection,
    'oidc': OIDCClientSection,
    'service-user': ServiceUserSection,
    'publishing': PublishingSection,
}

const AppSettingsPage: React.FC = () => {
    const intl = useIntl()
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const MyAppsTitle = intl.formatMessage({ id: 'global.service.sections.apps' })
    const MenuTitle = intl.formatMessage({ id: 'pages.apps.any.id.menu.title' })

    const router = useRouter()
    const { id } = router.query
    const [section, menuItems] = useB2CMenuItems()

    const { data } = useGetB2CAppQuery({
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
        return <Error statusCode={404}/>
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
    const { id, section, p, env } = query

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
    await client.query<GetB2CAppQuery, GetB2CAppQueryVariables>({
        query: GetB2CAppDocument,
        variables: {
            id,
        },
    })

    const currentSection = getCurrentSection(section)

    // Tab-specific info prefetch
    if (currentSection === 'builds') {
        const currentPage = getCurrentPage(p)
        await client.query<AllB2CAppBuildsQuery, AllB2CAppBuildsQueryVariables>({
            query: AllB2CAppBuildsDocument,
            variables: {
                where: { app: { id } },
                first: DEFAULT_PAGE_SIZE,
                skip: DEFAULT_PAGE_SIZE * (currentPage - 1),
            },
        })
    } else if (currentSection === 'service-user') {
        const environment = getEnvironment(env)
        await client.query<AllB2CAppAccessRightsQuery, AllB2CAppAccessRightsQueryVariables>({
            query: AllB2CAppAccessRightsDocument,
            variables: {
                appId: id,
                environment,
            },
        })
    }


    return extractApolloState(client, {
        props: {},
    })
}