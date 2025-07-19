import { Property as PropertyType } from '@app/condo/schema'
import { Col, ColProps, Form, FormInstance, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import { DefaultOptionType } from 'antd/lib/select'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pick from 'lodash/pick'
import React, { Dispatch, SetStateAction, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { MeterPageTypes, METER_TAB_TYPES } from '@condo/domains/meter/utils/clientSchema'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitInfo } from '@condo/domains/property/components/UnitInfo'
import { PropertyFormItemTooltip } from '@condo/domains/property/PropertyFormItemTooltip'


const FORM_ROW_MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 20]
const FORM_ROW_SMALL_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 4]
const FORM_ITEM_WRAPPER_COLUMN_STYLE: ColProps = { style: { width: '100%', padding: 0 } }

type PropertyUnitInitialValues = {
    propertyId?: string
    unitName?: string
    unitType?: string
}

type AddressAndUnitInfoProps = {
    form?: FormInstance
    organizationId: string
    meterType: MeterPageTypes
    getHandleSelectPropertyAddress: (form: FormInstance) => (_: unknown, option: DefaultOptionType) => void
    handleDeselectPropertyAddress: () => void
    selectedPropertyId: string
    isMatchSelectedProperty: boolean
    isNoMeterForAddress?: boolean
    notFoundMetersForAddressTooltip?: JSX.Element
    isNoMeterForUnitName?: boolean
    property?: PropertyType
    propertyLoading?: boolean
    setSelectedUnitName?: Dispatch<SetStateAction<string>>
    setSelectedUnitType?: Dispatch<SetStateAction<string>>
    initialValues?: PropertyUnitInitialValues
}


export const AddressAndUnitInfo = (props: AddressAndUnitInfoProps): JSX.Element => {
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
    const unitInfoInitialValues = useMemo(() => {
        if (selectedPropertyId === initialValues?.propertyId) {
            return pick(initialValues, ['unitName', 'unitType'])
        }
        return {}
    }, [initialValues, selectedPropertyId])

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
                <Row gutter={FORM_ROW_SMALL_VERTICAL_GUTTER}>
                    <Col span={24}>
                        <Form.Item
                            name='property'
                            label={AddressLabel}
                            rules={validations.property}
                            wrapperCol={FORM_ITEM_WRAPPER_COLUMN_STYLE}
                            shouldUpdate
                            tooltip={<PropertyFormItemTooltip />}
                            initialValue={!isEmpty(initialValues) && get(initialValues, 'propertyId')}
                        >
                            <PropertyAddressSearchInput
                                organizationId={organizationId}
                                autoFocus={true}
                                onSelect={getHandleSelectPropertyAddress(form)}
                                placeholder={AddressPlaceholder}
                                onClear={handleDeselectPropertyAddress}
                            />
                        </Form.Item>
                    </Col>
                    {notFoundMetersForAddressTooltip && isNoMeterForAddress && (
                        <Col span={24}>
                            <Typography.Text size='small' type='secondary'>{notFoundMetersForAddressTooltip}</Typography.Text>
                        </Col>
                    )}
                </Row>
            </Col>
           
            {!isNoMeterForAddress && (
                selectedPropertyId || !isEmpty(initialValues)) && meterType === METER_TAB_TYPES.meter && (property || !isEmpty(initialValues)) && (
                <Col span={24}>
                    <Row gutter={FORM_ROW_SMALL_VERTICAL_GUTTER}>
                        <Col span={24}>
                            <UnitInfo
                                property={property}
                                loading={propertyLoading}
                                setSelectedUnitName={setSelectedUnitName}
                                setSelectedUnitType={setSelectedUnitType}
                                form={form}
                                required
                                initialValues={unitInfoInitialValues}
                            />
                        </Col>
                        {notFoundMetersForAddressTooltip && isNoMeterForUnitName && (
                            <Col span={24}>
                                <Typography.Text size='small' type='secondary'>{notFoundMetersForAddressTooltip}</Typography.Text>
                            </Col>
                        )}
                    </Row>
                </Col>)
            }
        </Row>
    )
}