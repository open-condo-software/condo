import {
    NewsItem as INewsItem,
    NewsItemWhereInput,
    SortNewsItemsBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import { Search } from '@open-condo/icons'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    ActionBar,
    ActionBarProps,
    Button,
    FullTableState,
    GetTableData,
    Table,
    TableRef,
    Typography,
} from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableTranslations } from '@condo/domains/common/hooks/useTableTranslations'
import { PageComponentType } from '@condo/domains/common/types'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { defaultParseUrlQuery, defaultUpdateUrlQuery } from '@condo/domains/common/utils/tableUrls'
import { NewsAudienceFilterSwitch } from '@condo/domains/news/components/NewsAudienceFilterSwitch'
import { NewsReadPermissionRequired } from '@condo/domains/news/components/PageAccess'
import { NEWS_ITEM_SOURCE_IDS } from '@condo/domains/news/constants/newsItemSourceIds'
import { NewsItem as NewsItemGQL } from '@condo/domains/news/gql'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { useTableColumns } from '@condo/domains/news/hooks/useTableColumns'
import { useTableFilters, UseNewsTableFiltersReturnType } from '@condo/domains/news/hooks/useTableFilters'
import { NewsItem } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'

import styles from './index.module.css'


const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const HEADER_GUTTER: RowProps['gutter'] = [0, 16]
const SORTABLE_PROPERTIES = ['number', 'createdAt']
const NEWS_DEFAULT_SORT_BY = ['createdAt_DESC']
const AUDIENCE_FILTER_KEY = 'audience'

type BaseNewsQuery = {
    organization: { id: string }
    source: { id_in: string[] }
}

type NewsTableContainerProps = {
    baseNewsQuery: BaseNewsQuery
    filterMetas: UseNewsTableFiltersReturnType
    tableRef: React.RefObject<TableRef | null>
}

const NewsTableContainer: React.FC<NewsTableContainerProps> = ({
    baseNewsQuery,
    filterMetas,
    tableRef,
}) => {
    const intl = useIntl()
    const CreateNewsLabel = intl.formatMessage({ id: 'news.createNews' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const router = useRouter()
    const { canManage } = useNewsItemsAccess()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const columns = useTableColumns(filterMetas)
    const columnLabels = useTableTranslations()
    const [search, handleSearchChange, setSearch] = useTableSearch(tableRef)

    const { filters: urlFilters } = useMemo(() => parseQuery(router.query), [router.query])
    const audience = urlFilters[AUDIENCE_FILTER_KEY]

    const [fetchNews] = useLazyQuery(NewsItemGQL.GET_ALL_OBJS_WITH_COUNT_QUERY)
    const initialTableState = useMemo(
        () => defaultParseUrlQuery(router.query, DEFAULT_PAGE_SIZE),
        [router.query],
    )

    const updateUrlQuery = useCallback((params: FullTableState) => {
        const nextFilterState = omit(params.filterState, [AUDIENCE_FILTER_KEY])
        if (audience) {
            nextFilterState[AUDIENCE_FILTER_KEY] = audience
        }

        defaultUpdateUrlQuery(router, {
            ...params,
            filterState: nextFilterState,
        })
    }, [audience, router])

    const dataSource: GetTableData<INewsItem> = useCallback(async ({
        filterState,
        sortState,
        startRow,
        endRow,
        globalFilter,
    }) => {
        const where: NewsItemWhereInput = {
            ...baseNewsQuery,
            ...filtersToWhere({
                ...omit(filterState, [AUDIENCE_FILTER_KEY]),
                ...(audience ? { [AUDIENCE_FILTER_KEY]: audience } : {}),
                search: globalFilter,
            }),
        }

        try {
            const { data } = await fetchNews({
                variables: {
                    where,
                    sortBy: sortersToSortBy(sortState, NEWS_DEFAULT_SORT_BY) as SortNewsItemsBy[],
                    first: endRow - startRow,
                    skip: startRow,
                },
                fetchPolicy: 'network-only',
            })

            return {
                rowData: data?.objs?.filter(Boolean) ?? [],
                rowCount: data?.meta?.count ?? 0,
            }
        } catch (error) {
            console.error('Failed to fetch news items', error)
            return { rowData: [], rowCount: 0 }
        }
    }, [audience, baseNewsQuery, fetchNews, filtersToWhere, sortersToSortBy])

    useEffect(() => {
        tableRef.current?.api?.refetchData()
    }, [audience, baseNewsQuery, tableRef])

    const handleAddNews = useCallback(async () => {
        await router.push('/news/create')
    }, [router])

    const handleRowClick = useCallback((record: INewsItem) => {
        const hasSelectedText = globalThis.window?.getSelection?.()?.toString().trim()
        if (hasSelectedText) return

        router.push(`/news/${record.id}`)
    }, [router])

    const getRowId = useCallback((row: INewsItem) => row.id, [])

    const onTableReady = useCallback((readyTableRef: TableRef) => {
        setSearch(String(readyTableRef.api.getGlobalFilter() || ''))
    }, [setSearch])

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
                <TableFiltersContainer>
                    <Input
                        placeholder={SearchPlaceholder}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        value={search}
                        allowClear
                        suffix={<Search size='medium' color={colors.gray[7]} />}
                    />
                </TableFiltersContainer>
            </Col>
            <Col span={24} data-cy='news__table'>
                <Table<INewsItem>
                    id='news-table'
                    dataSource={dataSource}
                    columns={columns}
                    onRowClick={handleRowClick}
                    pageSize={DEFAULT_PAGE_SIZE}
                    onTableStateChange={updateUrlQuery}
                    initialTableState={initialTableState}
                    columnLabels={columnLabels}
                    getRowId={getRowId}
                    onTableReady={onTableReady}
                    ref={tableRef}
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

type NewsPageContentProps = {
    baseNewsQuery: BaseNewsQuery
    filterMetas: UseNewsTableFiltersReturnType
    tableRef: React.RefObject<TableRef | null>
    newsWithoutFiltersCount: number
    newsWithoutFiltersCountLoading: boolean
    newsError?: string
}

const NewsPageContent: React.FC<NewsPageContentProps> = ({
    baseNewsQuery,
    filterMetas,
    tableRef,
    newsWithoutFiltersCount,
    newsWithoutFiltersCountLoading,
    newsError,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.news.index.emptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'pages.condo.news.index.emptyList.title' })
    const PropertyGateLabel = intl.formatMessage({ id: 'pages.condo.news.index.propertyGate.header' })
    const PropertyGateMessage = intl.formatMessage({ id: 'pages.condo.news.index.propertyGate.title' })
    const PropertyGateButtonLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const CreateNews = intl.formatMessage({ id: 'news.createNews' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const { canManage } = useNewsItemsAccess()
    const { organization } = useOrganization()

    const {
        count: propertiesCount,
        loading: propertiesLoading,
        error: propertiesError,
    } = Property.useCount({ where: { organization: { id: get(organization, 'id') } }, first: 1 })

    const loading = newsWithoutFiltersCountLoading || propertiesLoading
    const error = newsError || propertiesError

    if (loading || error) {
        const errorToPrint = error ? ServerErrorMsg : null
        return <LoadingOrErrorPage loading={loading} error={errorToPrint}/>
    }

    if (propertiesCount === 0 && newsWithoutFiltersCount === 0) {
        return (
            <EmptyListContent
                image='/mascot/playing.webp'
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
        <NewsTableContainer
            baseNewsQuery={baseNewsQuery}
            filterMetas={filterMetas}
            tableRef={tableRef}
        />
    )
}

const NewsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.news.index.pageTitle' })

    const { link, organization } = useOrganization()
    const employeeId = get(link, 'id')
    const { isLoading: isAccessLoading } = useNewsItemsAccess()
    const tableRef = useRef<TableRef | null>(null)

    const { GlobalHints } = useGlobalHints()
    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    const baseNewsQuery = useMemo(() => ({
        organization: { id: organization.id },
        source: {
            id_in: [
                NEWS_ITEM_SOURCE_IDS.NEWS_FORM,
                NEWS_ITEM_SOURCE_IDS.REGISTRY,
            ],
        },
    }), [organization.id])

    const filterMetas = useTableFilters()

    const {
        count: newsWithoutFiltersCount,
        loading: newsWithoutFiltersCountLoading,
        error: newsError,
    } = NewsItem.useCount({ where: baseNewsQuery })
    const isNewsExists = (newsWithoutFiltersCount ?? 0) > 0

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
                <div className={styles.pageLayout}>
                    <Row justify='space-between' align='middle' gutter={HEADER_GUTTER}>
                        <PageHeader
                            className={styles.customPageHeader}
                            title={<Typography.Title>{PageTitleMessage}</Typography.Title>}
                        />
                        {
                            !newsWithoutFiltersCountLoading && isNewsExists && (
                                <Col>
                                    <NewsAudienceFilterSwitch />
                                </Col>
                            )
                        }
                    </Row>
                    <TablePageContent className={styles.tableContent}>
                        <NewsPageContent
                            baseNewsQuery={baseNewsQuery}
                            filterMetas={filterMetas}
                            tableRef={tableRef}
                            newsWithoutFiltersCount={newsWithoutFiltersCount}
                            newsWithoutFiltersCountLoading={newsWithoutFiltersCountLoading}
                            newsError={newsError}
                        />
                    </TablePageContent>
                </div>
            </PageWrapper>
        </>
    )
}

NewsPage.requiredAccess = NewsReadPermissionRequired

export default NewsPage
