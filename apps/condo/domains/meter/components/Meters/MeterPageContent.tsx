import { Col, Row, Typography } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Select } from '@open-condo/ui'

import { PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import { ShowMoreFieldsButton } from '@condo/domains/common/components/ShowMoreFieldsButton'
import { MeterAccountField, MeterCommonDateField, MeterNumberField, MeterPlaceField, MeterResourceField } from '@condo/domains/meter/components/Meters/MeterInfoFields'
import { MeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/MeterReading'
import { PropertyMeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeterReading'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { Meter, METER_READINGS_TYPES, METER_TAB_TYPES, PropertyMeter } from '@condo/domains/meter/utils/clientSchema'
import { getMeterTitleMessage } from '@condo/domains/meter/utils/helpers'
import { TicketPropertyField } from '@condo/domains/ticket/components/TicketId/TicketPropertyField'

const METER_INFO_TEXT_STYLE: CSSProperties = { margin: 0, fontSize: '12px' }

const METER_STATUSES = { active: 'active', archived: 'archived' } // TODO(@abshnko): get archivedDate from schema


const MeterHeader = ({ meter, meterReportingPeriod, refetchMeter, meterType }) => {
    const intl = useIntl()
    const MeterReportingPeriodTitle = intl.formatMessage({ id: 'pages.condo.meter.MeterReportingPeriod.Title' })
    const MeterReportingPeriodText = intl.formatMessage({ id: 'pages.condo.meter.MeterReportingPeriod.Text' },
        { startDate: get(meterReportingPeriod, 'notifyStartDay'), endDate:  get(meterReportingPeriod, 'notifyEndDay') },
    )
    const VerificationDateTipMessage = intl.formatMessage({ id: 'pages.condo.meter.nextVerificationTip' })
    const ArchivedMeterNotShowingMessage = intl.formatMessage({ id: 'pages.condo.meter.archivedMeterTip.NotShowing' })
    const MeterIsActiveMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.isActive' })
    const MeterIsOutOfOrderMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.outOfOrder' })    
   
    const MeterTitleMessage = useMemo(() => getMeterTitleMessage(intl, meter), [meter])
    const nextVerificationDate = get(meter, 'nextVerificationDate')

    // const archivedDate = get(meter, 'archivedDate')
    const [meterStatus, setMeterStatus] = useState(METER_STATUSES.active)
    const [isShowStatusChangeModal, setIsShowStatusChangeModal] = useState(false)

    const ArchivedMeterTipMessage = intl.formatMessage(
        { id: 'pages.condo.meter.archivedMeterTip.Message' },
        {
            notShowing: (
                <Typography.Text type='danger'>
                    {ArchivedMeterNotShowingMessage}
                </Typography.Text>
            ),
        })

    const isPropertyMeter = meterType === METER_TAB_TYPES.propertyMeter
    const MeterIdentity = isPropertyMeter ? PropertyMeter : Meter

    // const updateArchivedDateAction = MeterIdentity.useUpdate({ archivedDate: <date>}, {
    //    refetchMeter()
    //}) // TODO(@abshnko): get archivedDate to Meter

    const changeMeterStatus = useCallback(
        () => {
            if (meterStatus === METER_STATUSES.active){
                setMeterStatus(METER_STATUSES.archived) // TODO(@abshnko): remove
                //updateMeterStatusAction()
            } else {
                return 
            }
        }, [meterStatus])    
    

    const meterStatusTag = useMemo(() => (
        <Select
            onChange={changeMeterStatus}
            options={[
                {
                    label: MeterIsActiveMessage,
                    value: METER_STATUSES.active,
                },
                {
                    label: MeterIsOutOfOrderMessage,
                    value: METER_STATUSES.archived,
                },
            ]}

            key='statusTag'
            type={meterStatus === METER_STATUSES.active ? 'success' : 'warning'}
            value={meterStatus} // TODO(@abshnko): add statuses from schema and take from there
            disabled={meterStatus === METER_STATUSES.archived}
        />

    ), [MeterIsActiveMessage, MeterIsOutOfOrderMessage, changeMeterStatus, meterStatus])


    return (
        <>
            <Col span={24}>
                <PageHeader
                    title={<Typography.Title level={1}>{MeterTitleMessage}</Typography.Title>}
                    extra={meterStatusTag} style={{ paddingBottom: 20 }}
                />
            </Col>
            {meterReportingPeriod && (
                <Col span={24}>
                    <Typography.Text type='secondary' style={METER_INFO_TEXT_STYLE}>
                        {MeterReportingPeriodTitle}:&nbsp;
                        <Typography.Text style={METER_INFO_TEXT_STYLE}>
                            {MeterReportingPeriodText}
                        </Typography.Text>
                    </Typography.Text>
                </Col>
            )}
            {dayjs(nextVerificationDate).diff(dayjs(), 'month') <= 3 && (
                <Col span={24}>
                    <Typography.Text type='secondary' style={METER_INFO_TEXT_STYLE}>
                        {VerificationDateTipMessage} &mdash;&nbsp;
                        <Typography.Text type='danger'>
                            {dayjs(nextVerificationDate).format('DD.MM.YYYY')}
                        </Typography.Text>
                    </Typography.Text>
                </Col>
            )}
            {meterStatus === METER_STATUSES.archived && (
                <Col span={24}>
                    <Typography.Text type='secondary' style={METER_INFO_TEXT_STYLE}>
                        {ArchivedMeterTipMessage}
                    </Typography.Text>
                </Col>
            )}
            <Col span={24}>
                <Typography.Text type='secondary' style={METER_INFO_TEXT_STYLE}>
                </Typography.Text>
            </Col>
        </>
    )
}


const MeterContent = ({ meter, resource, meterType }) => {
    const intl = useIntl()
    const MeterVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const MeterNextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })
    const MeterInstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const MeterCommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const MeterSealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const MeterControlReadingsDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })

    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState(true)

    const meterVerificationDate = get(meter, 'verificationDate')
    const meterNextVerificationDate = get(meter, 'nextVerificationDate')
    const meterInstallationDate = get(meter, 'installationDate')
    const meterCommissioningDate = get(meter, 'commissioningDate')
    const meterSealingDate = get(meter, 'sealingDate')
    const meterControlReadingsDate = get(meter, 'controlReadingsDate')

    return (
        <Col span={24}>
            <Row gutter={[0, 16]}>
                <TicketPropertyField ticket={meter}/>
                {meterType === METER_TAB_TYPES.meter && (<MeterAccountField meter={meter}/>)}
                <MeterResourceField resource={resource}/>
                <MeterNumberField meter={meter}/>
                <MeterPlaceField meter={meter}/>
                <MeterCommonDateField title={MeterVerificationDateMessage} date={meterVerificationDate}/>
                <MeterCommonDateField title={MeterNextVerificationDateMessage} date={meterNextVerificationDate}/>

                {!isAdditionalFieldsCollapsed && (
                    <>
                        <MeterCommonDateField title={MeterInstallationDateMessage} date={meterInstallationDate}/>
                        <MeterCommonDateField title={MeterCommissioningDateMessage} date={meterCommissioningDate}/>
                        <MeterCommonDateField title={MeterSealingDateMessage} date={meterSealingDate}/>
                        <MeterCommonDateField title={MeterControlReadingsDateMessage} date={meterControlReadingsDate}/>
                    </>
                )}

                <ShowMoreFieldsButton
                    isAdditionalFieldsCollapsed={isAdditionalFieldsCollapsed}
                    setIsAdditionalFieldsCollapsed={setIsAdditionalFieldsCollapsed}
                />
            </Row>
        </Col>
    )
}

export const MeterPageContent = ({ meter, meterReportingPeriod, resource, refetchMeter, meterType }) => {
    const intl = useIntl()
    const BlockedEditingTitleMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.BlockedEditing.title' })
    const BlockedEditingDescriptionMessage = intl.formatMessage({ id: 'pages.condo.ticket.alert.BlockedEditing.description' })
    const MeterReadingsMessage = intl.formatMessage({ id: 'import.meterReading.plural' })
    

    const { organization, link: { role },  isLoading } = useOrganization()
    const canManageMeterReadings = useMemo(() => get(role, 'canManageMeterReadings', false), [role])
    const userOrganizationId = useMemo(() => get(organization, 'id'), [organization])
    const filtersMeta = useFilters(METER_TAB_TYPES.meterReading)
    const tableColumns = useTableColumns(filtersMeta, METER_TAB_TYPES.meterReading, METER_READINGS_TYPES.meterReadings, true)
    
    const baseMeterReadingsQuery = useMemo(() => ({
        meter: { deletedAt: null, id: get(meter, 'id') },
        deletedAt: null,
        organization: { id: userOrganizationId },
    }),
    [userOrganizationId])


    const isDeletedProperty = !meter.property
    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <MeterHeader
                    meter={meter}
                    meterReportingPeriod={meterReportingPeriod}
                    refetchMeter={refetchMeter}
                    meterType={meterType}
                />
            </Col>
            {
                isDeletedProperty && (
                    <Col span={24}>
                        <Alert
                            type='info'
                            showIcon
                            message={BlockedEditingTitleMessage}
                            description={BlockedEditingDescriptionMessage}
                        />
                    </Col>
                )
            }
            <MeterContent
                meter={meter}
                resource={resource}
                meterType={meterType}
            />
            <Col span={24}>
                <Typography.Title level={3} >{MeterReadingsMessage}</Typography.Title>
                {meterType === METER_TAB_TYPES.propertyMeter ? (
                    <PropertyMeterReadingsPageContent 
                        filtersMeta={filtersMeta}
                        tableColumns={tableColumns}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                        meterId={get(meter, 'id')}
                    />
                ) : (
                    <MeterReadingsPageContent
                        filtersMeta={filtersMeta}
                        tableColumns={tableColumns}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                        meterId={get(meter, 'id')}
                    /> 
                )}
                
            </Col>
        </Row>
    )
}