import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { MeterPageContent } from '@condo/domains/meter/components/Meters/MeterPageContent'
import { MeterReportingPeriod, MeterResource, METER_TAB_TYPES, PropertyMeter } from '@condo/domains/meter/utils/clientSchema'
import { getMeterTitleMessage } from '@condo/domains/meter/utils/helpers'


const PropertyMeterInfoPage = (): JSX.Element => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    
    const { query: { id: meterId } } = useRouter()
    const {
        obj: propertyMeter,
        error: propertyMeterError,
        loading: isPropertyMeterLoading,
        refetch,
    } = PropertyMeter.useObject({ where: { id: String(meterId) } })

    const propertyId = get(propertyMeter, 'property.id', null)
    const resourceId = get(propertyMeter, 'resource.id', null)
    const organizationId = get(propertyMeter, 'organization.id', null)

    const MeterTitleMessage = useMemo(() => getMeterTitleMessage(intl, propertyMeter), [propertyMeter])


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
    


    if (!propertyMeter || isPropertyMeterLoading || isPeriodsLoading || isMeterResourceLoading) {
        return (
            <LoadingOrErrorPage
                loading={isPropertyMeterLoading || isPeriodsLoading || isMeterResourceLoading}
                error={propertyMeterError && ServerErrorMessage}
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
                        meter={propertyMeter}
                        possibleReportingPeriods={possibleReportingPeriods}
                        resource={meterResource}
                        refetchMeter={refetch}
                        meterType={METER_TAB_TYPES.propertyMeter}
                    />
                </PageContent>
            </PageWrapper>
        </MultipleFilterContextProvider>
    )
}

export default PropertyMeterInfoPage