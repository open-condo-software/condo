/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useState, useMemo } from 'react'

import { Search, PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Typography, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import {
    PageWrapper,
} from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
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


const NewsTable = ({
    total,
    news,
    columns,
    loading,
}) => {
    return (
        <>
            <Table
                totalRows={total}
                loading={loading}
                dataSource={loading ? null : news}
                columns={columns}
                data-cy='news__table'
            />
        </>
    )
}

const NewsTableContainer = ({
    filterMetas,
    sortBy,
    searchNewsQuery,
    loading,
}) => {
    const router = useRouter()
    const { filters, offset } = useMemo(() => parseQuery(router.query), [router.query])
    
    const currentPageIndex = useMemo(() => getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE), [offset])

    const {
        loading: isNewsFetching,
        count: total,
        objs: news,
    } = NewsItem.useObjects({
        sortBy,
        where: searchNewsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [whereNewsItemScopeArr, setWhereNewsItemScopeArr] = useState([
        {
            newsItem: { 
                id: null,
            },
        },
    ])
    useMemo(() => {
        console.debug('isNewsFetching', isNewsFetching)
        if (!isNewsFetching) {
            const newWhereNewsItemScopeArr  = news.reduce((arr, newsItem) => {
                const newsItemID = get(newsItem, 'id', null)
                const newsItemOrganizationID = get(newsItem, ['organization', 'id'], null)
    
                if (newsItemID && newsItemOrganizationID) {
                    arr.push({
                        newsItem: { 
                            id: newsItemID,
                            organization: { id: newsItemOrganizationID },
                        },
                    })
                }
                return arr
            }, [])
            setWhereNewsItemScopeArr(() => newWhereNewsItemScopeArr)
        } else {
            setWhereNewsItemScopeArr(() => {
                return [
                    {
                        newsItem: { 
                            id: null,
                        },
                    },
                ]
            })
        }
    }, [isNewsFetching])

    const {
        loading: isNewsItemScopeFetching,
        objs: newsItemScope,
    } = NewsItemScope.useObjects({
        where: { OR: whereNewsItemScopeArr },
    })

    //TODO(KEKMUS)rewrite this later
    let newsWithAddresses = {}

    if (!isNewsItemScopeFetching) {
        const addresses = {}

        newsItemScope.forEach(item => {
            const propertyAddress = get(item, ['property', 'address'])
            addresses[item.newsItem.id] = [propertyAddress]
        })
    
        newsWithAddresses = news.map(newsItem => {
            return { 
                //TODO(KEKMUS) understand what i have to show if message is sent to all residents
                newsItemAddresses: addresses[newsItem.id] || 'ALL',
                ...newsItem,
            }
        })
    }

    const columns = useTableColumns(filterMetas)

    const handleAddNews = useCallback(() => {
        alert('dummy')
    }, [])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <NewsTable
                    total={total}
                    news={newsWithAddresses}
                    loading={loading || isNewsFetching || isNewsItemScopeFetching }
                    columns={columns}
                />
            </Col>
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Button 
                            key='addNews' 
                            type='primary'
                            children='Добавить новость'
                            icon={<PlusCircle size='small' />}
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

    const [search, changeSearch ] = useSearch<IFilters>()
    const handleSearchChange = useCallback((e) => {
        changeSearch(e.target.value)
    }, [changeSearch])


    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    //TODO(KEKMUS)now sorting by date sorts only by the createdAt field regardless of whether there is sendAt, need to understand what kind of behavior we expect
    const sortBy =  sortersToSortBy(sorters, NEWS_DEFAULT_SORT_BY) 
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
        <>
            <Row gutter={PAGE_ROW_GUTTER} justify='space-between'>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Input
                            placeholder={SearchPlaceholder}
                            onChange={handleSearchChange}
                            value={search}
                            allowClear
                            suffix={<Search size='medium' color={colors.gray[7]} />}
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
        </>
    )
}

const NewsPage: INewsIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.news.index.pageTitle' })

    const { link: { role = {} }, organization } = useOrganization()

    const baseNewsQuery = {
        organization: { id: organization.id, deletedAt: null },
        deletedAt: null,
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
