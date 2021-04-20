import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox } from 'antd'
import React, { useState } from 'react'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'

type BUnit = {
    id: string
    type: 'unit' | 'unknown'
    label: string
}
type BFloor = {
    id: string
    index: number
    name: string
    type: 'floor' | 'unknown'
    units: BUnit[]
}
type BSection = {
    id: string
    index: number
    name: string
    type: 'section' | 'unknown'
    floors: BFloor[]
}

export type BMap = {
    dv: number
    sections: BSection[]
    type: 'building' | 'vilage'
}
interface IBuilderPanelProps {
    map: BMap
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

const EmptyBuilderBlock: React.FC = () => {
    const intl = useIntl()
    const EmptyPropertyBuilderHeader = intl.formatMessage({ id: 'pages.condo.property.EmptyBuilderHeader' })
    const EmptyPropertyBuilderDescription = intl.formatMessage({ id: 'pages.condo.property.EmptyBuilderDescription' })
    const descriptionStyle = {
        display: 'flex',
        fontSize: '16px',
        maxWidth: '350px',
    }
    return (
        <BasicEmptyListView image='/propertyEmpty.svg' >
            <Typography.Title level={3} >
                {EmptyPropertyBuilderHeader}
            </Typography.Title>
            <Typography.Text style={descriptionStyle}>
                {EmptyPropertyBuilderDescription}
            </Typography.Text>
        </BasicEmptyListView>
    )
}


const BAxisY: React.FC<IBuilderPanelProps> = ({ map }) => {
    const maxFloors = Math.max(...map.sections.map(section => section.floors.length))
    const markerStyle = {
        display: 'block',
    }
    return (
        <div style={{ display: 'inline-block', marginRight: '12px' }}>
            {
                Array(maxFloors).fill('').map((_, ind) => (
                    <BCell key={ind} addStyle={{ ...markerStyle }} label={maxFloors - ind} />
                ))
            }
            <BCell label='&nbsp;' />
        </div>
    )
}


const BSection: React.FC<ISectionProps> = ({ children, label, isHidden }) => {
    return (
        <div style={{ display: isHidden ? 'none' : 'inline-block', marginRight: '12px', textAlign: 'center' }}>
            {children}
            <BCell label={label} addStyle={{ width: '100%', textAlign: 'center' }} />
        </div>
    )
}

const BFloor: React.FC = ({ children }) => {
    return (
        <div style={{ display: 'block' }}>
            {children}
        </div>
    )
}

const BCell: React.FC<ICellProps> = ({ label, addStyle }) => {
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
    return (
        <div style={{ textAlign: 'center', ...baseCellStyle, ...addStyle }} >
            {label}
        </div>
    )
}

interface IChooseSections {
    sections: BSection[]
    state: CheckboxValueType[]
    update(params: CheckboxValueType[]): void
}

const BChooseSections: React.FC<IChooseSections> = ({ sections, state, update }) => {
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

const BUnit: React.FC<IUnitProps> = ({ label }) => {
    const unitStyle = {
        fontSize: '14px',
        backgroundColor: '#F5F5F5',
        fontWeight: 'bold',
    }
    return (
        <BCell addStyle={{ ...unitStyle }} label={label} />
    )
}

export const BuilderPanelView: React.FC<IBuilderPanelProps> = ({ map }) => {
    const isEmptyMap = !map || !map.sections.length
    const sections = isEmptyMap ? [] : map.sections.map(section => section.id)
    const [checkedSections, setCheckedSections] = useState<CheckboxValueType[]>(sections)
    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >

            {
                isEmptyMap ?
                    <Col span={24} >
                        <EmptyBuilderBlock />
                    </Col>
                    :
                    <Col span={24}>
                        <BAxisY map={map} />
                        {
                            map.sections.map((section, sectionIndex) => {
                                return (
                                    <BSection key={sectionIndex} label={section.name} isHidden={checkedSections.indexOf(section.id) === -1}>
                                        {
                                            section.floors.map((floor, floorIndex) => {
                                                return (
                                                    <BFloor key={floorIndex}>
                                                        {
                                                            floor.units.map((unit, unitIndex) => {
                                                                return (
                                                                    <BUnit key={unitIndex} label={unit.label} />
                                                                )
                                                            })
                                                        }
                                                    </BFloor>
                                                )
                                            })
                                        }
                                    </BSection>
                                )
                            })
                        }
                        {
                            sections.length > 1 ?
                                <BChooseSections sections={map.sections} state={checkedSections} update={setCheckedSections}></BChooseSections>
                                : null
                        }
                    </Col>
            }
        </Row>
    )
}

export const BuilderPanelEdit: React.FC<IBuilderPanelProps> = (map) => {
    return (
        <Row >
            <Col span={8} push={8}>
                <EmptyBuilderBlock />
            </Col>
        </Row>
    )
}


