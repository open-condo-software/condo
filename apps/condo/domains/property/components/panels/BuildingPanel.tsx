import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox, Input, Select, InputNumber, Space } from 'antd'
import React, { useEffect, useState } from 'react'
import { CheckboxValueType } from 'antd/lib/checkbox/Group'
import { DeleteFilled } from '@ant-design/icons'
import { has } from 'lodash'
import { Button } from '@condo/domains/common/components/Button'
import { UnitButton } from '../../components/UnitButton'
import {
    BuildingUnit,
    BuildingSection,
    BuildingMap,
    unitInfo,
    possibleFloors,
    sectionOptions,
    sectionFloorOptions,
    mapAddSection,
    mapUpdateSection,
    mapRemoveSection,
    mapAddUnit,
    mapUpdateUnit,
    mapRemoveUnit,
} from './MapConstructor'

const { Option } = Select

const INPUT_STYLE = {
    width: '136px',
}
interface IBuildingPanelProps {
    map: BuildingMap
    unitClick?(unit: BuildingUnit): void
    sectionClick?(section: BuildingSection): void
    updateMap?(map: BuildingMap, action?: string): void
    selectedUnit?: BuildingUnit
    selectedSection?: BuildingSection
}
interface IUnitFormProps {
    map: BuildingMap
    unit: BuildingUnit
    updateMap?(map: BuildingMap, action?: string): void
}
interface IEditSectionProps {
    map: BuildingMap
    section: BuildingSection
    updateMap?(map: BuildingMap, action?: string): void
}

interface IEmptyFloorProps {
    units: number
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
    const allFloors = possibleFloors(map)
    return (
        <div style={{ display: 'inline-block', marginRight: '12px' }}>
            {
                allFloors.map(floorNum => (
                    <UnitButton secondary disabled key={floorNum} style={{ display: 'block' }}>{floorNum}</UnitButton>
                ))
            }
            <UnitButton secondary disabled >&nbsp;</UnitButton>
        </div>
    )
}

const EmptyFloor: React.FC<IEmptyFloorProps> = ({ units }) => {
    return (
        <div style={{ display: 'block' }} key={Math.random()}>
            {
                Array(units).fill('').map(_ => <UnitButton key={Math.random()} secondary disabled>&nbsp;</UnitButton>)
            }
        </div>
    )
}

const BuildingChooseSections: React.FC<IChooseSections> = ({ sections, state, update }) => {
    return (
        <Checkbox.Group onChange={update} value={state} style={{ width: '100%' }} >
            <Row style={{ marginTop: '60px' }}>
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


export const BuildingPanelView: React.FC<IBuildingPanelProps> = ({ map, unitClick, sectionClick, selectedSection, selectedUnit }) => {
    const isEmptyMap = !map || !map.sections.length
    const sections = isEmptyMap ? [] : map.sections.map(section => section.id)
    const [checkedSections, setCheckedSections] = useState<CheckboxValueType[]>(sections)
    const allFloors = possibleFloors(map)
    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >
            {
                isEmptyMap ?
                    <Col span={24} style={{ marginTop: '60px', marginBottom: '60px' }}>
                        <EmptyBuildingBlock />
                    </Col>
                    :
                    <Col span={24} style={{ marginTop: '60px' }}>
                        <BuildingAxisY map={map} />
                        {
                            map.sections.map((section, sectionIndex) => {
                                return (
                                    <div
                                        key={sectionIndex}
                                        style={{
                                            display: checkedSections.indexOf(section.id) === -1 ? 'none' : 'inline-block',
                                            marginRight: '12px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {
                                            allFloors.map(floorIndex => {
                                                const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                if (floorInfo && floorInfo.units.length) {
                                                    return (
                                                        <div key={floorIndex} style={{ display: 'block' }}>
                                                            {
                                                                floorInfo.units.map((unit, unitIndex) => {
                                                                    return (
                                                                        <UnitButton
                                                                            key={unitIndex}
                                                                            onClick={unitClick ? () => unitClick(unit) : null}
                                                                            selected={selectedUnit ? unit.id === selectedUnit.id : false}
                                                                        >{unit.label}</UnitButton>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    )
                                                } else {
                                                    return (
                                                        <EmptyFloor key={Math.random()} units={section.unitsOnFloor} />
                                                    )
                                                }
                                            })
                                        }
                                        <UnitButton
                                            secondary
                                            style={{ width: '100%' }}
                                            onClick={sectionClick ? () => sectionClick(section) : null}
                                            selected={selectedSection ? section.id === selectedSection.id : false}
                                        >{section.name}</UnitButton>
                                    </div>
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


const EditSectionForm: React.FC<IEditSectionProps> = ({ map, section, updateMap }) => {
    const [name, setName] = useState(section.name)
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })


    const updateSection = () => {
        const newMap = mapUpdateSection(map, { ...section, name })
        updateMap(newMap)
    }
    const deleteSection = () => {
        const newMap = mapRemoveSection(map, section.id)
        updateMap(newMap)
    }

    useEffect(() => {
        setName(section.name)
    }, [section, map])

    return (
        <>
            <Col flex={1}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE}/>
                </Space>
            </Col>
            <Col flex={1}>
                <Button
                    secondary
                    onClick={updateSection}
                    type='sberPrimary'
                    style={{ marginTop: '30px' }}
                > {SaveLabel} </Button>
                <Button
                    secondary
                    danger
                    onClick={deleteSection}
                    type='default'
                    icon={<DeleteFilled />}
                    style={{ marginLeft: '40px', marginTop: '30px', width: '48px' }}
                > </Button>
            </Col>
            <Col flex="auto" />
        </>
    )
}


const UnitForm: React.FC<IUnitFormProps> = ({ map, unit, updateMap }) => {
    const intl = useIntl()
    
    const mode = unit.id ? 'edit' : 'add'

    const SaveLabel = intl.formatMessage({ id: mode === 'edit' ? 'Save' : 'Add' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.unit.Name' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')

    const [sections, setSections] = useState([])
    const [floors, setFloors] = useState([])

    const updateSection = (value) => {
        setSection(value)
        setFloors(sectionFloorOptions(map, value))
        if (mode === 'edit') {
            const mapUnit = unitInfo(map, unit.id)
            if (value === mapUnit.section) {
                setFloor(mapUnit.floor)
            } else {
                setFloor(null)
            }
        }
    }

    useEffect(() => {
        const mapUnit = unitInfo(map, unit.id)
        setLabel(unit.label)
        setSections(sectionOptions(map))
        setFloors(sectionFloorOptions(map, mapUnit.section))
        setFloor(mapUnit.floor)
        setSection(mapUnit.section)
    }, [unit, map])

    const applyChanges = () => {
        const unitToSave = { ...unit, label, floor, section }
        let newMap = mapRemoveUnit(map, 'preview-unit')
        newMap = (mode === 'edit') ? mapUpdateUnit(map, unitToSave) : mapAddUnit(map, unitToSave)
        updateMap(newMap)
    }
    const deleteUnit = () => {
        const newMap = mapRemoveUnit(map, unit.id)
        updateMap(newMap)
    }

    return (
        <>
            <Col flex={1}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={label} onChange={e => setLabel(e.target.value)} style={INPUT_STYLE}/>
                </Space>
            </Col>
            <Col flex={1}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={updateSection} style={INPUT_STYLE} >
                        {sections.map((sec) => {
                            return <Option key={sec.id} value={sec.id}>{sec.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col flex={1}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{FloorLabel}</Typography.Text>
                    <Select value={floor} onSelect={setFloor} style={INPUT_STYLE} >
                        {floors.map(floorOption => {
                            return <Option key={floorOption.id} value={floorOption.id}>{floorOption.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col flex={1}>
                <Button
                    secondary
                    onClick={applyChanges}
                    type='sberPrimary'
                    disabled={!(floor && section)}
                    style={{ marginTop: '30px' }}
                > {SaveLabel} </Button>
                {
                    mode === 'edit' ?
                        <Button
                            secondary
                            danger
                            onClick={deleteUnit}
                            type='default'
                            icon={<DeleteFilled />}
                            style={{ marginLeft: '40px', marginTop: '30px', width: '48px' }}
                        > </Button> : null
                }
            </Col>
            <Col flex="auto" />
        </>
    )
}

const AddSectionForm: React.FC<IBuildingPanelProps> = ({ map, updateMap }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const MaxFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.maxFloor' })
    const UnitsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.unitsOnFloor' })
    const AddLabel = intl.formatMessage({ id: 'Add' })

    const [name, setName] = useState('')
    const [minFloor, setMinFloor] = useState(null)
    const [maxFloor, setMaxFloor] = useState(null)
    const [unitsOnFloor, setUnitsOnFloor] = useState(null)

    const resetForm = () => {
        setName('')
        setMinFloor(null)
        setMaxFloor(null)
        setUnitsOnFloor(null)
    }

    const handleFinish = () => {
        const newMap = mapAddSection(map, { id: null, name, minFloor, maxFloor, unitsOnFloor })
        updateMap(newMap)
        resetForm()
    }
    return (
        <>
            <Col flex={1}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE}/>
                </Space>
            </Col>
            <Col flex={1}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{MinFloorLabel}</Typography.Text>
                    <InputNumber value={minFloor} onChange={v => setMinFloor(v)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={1}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{MaxFloorLabel}</Typography.Text>
                    <InputNumber value={maxFloor} onChange={v => setMaxFloor(v)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={1}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{UnitsOnFloorLabel}</Typography.Text>
                    <InputNumber value={unitsOnFloor} onChange={v => setUnitsOnFloor(v)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={1}>
                <Button
                    key='submit'
                    secondary
                    onClick={handleFinish}
                    type='sberPrimary'
                    style={{ marginTop: '30px' }}
                    disabled={! (name.length && minFloor && maxFloor && unitsOnFloor)}
                > {AddLabel} </Button>
            </Col>
            <Col flex="auto" />
        </>
    )
}




export const BuildingPanelEdit: React.FC<IBuildingPanelProps> = ({ map, updateMap: parentUpdateMap }) => {

    const intl = useIntl()
 
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddLabel = intl.formatMessage({ id: 'Add' })

    const isEmptyMap = !map || !has(map, 'sections') || map.sections.length === 0
    const [unit, setUnit] = useState({ id: null })
    const [section, setSection] = useState({ id: null })
    const [mode, changeMode] = useState('addSection') // addSection, editSection, addUnit, editUnit

    const unitClick = (target) => {
        if (unit.id === target.id) {
            setUnit({ id: null })
            changeMode('addUnit')
        } else {
            setUnit(target)
            setSection({ id: null })
            changeMode('editUnit')
        }
    }

    const sectionClick = (target) => {
        if (section.id === target.id) {
            setSection({ id: null })
            changeMode('addSection')
        } else {
            setSection(target)
            setUnit({ id: null })
            changeMode('editSection')
        }
    }

    const updateMap = (map, action) => {
        changeMode('addSection')
        setSection({ id: null })
        setUnit({ id: null })
        parentUpdateMap(map)
    }

    return (
        <>
            <Row align='middle' style={{ marginBottom: '40px' }}>
                {
                    (mode === 'addSection' || mode === 'addUnit') ? (
                        <Col flex={1} >
                            <Space direction={'vertical'} size={8} style={{ width: '136px' }}>
                                <Typography.Text type={'secondary'} >{AddLabel}</Typography.Text>
                                <Select value={mode} onChange={value => changeMode(value)} style={{ width: '136px' }}>
                                    <Option value='addSection'>{AddSection}</Option>
                                    <Option value='addUnit'>{AddUnit}</Option>
                                </Select>
                            </Space>
                        </Col>
                    ) : null
                }
                {
                    mode === 'addSection'
                        ?
                        <AddSectionForm map={map} updateMap={updateMap}></AddSectionForm>
                        : mode === 'addUnit'
                            ?
                            <UnitForm map={map} unit={{ id: null }} updateMap={updateMap}></UnitForm>
                            : mode === 'editSection'
                                ?
                                <EditSectionForm map={map} section={section} updateMap={updateMap}></EditSectionForm>
                                : mode === 'editUnit'
                                    ?
                                    <UnitForm map={map} unit={unit} updateMap={updateMap}></UnitForm>
                                    : null
                }
            </Row>
            <Row>
                {
                    isEmptyMap
                        ?
                        <Col span={24}>
                            <EmptyBuildingBlock />
                        </Col>
                        :
                        <BuildingPanelView
                            map={map}
                            unitClick={unitClick}
                            sectionClick={sectionClick}
                            selectedUnit={unit}
                            selectedSection={section}
                        />

                }
            </Row>
        </>
    )
}


