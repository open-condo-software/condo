import {
    MeterReportingPeriod as MeterReportingPeriodType,
    MeterReportingPeriodWhereInput, QueryAllMeterReportingPeriodsArgs,
} from '@app/condo/schema'
import { Col, Row, RowProps, Typography } from 'antd'
import { TableRowSelection } from 'antd/lib/table/interface'
import chunk from 'lodash/chunk'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { IRefetchType } from '@open-condo/codegen/generate.hooks'
import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { METER_TAB_TYPES, METER_TYPES, MeterReportingPeriod } from '@condo/domains/meter/utils/clientSchema'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const DEFAULT_PERIOD_TEXT_STYLE = { alignSelf: 'start' }

const SORTABLE_PROPERTIES = []

type MeterReportingPeriodPageContentProps = {
    filtersMeta: FiltersMeta<MeterReportingPeriodWhereInput>[]
    loading?: boolean
    canManageMeters?: boolean
    userOrganizationId?: string
    refetchCount?: IRefetchType<MeterReportingPeriodType, QueryAllMeterReportingPeriodsArgs>
}

const MeterReportingPeriodTableContent: React.FC<MeterReportingPeriodPageContentProps> = (props) => {
    const {
        filtersMeta,
        loading,
        canManageMeters,
        userOrganizationId,
        refetchCount,
    } = props

    const intl = useIntl()
    const CreateReportingPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.EmptyList.create' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteMessage' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const tableColumns = useTableColumns(filtersMeta, METER_TAB_TYPES.reportingPeriod, METER_TYPES.unit)

    const searchMeterReportingPeriodsQuery = useMemo(() => {
        return {
            OR: [
                { organization_is_null: true },
                {
                    AND: [{
                        ...filtersToWhere(filters),
                        organization: { id: userOrganizationId },
                    }],
                },
            ],
        }},
    [filters, filtersToWhere, userOrganizationId])

    const {
        loading: periodLoading,
        count: total,
        objs: reportingPeriods,
        refetch,
    } = MeterReportingPeriod.useObjects({
        where: searchMeterReportingPeriodsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const defaultPeriod = useRef<MeterReportingPeriodType>()

    const reportingPeriodsProcessedForTable = useMemo(() => {
        return compact(reportingPeriods.map(period => {
            if (period.organization !== null) return period
            else defaultPeriod.current = period
        }))
    }, [reportingPeriods])
    const DefaultPeriodMessage = intl.formatMessage(
        { id: 'pages.condo.meter.index.reportingPeriod.defaultPeriod' },
        {
            notifyStartDay: get(defaultPeriod, 'current.notifyStartDay'),
            notifyEndDay: get(defaultPeriod, 'current.notifyEndDay'),
        }
    )

    const [search, handleSearchChange] = useSearch()
    const isNoMeterData = isEmpty(reportingPeriods) && isEmpty(filters) && !periodLoading && !loading

    const handleRowAction = useCallback((record) => {
        if (record.organization) {
            return {
                onClick: () => {
                    router.push(`/meter/reportingPeriod/${record.id}/update`)
                },
            }
        }
    }, [reportingPeriods])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])

    const handleCreateButtonClick = () => router.push('/meter/reportingPeriod/create')

    const [selectedRows, setSelectedRows] = useState([])

    const handleSelectRow = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            setSelectedRows([...selectedRows, record])
        } else {
            setSelectedRows(selectedRows.filter(({ id }) => id !== selectedKey))
        }
    }, [selectedRows])

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            setSelectedRows(reportingPeriodsProcessedForTable)
        } else {
            setSelectedRows([])
        }
    }, [reportingPeriodsProcessedForTable])

    const rowSelection: TableRowSelection<MeterReportingPeriodType> = useMemo(() => ({
        type: 'checkbox',
        onSelect: handleSelectRow,
        onSelectAll: handleSelectAll,
        selectedRowKeys: selectedRows.map(row => row.id),
    }), [handleSelectRow, handleSelectAll, selectedRows])

    const softDeleteMeterReportingPeriods = MeterReportingPeriod.useSoftDeleteMany(() => {
        setSelectedRows([])
        refetchCount()
        refetch()
    })

    const handleDeleteButtonClick = useCallback(async () => {
        if (selectedRows.length) {
            const itemsToDeleteByChunks = chunk(selectedRows, 30)
            for (const itemsToDelete of itemsToDeleteByChunks) {
                await softDeleteMeterReportingPeriods(selectedRows)
            }
        }
    }, [softDeleteMeterReportingPeriods, selectedRows])

    return (
        <>
            <Row
                gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                align='middle'
                justify='center'
                hidden={isNoMeterData}
            >
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row justify='space-between' gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}>
                            <Col span={24}>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={handleSearch}
                                    value={search}
                                    allowClear
                                    suffix={<Search size='medium' color={colors.gray[7]}/>}
                                />
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                {defaultPeriod.current && <Col span={24}>
                    <Typography.Text style={DEFAULT_PERIOD_TEXT_STYLE} type='secondary'>
                        {DefaultPeriodMessage}
                    </Typography.Text>
                </Col>}
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={periodLoading || loading}
                        dataSource={reportingPeriodsProcessedForTable}
                        columns={tableColumns}
                        onRow={handleRowAction}
                        rowSelection={rowSelection}
                    />
                </Col>
            </Row>
            {
                canManageMeters && !isNoMeterData && (
                    <ActionBar
                        actions={[
                            <Button
                                key='createPeriod'
                                type='primary'
                                onClick={handleCreateButtonClick}
                            >
                                {CreateReportingPeriodLabel}
                            </Button>,
                            selectedRows.length > 0 ? <DeleteButtonWithConfirmModal
                                key='deleteSelectedPeriods'
                                title={ConfirmDeleteTitle}
                                message={ConfirmDeleteMessage}
                                okButtonLabel={DeleteLabel}
                                action={handleDeleteButtonClick}
                                buttonContent={DeleteLabel}
                            /> : undefined,
                        ]}
                    />
                )
            }
        </>
    )
}

export const MeterReportingPeriodPageContent: React.FC<MeterReportingPeriodPageContentProps> = (props) => {
    const {
        loading,
        canManageMeters,
        userOrganizationId,
    } = props

    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.EmptyList.header' })
    const CreateReportingPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.EmptyList.create' })

    const searchMeterReportingPeriodsQuery = useMemo(() => {
        return {
            OR: [
                { organization_is_null: true },
                { AND: [{ organization: { id: userOrganizationId } }] },
            ],
        }},
    [userOrganizationId])
    const { count, loading: countLoading, refetch: refetchCount } = MeterReportingPeriod.useCount({ where: searchMeterReportingPeriodsQuery })

    const pageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />
        if (count === 0) {
            return (
                <EmptyListContent
                    label={EmptyListLabel}
                    createRoute='/meter/reportingPeriod/create'
                    createLabel={CreateReportingPeriodLabel}
                    accessCheck={canManageMeters}
                />
            )
        }

        return <MeterReportingPeriodTableContent refetchCount={refetchCount} {...props} />
    }, [CreateReportingPeriodLabel, EmptyListLabel, canManageMeters, count, countLoading, loading, props, refetchCount])

    return (
        <TablePageContent>
            {pageContent}
        </TablePageContent>
    )
}
