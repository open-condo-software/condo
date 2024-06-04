import { Property as PropertyType } from '@app/condo/schema'
import { Col, ColProps, Form, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import { DefaultOptionType } from 'antd/lib/select'
import React, { Dispatch, SetStateAction } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tooltip, Typography } from '@open-condo/ui'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MeterPageTypes, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { PropertyFormItemTooltip } from '@condo/domains/property/PropertyFormItemTooltip'


const FORM_ROW_MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 20]
const FORM_ITEM_WRAPPER_COLUMN_STYLE: ColProps = { style: { width: '100%', padding: 0 } }

type PROPERTY_UNIT_INITIAL_VALUES = {
    propertyId?: string
    unitName?: string
    unitType?: string
}

type ADDRESS_AND_UNIT_INFO_PROPS = {
    form: FormInstance,
    organizationId: string,
    meterType: MeterPageTypes,
    getHandleSelectPropertyAddress: (form: FormInstance) => (_: any, option: DefaultOptionType) => void,
    handleDeselectPropertyAddress: () => void
    selectedPropertyId: string,
    isMatchSelectedProperty: boolean
    isNoMeterForAddress?: boolean,
    notFoundMetersForAddressTooltip?: JSX.Element,
    isNoMeterForUnitName?: boolean
    property?: PropertyType,
    propertyLoading?: boolean
    setSelectedUnitName?: Dispatch<SetStateAction<string>>,
    setSelectedUnitType?: Dispatch<SetStateAction<string>>,
    initialValues?: PROPERTY_UNIT_INITIAL_VALUES
}


export const AddressAndUnitInfo = (props: ADDRESS_AND_UNIT_INFO_PROPS): JSX.Element => {
    const intl = useIntl()
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const ClientInfoMessage = intl.formatMessage({ id: 'ClientInfo' })

    const {
        getHandleSelectPropertyAddress,
        handleDeselectPropertyAddress,
        selectedPropertyId, isMatchSelectedProperty,
        organizationId,
        isNoMeterForAddress,
        notFoundMetersForAddressTooltip,
        isNoMeterForUnitName,
        meterType,
        property,
        propertyLoading,
        setSelectedUnitName,
        setSelectedUnitType,
        form,
        initialValues,
    } = props

    const { requiredValidator } = useValidations()
    const { addressValidator } = usePropertyValidations()
    const validations = {
        property: [requiredValidator, addressValidator(selectedPropertyId, isMatchSelectedProperty)],
    }

    return (
       
        <Row justify='space-between' gutter={FORM_ROW_MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                {meterType !== METER_TAB_TYPES.propertyMeter && (
                    <Typography.Title level={3}>
                        {ClientInfoMessage}
                    </Typography.Title>
                )}
            </Col>
            <Col span={24}>
                {notFoundMetersForAddressTooltip ? <Tooltip
                    className='no-content-found-tooltip'
                    open={isNoMeterForAddress}
                    title={notFoundMetersForAddressTooltip}
                    placement='bottomLeft'
                >
                    <Form.Item
                        name='property'
                        label={AddressLabel}
                        rules={validations.property}
                        wrapperCol={FORM_ITEM_WRAPPER_COLUMN_STYLE}
                        shouldUpdate
                        tooltip={<PropertyFormItemTooltip />}
                        initialValue={initialValues && initialValues.propertyId}
                    >
                        <PropertyAddressSearchInput
                            organizationId={organizationId}
                            autoFocus={true}
                            onSelect={getHandleSelectPropertyAddress(form)}
                            placeholder={AddressPlaceholder}
                            onClear={handleDeselectPropertyAddress}
                        />
                    </Form.Item>
                </Tooltip> : 
                    <Form.Item
                        name='property'
                        label={AddressLabel}
                        rules={validations.property}
                        wrapperCol={FORM_ITEM_WRAPPER_COLUMN_STYLE}
                        shouldUpdate
                        tooltip={<PropertyFormItemTooltip />}
                        initialValue={initialValues && initialValues.propertyId}
                    >
                        <PropertyAddressSearchInput
                            organizationId={organizationId}
                            autoFocus={true}
                            onSelect={getHandleSelectPropertyAddress(form)}
                            placeholder={AddressPlaceholder}
                            onClear={handleDeselectPropertyAddress}
                        />
                    </Form.Item>}
            </Col>
            {
                (selectedPropertyId || initialValues) && meterType === METER_TAB_TYPES.meter && (property || initialValues) && (
                    <Col span={24}>
                        {notFoundMetersForAddressTooltip ? <Tooltip
                            className='no-content-found-tooltip'
                            open={isNoMeterForUnitName}
                            title={notFoundMetersForAddressTooltip}
                            placement='bottomLeft'
                        >
                            <UnitInfo
                                property={property}
                                loading={propertyLoading}
                                setSelectedUnitName={setSelectedUnitName}
                                setSelectedUnitType={setSelectedUnitType}
                                form={form}
                                required
                            />
                        </Tooltip> :
                            <UnitInfo
                                property={property}
                                loading={propertyLoading}
                                setSelectedUnitName={setSelectedUnitName}
                                setSelectedUnitType={setSelectedUnitType}
                                form={form}
                                required
                                initialValues={{ unitName: initialValues?.unitName, unitType: initialValues?.unitType }}
                            />
                        }
                    </Col>
                )
            }
        </Row>
    )
}