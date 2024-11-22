import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { PageComponentType } from '@condo/domains/common/types'
import { MeterPageContent } from '@condo/domains/meter/components/Meters/MeterPageContent'
import { Meter, MeterReportingPeriod, MeterResource, METER_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { getMeterTitleMessage } from '@condo/domains/meter/utils/helpers'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'


const MeterInfoPage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const { query: { id: meterId } } = useRouter()
    const { user } = useAuth()
    const { organization, selectEmployee } = useOrganization()
    const {
        obj: meter,
        error: meterError,
        loading: isMeterLoading,
        refetch,
    } = Meter.useObject({ where: { id: String(meterId) } })

    const organizationId = get(meter, 'organization.id', null)
    const propertyId = get(meter, 'property.id', null)
    const resourceId = get(meter, 'resource.id', null)

    const {
        objs: possibleReportingPeriods,
        loading: isPeriodsLoading,
    } = MeterReportingPeriod.useObjects({ where: {
        OR: [
            { AND: [ { organization: { id: organizationId } }, { property: { id: propertyId } } ] },
            { AND: [ { organization: { id: organizationId } }, { property_is_null: true } ] },
        ],
    },
    })

    const {
        obj: meterResource,
        loading: isMeterResourceLoading,
    } = MeterResource.useObject({ where: { id: resourceId } })
    
    const MeterTitleMessage = useMemo(() => getMeterTitleMessage(intl, meter), [meter])

    const userId = get(user, 'id', null)
    const meterOrganizationId = get(meter, 'organization.id', null)

    const {
        obj: meterOrganizationEmployee,
    } = OrganizationEmployee.useObject({
        where: {
            user: { id: userId },
            organization: { id: meterOrganizationId },
        },
    })

    const meterOrganizationEmployeeOrganizationId = get(meterOrganizationEmployee, 'organization.id')
    const currentEmployeeOrganization = get(organization, 'id')

    useEffect(() => {
        if (
            meterOrganizationEmployeeOrganizationId &&
            meterOrganizationEmployeeOrganizationId !== currentEmployeeOrganization
        ) {
            selectEmployee(meterOrganizationEmployee?.id)
        }
    }, [meterOrganizationEmployeeOrganizationId, currentEmployeeOrganization])


    if (!meter || isMeterLoading || isPeriodsLoading || isMeterResourceLoading) {
        return (
            <LoadingOrErrorPage
                loading={isMeterLoading || isPeriodsLoading || isMeterResourceLoading}
                error={meterError && ServerErrorMessage}
            />
        )
    }

    return (
        <MultipleFilterContextProvider>
            <Head>
                <title>{MeterTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <MeterPageContent
                        meter={meter}
                        possibleReportingPeriods={possibleReportingPeriods}
                        resource={meterResource}
                        refetchMeter={refetch}
                        meterType={METER_TYPES.unit}
                    />
                </PageContent>
            </PageWrapper>
        </MultipleFilterContextProvider>
    )
}

// TODO(DOMA-10641): add accessRequired for page

export default MeterInfoPage
