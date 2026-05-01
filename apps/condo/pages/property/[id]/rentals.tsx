import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageComponentType } from '@condo/domains/common/types'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { RentalsPageContent } from '@condo/domains/property/components/Rentals/RentalsPageContent'
import { Property } from '@condo/domains/property/utils/clientSchema'


const PropertyRentalsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.properties' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const PropertyNotFoundTitle = intl.formatMessage({ id: 'pages.condo.property.id.NotFound.PageTitle' })
    const PropertyNotFoundMessage = intl.formatMessage({ id: 'pages.condo.property.id.NotFound.Message' })

    const { query: { id } } = useRouter()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)

    const { loading, obj: property, error } = Property.useObject({
        where: {
            id: id as string,
            organization: { id: organizationId },
        },
    })

    if (error || loading) {
        return <LoadingOrErrorPage title={PageTitle} loading={loading} error={error ? ServerErrorMsg : null}/>
    }

    if (!property) {
        return <LoadingOrErrorPage title={PropertyNotFoundTitle} loading={false} error={PropertyNotFoundMessage}/>
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <RentalsPageContent property={property} organizationId={organizationId as string} />
                </PageContent>
            </PageWrapper>
        </>
    )
}

PropertyRentalsPage.requiredAccess = OrganizationRequired

export default PropertyRentalsPage
