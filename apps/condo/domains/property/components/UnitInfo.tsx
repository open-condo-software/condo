import React from 'react'
import { useIntl } from '@core/next/intl'
import { Col, FormInstance, Row } from 'antd'
import Input from '@condo/domains/common/components/Input'
import get from 'lodash/get'

import { TicketFormItem } from '@condo/domains/ticket/components/BaseTicketForm'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'

import { BuildingSection, BuildingUnitSubType } from '@app/condo/schema'
import { IPropertyUIState } from '@condo/domains/property/utils/clientSchema/Property'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

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

interface IUnitInfo {
    ({ property, loading, setSelectedUnitName, form, setSelectedUnitType }: {
        property: IPropertyUIState,
        form: FormInstance
        loading: boolean,
        setSelectedUnitName: React.Dispatch<React.SetStateAction<string>>,
        setSelectedUnitType?: React.Dispatch<React.SetStateAction<BuildingUnitSubType>>,
    }): React.ReactElement
}

export const UnitInfo: IUnitInfo = (props) => {
    const intl = useIntl()
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const { property, loading, setSelectedUnitName, form, setSelectedUnitType } = props

    const { isSmall } = useLayoutContext()

    const updateSectionAndFloor = (form, unitName: string, unitType = BuildingUnitSubType.Flat) => {
        if (unitName) {
            const unitDestination = unitType === BuildingUnitSubType.Parking ? 'parking' : 'sections'
            const sections = get(property, ['map', unitDestination], [])
            const { sectionName, floorName } = getSectionAndFloorByUnit(unitName, sections, unitType)

            return form.setFieldsValue({ sectionName, floorName, unitType, unitName })
        }

        form.setFieldsValue({ sectionName: null, floorName: null, unitType })
    }

    return (
        <Col span={isSmall ? 24 : 22}>
            <Row gutter={[40, 0]}>
                <Col span={5} data-cy={'unit-name-input-item'}>
                    <TicketFormItem name={'unitName'} label={FlatNumberLabel}>
                        <UnitNameInput
                            property={property}
                            loading={loading}
                            allowClear={true}
                            onChange={(_, option: UnitNameInputOption) => {
                                if (!option) {
                                    setSelectedUnitName(null)
                                    setSelectedUnitType && setSelectedUnitType(BuildingUnitSubType.Flat)
                                    updateSectionAndFloor(form, null)
                                } else {
                                    const unitType = get(option, 'data-unitType', BuildingUnitSubType.Flat)
                                    const unitName = get(option, 'data-unitName')
                                    setSelectedUnitType && setSelectedUnitType(unitType)
                                    setSelectedUnitName(unitName)
                                    updateSectionAndFloor(form, unitName, unitType)
                                }
                            }}
                        />
                    </TicketFormItem>
                </Col>
                <Col span={5}>
                    <TicketFormItem name={'sectionName'} label={SectionNameLabel}>
                        <Input disabled/>
                    </TicketFormItem>
                </Col>
                <Col span={5}>
                    <TicketFormItem name={'floorName'} label={FloorNameLabel}>
                        <Input disabled/>
                    </TicketFormItem>
                </Col>
            </Row>
        </Col>
    )
}
