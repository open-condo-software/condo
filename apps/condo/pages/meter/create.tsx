import { Row, Col } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Tour, Typography } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import {
    CreateMeterReadingsForm,
    CreatePropertyMeterReadingsForm,
} from '@condo/domains/meter/components/CreateMeterReadingsForm'
import { CreateMeterForm } from '@condo/domains/meter/components/Meters/CreateMeterForm'
import {
    MeterReadAndManagePermissionRequired,
} from '@condo/domains/meter/components/PageAccess'
import { METER_TAB_TYPES, MeterPageTypes } from '@condo/domains/meter/utils/clientSchema'


const CREATE_METER_PAGE_GUTTER: [Gutter, Gutter] = [12, 40]

const CreateMeterPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleAddMeterReadings = intl.formatMessage({ id: 'meter.AddMeterReadings' })
    const PageTitleAddPropertyMeterReadings = intl.formatMessage({ id: 'meter.AddPropertyMeterReadings' })
    const PageTitleAddMeters = intl.formatMessage({ id: 'meter.AddMeters' })
    const PageTitleAddPropertyMeters = intl.formatMessage({ id: 'meter.AddPropertyMeters' })

    const router = useRouter()
    const { tab } = parseQuery(router.query)
    const { link: { role = {} }, organization } = useOrganization()
    const canManageMeters = get(role, 'canManageMeters', false)
    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

    const changeRouteToDefaultTab = useCallback(async () => {
        await updateQuery(router, {
            newParameters: {
                tab: METER_TAB_TYPES.meter,
            },
        }, { routerAction: 'replace', resetOldParameters: true, shallow: true })
    }, [router])

    useEffect(() => {        
        if (!Object.values(METER_TAB_TYPES).includes(tab as MeterPageTypes)) changeRouteToDefaultTab()
    }, [changeRouteToDefaultTab, tab])

    const getPageTitle = useMemo(() => {
        if (tab === METER_TAB_TYPES.meterReading) return PageTitleAddMeterReadings
        if (tab === METER_TAB_TYPES.propertyMeterReading) return PageTitleAddPropertyMeterReadings
        if (tab === METER_TAB_TYPES.meter) return PageTitleAddMeters

        return PageTitleAddPropertyMeters
    }, [PageTitleAddMeterReadings, PageTitleAddMeters, PageTitleAddPropertyMeterReadings, PageTitleAddPropertyMeters, tab])


    return (
        <>
            <Head>
                <title>{getPageTitle}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={CREATE_METER_PAGE_GUTTER}>
                        <Col span={24}>
                            <Typography.Title level={1}>{getPageTitle}</Typography.Title>
                        </Col>
                        <Col span={24}>
                            {
                                tab === METER_TAB_TYPES.propertyMeterReading ? (
                                    <CreatePropertyMeterReadingsForm
                                        organization={organization}
                                        canManageMeterReadings={canManageMeterReadings}
                                    />
                                ) : tab === METER_TAB_TYPES.meterReading ? (
                                    <Tour.Provider>
                                        <CreateMeterReadingsForm
                                            organization={organization}
                                            canManageMeterReadings={canManageMeterReadings}
                                        />
                                    </Tour.Provider>
                                ) : tab === METER_TAB_TYPES.meter ? (
                                    <Tour.Provider>
                                        <CreateMeterForm
                                            organizationId={get(organization, 'id')}
                                            meterType={METER_TAB_TYPES.meter}
                                            canManageMeters={canManageMeters}
                                        />
                                    </Tour.Provider>
                                ) : (
                                    <Tour.Provider>
                                        <CreateMeterForm
                                            organizationId={get(organization, 'id')}
                                            meterType={METER_TAB_TYPES.propertyMeter}
                                            canManageMeters={canManageMeters}
                                        />
                                    </Tour.Provider>
                                )
                            }
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

CreateMeterPage.requiredAccess = MeterReadAndManagePermissionRequired

export default CreateMeterPage
