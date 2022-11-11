/** @jsx jsx */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useIntl } from '@open-condo/next/intl'
import { jsx } from '@emotion/react'
import { Row, Col, Space, Typography } from 'antd'
import Select from '@condo/domains/common/components/antd/Select'
import Input from '@condo/domains/common/components/antd/Input'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { Button } from '@condo/domains/common/components/Button'
import { DeleteFilled } from '@ant-design/icons'
import {
    IPropertyMapModalForm,
    FormModalCss,
    MODAL_FORM_ROW_GUTTER,
    MODAL_FORM_ROW_BUTTONS_GUTTER,
    INPUT_STYLE,
    BUTTON_SPACE_SIZE,
    MODAL_FORM_CHECKBOX_STYLE,
    ERROR_TEXT_STYLE,
} from './BaseUnitForm'
import { MapEditMode } from '@condo/domains/property/components/panels/Builder/MapConstructor'

const { Option } = Select

const ParkingUnitForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: mode === MapEditMode.EditParkingUnit ? 'Save' : 'Add' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.parkingUnit.Name' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.parkingSection.name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const SectionTitlePrefix = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const RenameNextParkingUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextParkingUnits' })
    const UnitErrorLabel = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')

    const [sections, setSections] = useState([])
    const [floors, setFloors] = useState([])
    const [isValidationErrorVisible, setIsValidationErrorVisible] = useState(false)

    const renameNextUnits = useRef(true)

    const updateSection = useCallback((value) => {
        setSection(value)
        setFloors(builder.getParkingSectionFloorOptions(value))
        if (mode === MapEditMode.EditParkingUnit) {
            const mapUnit = builder.getSelectedParkingUnit()
            if (value === mapUnit.section) {
                setFloor(mapUnit.floor)
            } else {
                setFloor(null)
            }
        } else {
            setFloor(null)
        }
    }, [builder, mode])

    const onChangeLabel = useCallback((e) => {
        isValidationErrorVisible && setIsValidationErrorVisible(false)
        setLabel(e.target.value)
    }, [isValidationErrorVisible])

    useEffect(() => {
        setSections(builder.getParkingSectionOptions())
        const mapUnit = builder.getSelectedParkingUnit()
        if (mapUnit) {
            setFloors(builder.getParkingSectionFloorOptions(mapUnit.section))
            setLabel(mapUnit.label)
            setSection(mapUnit.section)
            setFloor(mapUnit.floor)
            setIsValidationErrorVisible(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [builder])

    useEffect(() => {
        if (label && floor && section && mode === MapEditMode.AddParkingUnit) {
            builder.addPreviewParkingUnit({ id: '', label, floor, section }, renameNextUnits.current)
            refresh()
        } else {
            builder.removePreviewParkingUnit(renameNextUnits.current)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [label, floor, section, mode])

    const resetForm = useCallback(() => {
        setLabel('')
        setFloor('')
        setSection('')
    }, [])

    const toggleRenameNextUnits = useCallback((event) => { renameNextUnits.current = event.target.checked }, [])

    const isUnitUnique = useMemo(() => {
        let isUnitLabelUnique = true
        if (mode === MapEditMode.AddParkingUnit) {
            isUnitLabelUnique = builder.validateUniqueUnitLabel()
        } else if (mode === MapEditMode.EditParkingUnit) {
            const selectedUnit = builder.getSelectedParkingUnit()
            if (!selectedUnit) {
                return false
            }

            const unitPlacementChanged = selectedUnit.floor !== floor || selectedUnit.section !== section
            const labelChanged = selectedUnit.label !== label
            const labelValidation = labelChanged
                ? builder.validateUniqueUnitLabel(label, 'parking')
                : false

            isUnitLabelUnique = unitPlacementChanged
                ? (!labelChanged || labelValidation)
                : labelValidation
        }

        return floor && section && label.trim() && isUnitLabelUnique
    }, [floor, section, label, builder, mode])

    const applyChanges = useCallback(() => {
        const mapUnit = builder.getSelectedParkingUnit()
        if (mapUnit) {
            builder.updateParkingUnit({ ...mapUnit, label, floor, section }, renameNextUnits.current)
        } else {
            builder.removePreviewParkingUnit()
            builder.addParkingUnit({ id: '', label, floor, section }, renameNextUnits.current)
            resetForm()
        }
        refresh()
    }, [builder, refresh, resetForm, label, floor, section])

    const deleteUnit = useCallback(() => {
        const mapUnit = builder.getSelectedParkingUnit()
        builder.removeParkingUnit(mapUnit.id, renameNextUnits.current)
        refresh()
        resetForm()
    }, [resetForm, refresh, builder])

    const sectionOptions = useMemo(() => (
        sections.map((sec) => {
            return <Option key={sec.id} value={sec.id}>{SectionTitlePrefix} {sec.label}</Option>
        })
    ), [sections, SectionTitlePrefix])

    const floorOptions = useMemo(() => (
        floors.map(floorOption => {
            return <Option key={floorOption.id} value={floorOption.id}>{floorOption.label}</Option>
        })
    ), [floors])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary' >{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={updateSection} style={INPUT_STYLE}>
                        {sectionOptions}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary' >{FloorLabel}</Typography.Text>
                    <Select value={floor} onSelect={setFloor} style={INPUT_STYLE}>
                        {floorOptions}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={BUTTON_SPACE_SIZE}>
                    <Space direction='vertical' size={8}>
                        <Typography.Text type='secondary'>{NameLabel}</Typography.Text>
                        <Input
                            allowClear
                            value={label}
                            onChange={onChangeLabel}
                            style={INPUT_STYLE}
                            status={isValidationErrorVisible ? 'error' : ''}
                        />
                        {isValidationErrorVisible && (
                            <Typography.Text style={ERROR_TEXT_STYLE}>{UnitErrorLabel}</Typography.Text>
                        )}
                        <Checkbox defaultChecked onChange={toggleRenameNextUnits} style={MODAL_FORM_CHECKBOX_STYLE}>
                            {RenameNextParkingUnitsLabel}
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
                            mode === MapEditMode.EditParkingUnit && (
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

export { ParkingUnitForm }
