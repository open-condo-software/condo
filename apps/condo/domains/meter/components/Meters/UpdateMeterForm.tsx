import { Meter as MeterType, PropertyMeter as PropertyMeterType } from '@app/condo/schema'
import { Col, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressAndUnitInfo } from '@condo/domains/meter/components/AddressAndUnitInfo'
import { BaseMetersFormFields } from '@condo/domains/meter/components/Meters/BaseMetersFormFields'
import {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
} from '@condo/domains/meter/constants/errors'
import { PropertyMeter, Meter, MeterPageTypes, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { handleUnitFieldsChange } from '@condo/domains/meter/utils/helpers'
import { Property } from '@condo/domains/property/utils/clientSchema'


type UpdateMeterProps = {
    organizationId: string
    meterType: MeterPageTypes
    canManageMeters: boolean
    initialRecord: MeterType | PropertyMeterType
}

const METER_MODAL_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const WRAPPER_STYLE = { maxWidth: '850px', padding: 0 }
const FORM_GUTTER: [Gutter, Gutter] = [0, 60]

export const UpdateMeterForm = (props: UpdateMeterProps): JSX.Element => {
    const intl = useIntl()
    const CancelMessageButton = intl.formatMessage({ id: 'Cancel' })
    const SaveMessageButton = intl.formatMessage({ id: 'Save' })
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const AccountNumberIsExistInOtherUnitMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumberIsExistInOtherUnit' })

    const { organizationId, meterType, canManageMeters, initialRecord } = props
    const router = useRouter()

    const disabledFields = useMemo(() => !canManageMeters, [canManageMeters])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(get(initialRecord, ['property', 'id']))
    const [selectedUnitName, setSelectedUnitName] = useState<string>(get(initialRecord, 'unitName'))

    const { obj: property, loading: propertyLoading } = Property.useObject({ where: { id: selectedPropertyId } },
        { skip: !selectedPropertyId }
    )

    const isPropertyMeter = meterType === METER_TAB_TYPES.propertyMeter
    const MeterIdentity = isPropertyMeter ? PropertyMeter : Meter

    const updateMeterAction = MeterIdentity.useUpdate({}, async (meter) => {
        await router.push(`/meter/${meterType === METER_TAB_TYPES.propertyMeter ? 'property' : 'unit'}/${meter.id}`)
    })

    const getCommonMeterFields = useCallback((values) => ({
        resource: { connect: { id: values.resource } },
        property: { connect: { id: selectedPropertyId } },
        unitName: isPropertyMeter ? undefined : selectedUnitName,
        unitType: isPropertyMeter ? undefined : values.unitType,
    }), [isPropertyMeter, selectedPropertyId, selectedUnitName])

    
    const handleUpdateMeter = useCallback(values => {
        const allowedValues = omit(values, ['sectionName', 'floorName'])

        updateMeterAction({
            ...allowedValues,
            ...getCommonMeterFields(values),
        }, { id: initialRecord.id })
    },
    [updateMeterAction, getCommonMeterFields, initialRecord])

    const connectedPropertyIitialValues = useMemo(() => !initialRecord ? ({}) : ({
        propertyId: get(initialRecord, 'property.id'),
        unitName: isPropertyMeter ? undefined : get(initialRecord, 'unitName'),
        unitType: isPropertyMeter ? undefined : get(initialRecord, 'unitType'),
    }), [initialRecord, isPropertyMeter])


    const ErrorToFormFieldMsgMapping = {
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: {
            name: 'number',
            errors: [MeterWithSameNumberIsExistMessage],
        },
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: {
            name: 'accountNumber',
            errors: [AccountNumberIsExistInOtherUnitMessage],
        },
    }

    const getHandleSelectPropertyAddress = useCallback((form) => (_, option) => {
        setSelectedPropertyId(String(option.key))
    }, [])

    const handleDeselectPropertyAddress = useCallback(() => {
        setSelectedPropertyId(null)
    }, [])

    const handleCancelEditing = useCallback(() => {
        router.push(`/meter/${meterType === METER_TAB_TYPES.propertyMeter ? 'property' : 'unit'}/${initialRecord.id}`)
    }, [initialRecord, meterType, router])

    const formRef = useRef<FormInstance | null>(null)

    return (
        <PageWrapper style={WRAPPER_STYLE}>
            <FormWithAction
                showCancelButton={false}
                validateTrigger={METER_MODAL_VALIDATE_TRIGGER}
                action={handleUpdateMeter}
                submitButtonProps={{
                    disabled: disabledFields,
                }}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                onValuesChange={handleUnitFieldsChange(formRef)}
            >
                {
                    ({ form, handleSave }) => {
                        formRef.current = form
                        return (
                            <Row gutter={FORM_GUTTER}>
                                <Col span={24}>
                                    <AddressAndUnitInfo
                                        form={form}
                                        getHandleSelectPropertyAddress={getHandleSelectPropertyAddress}
                                        handleDeselectPropertyAddress={handleDeselectPropertyAddress}
                                        isMatchSelectedProperty
                                        meterType={meterType}
                                        organizationId={organizationId}
                                        selectedPropertyId={selectedPropertyId}
                                        property={property}
                                        propertyLoading={propertyLoading}
                                        setSelectedUnitName={setSelectedUnitName}
                                        initialValues={connectedPropertyIitialValues}
                                    />
                                </Col>
                                <Col span={24}>
                                    <Row gutter={FORM_GUTTER}>
                                        <Col span={24}>
                                            <BaseMetersFormFields
                                                form={form}
                                                propertyId={selectedPropertyId}
                                                addressKey={get(property, 'addressKey')}
                                                initialValues={initialRecord || {}}
                                                organizationId={organizationId}
                                                meterType={meterType}
                                                disabledFields={disabledFields}
                                            />
                                        </Col>
                                        <Col span={24}>
                                            <ActionBar
                                                actions={[
                                                    <Button key='save' type='primary' onClick={handleSave}
                                                        disabled={!canManageMeters}>
                                                        {SaveMessageButton}
                                                    </Button>,
                                                    <Button key='cancel' type='secondary' onClick={handleCancelEditing}>
                                                        {CancelMessageButton}
                                                    </Button>,
                                                ]}>
                                            </ActionBar>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        )
                    }
                }
            </FormWithAction>
        </PageWrapper>
    )
}