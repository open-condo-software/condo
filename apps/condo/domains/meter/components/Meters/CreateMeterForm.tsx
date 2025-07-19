import { MeterUnitTypeType } from '@app/condo/schema'
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


type CreateMeterProps = {
    organizationId: string
    meterType: MeterPageTypes
    canManageMeters: boolean
}

const METER_MODAL_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const WRAPPER_STYLE = { maxWidth: '850px', padding: 0 }
const FORM_GUTTER: [Gutter, Gutter] = [0, 60]

export const CreateMeterForm = (props: CreateMeterProps): JSX.Element => {
    const intl = useIntl()
    const AddMeterMessageButton = intl.formatMessage({ id: 'pages.condo.meter.AddMeter.Button' })
    const AddPropertyMeterMessageButton = intl.formatMessage({ id: 'pages.condo.meter.AddPropertyMeter.Button' })
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const AccountNumberIsExistInOtherUnitMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumberIsExistInOtherUnit' })

    const { organizationId, meterType, canManageMeters } = props
    const router = useRouter()
    const propertyIdFromQuery = get(router.query, 'propertyId')
    const unitNameFromQuery = get(router.query, 'unitName')
    const unitTypeFromQuery = get(router.query, 'unitType')

    const disabledFields = useMemo(() => !canManageMeters, [canManageMeters])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyIdFromQuery as string || null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(unitNameFromQuery as string || null)
    const [selectedUnitType, setSelectedUnitType] = useState<MeterUnitTypeType>(unitTypeFromQuery as MeterUnitTypeType || MeterUnitTypeType.Flat)

    const { obj: property, loading: propertyLoading } = Property.useObject({ where: { id: selectedPropertyId } },
        { skip: !selectedPropertyId }
    )

    const isPropertyMeter = meterType === METER_TAB_TYPES.propertyMeter
    const MeterIdentity = isPropertyMeter ? PropertyMeter : Meter
    const createMeterAction = MeterIdentity.useCreate({}, async (meter) => {
        await router.push(`/meter/${meterType === METER_TAB_TYPES.propertyMeter ? 'property' : 'unit'}/${meter.id}`)
    })

    const getCommonMeterFields = useCallback((values) => ({
        resource: { connect: { id: values.resource } },
        property: { connect: { id: selectedPropertyId } },
        unitName: isPropertyMeter ? undefined : selectedUnitName,
        unitType: isPropertyMeter ? undefined : selectedUnitType,
    }), [isPropertyMeter, selectedPropertyId, selectedUnitName, selectedUnitType])

    
    const handleCreateMeter = useCallback(values => {
        const numberOfTariffs = values.numberOfTariffs || 1
        const allowedValues = omit(values, ['sectionName', 'floorName'])

        createMeterAction({
            ...allowedValues,
            numberOfTariffs,
            organization: { connect: { id: organizationId } },
            ...getCommonMeterFields(values),
        })
    },
    [createMeterAction, getCommonMeterFields, organizationId])

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

    const handleDeselectPropertyAddress = useCallback(() =>  {
        setSelectedPropertyId(null)
    }, [])

    const propertyUnitInitialValues = useMemo(()=> !propertyIdFromQuery ? ({}) : ({
        propertyId: propertyIdFromQuery as string,
        unitName: unitNameFromQuery as string,
        unitType: unitTypeFromQuery as string,
    }), [propertyIdFromQuery, unitNameFromQuery, unitTypeFromQuery])
    const formRef = useRef<FormInstance | null>(null)

    return (
        <PageWrapper style={WRAPPER_STYLE}>
            <FormWithAction
                showCancelButton={false}
                validateTrigger={METER_MODAL_VALIDATE_TRIGGER}
                action={handleCreateMeter}
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
                                        setSelectedUnitType={setSelectedUnitType}
                                        initialValues={propertyUnitInitialValues}
                                    />
                                </Col>
                                <Row gutter={FORM_GUTTER}>
                                    <Col span={24}>
                                        <BaseMetersFormFields
                                            form={form}
                                            propertyId={selectedPropertyId}
                                            addressKey={get(property, 'addressKey')}
                                            organizationId={organizationId}
                                            meterType={meterType}
                                            disabledFields={disabledFields}
                                            initialValues={{ unitName: selectedUnitName, unitType: selectedUnitType }}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <ActionBar
                                            actions={[
                                                <Button key='submit' type='primary' onClick={handleSave} >
                                                    {isPropertyMeter ? AddPropertyMeterMessageButton : AddMeterMessageButton}
                                                </Button>,
                                            ]}>
                                        </ActionBar>
                                    </Col>
                                </Row>
                            </Row>
                        )
                    }
                }
            </FormWithAction>
        </PageWrapper>
    )
}