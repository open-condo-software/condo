import { MeterReportingPeriod, MeterResource, PropertyMeter as PropertyMeterType } from '@app/condo/schema'
import { Meter as MeterType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Alert } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Select from '@condo/domains/common/components/antd/Select'
import { PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import { ShowMoreFieldsButton } from '@condo/domains/common/components/ShowMoreFieldsButton'
import { StatusSelect } from '@condo/domains/common/components/StatusSelect'
import B2bAppLogo from '@condo/domains/meter/components/Meters/B2bAppLogo'
import ChangeMeterStatusModal from '@condo/domains/meter/components/Meters/ChangeMeterStatusModal'
import { MeterAccountField, MeterCommonDateField, MeterNumberField, MeterPlaceField, MeterResourceField } from '@condo/domains/meter/components/Meters/MeterInfoFields'
import styles from '@condo/domains/meter/components/Meters/MeterPageContent.module.css'
import { MeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/MeterReading'
import { PropertyMeterReadingsPageContent } from '@condo/domains/meter/components/TabContent/PropertyMeterReading'
import { useMeterReadingFilters } from '@condo/domains/meter/hooks/useMeterReadingFilters'
import { Meter, MeterTypes, METER_TAB_TYPES, METER_TYPES, PropertyMeter } from '@condo/domains/meter/utils/clientSchema'
import { getMeterTitleMessage } from '@condo/domains/meter/utils/helpers'
import { TicketPropertyField } from '@condo/domains/ticket/components/TicketId/TicketPropertyField'


const METER_STATUSES = { active: 'active', archived: 'archived' }


export const MeterHeader = ({ meter, meterReportingPeriod, refetchMeter, meterType }) => {
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

    const archiveDate = get(meter, 'archiveDate')
    const isAutomatic = get(meter, 'isAutomatic')
    const b2bAppId = get(meter, 'b2bApp.id')

    const meterStatus = useMemo(() => archiveDate ? METER_STATUSES.archived : METER_STATUSES.active, [archiveDate])
    const [selectedArchiveDate, setSelectedArchiveDate] = useState(archiveDate || null)
    const [isShowStatusChangeModal, setIsShowStatusChangeModal] = useState(false)

    const ArchivedMeterTipMessage = intl.formatMessage(
        { id: 'pages.condo.meter.archivedMeterTip.Message' },
        {
            notShowing: (
                <Typography.Text type='danger' size='small'>
                    {ArchivedMeterNotShowingMessage}
                </Typography.Text>
            ),
        })

    const isPropertyMeter = meterType === METER_TYPES.property
    const MeterIdentity = isPropertyMeter ? PropertyMeter : Meter

    const updateArchivedDateAction = MeterIdentity.useUpdate({}, ()=> {
        setIsShowStatusChangeModal(false)
        refetchMeter()
    })

    const changeMeterStatusToArchived = useCallback(() => {
        if (meterStatus === METER_STATUSES.active){
            updateArchivedDateAction({ archiveDate: selectedArchiveDate }, { id: meter.id })
        }
    }, [meter, meterStatus, selectedArchiveDate, updateArchivedDateAction])  
    
    const handleChangeStatusButtonClick = useCallback(() => {
        setIsShowStatusChangeModal(true)
    }, []) 

    const handleChangeSelectedArchiveDate = useCallback((date) => {
        setSelectedArchiveDate(dayjs(date).toISOString())
    }, []) 

    const handleCloseStatusChangeModal = useCallback(() => {
        setIsShowStatusChangeModal(false)
    }, []) 

    const options = useMemo(() => ([
        <Select.Option
            key={METER_STATUSES.active}
            value={METER_STATUSES.active}
            title={MeterIsActiveMessage}
            data-cy='meter__status-select-option'
        >
            {MeterIsActiveMessage}
        </Select.Option>,
        <Select.Option
            key={METER_STATUSES.archived}
            value={METER_STATUSES.archived}
            title={MeterIsOutOfOrderMessage}
            data-cy='meter__status-select-option'
        >
            {MeterIsOutOfOrderMessage}
        </Select.Option>,
    ]), [MeterIsActiveMessage, MeterIsOutOfOrderMessage])
    

    const meterStatusTag = useMemo(() => (
        <StatusSelect
            color={colors.white}
            backgroundColor={meterStatus === METER_STATUSES.archived ? colors.brown[5] : colors.green[5]}
            disabled={meterStatus === METER_STATUSES.archived}
            onChange={handleChangeStatusButtonClick}
            value={meterStatus}
            bordered={false}
            labelInValue
        >
            {options}
        </StatusSelect>

    ), [handleChangeStatusButtonClick, meterStatus, options])


    return (
        <>
            <Col span={24}>
                <PageHeader
                    className={styles.pageHeader}
                    title={<Typography.Title level={1}>{MeterTitleMessage}</Typography.Title>}
                    extra={meterStatusTag}
                />
            </Col>
            <Row gutter={[30, 0]}>
                <Col span={20} style={{ padding: 0 }}>
                    {meterReportingPeriod && (
                        <Col span={24}>
                            <Typography.Text type='secondary' size='small'>
                                {MeterReportingPeriodTitle}:&nbsp;
                                <Typography.Text size='small'>
                                    {MeterReportingPeriodText}
                                </Typography.Text>
                            </Typography.Text>
                        </Col>
                    )}
                    {!archiveDate && nextVerificationDate && dayjs(nextVerificationDate).diff(dayjs(), 'month') <= 3 && (
                        <Col span={24}>
                            <Typography.Text type='secondary' size='small'>
                                {VerificationDateTipMessage} &mdash;&nbsp;
                                <Typography.Text type='danger' size='small'>
                                    {dayjs(nextVerificationDate).format('DD.MM.YYYY')}
                                </Typography.Text>
                            </Typography.Text>
                        </Col>
                    )}
                    {meterStatus === METER_STATUSES.archived && !isPropertyMeter && (
                        <Col span={24}>
                            <Typography.Text type='secondary' size='small'>
                                {ArchivedMeterTipMessage}
                            </Typography.Text>
                        </Col>
                    )}
                </Col>
                {isAutomatic && b2bAppId && (
                    <B2bAppLogo b2bAppId={b2bAppId} isAutomatic={isAutomatic}/>
                )}
            </Row>
            
            <ChangeMeterStatusModal 
                changeMeterStatusToArchived={changeMeterStatusToArchived}
                handleChangeSelectedArchiveDate={handleChangeSelectedArchiveDate}
                handleCloseStatusChangeModal={handleCloseStatusChangeModal}
                isShowStatusChangeModal={isShowStatusChangeModal}
                selectedArchiveDate={selectedArchiveDate}
            />
        </>
    )
}


export const MeterContent = ({ meter, resource, meterType }) => {
    const intl = useIntl()
    const MeterVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.VerificationDate' })
    const MeterCreationDateMessage = intl.formatMessage({ id: 'AddedDate' })
    const MeterNextVerificationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.NextVerificationDate' })
    const MeterInstallationDateMessage = intl.formatMessage({ id: 'pages.condo.meter.InstallationDate' })
    const MeterCommissioningDateMessage = intl.formatMessage({ id: 'pages.condo.meter.CommissioningDate' })
    const MeterSealingDateMessage = intl.formatMessage({ id: 'pages.condo.meter.SealingDate' })
    const MeterControlReadingsDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ControlReadingsDate' })
    const MeterArchiveDateMessage = intl.formatMessage({ id: 'pages.condo.meter.ArchiveDate' })

    const [isAdditionalFieldsCollapsed, setIsAdditionalFieldsCollapsed] = useState(true)

    const meterVerificationDate = get(meter, 'verificationDate')
    const meterNextVerificationDate = get(meter, 'nextVerificationDate')
    const meterInstallationDate = get(meter, 'installationDate')
    const meterCommissioningDate = get(meter, 'commissioningDate')
    const meterSealingDate = get(meter, 'sealingDate')
    const meterControlReadingsDate = get(meter, 'controlReadingsDate')
    const meterArchiveDate = get(meter, 'archiveDate')
    const meterCreatedAtDate = get(meter, 'createdAt')

    return (
        <Col span={24}>
            <Row gutter={[0, 24]}>
                <TicketPropertyField ticket={meter}/>
                {meterType === METER_TYPES.unit && (<MeterAccountField meter={meter}/>)}
                <MeterResourceField resource={resource}/>
                <MeterNumberField meter={meter}/>
                <MeterPlaceField meter={meter}/>
                <MeterCommonDateField title={MeterCreationDateMessage} date={meterCreatedAtDate}/>
                <MeterCommonDateField title={MeterVerificationDateMessage} date={meterVerificationDate}/>
                <MeterCommonDateField title={MeterNextVerificationDateMessage} date={meterNextVerificationDate}/>

                {!isAdditionalFieldsCollapsed && (
                    <>
                        <MeterCommonDateField title={MeterInstallationDateMessage} date={meterInstallationDate}/>
                        <MeterCommonDateField title={MeterCommissioningDateMessage} date={meterCommissioningDate}/>
                        <MeterCommonDateField title={MeterSealingDateMessage} date={meterSealingDate}/>
                        <MeterCommonDateField title={MeterControlReadingsDateMessage} date={meterControlReadingsDate}/>
                        <MeterCommonDateField title={MeterArchiveDateMessage} date={meterArchiveDate}/>
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

type MeterPageContentProps = {
    meter: MeterType | PropertyMeterType
    possibleReportingPeriods: Array<MeterReportingPeriod>
    resource: MeterResource
    refetchMeter: () => void
    meterType: MeterTypes
}

export const MeterPageContent = ({ meter, possibleReportingPeriods, resource, refetchMeter, meterType }: MeterPageContentProps): JSX.Element => {
    const intl = useIntl()
    const BlockedEditingTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.alert.BlockedEditing.title' })
    const BlockedEditingDescriptionMessage = intl.formatMessage({ id: 'pages.condo.meter.alert.BlockedEditing.description' })

    const { organization, link: { role },  isLoading } = useOrganization()
    const canManageMeterReadings = useMemo(() => get(role, 'canManageMeterReadings', false), [role])
    const userOrganizationId = useMemo(() => get(organization, 'id'), [organization])
    const filtersMeta = useMeterReadingFilters(meterType)
    
    
    const baseMeterReadingsQuery = useMemo(() => ({
        meter: { deletedAt: null, id: get(meter, 'id') },
        deletedAt: null,
        organization: { id: userOrganizationId },
    }),
    [meter, userOrganizationId])

    const reportingPeriodByProperty = possibleReportingPeriods.find((period: MeterReportingPeriod) => period.property)
    const reportingPeriodByOrg = possibleReportingPeriods.find((period: MeterReportingPeriod) => !period.property)


    const isDeletedProperty = !meter.property
    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <MeterHeader
                    meter={meter}
                    meterReportingPeriod={reportingPeriodByProperty || reportingPeriodByOrg}
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
                {meterType === METER_TYPES.property ? (
                    <PropertyMeterReadingsPageContent 
                        filtersMeta={filtersMeta}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                        isAutomatic={get(meter, 'isAutomatic')}
                        meter={meter}
                        resource={resource}
                    />
                ) : (
                    <MeterReadingsPageContent
                        filtersMeta={filtersMeta}
                        loading={isLoading}
                        canManageMeterReadings={canManageMeterReadings}
                        baseSearchQuery={baseMeterReadingsQuery}
                        isAutomatic={get(meter, 'isAutomatic')}
                        meter={meter}
                        resource={resource}
                    /> 
                )}
            </Col>
        </Row>
    )
}