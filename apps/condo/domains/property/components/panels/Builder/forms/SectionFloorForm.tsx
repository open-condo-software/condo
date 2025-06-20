import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, InputNumber, Row } from 'antd'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Typography, Select, Button } from '@open-condo/ui'

import {
    INPUT_STYLE,
    IPropertyMapModalForm,
    MODAL_FORM_ROW_GUTTER,
} from './BaseUnitForm'
import { RenameNextUnitsCheckbox } from './RenameNextUnitsCheckbox'

import { MapViewMode } from '../MapConstructor'


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

    const [sections, setSections] = useState(builder.getSectionOptions())
    const [section, setSection] = useState<number | null>(null)
    const [unitType, setUnitType] = useState<BuildingUnitSubType>(builder.defaultUnitType)
    const [unitsOnFloor, setUnitsOnFloor] = useState<number>()
    const [floor, setFloor] = useState<string>('')

    const maxFloor = useRef<number>(0)
    const minFloor = useRef<number>(0)
    const renameNextUnits = useRef(false)

    const setFloorNumber = useCallback((value) => {
        setFloor(value !== null ? value.toString() : '')
    }, [])
    const setUnitsOnFloorNumber = useCallback((value) => setUnitsOnFloor(value ? value.toString() : ''), [])
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
        !(floor !== '' && section !== null && unitsOnFloor)
    , [floor, section, unitsOnFloor])

    useEffect(() => {
        if (section !== null) {
            maxFloor.current = builder.getSectionMaxFloor(section) + 1
            minFloor.current = Math.min(builder.getSectionMinFloor(section) - 1, -1)
        }
    }, [section])

    useEffect(() => {
        if (floor !== '' && section !== null && unitsOnFloor > 0) {
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
        builder.availableUnitTypes.map((unitType, key) => ({
            key: `${key}-${unitType}`,
            value: unitType,
            title: unitType,
            label: intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` }),
        }))
    ), [builder.availableUnitTypes, intl])

    const sectionOptions = useMemo(() => (
        sections.map((sec, index) => ({
            key: sec.id,
            label: `${SectionTitlePrefix} ${sec.label}`,
            value: index,
        }))
    ), [sections, SectionTitlePrefix])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Row gutter={MODAL_FORM_ROW_GUTTER}>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>{UnitTypeAtFloorLabel}</Typography.Text>
                            <Select
                                value={unitType}
                                onChange={(unitType) => {
                                    setUnitType(unitType as BuildingUnitSubType)
                                }}
                                options={unitSubtypeOptions}
                                id='property-map__add-section-floor-form__unit-type-select'
                            />
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>{SectionLabel}</Typography.Text>
                            <Select
                                value={section}
                                onChange={(value) => {
                                    setSection(Number(value))
                                }}
                                options={sectionOptions}
                                id='property-map__add-section-floor-form__section-select'
                            />
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>{FloorLabel}</Typography.Text>
                            <InputNumber
                                value={floor}
                                onChange={setFloorNumber}
                                max={maxFloor.current}
                                min={minFloor.current}
                                type='number'
                                style={INPUT_STYLE}
                            />
                        </Space>
                    </Col>
                    <Col span={24}>
                        <Space direction='vertical' size={8} width='100%'>
                            <Typography.Text size='medium' type='secondary'>
                                {unitType === BuildingUnitSubType.Parking ? ParkingsOnFloorLabel : UnitsOnFloorLabel}
                            </Typography.Text>
                            <InputNumber
                                value={unitsOnFloor}
                                onChange={setUnitsOnFloorNumber}
                                type='number'
                                min={1}
                                style={INPUT_STYLE}
                            />
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
                <Button
                    onClick={applyChanges}
                    type='primary'
                    disabled={isSubmitDisabled}
                    block
                >
                    {SaveLabel}
                </Button>
            </Col>
        </Row>
    )
}

export { AddSectionFloorForm }
