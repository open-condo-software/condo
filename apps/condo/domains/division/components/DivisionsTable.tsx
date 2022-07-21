import { DatabaseFilled } from '@ant-design/icons'
import { DivisionWhereInput, OrganizationEmployeeRole, SortDivisionsBy, Division as DivisionType } from '@app/condo/schema'
import { Button } from '@condo/domains/common/components/Button'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors } from '@condo/domains/common/constants/style'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { useIntl } from '@core/next/intl'
import { Col, Row, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import { useRouter } from 'next/router'
import qs from 'qs'
import React from 'react'
import isEmpty from 'lodash/isEmpty'

type BuildingTableProps = {
    role: OrganizationEmployeeRole
    searchDivisionsQuery: DivisionWhereInput
    tableColumns: ColumnsType
    sortBy: string[]
    onSearch?: (properties: DivisionType[]) => void
    loading?: boolean
}

const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]

export default function DivisionTable (props: BuildingTableProps) {
    const intl = useIntl()

    const CreateLabel = intl.formatMessage({ id: 'pages.condo.division.index.CreateDivisionButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.division.index.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'pages.condo.division.index.EmptyList.text' })
    const CreateDivision = intl.formatMessage({ id: 'pages.condo.division.index.CreateDivisionButtonLabel' })

    const { role, searchDivisionsQuery, tableColumns, sortBy, loading } = props

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { loading: divisionsLoading, objs: divisions, count: total } = Division.useObjects({
        sortBy: sortBy as SortDivisionsBy[],
        where: { ...searchDivisionsQuery },
        skip: (currentPageIndex - 1) * PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
        onCompleted: () => {
            props.onSearch && props.onSearch(divisions)
        },
    })

    const handleRowAction = (record) => {
        return {
            onClick: () => {
                router.push(`/division/${record.id}/`)
            },
        }
    }

    const [search, handleSearchChange] = useSearch<IFilters>(divisionsLoading)
    const isNoDivisionsData = !divisions.length && isEmpty(filters) && !divisionsLoading && !loading

    return isNoDivisionsData
        ? <EmptyListView
            label={EmptyListLabel}
            message={EmptyListMessage}
            createRoute="/division/create"
            createLabel={CreateDivision}/>
        : (
            <Row align={'middle'} gutter={ROW_VERTICAL_GUTTERS}>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row justify="space-between" gutter={ROW_VERTICAL_GUTTERS}>
                            <Col xs={24} lg={6}>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={(e) => {
                                        handleSearchChange(e.target.value)
                                    }}
                                    value={search}
                                />
                            </Col>
                            <Col lg={6} offset={1} hidden={isSmall}>
                                <Tooltip title={NotImplementedYetMessage}>
                                    <Typography.Text
                                        style={{
                                            opacity: 70,
                                            color: colors.sberGrey[4],
                                        }}
                                    >
                                        <Button
                                            type={'inlineLink'}
                                            icon={<DatabaseFilled/>}
                                            target="_blank"
                                            rel="noreferrer">{DownloadExcelLabel}
                                        </Button>
                                    </Typography.Text>
                                </Tooltip>
                            </Col>
                            <Col xs={24} lg={4} offset={isSmall ? 0 : 7}>
                                {
                                    role?.canManageDivisions && (
                                        <Row justify={isSmall ? 'start' : 'end'}>
                                            <Button type="sberPrimary" onClick={() => router.push('/division/create')}>
                                                {CreateLabel}
                                            </Button>
                                        </Row>
                                    )
                                }
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <Table
                        scroll={getTableScrollConfig(isSmall)}
                        totalRows={total}
                        loading={divisionsLoading || loading}
                        dataSource={divisions}
                        onRow={handleRowAction}
                        columns={tableColumns}
                        pageSize={PROPERTY_PAGE_SIZE}
                        applyQuery={(queryParams) => {
                            queryParams['tab'] = router.query['tab']
                            const newQuery = qs.stringify({ ...queryParams }, {
                                arrayFormat: 'comma',
                                skipNulls: true,
                                addQueryPrefix: true,
                            })
                            return router.push(router.route + newQuery)
                        }}
                    />
                </Col>
            </Row>
        )
}
