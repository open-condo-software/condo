import { useIntl } from '@core/next/intl'
import { get } from 'lodash'
import { Col, Input, Row } from 'antd'
import React from 'react'
import { LabeledValue } from 'antd/lib/select'

import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import { TicketFormItem } from '@condo/domains/ticket/components/BaseTicketForm'

const getSectionAndFloorByUnit = (unitName, sections) => {
    const sectionAndFloor = { sectionName: null, floorName: null }

    for (const section of sections) {
        for (const floor of section.floors) {
            for (const unit of floor.units) {
                if (unit.label === unitName) {
                    sectionAndFloor.sectionName = section.name
                    sectionAndFloor.floorName = floor.name
                }
            }
        }
    }

    return sectionAndFloor
}

export const UnitInfo = ({ property, loading, setSelectedUnitName, form }) => {
    const intl = useIntl()
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })

    const updateSectionAndFloor = (form, unitName) => {
        if (unitName) {
            const sections = get(property, ['map', 'sections'], [])
            let sectionAndFloor = getSectionAndFloorByUnit(unitName, sections)

            if (!sectionAndFloor.sectionName && !sectionAndFloor.floorName) {
                const parking = get(property, ['map', 'parking'], [])
                sectionAndFloor = getSectionAndFloorByUnit(unitName, parking)
            }

            return form.setFieldsValue({ sectionName: sectionAndFloor.sectionName, floorName: sectionAndFloor.floorName })
        }

        form.setFieldsValue({ sectionName: null, floorName: null })
    }

    return (
        <Col span={12}>
            <Row justify={'space-between'}>
                <Col span={6}>
                    <TicketFormItem name={'unitName'} label={FlatNumberLabel}>
                        <UnitNameInput
                            property={property}
                            loading={loading}
                            allowClear={true}
                            onChange={(_, option: LabeledValue) => {
                                if (!option) {
                                    setSelectedUnitName(null)
                                    updateSectionAndFloor(form, null)
                                } else {
                                    setSelectedUnitName(option.key)
                                    updateSectionAndFloor(form, option.key)
                                }
                            }}
                        />
                    </TicketFormItem>
                </Col>
                <Col span={6}>
                    <TicketFormItem name={'sectionName'} label={SectionNameLabel}>
                        <Input disabled/>
                    </TicketFormItem>
                </Col>
                <Col span={6}>
                    <TicketFormItem name={'floorName'} label={FloorNameLabel}>
                        <Input disabled/>
                    </TicketFormItem>
                </Col>
            </Row>
        </Col>
    )
}