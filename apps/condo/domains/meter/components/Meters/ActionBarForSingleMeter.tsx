import { useRouter } from 'next/router'
import { useCallback } from 'react'

import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { Meter, MeterPageTypes, METER_TAB_TYPES, PropertyMeter } from '@condo/domains/meter/utils/clientSchema'

type ACTION_BAR_FOR_SINGLE_METER_PROPS = {
    meterId: string
    canManageMeterReadings: boolean
    meterType: MeterPageTypes
}

const ActionBarForSingleMeter = ({
    meterId,
    canManageMeterReadings,
    meterType,
}: ACTION_BAR_FOR_SINGLE_METER_PROPS): JSX.Element => {
    const intl = useIntl()
    const DeleteMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.DeleteMeter' })
    const DeleteMeterMessageWarn = intl.formatMessage({ id: 'pages.condo.meter.Meter.DeleteMeter.Warn' })
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const EditMessage = intl.formatMessage({ id: 'Edit' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const router = useRouter()
    const isPropertyMeter =  meterType === METER_TAB_TYPES.propertyMeter

    const MeterIdentity = isPropertyMeter ?  PropertyMeter : Meter

    const softDeleteMeter = MeterIdentity.useSoftDelete(async () => {
        router.push('/meter?tab=meter')
    })

    const handleUpdateMeterButtonClick = useCallback(() => 
        router.push(`/meter/${isPropertyMeter ? 'propertyDevice' : 'device'}/${meterId}/update`),
    [isPropertyMeter, meterId, router])
    
    const handleCreateMeterReadings = useCallback(() => 
        router.push(`/meter/create?tab=${isPropertyMeter ? METER_TAB_TYPES.propertyMeterReading : METER_TAB_TYPES.meterReading}`),
    [isPropertyMeter, router])
    
    const handleDeleteMeterButtonClick = useCallback(async () => {
        await softDeleteMeter({ id: meterId })
    }, [meterId, softDeleteMeter])

    return (
        <ActionBar
            actions={[
                canManageMeterReadings && (
                    <Button
                        key='create'
                        type='primary'
                        icon={<PlusCircle size='medium' />}
                        onClick={handleCreateMeterReadings}
                    >
                        {CreateMeterReadingsButtonLabel}
                    </Button>
                ),
                <Button
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