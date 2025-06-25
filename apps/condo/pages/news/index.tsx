import { Col, Row, RowProps } from 'antd'
import { isEmpty } from 'lodash'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PageComponentType } from '@condo/domains/common/types'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { NewsReadPermissionRequired } from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { useTableColumns } from '@condo/domains/news/hooks/useTableColumns'
import { useTableFilters } from '@condo/domains/news/hooks/useTableFilters'
import { NewsItem } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { IFilters } from '@condo/domains/ticket/utils/helpers'


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
    const { canManage } = useNewsItemsAccess()

    const {
        loading: isNewsFetching,
        count: total,
        objs: news,
    } = NewsItem.useObjects({
        sortBy,
        where: searchNewsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, { fetchPolicy: 'network-only' })

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

    const isAllLoaded = !(loading || isNewsFetching)

    const actionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        canManage && <Button
            key='addNews'
            type='primary'
            children={CreateNewsLabel}
            onClick={handleAddNews}
        />,
    ], [CreateNewsLabel, canManage, handleAddNews])

    return (
        <Row gutter={PAGE_ROW_GUTTER}>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={!isAllLoaded}
                    dataSource={isAllLoaded ? news : null}
                    columns={columns}
                    data-cy='news__table'
                    onRow={handleRowAction}
                />
            </Col>
            {
                !isEmpty(actionBarButtons.filter(Boolean)) && (
                    <Col span={24}>
                        <ActionBar
                            actions={actionBarButtons}
                        />
                    </Col>
                )
            }
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
    const PropertyGateLabel = intl.formatMessage({ id: 'pages.condo.news.index.propertyGate.header' })
    const PropertyGateMessage = intl.formatMessage({ id: 'pages.condo.news.index.propertyGate.title' })
    const PropertyGateButtonLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
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
    const { canManage } = useNewsItemsAccess()

    const { organization } = useOrganization()

    const {
        count: propertiesCount,
        loading: propertiesLoading,
        error: propertiesError,
    } = Property.useCount({ where: { organization: { id: get(organization, 'id') } }, first: 1 })

    const {
        count: newsWithoutFiltersCount,
        loading: newsWithoutFiltersCountLoading,
        error: newsError,
    } = NewsItem.useCount({ where: baseNewsQuery })

    const loading = newsWithoutFiltersCountLoading || propertiesLoading
    const error = newsError || propertiesError

    if (loading || error) {
        const errorToPrint = error ? ServerErrorMsg : null
        return <LoadingOrErrorPage loading={loading} error={errorToPrint}/>
    }

    if (propertiesCount === 0 && newsWithoutFiltersCount === 0) {
        return (
            <EmptyListContent
                image='/dino/playing@2x.png'
                label={PropertyGateLabel}
                message={PropertyGateMessage}
                createRoute='/property/create?next=/news&skipTourModal=true'
                createLabel={PropertyGateButtonLabel}
                accessCheck={canManage}
            />
        )
    }

    if (newsWithoutFiltersCount === 0) {
        return (
            <EmptyListContent
                label={EmptyListLabel}
                message={EmptyListMessage}
                createRoute='/news/create'
                createLabel={CreateNews}
                accessCheck={canManage}
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

const NewsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.news.index.pageTitle' })

    const { link, organization }  = useOrganization()
    const employeeId = get(link, 'id')
    const { isLoading: isAccessLoading } = useNewsItemsAccess()

    const { GlobalHints } = useGlobalHints()
    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    const baseNewsQuery = {
        organization: { id: organization.id },
    }

    const filterMetas = useTableFilters()

    if (isAccessLoading) {
        return <LoadingOrErrorPage error='' loading={true}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>} />
                <TablePageContent>
                    <NewsPageContent
                        baseNewsQuery={baseNewsQuery}
                        filterMetas={filterMetas}
                        sortableProperties={SORTABLE_PROPERTIES}
                    />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

NewsPage.requiredAccess = NewsReadPermissionRequired

export default NewsPage
