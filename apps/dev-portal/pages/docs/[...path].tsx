import path from 'path'

import { Layout, Menu, Row, Col, Anchor } from 'antd'
import { DEFAULT_LOCALE } from 'domains/common/constants/locales'
import { MDXMapping } from 'domains/docs/components/mdx'
import { useMenuItems } from 'domains/docs/hooks/useMenuItems'
import { extractMdx } from 'domains/docs/utils/mdx'
import { getNavTree, getAllRoutes, getFlatArticles, extractLocalizedTitleParts } from 'domains/docs/utils/routing'
import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MDXRemote } from 'next-mdx-remote'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { ChevronLeft, ChevronRight, Edit } from '@open-condo/icons'
import { Typography, Card, Space } from '@open-condo/ui'

import styles from './path.module.css'

import type { RowProps } from 'antd'
import type { Heading } from 'domains/docs/utils/mdx'
import type { NavItem, ArticleInfo } from 'domains/docs/utils/routing'
import type { GetStaticPaths, GetStaticProps } from 'next'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'


const {
    publicRuntimeConfig: {
        docsRootPath,
        docsRepo,
        docsRepoDocsRoot,
        docsEditBranch,
    },
} = getConfig()

const DOCS_ROOT_ENDPOINT = '/docs'
const SIDER_WIDTH = 336
const CARD_WIDTH = 308
const CARD_PADDING = '20px 24px 20px 0'
const TITLE_GUTTER: RowProps['gutter'] = [40, 40]
const FOOTER_GUTTER: RowProps['gutter'] = [40, 60]

type DocPageProps = {
    navigation: Array<NavItem>
    articleTitle: string
    localizedPageTitleParts: Array<string>
    serializedContent: MDXRemoteSerializeResult
    headings: Array<Heading>
    nextPage: ArticleInfo | null
    prevPage: ArticleInfo | null
    editUrl: string | null
}

const DocPage: React.FC<DocPageProps> = ({
    navigation,
    articleTitle,
    localizedPageTitleParts,
    nextPage,
    prevPage,
    serializedContent,
    headings,
    editUrl,
}) => {
    const intl = useIntl()
    const EditPageMessage = intl.formatMessage({ id: 'docs.editPage' })
    const NextPageMessage = intl.formatMessage({ id: 'docs.nextArticle' }, {
        title: nextPage ? nextPage.label : '',
    })
    const PrevPageMessage = intl.formatMessage({ id: 'docs.prevArticle' }, {
        title: prevPage ? prevPage.label : '',
    })
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const PageTitle = [...localizedPageTitleParts, ServiceTitleMessage].join(' | ')

    const router = useRouter()
    const currentRoute = router.asPath.split(/[?#]/)[0]
    const menuItems = useMenuItems(navigation, DOCS_ROOT_ENDPOINT)

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
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
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
                            <Row gutter={FOOTER_GUTTER}>
                                <Col span={24}>
                                    <Row gutter={TITLE_GUTTER}>
                                        <Col span={24}>
                                            <Typography.Title>{articleTitle}</Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <div className='condo-markdown'>
                                                <MDXRemote {...serializedContent} components={MDXMapping} lazy/>
                                            </div>
                                        </Col>
                                        {editUrl && (
                                            <Col span={24}>
                                                <Typography.Link size='large' target='_blank' href={editUrl}>
                                                    <Space direction='horizontal' size={8}>
                                                        <Edit size='medium'/>
                                                        {EditPageMessage}
                                                    </Space>
                                                </Typography.Link>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <div className={styles.bottomNavContainer}>
                                        <div className={styles.bottomNavLink}>
                                            {prevPage && (
                                                <Link href={`${DOCS_ROOT_ENDPOINT}/${prevPage.route}`} legacyBehavior>
                                                    <Typography.Link size='large'>
                                                        <Space direction='horizontal' size={8} align='center'>
                                                            <ChevronLeft size='medium'/>
                                                            {PrevPageMessage}
                                                        </Space>
                                                    </Typography.Link>
                                                </Link>
                                            )}
                                        </div>
                                        <div className={`${styles.alignRight} ${styles.bottomNavLink}`}>
                                            {nextPage && (
                                                <Link href={`${DOCS_ROOT_ENDPOINT}/${nextPage.route}`} legacyBehavior>
                                                    <Typography.Link size='large'>
                                                        <Space direction='horizontal' size={8} align='center'>
                                                            {NextPageMessage}
                                                            <ChevronRight size='medium'/>
                                                        </Space>
                                                    </Typography.Link>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                        {Boolean(headings.length) && (
                            <div className={styles.tableOfContentsColumn}>
                                <Card width={CARD_WIDTH} bodyPadding={CARD_PADDING}>
                                    <Anchor
                                        affix={false}
                                        showInkInFixed={true}
                                        offsetTop={112}
                                        items={headings.map(heading => ({
                                            key: heading.id,
                                            href: `#${heading.id}`,
                                            title: <Typography.Text type='secondary'>{heading.heading}</Typography.Text>,
                                        }))}
                                    />
                                </Card>
                            </div>
                        )}
                    </div>
                </Layout.Content>
            </Layout>
        </>
    )
}

export default DocPage

type GetStaticPathParams = {
    path: Array<string>
}

export const getStaticPaths: GetStaticPaths<GetStaticPathParams> = ({ locales = [] }) => {
    return {
        paths: locales.flatMap(locale => {
            return Array.from(getAllRoutes(docsRootPath, locale, docsRootPath), (route) => ({
                params: { path: route.split('/') },
                locale,
            }))
        }),
        fallback: false,
    }
}

export const getStaticProps: GetStaticProps<DocPageProps, GetStaticPathParams> = async ({ locale = DEFAULT_LOCALE, params }) => {
    const navTree = getNavTree(docsRootPath, locale, docsRootPath)

    const articles = Array.from(getFlatArticles(navTree))
    const route = get(params, 'path', []).join('/')
    const pageIndex = articles.findIndex((item) => item.route === route)

    const currentPage = articles[pageIndex]
    const prevPage = pageIndex > 0 ? articles[pageIndex - 1] : null
    const nextPage = (pageIndex < articles.length - 1 && pageIndex != -1) ? articles[pageIndex + 1] : null

    const localizedPageTitleParts = extractLocalizedTitleParts(currentPage.route, navTree)

    const { serializedContent, headings, fileName } = await extractMdx(docsRootPath, currentPage.route, locale)

    const filePath = path.relative(docsRootPath, fileName)
    const editUrl = docsRepo
        ? `${docsRepo}/edit/${docsEditBranch}/${docsRepoDocsRoot}/${filePath}`
        : null

    return {
        props: {
            navigation: navTree,
            serializedContent,
            headings,
            prevPage,
            nextPage,
            editUrl: editUrl,
            articleTitle: currentPage.label,
            localizedPageTitleParts,
        },
    }
}