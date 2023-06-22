/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import has from 'lodash/has'
import isArray from 'lodash/isArray'
import isUndefined from 'lodash/isUndefined'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { PlusCircle, Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useTableColumns } from '@condo/domains/news/hooks/useTableColumns'
import { useTableFilters } from '@condo/domains/news/hooks/useTableFilters'
import { NewsItem, NewsItemScope } from '@condo/domains/news/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { IFilters } from '@condo/domains/ticket/utils/helpers'



interface INewsIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const SORTABLE_PROPERTIES = ['number', 'createdAt']
const NEWS_DEFAULT_SORT_BY = ['createdAt_DESC']

const NewsTableContainer = ({
    filterMetas,
    sortBy,
    searchNewsQuery,
    loading,
}) => {
    const intl = useIntl()
    const CreateNewsLabel = intl.formatMessage({ id: 'news.createNews' })
    const router = useRouter()
    const { offset } = useMemo(() => parseQuery(router.query), [router.query])

    const currentPageIndex = useMemo(() => getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE), [offset])

    const {
        loading: isNewsFetching,
        count: total,
        objs: news,
    } = NewsItem.useAllObjects({
        sortBy,
        where: searchNewsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, { fetchPolicy: 'network-only' })

    const newsIds = useMemo(() => {
        return news.map(obj => obj.id)
    }, [news])

    const {
        loading: isNewsItemScopeFetching,
        objs: newsItemScope,
    } = NewsItemScope.useAllObjects({
        where: {
            newsItem: {
                id_in: newsIds,
            },
        },
    })

    const newsWithAddresses = useMemo(() => {
        if (isNewsItemScopeFetching) return []

        const addresses = {}

        newsItemScope.forEach(item => {
            const propertyAddress = get(item, ['property'], null)
            const unitType = get(item, ['unitType'], null)
            const unitName = get(item, ['unitName'], null)
            const newsItemId = get(item, ['newsItem', 'id'])
            if (propertyAddress && addresses[newsItemId] !== 'hasAllProperties') {
                if (isArray(addresses[newsItemId])) {
                    addresses[newsItemId] = [...addresses[newsItemId], propertyAddress]
                } else {
                    addresses[newsItemId] = [propertyAddress]
                }
            } else {
                addresses[newsItemId] = 'hasAllProperties'
            }
        })

        const newsWithAddresses = news
            .filter(newsItem => {
                const newsItemId = get(newsItem, 'id')
                const hasScope = has(addresses, [newsItemId])

                return hasScope
            })
            .map(newsItem => {
                const newsItemId = get(newsItem, 'id')
                const hasAllProperties = addresses[newsItemId] === 'hasAllProperties'
                return {
                    newsItemAddresses: addresses[newsItemId] || [],
                    hasAllProperties: hasAllProperties,
                    ...newsItem,
                }
            })

        return newsWithAddresses
    }, [isNewsItemScopeFetching, newsItemScope, news])

    const columns = useTableColumns(filterMetas)

    const handleAddNews = useCallback(async () => {
        await router.push('/news/create')
    }, [router])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/news/${record.id}`)
            },
        }
    }, [router])


    const isAllLoaded = !(loading || isNewsFetching || isNewsItemScopeFetching)

    return (
        <Row gutter={PAGE_ROW_GUTTER}>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={!isAllLoaded}
                    dataSource={isAllLoaded ? newsWithAddresses : null}
                    columns={columns}
                    data-cy='news__table'
                    onRow={handleRowAction}
                />
            </Col>
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Button
                            key='addNews'
                            type='primary'
                            children={CreateNewsLabel}
                            icon={<PlusCircle size='medium'/>}
                            onClick={handleAddNews}
                        />,
                    ]}
                />
            </Col>
        </Row>
    )
}

const NewsPageContent = ({
    baseNewsQuery,
    filterMetas,
    sortableProperties,
}) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.news.index.emptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'pages.condo.news.index.emptyList.title' })
    const CreateNews = intl.formatMessage({ id: 'news.createNews' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const [search, changeSearch] = useSearch<IFilters>()
    const handleSearchChange = useCallback((e) => {
        changeSearch(e.target.value)
    }, [changeSearch])

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    const sortBy = sortersToSortBy(sorters, NEWS_DEFAULT_SORT_BY)
    const searchNewsQuery = useMemo(() => ({ ...baseNewsQuery, ...filtersToWhere(filters) }),
        [baseNewsQuery, filters, filtersToWhere])

    const {
        count: newsWithoutFiltersCount,
        loading: newsWithoutFiltersCountLoading,
        error,
    } = NewsItem.useCount({ where: baseNewsQuery })
    const loading = newsWithoutFiltersCountLoading

    if (loading || error) {
        const errorToPrint = error ? ServerErrorMsg : null
        return <LoadingOrErrorPage loading={loading} error={errorToPrint}/>
    }

    if (newsWithoutFiltersCount === 0) {
        return (
            <EmptyListView
                label={EmptyListLabel}
                message={EmptyListMessage}
                createRoute='/news/create'
                createLabel={CreateNews}
            />
        )
    }

    return (
        <Row gutter={PAGE_ROW_GUTTER} justify='space-between'>
            <Col span={24}>
                <TableFiltersContainer>
                    <Input
                        placeholder={SearchPlaceholder}
                        onChange={handleSearchChange}
                        value={search}
                        allowClear
                        suffix={<Search size='medium' color={colors.gray[7]}/>}
                    />
                </TableFiltersContainer>
            </Col>
            <NewsTableContainer
                searchNewsQuery={searchNewsQuery}
                sortBy={sortBy}
                filterMetas={filterMetas}
                loading={loading}
            />
        </Row>
    )
}

const NewsPage: INewsIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.news.index.pageTitle' })

    const { organization } = useOrganization()

    const baseNewsQuery = {
        organization: { id: organization.id },
    }

    const filterMetas = useTableFilters()

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <TablePageContent>
                    <Row gutter={PAGE_ROW_GUTTER} justify='space-between'>
                        <Col md={12} xs={24}>
                            <Typography.Title>
                                {PageTitleMessage}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <NewsPageContent
                                baseNewsQuery={baseNewsQuery}
                                filterMetas={filterMetas}
                                sortableProperties={SORTABLE_PROPERTIES}
                            />
                        </Col>
                    </Row>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

NewsPage.requiredAccess = OrganizationRequired
export default NewsPage
