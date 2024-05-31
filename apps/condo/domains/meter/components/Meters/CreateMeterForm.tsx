import { Col, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { AddressAndUnitInfo } from '@condo/domains/meter/components/AddressAndUnitInfo'
import {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
} from '@condo/domains/meter/constants/errors'
import { PropertyMeter, Meter, MeterPageTypes, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'

import { BaseMetersForm } from './BaseMetersForm'


type CreateMeterProps = {
    organizationId: string
    meterType: MeterPageTypes
    canManageMeters: boolean
}

const METER_MODAL_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']
const WRAPPER_STYLE = { maxWidth: '850px', padding: 0 }
const FORM_GUUTER: [Gutter, Gutter] = [0, 60]

export const CreateMeterForm = (props: CreateMeterProps): JSX.Element => {
    const intl = useIntl()
    const AddMeterMessageButton = intl.formatMessage({ id: 'pages.condo.meter.AddMeter.Button' })
    const AddPropertyMeterMessageButton = intl.formatMessage({ id: 'pages.condo.meter.AddPropertyMeter.Button' })
    const MeterWithSameNumberIsExistMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterWithSameNumberIsExist' })
    const AccountNumberIsExistInOtherUnitMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumberIsExistInOtherUnit' })

    const { organizationId, meterType, canManageMeters } = props
    const router = useRouter()

    const disabledFields = useMemo(() => !canManageMeters, [canManageMeters])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>(null)
    const [selectedUnitName, setSelectedUnitName] = useState<string>(null)
    const [isMatchSelectedProperty, setIsMatchSelectedProperty] = useState(true)

    const { obj: property, loading: propertyLoading } = Property.useObject({ where: { id: selectedPropertyId } })

    const isPropertyMeter = meterType === METER_TAB_TYPES.propertyMeter
    const MeterIdentity = isPropertyMeter ? PropertyMeter : Meter
    const createMeterAction = MeterIdentity.useCreate({}, async (meter) => {
        await router.push(`/meter/device/${meter.id}`)
    })

    const handleMeterCreate = useCallback(values => {
        const numberOfTariffs = values.numberOfTariffs || 1
        
        createMeterAction({
            ...values,
            resource: { connect: { id: values.resource } },
            numberOfTariffs,
            organization: { connect: { id: organizationId } },
            property: { connect: { id: selectedPropertyId } },
            unitName: isPropertyMeter ? undefined : selectedUnitName,
            unitType: isPropertyMeter ? undefined : values.unitType,
        })
        //TODO: notification about saving meter and reset form
    },
    [createMeterAction, organizationId, selectedPropertyId, isPropertyMeter, selectedUnitName])

    // const initialValues = useMemo(() => ({
    //     propertyId,
    //     unitName: isPropertyMeter ? undefined : unitName,
    //     unitType: isPropertyMeter ? undefined : unitType,
    // }), [propertyId, unitName, unitType, isPropertyMeter])
    // TODO: refactor to use this form for update - take initial values from the updated meter

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


    return (
        <PageWrapper style={WRAPPER_STYLE}>
            <FormWithAction>
                {
                    ({ form }) => (
                        <AddressAndUnitInfo 
                            form={form}
                            getHandleSelectPropertyAddress={getHandleSelectPropertyAddress}
                            handleDeselectPropertyAddress={handleDeselectPropertyAddress}
                            isMatchSelectedProperty={isMatchSelectedProperty}
                            meterType={meterType}
                            organizationId={organizationId}
                            selectedPropertyId={selectedPropertyId}
                            property={property}
                            propertyLoading={propertyLoading}
                            setSelectedUnitName={setSelectedUnitName}
                        />
                    )
                }
            </FormWithAction>
            <FormWithAction
                showCancelButton={false}
                validateTrigger={METER_MODAL_VALIDATE_TRIGGER}
                action={handleMeterCreate}
                submitButtonProps={{
                    disabled: disabledFields,
                }}
                ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            >
                {
                    ({ form, handleSave }) => (
                        <Row gutter={FORM_GUUTER}>
                            <Col span={24}>
                                <BaseMetersForm
                                    form={form}
                                    propertyId={selectedPropertyId}
                                    addressKey={get(property, 'addressKey')}
                                    unitName={null}
                                    initialValues={{}}
                                    handleSubmit={handleMeterCreate}
                                    organizationId={organizationId}
                                    meterType={meterType}
                                    disabledFields={disabledFields}
                                />
                            </Col>
                            <Col span={24}>
                                <Button key='submit' type='primary' onClick={handleSave} >
                                    {isPropertyMeter ? AddPropertyMeterMessageButton : AddMeterMessageButton}
                                </Button>
                            </Col>
                        </Row>
                    )
                }
            </FormWithAction>
        </PageWrapper>
    )
}