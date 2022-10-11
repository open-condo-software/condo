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

const { Option } = Select

const UnitForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: mode === 'editUnit' ? 'Save' : 'Add' })
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

    const updateSection = (value) => {
        setSection(value)
        setFloors(builder.getSectionFloorOptions(value))
        if (mode === 'editUnit') {
            const mapUnit = builder.getSelectedUnit()
            if (value === mapUnit.section) {
                setFloor(mapUnit.floor)
            } else {
                setFloor(null)
            }
        } else {
            setFloor(null)
        }
    }

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
        if (label && floor && section && unitType && mode === 'addUnit') {
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
        if (mode === 'addUnit') {
            isUnitLabelUnique = builder.validateUniqueUnitLabel()
        } else if (mode === 'editUnit') {
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
        setIsValidationErrorVisible(!isUnitUnique)

        if (isUnitUnique) {
            const mapUnit = builder.getSelectedUnit()
            if (mapUnit) {
                builder.updateUnit({ ...mapUnit, label, floor, section, unitType }, renameNextUnits.current)
            } else {
                builder.removePreviewUnit()
                builder.addUnit({ id: '', label, floor, section, unitType }, renameNextUnits.current)
                resetForm()
            }
            refresh()
        }
    }, [builder, refresh, resetForm, label, floor, section, unitType, isUnitUnique])

    const deleteUnit = useCallback(() => {
        const mapUnit = builder.getSelectedUnit()
        builder.removeUnit(mapUnit.id, renameNextUnits.current)
        refresh()
        resetForm()
    }, [resetForm, refresh, builder])

    const updateUnitType = useCallback((value) => {
        setUnitType(value)
    }, [])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction='vertical' size={8}>
                    <Typography.Text>{UnitTypeLabel}</Typography.Text>
                    <Select
                        value={intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                        onSelect={updateUnitType}
                        style={INPUT_STYLE}
                    >
                        {Object.values(BuildingUnitSubType)
                            .filter(unitType => unitType !== BuildingUnitSubType.Parking)
                            .map((unitType, unitTypeIndex) => (
                                <Option key={unitTypeIndex} value={unitType}>{intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}</Option>
                            ))}
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
                        onChange={e => {
                            isValidationErrorVisible && setIsValidationErrorVisible(false)
                            setLabel(e.target.value)
                        }}
                        style={INPUT_STYLE}
                    />
                    {isValidationErrorVisible && (
                        <Typography.Text style={ERROR_TEXT_STYLE}>{UnitErrorLabel}</Typography.Text>
                    )}
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary' >{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={updateSection} style={INPUT_STYLE}>
                        {sections.map((sec) => {
                            return <Option key={sec.id} value={sec.id}>{sec.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={BUTTON_SPACE_SIZE}>
                    <Space direction='vertical' size={8} style={INPUT_STYLE}>
                        <Typography.Text type='secondary' >{FloorLabel}</Typography.Text>
                        <Select value={floor} onSelect={setFloor} style={INPUT_STYLE}>
                            {floors.map(floorOption => {
                                return <Option key={floorOption.id} value={floorOption.id}>{floorOption.label}</Option>
                            })}
                        </Select>
                        <Checkbox defaultChecked onChange={toggleRenameNextUnits} style={MODAL_FORM_CHECKBOX_STYLE}>
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
                            > {SaveLabel} </Button>
                        </Col>
                        {
                            mode === 'editUnit' && (
                                <Col span={24}>
                                    <Button
                                        secondary
                                        onClick={deleteUnit}
                                        type='sberDangerGhost'
                                        icon={<DeleteFilled />}
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
