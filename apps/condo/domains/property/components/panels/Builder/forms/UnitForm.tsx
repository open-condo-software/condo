import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Trash } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Input, Select, Space, Typography } from '@open-condo/ui'

import { MapEditMode, MapViewMode } from '@condo/domains/property/components/panels/Builder/MapConstructor'

import { IPropertyMapModalForm, MODAL_FORM_ROW_BUTTONS_GUTTER, MODAL_FORM_ROW_GUTTER } from './BaseUnitForm'
import { RenameNextUnitsCheckbox } from './RenameNextUnitsCheckbox'


const EDIT_UNIT_MODS = [MapEditMode.EditUnit, MapEditMode.EditUnits, MapEditMode.EditParkingUnit, MapEditMode.EditParkingFacilityUnit]
const ADD_UNIT_MODS = [MapEditMode.AddUnit, MapEditMode.AddParkingUnit, MapEditMode.AddParkingFacilityUnit]

const UnitForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh, setDuplicatedUnitIds }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: EDIT_UNIT_MODS.includes(mode) ? 'Save' : 'Add' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.unit.Name' })
    const ParkingNameLabel = intl.formatMessage({ id: 'pages.condo.property.parkingUnit.Name' })
    const SectionLabel = builder.viewMode === MapViewMode.parking ?
        intl.formatMessage({ id: 'pages.condo.property.parkingSection.name' }) :
        intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })
    const UnitErrorLabel = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const defaultUnitType = useMemo(() => {
        switch (mode) {
            case MapEditMode.AddParkingFacilityUnit:
            case MapEditMode.EditParkingFacilityUnit:
                return BuildingUnitSubType.Warehouse
            default:
                return builder.defaultUnitType
        }
    }, [builder.defaultUnitType, mode])
    const availableUnitTypes = useMemo(() => {
        switch (mode) {
            case MapEditMode.AddParkingFacilityUnit:
                return [BuildingUnitSubType.Warehouse, BuildingUnitSubType.Commercial]
            case MapEditMode.AddParkingUnit:
                return [BuildingUnitSubType.Parking]
            default:
                return builder.availableUnitTypes
        }
    }, [builder.availableUnitTypes, mode])

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')
    const [unitType, setUnitType] = useState<BuildingUnitSubType>(defaultUnitType)
    const [sections, setSections] = useState([])
    const [floors, setFloors] = useState([])
    const [isValidationErrorVisible, setIsValidationErrorVisible] = useState(false)

    const renameNextUnits = useRef(false)

    const updateSection = useCallback((value) => {
        setSection(value)
        setFloors(builder.getSectionFloorOptions(value))
        setFloor(null)
    }, [builder])

    useEffect(() => {
        const sections = builder.getSectionOptions()
        setSections(sections)

        if (sections.length === 1 && !section) {
            updateSection(sections[0].id)
        }

        const mapUnit = builder.getSelectedUnits()[0]
        if (mapUnit) {
            setFloors(builder.getSectionFloorOptions(mapUnit.section))
            setLabel(mapUnit.label)
            setSection(mapUnit.section)
            setFloor(mapUnit.floor)
            setUnitType(mapUnit.unitType)
            setIsValidationErrorVisible(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [builder])

    useEffect(() => {
        if (label && floor && section && unitType && ADD_UNIT_MODS.includes(mode)) {
            builder.addPreviewUnit({ id: '', label, floor, section, unitType }, renameNextUnits.current)
            refresh()
        } else {
            builder.removePreviewUnit(renameNextUnits.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [label, floor, section, mode, unitType])

    const resetForm = useCallback(() => {
        setLabel('')
        setFloor('')
        setSection('')
    }, [])

    const isUnitUnique = useMemo(() => {
        let isUnitLabelUnique = true
        const selectedUnit = builder.getSelectedUnits()[0]
        const trimmedLabel = label?.trim()
        if (ADD_UNIT_MODS.includes(mode)) {
            isUnitLabelUnique = builder.validateInputUnitLabel(selectedUnit, trimmedLabel, unitType)
            setDuplicatedUnitIds(builder.duplicatedUnits)
        } else if (EDIT_UNIT_MODS.includes(mode)) {
            if (!selectedUnit) {
                return false
            }
            isUnitLabelUnique = builder.validateInputUnitLabel(selectedUnit, trimmedLabel, unitType)
            setDuplicatedUnitIds(builder.duplicatedUnits)
        }
        const isUniqueCondition = floor && section && trimmedLabel && isUnitLabelUnique
        !isUnitLabelUnique && setIsValidationErrorVisible(true)
        return isUniqueCondition
    }, [builder, mode, floor, section, label, unitType, setDuplicatedUnitIds])

    const applyChanges = useCallback(() => {
        if (isUnitUnique) {
            const mapUnit = builder.getSelectedUnits()[0]
            const trimmedLabel = label?.trim()
            if (mapUnit) {
                builder.updateUnit({ ...mapUnit, label: trimmedLabel, floor, section, unitType }, renameNextUnits.current)
            } else {
                builder.removePreviewUnit(false)
                builder.addUnit({ id: '', label: trimmedLabel, floor, section, unitType }, renameNextUnits.current)
                resetForm()
            }
            refresh()
        }
    }, [builder, refresh, resetForm, label, floor, section, unitType, isUnitUnique])

    const onLabelChange = useCallback((e) => {
        isValidationErrorVisible && setIsValidationErrorVisible(false)
        setLabel(e.target.value)
    }, [isValidationErrorVisible])

    const deleteUnit = useCallback(() => {
        const mapUnit = builder.getSelectedUnits()[0]
        builder.removeUnit(mapUnit.id, renameNextUnits.current)
        refresh()
        resetForm()
    }, [resetForm, refresh, builder])

    const updateUnitType = useCallback((value) => {
        setUnitType(value)
    }, [])

    const unitSubtypeOptions = useMemo(() => {
        if (!Array.isArray(availableUnitTypes)) return []

        return availableUnitTypes
            .map((unitType, unitTypeIndex) => ({
                key: unitTypeIndex,
                value: unitType,
                label: intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` }),
            }))
    }, [availableUnitTypes, intl])

    const sectionOptions = useMemo(() => (
        sections.map((sec) => ({
            key: sec.id,
            value: sec.id,
            label: sec.label,
        }))
    ), [sections])

    const floorOptions = useMemo(() => (
        floors.map(floorOption => {
            return {
                key: floorOption.id,
                value: floorOption.id,
                label: floorOption.label,
            }
        })
    ), [floors])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Row gutter={MODAL_FORM_ROW_GUTTER}>
                    {
                        unitSubtypeOptions.length > 1 && (
                            <Col span={24}>
                                <Space direction='vertical' size={8} width='100%'>
                                    <Typography.Text size='medium' type='secondary'>{UnitTypeLabel}</Typography.Text>
                                    <Select
                                        value={intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                                        onChange={updateUnitType}
                                        options={unitSubtypeOptions}
                                        data-cy='property-map__unit-form__unit-type-select'
                                        id='property-map__unit-form__unit-type-select'
                                    />
                                </Space>
                            </Col>
                        )
                    }
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>{SectionLabel}</Typography.Text>
                            <Select
                                value={section}
                                onChange={updateSection}
                                options={sectionOptions}
                                data-cy='property-map__unit-form__section-select'
                                id='property-map__unit-form__section-select'
                            />
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>{FloorLabel}</Typography.Text>
                            <Select
                                value={floor}
                                onChange={(value) => {
                                    setFloor(String(value))
                                }}
                                options={floorOptions}
                                id='property-map__unit-form__floor-select'
                            />
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space
                            direction='vertical'
                            size={8}
                            width='100%'
                            className={isValidationErrorVisible ? 'unit-name-error' : null}
                        >
                            <Typography.Text size='medium' type='secondary'>
                                {unitType === BuildingUnitSubType.Parking ? ParkingNameLabel : NameLabel}
                            </Typography.Text>
                            <Input
                                allowClear
                                value={label}
                                onChange={onLabelChange}
                                data-cy='property-map__unit-form__label-input'
                            />
                            {isValidationErrorVisible && (
                                <Typography.Text size='medium'>
                                    {UnitErrorLabel}
                                </Typography.Text>
                            )}
                        </Space>
                    </Col>
                    <Col span={24}>
                        <RenameNextUnitsCheckbox
                            renameNextUnitsRef={renameNextUnits}
                            mapViewMode={builder.viewMode}
                        />
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <Row gutter={MODAL_FORM_ROW_BUTTONS_GUTTER}>
                    <Col span={24}>
                        <Button
                            onClick={applyChanges}
                            type='primary'
                            disabled={!(floor && section && label.trim() && !isValidationErrorVisible)}
                            block
                            data-cy='property-map__unit-form__submit-button'
                        >
                            {SaveLabel}
                        </Button>
                    </Col>
                    {
                        EDIT_UNIT_MODS.includes(mode) && (
                            <Col span={24}>
                                <Button
                                    onClick={deleteUnit}
                                    type='secondary'
                                    danger
                                    icon={<Trash />}
                                    disabled={!(floor && section)}
                                    block
                                    data-cy='property-map__unit-form__delete-button'
                                >
                                    {DeleteLabel}
                                </Button>
                            </Col>
                        )
                    }
                </Row>
            </Col>
        </Row>
    )
}

export { UnitForm }
