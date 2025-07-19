import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { Meter, MeterPageTypes, METER_TAB_TYPES, METER_TYPES, PropertyMeter } from '@condo/domains/meter/utils/clientSchema'

type ActionBarForSingleMeterProps = {
    meterId: string
    canManageMeterReadings: boolean
    meterType: MeterPageTypes
    isAutomatic: boolean
    nextVerificationDate: string
    propertyId: string
    unitName?: string
    unitType?: string
    archiveDate?: string
    isDeletedProperty?: boolean
}

const ActionBarForSingleMeter = ({
    meterId,
    canManageMeterReadings,
    meterType,
    archiveDate,
    isAutomatic,
    nextVerificationDate,
    propertyId,
    unitName,
    unitType,
    isDeletedProperty,
}: ActionBarForSingleMeterProps): JSX.Element => {
    const intl = useIntl()
    const DeleteMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.DeleteMeter' })
    const DeleteMeterMessageWarn = intl.formatMessage({ id: 'pages.condo.meter.Meter.DeleteMeter.Warn' })
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const DeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.DeleteMeter.button' })
    const EditMessage = intl.formatMessage({ id: 'Edit' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const router = useRouter()
    const isPropertyMeter =  meterType === METER_TAB_TYPES.propertyMeter
    const isVerificationMissed = dayjs(nextVerificationDate).isBefore(dayjs(), 'day')

    const MeterIdentity = isPropertyMeter ?  PropertyMeter : Meter

    const softDeleteMeter = MeterIdentity.useSoftDelete(async () => {
        router.push(`/meter?tab=meter&type=${isPropertyMeter ? METER_TYPES.property : METER_TYPES.unit}`)
    })

    const isUsableMeter = !archiveDate && !isVerificationMissed && !isDeletedProperty
    const isEditable = !archiveDate && !isDeletedProperty

    const handleUpdateMeterButtonClick = useCallback(() => 
        router.push(`/meter/${isPropertyMeter ? 'property' : 'unit'}/${meterId}/update`),
    [isPropertyMeter, meterId, router])
    
    const handleCreateMeterReadings = useCallback(() => 
        router.push(`/meter/create?tab=${isPropertyMeter ? METER_TAB_TYPES.propertyMeterReading : METER_TAB_TYPES.meterReading}&propertyId=${propertyId}${unitName ? `&unitName=${unitName}` : ''}${unitType ? `&unitType=${unitType}` : ''}`),
    [isPropertyMeter, propertyId, router, unitName, unitType])
    
    const handleDeleteMeterButtonClick = useCallback(async () => {
        await softDeleteMeter({ id: meterId })
    }, [meterId, softDeleteMeter])

    return (
        <ActionBar
            actions={[
                canManageMeterReadings && isUsableMeter && (
                    <Button
                        key='create'
                        type='primary'
                        onClick={handleCreateMeterReadings}
                    >
                        {CreateMeterReadingsButtonLabel}
                    </Button>
                ),
                !isAutomatic && isEditable && <Button
                    key='update'
                    type='secondary'
                    onClick={handleUpdateMeterButtonClick}
                >
                    {EditMessage}
                </Button>,
                <DeleteButtonWithConfirmModal
                    key='deleteCurrentMeter'
                    title={DeleteMeterMessage}
                    message={DeleteMeterMessageWarn}
                    okButtonLabel={DeleteMessage}
                    action={handleDeleteMeterButtonClick}
                    buttonContent={DeleteMessage}
                    cancelMessage={DontDeleteMessage}
                    showCancelButton
                    cancelButtonType='primary'
                />,
            ]}
        />)
}

export default ActionBarForSingleMeter