import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Select, Space, Typography } from '@open-condo/ui'

import { MapEditMode, MapViewMode } from '@condo/domains/property/components/panels/Builder/MapConstructor'

import { IPropertyMapModalForm, MODAL_FORM_ROW_GUTTER } from './BaseUnitForm'


const EDIT_UNIT_MODS = [MapEditMode.EditUnits, MapEditMode.EditParkingUnits]

const EditUnitsForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh, setDuplicatedUnitIds }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const selectedUnitsCount = Array.isArray(builder.getSelectedUnits()) && builder.getSelectedUnits().length
    const SaveLabel = intl.formatMessage({ id: EDIT_UNIT_MODS.includes(mode) ? 'Save' : 'Add' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })
    const SelectUnitsMessage = builder.viewMode === MapViewMode.parking ?
        intl.formatMessage({ id: 'pages.condo.property.modal.SelectParkingUnitsLabel' }, {
            count: selectedUnitsCount,
        }) :
        intl.formatMessage({ id: 'pages.condo.property.modal.SelectUnitsLabel' }, {
            count: selectedUnitsCount,
        })

    const [unitType, setUnitType] = useState<BuildingUnitSubType>()

    useEffect(() => {
        const mapUnits = builder.getSelectedUnits()
        if (mapUnits.every(unit => unit.unitType === mapUnits[0].unitType)) {
            setUnitType(mapUnits[0].unitType)
        } else {
            setUnitType(null)
        }
    }, [builder])

    const applyChanges = useCallback(() => {
        const mapUnits = builder.getSelectedUnits()
        if (Array.isArray(mapUnits)) {
            mapUnits.forEach(unit => {
                builder.updateUnit({ ...unit, unitType }, false)
            })

            refresh()
        }
    }, [builder, refresh, unitType])

    const updateUnitType = useCallback((value) => {
        setUnitType(value)
    }, [])

    const unitSubtypeOptions = useMemo(() => {
        if (!Array.isArray(builder?.availableUnitTypes)) return []

        return builder.availableUnitTypes
            .map((unitType, unitTypeIndex) => ({
                key: unitTypeIndex,
                value: unitType,
                label: intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` }),
            }))
    }, [builder?.availableUnitTypes, intl])

    const unitTypeLabel = unitType && intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Row gutter={MODAL_FORM_ROW_GUTTER}>
                    <Col span={24}>
                        <Typography.Text>{SelectUnitsMessage}</Typography.Text>
                    </Col>
                    {
                        unitSubtypeOptions.length > 1 && (
                            <Col span={24}>
                                <Space direction='vertical' size={8} width='100%'>
                                    <Typography.Text size='medium' type='secondary'>{UnitTypeLabel}</Typography.Text>
                                    <Select
                                        value={unitTypeLabel}
                                        onChange={updateUnitType}
                                        options={unitSubtypeOptions}
                                        data-cy='property-map__units-form__unit-type-select'
                                        id='property-map__units-form__unit-type-select'
                                    />
                                </Space>
                            </Col>
                        )
                    }
                </Row>
            </Col>
            <Col span={24}>
                <Button
                    onClick={applyChanges}
                    type='primary'
                    block
                    disabled={!unitType}
                    data-cy='property-map__unit-form__submit-button'
                >
                    {SaveLabel}
                </Button>
            </Col>
        </Row>
    )
}

export { EditUnitsForm }
