import path from 'path'

import { Row, Col, Anchor } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MDXRemote } from 'next-mdx-remote'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { ChevronLeft, ChevronRight, Edit } from '@open-condo/icons'
import { Typography, Card, Space } from '@open-condo/ui'

import { BaseLayout } from '@/domains/common/components/BaseLayout'
import { CollapsibleMenu } from '@/domains/common/components/CollapsibleMenu'
import { DOCS_REPO, DOCS_ROOT_PATH, DOCS_REPO_DOCS_ROOT, DOCS_EDIT_BRANCH } from '@/domains/common/constants/buildVars'
import { DEFAULT_LOCALE } from '@/domains/common/constants/locales'
import { initializeApollo, prepareSSRContext, extractApolloState } from '@/domains/common/utils/apollo'
import { ArticleMeta } from '@/domains/docs/components/ArticleMeta'
import { MDXMapping } from '@/domains/docs/components/mdx'
import { useMenuItems } from '@/domains/docs/hooks/useMenuItems'
import { extractMdx } from '@/domains/docs/utils/mdx'
import {
    getNavTree,
    getFlatArticles,
    getNextArticle,
    getPrevArticle,
    extractLocalizedTitleParts, 
} from '@/domains/docs/utils/routing'
import { prefetchAuth } from '@/domains/user/utils/auth'

import styles from './path.module.css'

import type { Heading } from '@/domains/docs/utils/mdx'
import type { NavItem, ArticleInfo } from '@/domains/docs/utils/routing'
import type { RowProps } from 'antd'
import type { GetServerSideProps } from 'next'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'


const DOCS_ROOT_ENDPOINT = '/docs'
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
    const MenuTitle = intl.formatMessage({ id: 'docs.menu.title' })
    const EditPageMessage = intl.formatMessage({ id: 'docs.actions.editArticle' })
    const NextPageMessage = intl.formatMessage({ id: 'docs.actions.nextArticle' }, {
        title: nextPage ? nextPage.label : '',
    })
    const PrevPageMessage = intl.formatMessage({ id: 'docs.actions.prevArticle' }, {
        title: prevPage ? prevPage.label : '',
    })
    const ServiceTitleMessage = intl.formatMessage({ id: 'global.service.name' })
    const PageTitle = [...localizedPageTitleParts, ServiceTitleMessage].join(' | ')

    const router = useRouter()
    const currentRoute = router.asPath.split(/[?#]/)[0]
    const menuItems = useMenuItems(navigation, DOCS_ROOT_ENDPOINT)

    const openPaths = useMemo(() => {
        const parts = currentRoute.split('/').filter(Boolean)
        const result: Array<string> = []
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
            <ArticleMeta title={localizedPageTitleParts.join(' | ')}/>
            <BaseLayout
                menuElement={(
                    <CollapsibleMenu
                        menuTitle={MenuTitle}
                        mode='inline'
                        items={menuItems}
                        defaultOpenKeys={openPaths}
                        defaultSelectedKeys={[currentRoute]}
                        selectedKeys={[currentRoute]}
                    />
                )}
                anchorElement={Boolean(headings.length) && (
                    <Card bodyPadding={CARD_PADDING}>
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
                )}
            >
                <Row gutter={FOOTER_GUTTER}>
                    <Col span={24}>
                        <Row gutter={TITLE_GUTTER} id='article'>
                            <Col span={24}>
                                <Typography.Title id='article-title'>{articleTitle}</Typography.Title>
                            </Col>
                            <Col span={24}>
                                <article className='condo-markdown' id='article-content'>
                                    <MDXRemote {...serializedContent} components={MDXMapping} lazy/>
                                </article>
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
                                    <Typography.Link size='large' component={Link} href={`${DOCS_ROOT_ENDPOINT}/${prevPage.route}`}>
                                        <Space direction='horizontal' size={8} align='center'>
                                            <ChevronLeft size='medium'/>
                                            {PrevPageMessage}
                                        </Space>
                                    </Typography.Link>
                                )}
                            </div>
                            <div className={`${styles.alignRight} ${styles.bottomNavLink}`}>
                                {nextPage && (
                                    <Typography.Link size='large' component={Link} href={`${DOCS_ROOT_ENDPOINT}/${nextPage.route}`}>
                                        <Space direction='horizontal' size={8} align='center'>
                                            {NextPageMessage}
                                            <ChevronRight size='medium'/>
                                        </Space>
                                    </Typography.Link>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </BaseLayout>
        </>
    )
}

export default DocPage

export const getServerSideProps: GetServerSideProps<DocPageProps> = async ({ locale = DEFAULT_LOCALE, params, req, res }) => {
    // Static props
    const navTree = getNavTree(DOCS_ROOT_PATH, locale, DOCS_ROOT_PATH)

    const articles = Array.from(getFlatArticles(navTree))
    const routeParts = get(params, 'path', [])
    const route = Array.isArray(routeParts) ? routeParts.join('/') : routeParts
    const pageIndex = articles.findIndex((item) => item.route === route)

    if (pageIndex < 0) {
        return {
            notFound: true,
        }
    }

    const currentPage = articles[pageIndex]
    const prevPage = getPrevArticle(articles, pageIndex)
    const nextPage = getNextArticle(articles, pageIndex)

    const localizedPageTitleParts = extractLocalizedTitleParts(currentPage.route, navTree)

    const { serializedContent, headings, fileName } = await extractMdx(DOCS_ROOT_PATH, currentPage.route, locale)

    const filePath = path.relative(DOCS_ROOT_PATH, fileName)
    const repoRoute = path.join('edit', DOCS_EDIT_BRANCH, DOCS_REPO_DOCS_ROOT, filePath)

    const editUrl = DOCS_REPO
        ? `${DOCS_REPO}/${repoRoute}`
        : null

    // Prefetch client queries
    const { headers, defaultContext } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers, defaultContext })
    await prefetchAuth(client)

    return extractApolloState<DocPageProps>(client, {
        props: {
            navigation: navTree,
            serializedContent,
            headings,
            prevPage,
            nextPage,
            editUrl,
            articleTitle: currentPage.label,
            localizedPageTitleParts,
        },
    })
}
