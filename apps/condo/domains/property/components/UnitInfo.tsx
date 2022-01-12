import { useIntl } from '@core/next/intl'
import { get } from 'lodash'
import { Col, Form, Input, Row } from 'antd'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import React from 'react'
import { LabeledValue } from 'antd/lib/select'

export const UnitInfo = ({ property, loading, setSelectedUnitName, form }) => {
    const intl = useIntl()
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })

    const updateSectionAndFloor = (form, unitName) => {
        if (unitName) {
            const sections = get(property, ['map', 'sections'], [])
            for (const section of sections) {
                for (const floor of section.floors) {
                    for (const unit of floor.units) {
                        if (unit.label === unitName) {
                            return form.setFieldsValue({ sectionName: section.name, floorName: floor.name })
                        }
                    }
                }
            }
        }
        form.setFieldsValue({ sectionName: null, floorName: null })
    }

    return (
        <Col span={16}>
            <Row justify={'space-between'}>
                <Col span={6}>
                    <Form.Item name={'unitName'} label={FlatNumberLabel}>
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
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={'sectionName'} label={SectionNameLabel}>
                        <Input disabled />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={'floorName'} label={FloorNameLabel}>
                        <Input disabled />
                    </Form.Item>
                </Col>
            </Row>
        </Col>
    )
}
