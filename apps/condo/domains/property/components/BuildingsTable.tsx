import { jsx } from '@emotion/core'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useLazyQuery } from '@apollo/client'

import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { useIntl } from '@core/next/intl'

import { EXPORT_PROPERTIES_TO_EXCEL } from '@condo/domains/property/gql'
import { Col, Input, notification, Row, Space } from 'antd'
import { Table } from '@condo/domains/common/components/Table/Index'
import { useLayoutContext } from '../../common/components/LayoutContext'
import { useImporterFunctions } from '../hooks/useImporterFunctions'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DatabaseFilled, DiffOutlined } from '@ant-design/icons'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Button } from '@condo/domains/common/components/Button'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationEmployeeRole, PropertyWhereInput } from '@app/condo/schema'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { ColumnsType } from 'antd/lib/table'

type BuildingTableProps = {
    role: OrganizationEmployeeRole
    searchPropertiesQuery: PropertyWhereInput
    tableColumns: ColumnsType
    sortBy: string[]
    onSearch?: (properties: Property.IPropertyUIState[]) => void
}

export default function BuildingsTable (props: BuildingTableProps) {
    const intl = useIntl()

    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const PageTitleMsg = intl.formatMessage({ id: 'pages.condo.property.id.PageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const PropertiesMessage = intl.formatMessage({ id: 'menu.Property' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })
    const PropertyTitle = intl.formatMessage({ id: 'pages.condo.property.ImportTitle' })

    const { role, searchPropertiesQuery, tableColumns, sortBy } = props

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const { offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { loading, error, refetch, objs: properties, count: total } = Property.useObjects({
        sortBy,
        where: { ...searchPropertiesQuery },
        skip: (currentPageIndex - 1) * PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
        onCompleted: () => {
            props.onSearch && props.onSearch(properties)
        },
    })

    const handleRowAction = (record) => {
        return {
            onClick: () => {
                router.push(`/property/${record.id}/`)
            },
        }
    }

    const [downloadLink, setDownloadLink] = useState(null)
    const [exportToExcel, { loading: isXlsLoading }] = useLazyQuery(
        EXPORT_PROPERTIES_TO_EXCEL,
        {
            onError: error => {
                notification.error(error)
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        }
    )

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()

    const [search, handleSearchChange] = useSearch<IFilters>(loading)

    function onExportToExcelButtonClicked () {
        exportToExcel({
            variables: {
                data: {
                    where: { ...searchPropertiesQuery },
                    sortBy,
                },
            },
        })
    }

    if (error) {
        return <LoadingOrErrorPage title={PageTitleMsg} loading={loading} error={error ? ServerErrorMsg : null} />
    }

    return (
        <Row align={'middle'} justify={'start'} gutter={[0, 40]}>
            <Col xs={24} lg={6}>
                <Input
                    placeholder={SearchPlaceholder}
                    onChange={(e) => {handleSearchChange(e.target.value)}}
                    value={search}
                />
            </Col>
            <Col lg={6} offset={1} hidden={isSmall}>
                {
                    downloadLink
                        ? (
                            <Button
                                type={'inlineLink'}
                                icon={<DatabaseFilled />}
                                loading={isXlsLoading}
                                target='_blank'
                                href={downloadLink}
                                rel='noreferrer'>{DownloadExcelLabel}
                            </Button>
                        )
                        : (
                            <Button
                                type={'inlineLink'}
                                icon={<DatabaseFilled />}
                                loading={isXlsLoading}
                                onClick={onExportToExcelButtonClicked}>{ExportAsExcel}
                            </Button>
                        )
                }
            </Col>
            <Col lg={1} offset={7} hidden={isSmall}>
                {
                    role?.canManageProperties && (
                        <ImportWrapper
                            objectsName={PropertiesMessage}
                            accessCheck={role?.canManageProperties}
                            onFinish={refetch}
                            columns={columns}
                            rowNormalizer={propertyNormalizer}
                            rowValidator={propertyValidator}
                            domainTranslate={PropertyTitle}
                            objectCreator={propertyCreator}
                        >
                            <Button
                                type={'sberPrimary'}
                                icon={<DiffOutlined />}
                                secondary
                            />
                        </ImportWrapper>
                    )
                }
            </Col>
            <Col xs={24} lg={3}>
                {
                    role?.canManageProperties
                        ? (
                            <Button type='sberPrimary' onClick={() => router.push('/property/create')}>
                                {CreateLabel}
                            </Button>
                        )
                        : null
                }
            </Col>
            <Col span={24}>
                <Table
                    scroll={isSmall ? { x: true } : {}}
                    totalRows={total}
                    loading={loading}
                    dataSource={properties}
                    onRow={handleRowAction}
                    columns={tableColumns}
                    pageSize={PROPERTY_PAGE_SIZE}
                />
            </Col>
        </Row>)
}
