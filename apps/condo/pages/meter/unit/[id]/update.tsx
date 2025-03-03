import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageComponentType } from '@condo/domains/common/types'
import { UpdateMeterForm } from '@condo/domains/meter/components/Meters/UpdateMeterForm'
import { Meter, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'


const UpdateMeterPage: PageComponentType = () => {
    const intl = useIntl()
    const UpdateMeterPageTitle = intl.formatMessage({ id: 'pages.condo.meter.meterId.update.PageTitle' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const { query: { id: meterId } } = useRouter()
    const { link: { role = {} }, organization } = useOrganization()
    const canManageMeters = get(role, 'canManageMeters', false)
    const organizationId = get(organization, 'id')

    const {
        obj: meter,
        error: meterError,
        loading: isMeterLoading,
    } = Meter.useObject({ where: { id: String(meterId) } })


    if (!meter || isMeterLoading) {
        return (
            <LoadingOrErrorPage
                loading={isMeterLoading}
                error={meterError && ServerErrorMessage}
            />
        )
    }
    
    return (
        <>
            <Head>
                <title>{UpdateMeterPageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{UpdateMeterPageTitle}</Typography.Title>}/>
                <PageContent>
                    <UpdateMeterForm
                        canManageMeters={canManageMeters}
                        meterType={METER_TAB_TYPES.meter}
                        organizationId={organizationId}
                        initialRecord={meter}
                    />
                </PageContent>
            </PageWrapper>
        </>
    )
}

// TODO(DOMA-10641): add accessRequired for page

export default UpdateMeterPage
