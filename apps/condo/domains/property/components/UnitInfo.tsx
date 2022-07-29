import { isEmpty } from 'lodash'
import React, { useCallback, useMemo, useState } from 'react'
import { Gutter } from 'antd/es/grid/row'
import { useIntl } from '@core/next/intl'
import { Col, FormInstance, Row } from 'antd'
import get from 'lodash/get'

import { BuildingFloor, BuildingSection, Property, BuildingUnitSubType } from '@app/condo/schema'

import { TicketFormItem } from '@condo/domains/ticket/components/BaseTicketForm'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { FloorNameInput } from '@condo/domains/user/components/FloorNameInput'
import { SectionNameInput } from '@condo/domains/user/components/SectionNameInput'
import { PARKING_SECTION_TYPE, SECTION_SECTION_TYPE } from '@condo/domains/property/constants/common'

interface IGetSectionAndFloorByUnit {
    (unitName: string, sections: BuildingSection[], unitType: BuildingUnitSubType): {
        sectionName: null | string, floorName: null | string
    }
}

const getSectionAndFloorByUnit: IGetSectionAndFloorByUnit = (unitName, sections, unitType = BuildingUnitSubType.Flat) => {
    const sectionAndFloor = { sectionName: null, floorName: null }

    if (sections) {
        for (const section of sections) {
            for (const floor of section.floors) {
                const floorUnits = floor.units.filter((unit) => {
                    if (unitType === BuildingUnitSubType.Flat) {
                        return unit.unitType === null || unit.unitType === BuildingUnitSubType.Flat
                    }
                    return unit.unitType === unitType
                })
                for (const unit of floorUnits) {
                    if (unit.label === unitName) {
                        sectionAndFloor.sectionName = section.name
                        sectionAndFloor.floorName = floor.name
                    }
                }
            }
        }
    }

    return sectionAndFloor
}

export function getFloorsBySection (selectedSectionName, sections: BuildingSection[]): BuildingFloor[] {
    if (!isEmpty(selectedSectionName)) {
        const section = sections.find(section => section.name === selectedSectionName)

        return get(section, 'floors', [])
    }

    return []
}

export enum UnitInfoMode {
    Unit = 'unit',
    All = 'all',
}

type InitialUnitInfoType = {
    sectionName?: string
    floorName?: string
}

interface IUnitInfo {
    property: Property
    form: FormInstance
    loading: boolean
    setSelectedUnitName: React.Dispatch<React.SetStateAction<string>>
    setSelectedUnitType?: React.Dispatch<React.SetStateAction<BuildingUnitSubType>>
    selectedUnitName?: string
    mode?: UnitInfoMode
    initialValues?: InitialUnitInfoType
    selectedSectionType?: string
    setSelectedSectionType?: React.Dispatch<React.SetStateAction<string>>
}

const UNIT_FIELDS_GUTTER: [Gutter, Gutter] = [40, 0]

export const UnitInfo: React.FC<IUnitInfo> = (props) => {
    const intl = useIntl()
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const {
        initialValues = {},
        property,
        loading,
        setSelectedUnitName,
        form,
        setSelectedUnitType,
        selectedUnitName,
        mode = UnitInfoMode.Unit,
        selectedSectionType,
        setSelectedSectionType,
    } = props

    const { isSmall } = useLayoutContext()

    const [selectedSectionName, setSelectedSectionName] = useState<string>(get(initialValues, 'sectionName'))
    const [selectedFloorName, setSelectedFloorName] = useState<string>(get(initialValues, 'floorName'))

    const sections = useMemo(() => get(property, ['map', 'sections'], []), [property])
    const parking = useMemo(() => get(property, ['map', 'parking'], []), [property])
    const selectedSections = useMemo(() => {
        if (selectedSectionName) {
            return selectedSectionType === SECTION_SECTION_TYPE ? sections : parking
        }
    }, [parking, sections, selectedSectionName, selectedSectionType])
    const floors = useMemo(() =>
        getFloorsBySection(selectedSectionName, selectedSections)
    , [selectedSectionName, selectedSections])

    const updateSectionAndFloor = useCallback((form, unitName: string, unitType = BuildingUnitSubType.Flat) => {
        if (unitName) {
            const unitDestination = unitType === BuildingUnitSubType.Parking ? 'parking' : 'sections'
            const sectionType = unitType === BuildingUnitSubType.Parking ? PARKING_SECTION_TYPE : SECTION_SECTION_TYPE
            const sections = get(property, ['map', unitDestination], [])
            const { sectionName, floorName } = getSectionAndFloorByUnit(unitName, sections, unitType)

            if (setSelectedSectionType) setSelectedSectionType(sectionType)

            return form.setFieldsValue({ sectionName, sectionType, floorName, unitType, unitName })
        }

        form.setFieldsValue({ sectionName: null, sectionType: null, floorName: null, unitType: null })
    }, [property, setSelectedSectionType])

    const handleUnitNameInputChange = useCallback((_, option: UnitNameInputOption) => {
        if (!option) {
            setSelectedUnitName(null)
            if (setSelectedUnitType) setSelectedUnitType(null)
            updateSectionAndFloor(form, null)

            setSelectedFloorName(null)
            setSelectedSectionName(null)
            if (setSelectedSectionType) setSelectedSectionType(null)
        } else {
            const unitType = get(option, 'data-unitType', BuildingUnitSubType.Flat)
            const unitName = get(option, 'data-unitName')
            setSelectedUnitType && setSelectedUnitType(unitType)
            setSelectedUnitName(unitName)
            updateSectionAndFloor(form, unitName, unitType)
        }
    }, [form, setSelectedSectionType, setSelectedUnitName, setSelectedUnitType, updateSectionAndFloor])

    const inputColSpan = 8

    const disableFloorInputCondition = mode === UnitInfoMode.Unit || isEmpty(selectedSectionName) || selectedUnitName
    const disableSectionInputCondition = mode === UnitInfoMode.Unit || selectedUnitName

    const handleChangeSectionNameInput = useCallback((section, option) => {
        if (!isEmpty(section)) {
            const sectionName = get(option, 'data-sectionName')
            const sectionType = get(option, 'data-sectionType')

            setSelectedSectionName(sectionName)
            if (setSelectedSectionType) setSelectedSectionType(sectionType)
            setSelectedFloorName(null)

            form.setFieldsValue({ sectionName, sectionType, floorName: null })
        } else {
            setSelectedFloorName(null)
            setSelectedSectionName(null)
            if (setSelectedSectionType) setSelectedSectionType(null)

            form.setFieldsValue({ sectionName: null, sectionType: null, floorName: null })
        }
    }, [form, setSelectedSectionType])

    const handleChangeFloorNameInput = useCallback((floor) => {
        if (!isEmpty(floor)) {
            setSelectedFloorName(floor)
        } else {
            setSelectedFloorName(null)
            form.setFieldsValue({ floorName: null })
        }
    }, [form])

    return (
        <Col span={24} md={20} xl={18} xxl={16}>
            <Row gutter={UNIT_FIELDS_GUTTER}>
                <Col span={inputColSpan} data-cy={'unit-name-input-item'}>
                    <TicketFormItem name={'unitName'} label={FlatNumberLabel}>
                        <UnitNameInput
                            property={property}
                            loading={loading}
                            allowClear
                            onChange={handleUnitNameInputChange}
                            mode={mode}
                            selectedSections={selectedSections}
                            selectedSectionName={selectedSectionName}
                            selectedFloorName={selectedFloorName}
                        />
                    </TicketFormItem>
                </Col>
                <Col span={inputColSpan}>
                    <TicketFormItem name={'sectionName'} label={SectionNameLabel}>
                        <SectionNameInput
                            disabled={disableSectionInputCondition}
                            property={property}
                            onChange={handleChangeSectionNameInput}
                        />
                    </TicketFormItem>
                </Col>
                <Col span={inputColSpan}>
                    <TicketFormItem name={'floorName'} label={FloorNameLabel}>
                        <FloorNameInput
                            disabled={disableFloorInputCondition}
                            property={property}
                            floors={floors}
                            onChange={handleChangeFloorNameInput}
                        />
                    </TicketFormItem>
                </Col>
            </Row>
        </Col>
    )
}
