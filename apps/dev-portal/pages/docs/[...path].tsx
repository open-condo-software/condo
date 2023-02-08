import { Layout, Menu, Row, Col, Anchor } from 'antd'
import { DEFAULT_LOCALE } from 'domains/common/constants/locales'
import { useMenuItems } from 'domains/docs/hooks/useMenuItems'
import { extractMdx } from 'domains/docs/utils/mdx'
import { getNavTree, getAllRoutes, getFlatArticles } from 'domains/docs/utils/routing'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import { MDXRemote } from 'next-mdx-remote'
import React, { useMemo } from 'react'

import { Typography, Card, Alert } from '@open-condo/ui'

import styles from './path.module.css'

import type { RowProps } from 'antd'
import type { Heading } from 'domains/docs/utils/mdx'
import type { NavItem, ArticleInfo } from 'domains/docs/utils/routing'
import type { MDXComponents } from 'mdx/types'
import type { GetStaticPaths, GetStaticProps } from 'next'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

const DOCS_ROOT_FOLDER = 'docs'
const DOCS_ROOT_ENDPOINT = '/docs'
const SIDER_WIDTH = 336
const CARD_WIDTH = 308
const CARD_PADDING = '28px 24px 28px 0'
const TITLE_GUTTER: RowProps['gutter'] = [40, 40]

type DocPageProps = {
    navigation: Array<NavItem>
    pageTitle: string
    serializedContent: MDXRemoteSerializeResult
    headings: Array<Heading>
    nextPage: ArticleInfo | null
    prevPage: ArticleInfo | null
}

const MDXMapping: MDXComponents = {
    h1: (props) => <Typography.Title {...omit(props, 'ref')} level={1}/>,
    h2: (props) => <Typography.Title {...omit(props, 'ref')} level={2}/>,
    h3: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
    h4: (props) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
    h5: (props) => <Typography.Title {...omit(props, 'ref')} level={5}/>,
    h6: (props) => <Typography.Title {...omit(props, 'ref')} level={6}/>,
    p: (props) => <Typography.Paragraph {...omit(props, 'ref')} type='secondary'/>,
    li: ({ children, ...restProps }) => <li {...restProps}><Typography.Text type='secondary'>{children}</Typography.Text></li>,
    Alert,
}

const DocPage: React.FC<DocPageProps> = ({
    navigation,
    pageTitle,
    serializedContent,
    headings,
}) => {
    const router = useRouter()
    const currentRoute = router.asPath.split(/[?#]/)[0]
    const menuItems = useMenuItems(navigation, DOCS_ROOT_ENDPOINT)

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
        <Layout hasSider>
            <Layout.Sider width={SIDER_WIDTH} className={styles.sider} theme='light'>
                <Menu
                    mode='inline'
                    items={menuItems}
                    defaultOpenKeys={openPaths}
                    defaultSelectedKeys={[currentRoute]}
                    selectedKeys={[currentRoute]}
                    className={styles.menu}
                />
            </Layout.Sider>
            <Layout.Content className={styles.content}>
                <div className={styles.pageContainer}>
                    <div className={styles.articleColumn}>
                        <Row gutter={TITLE_GUTTER}>
                            <Col span={24}>
                                <Typography.Title>{pageTitle}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <div className='condo-markdown'>
                                    <MDXRemote {...serializedContent} components={MDXMapping} lazy/>
                                </div>
                            </Col>
                        </Row>
                    </div>
                    <div className={styles.tableOfContentsColumn}>
                        <Card width={CARD_WIDTH} bodyPadding={CARD_PADDING}>
                            <Anchor
                                offsetTop={112}
                                items={headings.map(heading => ({
                                    key: heading.id,
                                    href: `#${heading.id}`,
                                    title: <Typography.Text type='secondary'>{heading.heading}</Typography.Text>,
                                }))}
                            />
                        </Card>
                    </div>
                </div>
            </Layout.Content>
        </Layout>
    )
}

export default DocPage

type GetStaticPathParams = {
    path: Array<string>
}

export const getStaticPaths: GetStaticPaths<GetStaticPathParams> = ({ locales = [] }) => {
    return {
        paths: locales.flatMap(locale => {
            return Array.from(getAllRoutes(DOCS_ROOT_FOLDER, locale, DOCS_ROOT_FOLDER), (route) => ({
                params: { path: route.split('/') },
                locale,
            }))
        }),
        fallback: false,
    }
}

export const getStaticProps: GetStaticProps<DocPageProps, GetStaticPathParams> = async ({ locale = DEFAULT_LOCALE, params }) => {
    const navTree = getNavTree(DOCS_ROOT_FOLDER, locale, DOCS_ROOT_FOLDER)

    const articles = Array.from(getFlatArticles(navTree))
    const route = get(params, 'path', []).join('/')
    const pageIndex = articles.findIndex((item) => item.route === route)

    const currentPage = articles[pageIndex]
    const { serializedContent, headings } = await extractMdx(DOCS_ROOT_FOLDER, currentPage.route, locale)

    const prevPage = pageIndex > 0 ? articles[pageIndex - 1] : null
    const nextPage = (pageIndex < articles.length - 1 && pageIndex != -1) ? articles[pageIndex + 1] : null

    return {
        props: {
            navigation: navTree,
            serializedContent,
            headings,
            prevPage,
            nextPage,
            pageTitle: currentPage.label,
        },
    }
}