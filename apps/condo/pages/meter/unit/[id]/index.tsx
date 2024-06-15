import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { MeterPageContent } from '@condo/domains/meter/components/Meters/MeterPageContent'
import { Meter, MeterReportingPeriod, MeterResource, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { getMeterTitleMessage } from '@condo/domains/meter/utils/helpers'


const MeterInfoPage = (): JSX.Element => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    
    const { query: { id: meterId } } = useRouter()
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
                        meterType={METER_TAB_TYPES.meter}
                    />
                </PageContent>
            </PageWrapper>
        </MultipleFilterContextProvider>
    )
}

export default MeterInfoPage