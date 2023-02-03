import { Button } from 'antd'
import { DEFAULT_LOCALE } from 'domains/common/constants/locales'
import { getNavTree, getAllRoutes } from 'domains/docs/utils/routing'
import React from 'react'

import type { NavGroup, NavItem } from 'domains/docs/utils/routing'
import type { GetStaticPaths, GetStaticProps } from 'next'

const DOCS_ROOT = 'docs'

type DocPageProps = {
    navigation: Array<NavGroup | NavItem>
}

const DocPage: React.FC<DocPageProps> = ({ navigation }) => {
    return (
        <>
            <Button>123445</Button>
            <pre>
                {JSON.stringify(navigation, null, 4)}
            </pre>
        </>
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