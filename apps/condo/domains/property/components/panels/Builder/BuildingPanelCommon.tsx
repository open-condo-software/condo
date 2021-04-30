import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox } from 'antd'
import React from 'react'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MapEdit, MapView } from './MapConstructor'

export const PropertyMapFloor: React.FC = ({ children }) => {
    return (
        <div style={{ display: 'block' }}>
            {children}
        </div>
    )
}

export const EmptyFloor: React.FC = () => {
    return (
        <div style={{ display: 'block' }}>
            <UnitButton secondary disabled >&nbsp;</UnitButton>
        </div>
    )
}
export const EmptyBuildingBlock: React.FC = () => {
    const intl = useIntl()
    const EmptyPropertyBuildingHeader = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingHeader' })
    const EmptyPropertyBuildingDescription = intl.formatMessage({ id: 'pages.condo.property.EmptyBuildingDescription' })
    const descriptionStyle = {
        display: 'flex',
        fontSize: '16px',
        maxWidth: '350px',
    }
    return (
        <BasicEmptyListView image='/propertyEmpty.svg' >
            <Typography.Title level={3} >
                {EmptyPropertyBuildingHeader}
            </Typography.Title>
            <Typography.Text style={descriptionStyle}>
                {EmptyPropertyBuildingDescription}
            </Typography.Text>
        </BasicEmptyListView>
    )
}


interface IBuildingAxisYProps {
    floors: number[]
}

export const BuildingAxisY: React.FC<IBuildingAxisYProps> = ({ floors }) => {
    return (
        <div style={{ display: 'inline-block', marginRight: '12px' }}>
            {
                floors.map(floorNum => (
                    <UnitButton secondary disabled key={`floor_${floorNum}`} style={{ display: 'block' }}>{floorNum}</UnitButton>
                ))
            }
            <UnitButton secondary disabled >&nbsp;</UnitButton>
        </div>
    )
}

interface IBuildingChooseSectionsProps {
    Builder: MapEdit | MapView
    refresh(): void
}

export const BuildingChooseSections: React.FC<IBuildingChooseSectionsProps> = ({ Builder, refresh }) => {
    const updateVisibleSections = (value) => {
        Builder.setVisibleSections(value)
        refresh()
    }
    const sections = Builder.sections
    if (sections.length < 2) {
        return (
            null
        )
    }
    return (
        <Checkbox.Group onChange={updateVisibleSections} value={Builder.visibleSections} style={{ width: '100%' }} >
            <Row gutter={[40, 40]} style={{ marginTop: '60px' }}>
                {
                    sections.map(section => (
                        <Col key={section.id} flex={0}>
                            <Checkbox value={section.id}>{section.name}</Checkbox>
                        </Col>
                    ))
                }
                <Col flex="auto" />
            </Row>
        </Checkbox.Group>
    )
}