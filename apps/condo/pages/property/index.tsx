/** @jsx jsx */
import {
    OrganizationEmployeeRole,
    PropertyWhereInput,
    SortPropertiesBy,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Typography } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    PageHeader,
    PageWrapper,
} from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import BuildingsTable from '@condo/domains/property/components/BuildingsTable'
import { useTableColumns as usePropertiesTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { useTableFilters as usePropertyTableFilters } from '@condo/domains/property/hooks/useTableFilters'


interface IPropertiesPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type PropertiesContentProps = {
    role: OrganizationEmployeeRole
    searchPropertiesQuery: PropertyWhereInput
    propertiesTableColumns: ColumnsType
    sortPropertiesBy: SortPropertiesBy[]
    loading?: boolean
    canDownloadProperties?: boolean
}

export const PropertiesContent: React.FC<PropertiesContentProps> = (props) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })

    const { role, searchPropertiesQuery, propertiesTableColumns, sortPropertiesBy, loading, canDownloadProperties } = props

    const { GlobalHints } = useGlobalHints()

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>} />
                <TablePageContent>
                    <BuildingsTable
                        role={role}
                        searchPropertiesQuery={searchPropertiesQuery}
                        tableColumns={propertiesTableColumns}
                        sortBy={sortPropertiesBy}
                        loading={loading}
                        canDownloadProperties={canDownloadProperties}
                    />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const PropertiesPage: IPropertiesPage = () => {
    const { link: { role = {} }, organization } = useOrganization()

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const propertyFilterMetas = usePropertyTableFilters()
    const propertiesTableColumns = usePropertiesTableColumns(propertyFilterMetas)

    const {
        filtersToWhere: filtersToPropertiesWhere,
        sortersToSortBy: sortersToSortPropertiesBy,
    } = useQueryMappers<PropertyWhereInput>(propertyFilterMetas, ['address'])

    const searchPropertiesQuery = {
        ...filtersToPropertiesWhere(filters),
        organization: { id: organization.id, deletedAt: null },
        deletedAt: null,
    }

    return (
        <PropertiesContent
            searchPropertiesQuery={searchPropertiesQuery}
            propertiesTableColumns={propertiesTableColumns}
            sortPropertiesBy={sortersToSortPropertiesBy(sorters) as SortPropertiesBy[]}
            role={role}
        />
    )
}

PropertiesPage.requiredAccess = OrganizationRequired

export default PropertiesPage
