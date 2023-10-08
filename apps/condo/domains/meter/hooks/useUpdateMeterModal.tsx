import { Meter as MeterType } from '@app/condo/schema'
import dayjs from 'dayjs'
import get from 'lodash/get'
import pick from 'lodash/pick'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    DeleteButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { AutoSourceAlert } from '@condo/domains/meter/components/BaseMeterModal/AutoSourceAlert'
import { BaseMeterModalForm } from '@condo/domains/meter/components/BaseMeterModal/BaseMeterModalForm'
import { Meter, PropertyMeter, METER_PAGE_TYPES, MeterPageTypes } from '@condo/domains/meter/utils/clientSchema'


const INITIAL_METER_VALUES_KEYS = [
    'accountNumber', 'number', 'resource', 'place', 'numberOfTariffs', 'installationDate',
    'commissioningDate', 'sealingDate', 'verificationDate', 'nextVerificationDate', 'controlReadingsDate',
]
const INITIAL_PROPERTY_METER_VALUES_KEYS = [
    'number', 'resource', 'numberOfTariffs', 'installationDate',
    'commissioningDate', 'sealingDate', 'verificationDate', 'nextVerificationDate', 'controlReadingsDate',
]

export const useUpdateMeterModal = (refetch, meterType: MeterPageTypes = METER_PAGE_TYPES.meter) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.NumberOfMeter' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.DeleteMeterAndReadings' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' }).toUpperCase()

    const [selectedMeter, setSelectedMeter] = useState()
    const meterNumber = get(selectedMeter, 'number')
    const isAutomatic = get(selectedMeter, 'isAutomatic', false)
    const masterAppName = get(selectedMeter, ['b2bApp', 'name'], DeletedMessage)
    const organizationId = get(selectedMeter, ['organization', 'id'])

    const isPropertyMeter = meterType === METER_PAGE_TYPES.propertyMeter
    const MeterIdentity = !isPropertyMeter ? Meter : PropertyMeter
    const updateMeterAction = MeterIdentity.useUpdate({}, () => {
        setSelectedMeter(null)
        refetch()
    })

    const initialValues = useMemo(() => {
        if (selectedMeter) {
            return pick(selectedMeter, isPropertyMeter ? INITIAL_PROPERTY_METER_VALUES_KEYS : INITIAL_METER_VALUES_KEYS)
        }
    }, [selectedMeter])

    const handleSubmit = useCallback(values => {
        if (values.resource) {
            values.resource = { connect: { id: values.resource } }
        }
        updateMeterAction(values, selectedMeter)
    }, [selectedMeter, updateMeterAction])
    const handleCancelModal = useCallback(() => setSelectedMeter(null), [setSelectedMeter])

    const handleDeleteButtonClick = useCallback(() => updateMeterAction({ deletedAt: dayjs().toISOString() }, selectedMeter),
        [selectedMeter, updateMeterAction])

    const modalFooter = useMemo(() => {
        return isAutomatic
            ? []
            : [
                <DeleteButtonWithConfirmModal
                    key='delete'
                    title={ConfirmDeleteTitle}
                    message={ConfirmDeleteMessage}
                    okButtonLabel={DeleteMessage}
                    action={handleDeleteButtonClick}
                    buttonContent={DeleteMessage}
                    showCancelButton
                />,
            ]

    }, [ConfirmDeleteMessage, ConfirmDeleteTitle, DeleteMessage, handleDeleteButtonClick, isAutomatic])

    const modalTitle = `${MeterNumberMessage} ${meterNumber}`

    const UpdateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
                propertyId={get(selectedMeter, ['property', 'id'])}
                unitName={get(selectedMeter, 'unitName')}
                initialValues={initialValues}
                ModalTitleMsg={modalTitle}
                visible={selectedMeter}
                modalExtraFooter={modalFooter}
                handleSubmit={handleSubmit}
                showCancelButton={false}
                cancelModal={handleCancelModal}
                centered
                meter={selectedMeter}
                disabled={isAutomatic}
                modalNotification={ isAutomatic
                    ? <AutoSourceAlert sourceAppName={masterAppName} />
                    : null
                }
                organizationId={organizationId}
                meterType={meterType}
            />
        )
    }, [
        modalTitle,
        handleCancelModal,
        handleSubmit,
        initialValues,
        modalFooter,
        selectedMeter,
        isAutomatic,
        masterAppName,
        organizationId,
    ])

    return useMemo(() => ({ UpdateMeterModal, setSelectedMeter }), [UpdateMeterModal])
}
