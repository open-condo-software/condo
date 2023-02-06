import { Layout, Menu } from 'antd'
import { DEFAULT_LOCALE } from 'domains/common/constants/locales'
import { useMenuItems } from 'domains/docs/hooks/useMenuItems'
import { getNavTree, getAllRoutes } from 'domains/docs/utils/routing'
import { useRouter } from 'next/router'
import React, { CSSProperties, useMemo } from 'react'


import type { NavItem } from 'domains/docs/utils/routing'
import type { GetStaticPaths, GetStaticProps } from 'next'

const DOCS_ROOT = 'docs'
const SIDER_WIDTH = 336

type DocPageProps = {
    navigation: Array<NavItem>
}

const STATIC_SIDER_STYLES: CSSProperties = {
    minHeight: 'calc(100vh - 72px)',
    padding: 20,
}

const DocPage: React.FC<DocPageProps> = ({ navigation }) => {
    const router = useRouter()
    const currentRoute = router.asPath.split('?')[0]
    const menuItems = useMenuItems(navigation)

    // /path/subpath/page -> ['/path', '/path/subpath']
    const openPaths = useMemo(() => {
        const parts = currentRoute.split('/').filter(Boolean)
        const result = []
        for (let i = 0; i < parts.length - 2; ++i) {
            const route = `/${parts.slice(0, parts.length - (i + 1)).join('/')}`
            result.push(route)
        }

        return result
    }, [currentRoute])

    return (
        <Layout hasSider={true}>
            <Layout.Sider width={SIDER_WIDTH} style={{ ...STATIC_SIDER_STYLES }} theme='light'>
                <Menu
                    mode='inline'
                    items={menuItems}
                    defaultOpenKeys={openPaths}
                    defaultSelectedKeys={[currentRoute]}
                    selectedKeys={[currentRoute]}
                />
            </Layout.Sider>
            <Layout.Content>
                <pre>
                    {JSON.stringify(navigation, null, 2)}
                </pre>
            </Layout.Content>
        </Layout>
    )
}

export default DocPage

export const getStaticPaths: GetStaticPaths = ({ locales = [] }) => {
    return {
        paths: locales.flatMap(locale => {
            return Array.from(getAllRoutes(DOCS_ROOT, locale, DOCS_ROOT), (route) => ({
                params: { path: route.split('/') },
                locale,
            }))
        }),
        fallback: false,
    }
}

export const getStaticProps: GetStaticProps<DocPageProps> = ({ locale = DEFAULT_LOCALE }) => {
    return {
        props: {
            navigation: getNavTree(DOCS_ROOT, locale, DOCS_ROOT),
        },
    }
}