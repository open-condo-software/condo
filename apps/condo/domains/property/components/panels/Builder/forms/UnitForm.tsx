/** @jsx jsx */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useIntl } from '@condo/next/intl'
import { BuildingUnitSubType } from '@app/condo/schema'
import { Row, Col, Space, Typography } from 'antd'
import Select from '@condo/domains/common/components/antd/Select'
import Input from '@condo/domains/common/components/antd/Input'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { Button } from '@condo/domains/common/components/Button'
import { DeleteFilled } from '@ant-design/icons'
import { jsx } from '@emotion/react'
import {
    IPropertyMapModalForm,
    MODAL_FORM_ROW_GUTTER,
    MODAL_FORM_ROW_BUTTONS_GUTTER,
    MODAL_FORM_CHECKBOX_STYLE,
    INPUT_STYLE,
    ERROR_TEXT_STYLE,
    BUTTON_SPACE_SIZE,
    FormModalCss,
} from './BaseUnitForm'
import { MapEditMode } from '@condo/domains/property/components/panels/Builder/MapConstructor'

const { Option } = Select

const UnitForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: mode === MapEditMode.EditUnit ? 'Save' : 'Add' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.unit.Name' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })
    const RenameNextUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextUnits' })
    const UnitErrorLabel = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')
    const [unitType, setUnitType] = useState<BuildingUnitSubType>(BuildingUnitSubType.Flat)

    const [sections, setSections] = useState([])
    const [floors, setFloors] = useState([])
    const [isValidationErrorVisible, setIsValidationErrorVisible] = useState(false)

    const renameNextUnits = useRef(true)

    const updateSection = useCallback((value) => {
        setSection(value)
        setFloors(builder.getSectionFloorOptions(value))
        if (mode === MapEditMode.EditUnit) {
            const mapUnit = builder.getSelectedUnit()
            if (value === mapUnit.section) {
                setFloor(mapUnit.floor)
            } else {
                setFloor(null)
            }
        } else {
            setFloor(null)
        }
    }, [builder, mode])

    useEffect(() => {
        setSections(builder.getSectionOptions())
        const mapUnit = builder.getSelectedUnit()
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
        if (label && floor && section && unitType && mode === MapEditMode.AddUnit) {
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

    const toggleRenameNextUnits = useCallback((event) => { renameNextUnits.current = event.target.checked }, [])

    const isUnitUnique = useMemo(() => {
        let isUnitLabelUnique = true
        if (mode === MapEditMode.AddUnit) {
            isUnitLabelUnique = builder.validateUniqueUnitLabel()
        } else if (mode === MapEditMode.EditUnit) {
            const selectedUnit = builder.getSelectedUnit()
            if (!selectedUnit) {
                return false
            }

            const unitPlacementChanged = selectedUnit.floor !== floor
                || selectedUnit.section !== section
                || unitType !== selectedUnit.unitType
            const labelChanged = selectedUnit.label !== label
            const labelValidation = labelChanged
                ? builder.validateUniqueUnitLabel(label, 'section')
                : false

            isUnitLabelUnique = unitPlacementChanged
                ? (!labelChanged || labelValidation)
                : labelValidation
        }

        return floor && section && label.trim() && isUnitLabelUnique
    }, [floor, section, label, unitType, builder, mode])

    const applyChanges = useCallback(() => {
        const mapUnit = builder.getSelectedUnit()
        if (mapUnit) {
            builder.updateUnit({ ...mapUnit, label, floor, section, unitType }, renameNextUnits.current)
        } else {
            builder.removePreviewUnit()
            builder.addUnit({ id: '', label, floor, section, unitType }, renameNextUnits.current)
            resetForm()
        }
        refresh()
    }, [builder, refresh, resetForm, label, floor, section, unitType])

    const onLabelChange = useCallback((e) => {
        isValidationErrorVisible && setIsValidationErrorVisible(false)
        setLabel(e.target.value)
    }, [isValidationErrorVisible])

    const deleteUnit = useCallback(() => {
        const mapUnit = builder.getSelectedUnit()
        builder.removeUnit(mapUnit.id, renameNextUnits.current)
        refresh()
        resetForm()
    }, [resetForm, refresh, builder])

    const updateUnitType = useCallback((value) => {
        setUnitType(value)
    }, [])

    const unitSubtypeOptions = useMemo(() => (
        Object.values(BuildingUnitSubType)
            .filter(unitType => unitType !== BuildingUnitSubType.Parking)
            .map((unitType, unitTypeIndex) => (
                <Option
                    key={unitTypeIndex}
                    value={unitType}
                    data-cy='property-map__unit-form__unit-type-select__option'
                >
                    {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                </Option>
            ))
    ), [BuildingUnitSubType])

    const sectionOptions = useMemo(() => (
        sections.map((sec) => {
            return <Option
                key={sec.id}
                value={sec.id}
                data-cy='property-map__unit-form__section-select__option'
            >
                {sec.label}
            </Option>
        })
    ), [sections])

    const floorOptions = useMemo(() => (
        floors.map(floorOption => {
            return <Option
                key={floorOption.id}
                value={floorOption.id}
                data-cy='property-map__unit-form__floor-select__option'
            >
                {floorOption.label}
            </Option>
        })
    ), [floors])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
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
            <Col span={24}>
                <Space direction='vertical' size={8}>
                    <Typography.Text type='secondary'>{NameLabel}</Typography.Text>
                    <Input
                        allowClear
                        status={isValidationErrorVisible ? 'error' : ''}
                        value={label}
                        onChange={onLabelChange}
                        style={INPUT_STYLE}
                        data-cy='property-map__unit-form__label-input'
                    />
                    {isValidationErrorVisible && (
                        <Typography.Text style={ERROR_TEXT_STYLE}>{UnitErrorLabel}</Typography.Text>
                    )}
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary' >{SectionLabel}</Typography.Text>
                    <Select
                        value={section}
                        onSelect={updateSection}
                        style={INPUT_STYLE}
                        data-cy='property-map__unit-form__section-select'
                    >
                        {sectionOptions}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={BUTTON_SPACE_SIZE}>
                    <Space direction='vertical' size={8} style={INPUT_STYLE}>
                        <Typography.Text type='secondary' >{FloorLabel}</Typography.Text>
                        <Select
                            value={floor}
                            onSelect={setFloor}
                            style={INPUT_STYLE}
                            data-cy='property-map__unit-form__floor-select'
                        >
                            {floorOptions}
                        </Select>
                        <Checkbox
                            defaultChecked
                            onChange={toggleRenameNextUnits}
                            style={MODAL_FORM_CHECKBOX_STYLE}
                            data-cy='property-map__unit-form__rename-units-checkbox'
                        >
                            {RenameNextUnitsLabel}
                        </Checkbox>
                    </Space>
                    <Row gutter={MODAL_FORM_ROW_BUTTONS_GUTTER}>
                        <Col span={24}>
                            <Button
                                secondary
                                onClick={applyChanges}
                                type='sberDefaultGradient'
                                disabled={!(floor && section && label.trim())}
                                data-cy='property-map__unit-form__submit-button'
                            >{SaveLabel}</Button>
                        </Col>
                        {
                            mode === MapEditMode.EditUnit && (
                                <Col span={24}>
                                    <Button
                                        secondary
                                        onClick={deleteUnit}
                                        type='sberDangerGhost'
                                        icon={<DeleteFilled />}
                                        data-cy='property-map__unit-form__delete-button'
                                    >{DeleteLabel}</Button>
                                </Col>
                            )
                        }
                    </Row>
                </Space>
            </Col>
        </Row>
    )
}

export { UnitForm }
