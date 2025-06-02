import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, InputNumber, Row, Space, Typography } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Checkbox } from '@open-condo/ui'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'



import {
    BUTTON_SPACE_SIZE,
    FormModalCss,
    INPUT_STYLE,
    IPropertyMapModalForm,
    MODAL_FORM_ROW_BUTTONS_GUTTER,
    MODAL_FORM_ROW_GUTTER,
} from './BaseUnitForm'

import { MapViewMode } from '../MapConstructor'




const { Option } = Select

const AddSectionFloorForm: React.FC<IPropertyMapModalForm> = ({ builder, refresh }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Add' })
    const UnitTypeAtFloorLabel = intl.formatMessage({ id: 'pages.condo.property.modal.title.unitTypeAtFloor' })
    const UnitsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.unitsOnFloor' })
    const ParkingsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.parkingsOnFloor' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.parkingSection.name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const SectionTitlePrefix = builder.viewMode === MapViewMode.section ?
        intl.formatMessage({ id: 'pages.condo.property.select.option.section' }) :
        intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const RenameNextUnitsLabel = intl.formatMessage({ id: 'pages.condo.property.modal.RenameNextUnits' })

    const [sections, setSections] = useState([])
    const [section, setSection] = useState<number | null>(null)
    const [unitType, setUnitType] = useState<BuildingUnitSubType>(builder.defaultUnitType)
    const [unitsOnFloor, setUnitsOnFloor] = useState<number>()
    const [floor, setFloor] = useState<string>('')

    const maxFloor = useRef<number>(0)
    const renameNextUnits = useRef(true)

    const setFloorNumber = useCallback((value) => setFloor(value ? value.toString() : ''), [])
    const setUnitsOnFloorNumber = useCallback((value) => setUnitsOnFloor(value ? value.toString() : ''), [])
    const toggleRenameNextUnits = useCallback((event) => { renameNextUnits.current = event.target.checked }, [])
    const applyChanges = useCallback(() => {
        if (floor !== '' && section !== null && unitsOnFloor > 0) {
            builder.addSectionFloor({
                section: Number(section),
                index: Number(floor),
                unitType,
                unitCount: Number(unitsOnFloor),
            }, renameNextUnits.current)
        }
        refresh()

        setUnitsOnFloor(null)
        setFloor(null)
        setSection(null)
    }, [builder, refresh, floor, section, unitsOnFloor, unitType])

    const isSubmitDisabled = useMemo(() =>
        !(floor && section !== null && unitsOnFloor)
    , [floor, section, unitsOnFloor])

    useEffect(() => {
        if (section !== null) {
            maxFloor.current = builder.getSectionMaxFloor(section) + 1
        }
    }, [section])

    useEffect(() => {
        setSections(builder.getSectionOptions())
    }, [builder])

    useEffect(() => {
        if (floor && section !== null && unitsOnFloor > 0) {
            const sectionFloors = builder.sections?.[section]
                ?.floors?.map(floor => floor.name) || []
            if (!sectionFloors.includes(floor)) {
                builder.addPreviewSectionFloor({
                    section: Number(section),
                    index: Number(floor),
                    unitType,
                    unitCount: Number(unitsOnFloor),
                })
            }
        } else {
            builder.removePreviewSectionFloor()
        }
        refresh()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floor, section, unitsOnFloor, unitType])

    const unitSubtypeOptions = useMemo(() => (
        builder.availableUnitTypes.map((unitType, key) => (
            <Select.Option key={`${key}-${unitType}`} value={unitType} title={unitType}>
                {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
            </Select.Option>
        ))
    ), [builder.availableUnitTypes, intl])

    const sectionOptions = useMemo(() => (
        sections.map((sec, index) => {
            return <Option key={sec.id} value={index}>{SectionTitlePrefix} {sec.label}</Option>
        })
    ), [sections, SectionTitlePrefix])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary'>{UnitTypeAtFloorLabel}</Typography.Text>
                    <Select value={unitType} onSelect={setUnitType}>
                        {unitSubtypeOptions}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary'>{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={setSection} style={INPUT_STYLE}>
                        {sectionOptions}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={8} style={INPUT_STYLE}>
                    <Typography.Text type='secondary'>{FloorLabel}</Typography.Text>
                    <InputNumber
                        value={floor}
                        onChange={setFloorNumber}
                        max={maxFloor.current}
                        type='number'
                        style={INPUT_STYLE}
                    />
                </Space>
            </Col>
            <Col span={24}>
                <Space direction='vertical' size={BUTTON_SPACE_SIZE}>
                    <Space direction='vertical' size={8} style={INPUT_STYLE}>
                        <Typography.Text type='secondary'>{unitType === BuildingUnitSubType.Parking ? ParkingsOnFloorLabel : UnitsOnFloorLabel}</Typography.Text>
                        <InputNumber
                            value={unitsOnFloor}
                            onChange={setUnitsOnFloorNumber}
                            type='number'
                            style={INPUT_STYLE}
                            min={1}
                        />
                    </Space>
                    <Checkbox onChange={toggleRenameNextUnits}>
                        {RenameNextUnitsLabel}
                    </Checkbox>
                    <Row gutter={MODAL_FORM_ROW_BUTTONS_GUTTER}>
                        <Col span={24}>
                            <Button
                                onClick={applyChanges}
                                type='sberDefaultGradient'
                                disabled={isSubmitDisabled}
                            > {SaveLabel} </Button>
                        </Col>
                    </Row>
                </Space>
            </Col>
        </Row>
    )
}

export { AddSectionFloorForm }
