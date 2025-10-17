import { Col, Row, RowProps } from 'antd'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Typography, Table as OpenTable } from '@open-condo/ui'
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
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PageComponentType } from '@condo/domains/common/types'
import { NewsReadPermissionRequired } from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'
import { useOpenTableColumns, useTableColumns } from '@condo/domains/news/hooks/useTableColumns'
import { useTableFilters } from '@condo/domains/news/hooks/useTableFilters'
import { NewsItem } from '@condo/domains/news/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

const PAGE_ROW_GUTTER: RowProps['gutter'] = [0, 40]
const SORTABLE_PROPERTIES = ['number', 'createdAt']
const NEWS_DEFAULT_SORT_BY = ['createdAt_DESC']

const OpenTableContainer = ({
    baseNewsQuery,
    filterMetas,
    loading, 
    search,
}) => {
    const intl = useIntl()
    const CreateNewsLabel = intl.formatMessage({ id: 'news.createNews' })
    const SortLabel = intl.formatMessage({ id: 'Table.Sort' })
    const FilterLabel = intl.formatMessage({ id: 'Table.Filter' })
    const SettingsLabel = intl.formatMessage({ id: 'Table.Settings' })
    const SortedLabel = intl.formatMessage({ id: 'Table.Sorted' })
    const FilteredLabel = intl.formatMessage({ id: 'Table.Filtered' })
    const SettedLabel = intl.formatMessage({ id: 'Table.Setted' })
    const { push } = useRouter()

    const columns = useOpenTableColumns(filterMetas)

    const { canManage } = useNewsItemsAccess()

    const { count: total, refetch } = NewsItem.useObjects({})

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)

    const debouncedRefetch = useMemo(() => {
        return debounce(async (params) => {
            return await refetch(params)
        }, 3000)
    }, [refetch])

    const dataSource = useCallback(async ({ request, success, fail }) => {
        try {
            const sortBy = sortersToSortBy(request.sortModel, NEWS_DEFAULT_SORT_BY)
            const where = filtersToWhere({ ...request.filterModel, search, ...baseNewsQuery })
            const { data } = await debouncedRefetch({
                sortBy,
                where,
                first: DEFAULT_PAGE_SIZE,
                skip: request.endRow - DEFAULT_PAGE_SIZE,
            })

            success({ rowData: data?.objs ?? [], rowCount: data?.meta?.count })
        } catch (e) {
            fail()
        }
    }, [sortersToSortBy, filtersToWhere, search, debouncedRefetch, baseNewsQuery])

    const columnMenuLabels = {
        sortLabel: SortLabel,
        filterLabel: FilterLabel,
        settingsLabel: SettingsLabel,
        sortedLabel: SortedLabel,
        filteredLabel: FilteredLabel,
        settedLabel: SettedLabel,
    }

    const handleRowAction = useCallback(async (record) => {
        await push(`/news/${record.id}`)
    }, [push])

    const handleAddNews = useCallback(async () => {
        await push('/news/create')
    }, [push])

    const actionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        canManage && <Button
            key='addNews'
            type='primary'
            children={CreateNewsLabel}
            onClick={handleAddNews}
        />,
    ], [CreateNewsLabel, canManage, handleAddNews])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <Row gutter={PAGE_ROW_GUTTER}>
                <Col span={24}>
                    <OpenTable
                        dataSource={dataSource}
                        // @ts-ignore
                        columns={columns}
                        totalRows={total}
                        pageSize={DEFAULT_PAGE_SIZE}
                        syncUrlConfig={{
                            parseUrlCallback: () => ({ filterModel: {}, startRow: 0, sortModel: [], endRow: 0 }),
                            updateUrlCallback: (params) => console.log('params', params),
                        }}
                        columnMenuLabels={columnMenuLabels}
                        id='open-table'
                        loading={loading}
                        onRowClick={handleRowAction}
                    />
                </Col>
            </Row>
            {
                !isEmpty(actionBarButtons.filter(Boolean)) && (
                    <Row gutter={PAGE_ROW_GUTTER}>
                        <Col span={24}>
                            <ActionBar
                                actions={actionBarButtons}
                            />
                        </Col>
                    </Row>
                )
            }
        </div>
    )
            
}

const NewsPageContent = ({
    baseNewsQuery,
    filterMetas,
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
            <OpenTableContainer
                baseNewsQuery={baseNewsQuery}
                filterMetas={filterMetas}
                loading={loading}   
                search={search}
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
                    />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

NewsPage.requiredAccess = NewsReadPermissionRequired

export default NewsPage
