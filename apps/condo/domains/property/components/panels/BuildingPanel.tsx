import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox } from 'antd'
import React, { useState } from 'react'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'

const baseCellStyle = {
    fontSize: '12px',
    lineHeight: '40px',
    height: '40px',
    width: '40px',
    display: 'inline-block',
    borderRadius: '5px',
    marginTop: '2px',
    marginRight: '2px',
}

const unitStyle = {
    fontSize: '14px',
    backgroundColor: '#F5F5F5',
    fontWeight: 'bold',
}

type BuildingUnit = {
    id: string
    type: 'unit' | 'unknown'
    label: string
}

type BuildingFloor = {
    id: string
    index: number
    name: string
    type: 'floor' | 'unknown'
    units: BuildingUnit[]
}

type BuildingSection = {
    id: string
    index: number
    name: string
    type: 'section' | 'unknown'
    floors: BuildingFloor[]
}

export type BuildingMap = {
    dv: number
    sections: BuildingSection[]
    type: 'building' | 'vilage'
}

interface IBuildingPanelProps {
    map: BuildingMap
}

interface ICellProps {
    label: string | number
    addStyle?: Record<string, string>
}

interface IUnitProps {
    label: string | number
}

interface ISectionProps {
    label: string | number
    isHidden: boolean
}

interface IChooseSections {
    sections: BuildingSection[]
    state: CheckboxValueType[]
    update(params: CheckboxValueType[]): void
}

const EmptyBuildingBlock: React.FC = () => {
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

const BuildingAxisY: React.FC<IBuildingPanelProps> = ({ map }) => {
    const maxFloors = Math.max(...map.sections.map(section => section.floors.length))
    const markerStyle = {
        display: 'block',
    }
    return (
        <div style={{ display: 'inline-block', marginRight: '12px' }}>
            {
                Array(maxFloors).fill('').map((_, ind) => (
                    <BuildingCell key={ind} addStyle={markerStyle} label={maxFloors - ind} />
                ))
            }
            <BuildingCell label='&nbsp;' />
        </div>
    )
}


const BuildingSection: React.FC<ISectionProps> = ({ children, label, isHidden }) => {
    return (
        <div style={{ display: isHidden ? 'none' : 'inline-block', marginRight: '12px', textAlign: 'center' }}>
            {children}
            <BuildingCell label={label} addStyle={{ width: '100%', textAlign: 'center' }} />
        </div>
    )
}

const BuildingFloor: React.FC = ({ children }) => {
    return (
        <div style={{ display: 'block' }}>
            {children}
        </div>
    )
}

const BuildingCell: React.FC<ICellProps> = ({ label, addStyle }) => {
    return (
        <div style={{ textAlign: 'center', ...baseCellStyle, ...addStyle }} >
            {label}
        </div>
    )
}



const BuildingChooseSections: React.FC<IChooseSections> = ({ sections, state, update }) => {
    return (
        <Checkbox.Group onChange={checkedValues => update(checkedValues)} value={state} style={{ width: '100%' }} >
            <Row >
                {
                    sections.map(section => (
                        <Col key={section.id} span={3}>
                            <Checkbox value={section.id}>{section.name}</Checkbox>
                        </Col>
                    ))
                }
            </Row>
        </Checkbox.Group>

    )
}

const BuildingUnit: React.FC<IUnitProps> = ({ label }) => {
    return (
        <BuildingCell addStyle={unitStyle} label={label} />
    )
}

export const BuildingPanelView: React.FC<IBuildingPanelProps> = ({ map }) => {
    const isEmptyMap = !map || !map.sections.length
    const sections = isEmptyMap ? [] : map.sections.map(section => section.id)
    const [checkedSections, setCheckedSections] = useState<CheckboxValueType[]>(sections)
    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >
            {
                isEmptyMap ?
                    <Col span={24} >
                        <EmptyBuildingBlock />
                    </Col>
                    :
                    <Col span={24}>
                        <BuildingAxisY map={map} />
                        {
                            map.sections.map((section, sectionIndex) => {
                                return (
                                    <BuildingSection key={sectionIndex} label={section.name} isHidden={checkedSections.indexOf(section.id) === -1}>
                                        {
                                            section.floors.map((floor, floorIndex) => {
                                                return (
                                                    <BuildingFloor key={floorIndex}>
                                                        {
                                                            floor.units.map((unit, unitIndex) => {
                                                                return (
                                                                    <BuildingUnit key={unitIndex} label={unit.label} />
                                                                )
                                                            })
                                                        }
                                                    </BuildingFloor>
                                                )
                                            })
                                        }
                                    </BuildingSection>
                                )
                            })
                        }
                        {
                            sections.length > 1 ?
                                <BuildingChooseSections sections={map.sections} state={checkedSections} update={setCheckedSections}></BuildingChooseSections>
                                : null
                        }
                    </Col>
            }
        </Row>
    )
}

export const BuildingPanelEdit: React.FC<IBuildingPanelProps> = (map) => {
    return (
        <Row >
            <Col span={8} push={8}>
                <EmptyBuildingBlock />
            </Col>
        </Row>
    )
}


