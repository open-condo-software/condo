/** @jsx jsx */
import {
    OrganizationEmployeeRole,
    PropertyWhereInput,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Typography } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import get from 'lodash/get'
import Head from 'next/head'
import React, { useMemo } from 'react'

import { prepareSSRContext } from '@open-condo/miniapp-utils'
import { initializeApollo } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'


import {
    PageHeader,
    PageWrapper,
} from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { prefetchAuthOrRedirect } from '@condo/domains/common/utils/next/auth'
import { prefetchOrganizationEmployee } from '@condo/domains/common/utils/next/organization'
import { extractSSRState, ifSsrIsNotDisabled } from '@condo/domains/common/utils/next/ssr'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import BuildingsTable from '@condo/domains/property/components/BuildingsTable'
import { useTableColumns as usePropertiesTableColumns } from '@condo/domains/property/hooks/useTableColumns'
import { useTableFilters as usePropertyTableFilters } from '@condo/domains/property/hooks/useTableFilters'

import type { GetServerSideProps } from 'next'


interface IPropertiesPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

type PropertiesContentProps = {
    role: Pick<OrganizationEmployeeRole, 'canManageProperties' | 'canReadProperties'>
    baseSearchQuery: PropertyWhereInput
    propertiesTableColumns: ColumnsType
    propertyFilterMeta: FiltersMeta<PropertyWhereInput>[]
    loading?: boolean
    canDownloadProperties?: boolean
}

export const PropertiesContent: React.FC<PropertiesContentProps> = (props) => {
    const {
        role,
        propertyFilterMeta,
        baseSearchQuery,
        propertiesTableColumns,
        loading,
        canDownloadProperties,
    } = props

    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.PageTitle' })

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
                        tableColumns={propertiesTableColumns}
                        propertyFilterMeta={propertyFilterMeta}
                        baseSearchQuery={baseSearchQuery}
                        loading={loading}
                        canDownloadProperties={canDownloadProperties}
                    />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const PropertiesPage: IPropertiesPage = () => {
    const { link, organization } = useOrganization()
    const role = get(link, 'role', {})
    const employeeId = get(link, 'id')

    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    const propertyFilterMeta = usePropertyTableFilters()
    const propertiesTableColumns = usePropertiesTableColumns(propertyFilterMeta)

    const baseSearchQuery = useMemo(() => ({
        organization: { id: organization.id, deletedAt: null },
        deletedAt: null,
    }), [organization.id])

    return (
        <PropertiesContent
            baseSearchQuery={baseSearchQuery}
            propertiesTableColumns={propertiesTableColumns}
            propertyFilterMeta={propertyFilterMeta}
            role={role}
        />
    )
}

PropertiesPage.requiredAccess = OrganizationRequired

export default PropertiesPage

export const getServerSideProps: GetServerSideProps = ifSsrIsNotDisabled(async (context) => {
    const { req, res } = context

    // @ts-ignore In Next 9 the types (only!) do not match the expected types
    const { headers } = prepareSSRContext(req, res)
    const client = initializeApollo({ headers })

    const { redirect, user } = await prefetchAuthOrRedirect(client, context)
    if (redirect) return redirect

    await prefetchOrganizationEmployee({ client, context, userId: user.id })

    return extractSSRState(client, req, res, {
        props: {},
    })
})
