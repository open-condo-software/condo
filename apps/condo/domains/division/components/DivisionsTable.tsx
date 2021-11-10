import React from 'react'
import { useRouter } from 'next/router'
import qs from 'qs'
import { ColumnsType } from 'antd/lib/table'

import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Typography } from 'antd'
import { Table } from '@condo/domains/common/components/Table/Index'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DatabaseFilled } from '@ant-design/icons'
import { Button } from '@condo/domains/common/components/Button'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors } from '@condo/domains/common/constants/style'
import { DivisionWhereInput, OrganizationEmployeeRole, SortDivisionsBy } from '@app/condo/schema'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'


type BuildingTableProps = {
    role: OrganizationEmployeeRole
    searchDivisionsQuery: DivisionWhereInput
    tableColumns: ColumnsType
    sortBy: string[]
    onSearch?: (properties: Division.IDivisionUIState[]) => void
}

export default function DivisionTable (props: BuildingTableProps) {
    const intl = useIntl()

    const CreateLabel = intl.formatMessage({ id: 'pages.condo.division.index.CreateDivisionButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })

    const { role, searchDivisionsQuery, tableColumns, sortBy } = props

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const { offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { loading, error, objs: divisions, count: total } = Division.useObjects({
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

    const [search, handleSearchChange] = useSearch<IFilters>(loading)

    if (error) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null} />
    }

    return (
        <Row align={'middle'} gutter={[0, 40]}>
            <Col xs={24} lg={6}>
                <Input
                    placeholder={SearchPlaceholder}
                    onChange={(e) => {handleSearchChange(e.target.value)}}
                    value={search}
                />
            </Col>
            <Col lg={6} offset={1} hidden={isSmall}>
                <Tooltip title={NotImplementedYetMessage} >
                    <Typography.Text
                        style={{
                            opacity: 70,
                            color: colors.sberGrey[4],
                        }}
                    >
                        <Button
                            type={'inlineLink'}
                            icon={<DatabaseFilled />}
                            target='_blank'
                            rel='noreferrer'>{DownloadExcelLabel}
                        </Button>
                    </Typography.Text>
                </Tooltip>
            </Col>
            <Col xs={24} lg={4} offset={isSmall ? 0 : 7}>
                {
                    role?.canManageDivisions && (
                        <Row justify={isSmall ? 'start' : 'end'}>
                            <Button type='sberPrimary' onClick={() => router.push('/division/create')}>
                                {CreateLabel}
                            </Button>
                        </Row>
                    )
                }
            </Col>
            <Col span={24}>
                <Table
                    scroll={getTableScrollConfig(isSmall)}
                    totalRows={total}
                    loading={loading}
                    dataSource={divisions}
                    onRow={handleRowAction}
                    columns={tableColumns}
                    pageSize={PROPERTY_PAGE_SIZE}
                    applyQuery={(queryParams)=> {
                        queryParams['tab'] = router.query['tab']
                        const newQuery = qs.stringify({ ...queryParams }, { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true })
                        return router.push(router.route + newQuery)
                    }}
                />
            </Col>
        </Row>)
}
