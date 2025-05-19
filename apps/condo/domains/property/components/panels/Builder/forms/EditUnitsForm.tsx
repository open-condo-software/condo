/** @jsx jsx */
import { BuildingUnitSubType } from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Row, Space, Typography } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'
import { MapEditMode } from '@condo/domains/property/components/panels/Builder/MapConstructor'




import { FormModalCss, INPUT_STYLE, IPropertyMapModalForm, MODAL_FORM_ROW_GUTTER } from './BaseUnitForm'


const { Option } = Select

const EDIT_UNIT_MODS = [MapEditMode.EditUnits, MapEditMode.EditParkingUnits]

const EditUnitsForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh, setDuplicatedUnitIds }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: EDIT_UNIT_MODS.includes(mode) ? 'Save' : 'Add' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')
    const [unitType, setUnitType] = useState<BuildingUnitSubType>()
    const [isValidationErrorVisible, setIsValidationErrorVisible] = useState(false)

    useEffect(() => {
        const mapUnits = builder.getSelectedUnits()
        if (mapUnits.every(unit => unit.unitType === mapUnits[0].unitType)) {
            setUnitType(mapUnits[0].unitType)
        }
    }, [builder])

    const isUnitUnique = useMemo(() => {
        let isUnitLabelUnique = true
        const selectedUnit = builder.getSelectedUnits()

        if (EDIT_UNIT_MODS.includes(mode)) {
            if (!selectedUnit) {
                return false
            }
            isUnitLabelUnique = builder.validateInputUnitLabel(null, label, unitType)
            setDuplicatedUnitIds(builder.duplicatedUnits)
        }

        const isUniqueCondition = floor && section && label.trim() && isUnitLabelUnique
        !isUnitLabelUnique && setIsValidationErrorVisible(true)
        return isUniqueCondition
    }, [builder, mode, floor, section, label, unitType, setDuplicatedUnitIds])

    const applyChanges = useCallback(() => {
        // if (isUnitUnique) {
        const mapUnits = builder.getSelectedUnits()
        if (Array.isArray(mapUnits)) {
            mapUnits.forEach(unit => {
                builder.updateUnit({ ...unit, unitType }, false)
            })

            refresh()
        }
        // }
    }, [builder, refresh, unitType])

    const updateUnitType = useCallback((value) => {
        setUnitType(value)
    }, [])

    const unitSubtypeOptions = useMemo(() => {
        if (!Array.isArray(builder?.availableUnitTypes)) return []

        return builder.availableUnitTypes
            .map((unitType, unitTypeIndex) => (
                <Option
                    key={unitTypeIndex}
                    value={unitType}
                    data-cy='property-map__unit-form__unit-type-select__option'
                >
                    {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                </Option>
            ))
    }, [builder?.availableUnitTypes, intl])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            {
                unitSubtypeOptions.length > 1 && (
                    <Col span={24}>
                        <Space direction='vertical' size={8}>
                            <Typography.Text>{UnitTypeLabel}</Typography.Text>
                            <Select
                                value={intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                                onSelect={updateUnitType}
                                style={INPUT_STYLE}
                                data-cy='property-map__unit-form__unit-type-select'
                            >
                                {unitSubtypeOptions}
                            </Select>
                        </Space>
                    </Col>
                )
            }
            <Col span={24}>
                <Button
                    onClick={applyChanges}
                    type='sberDefaultGradient'
                    // disabled={!(floor && section && label.trim() && !isValidationErrorVisible)}
                    data-cy='property-map__unit-form__submit-button'
                >{SaveLabel}</Button>
            </Col>
        </Row>
    )
}

export { EditUnitsForm }
