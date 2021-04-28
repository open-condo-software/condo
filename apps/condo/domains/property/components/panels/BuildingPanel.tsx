import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Col, Row, Typography, Checkbox, Input, Select, InputNumber, Space } from 'antd'
import React, { useEffect, useState } from 'react'
import { DeleteFilled } from '@ant-design/icons'
import { cloneDeep } from 'lodash'
import { Button } from '@condo/domains/common/components/Button'
import { UnitButton } from '../../components/UnitButton'
import MapConstructor, {
    BuildingMap,
    BuildingUnit,
    BuildingSection,
} from './MapConstructor'

import ScrollContainer from 'react-indiana-drag-scroll'

const { Option } = Select

const INPUT_STYLE = {
    width: '136px',
}

interface IBuildingPanelViewProps {
    map: BuildingMap
}
interface IBuildingPanelEditProps {
    map: BuildingMap
    updateMap: (map: BuildingMap) => void
}
interface IEditMapProps {
    Builder: MapConstructor
    refresh(): void
}
interface IPropertyMapUnitProps {
    unit: BuildingUnit
    Builder: MapConstructor
    refresh(): void
}

interface IBuildingAxisY {
    floors: number[]
}
interface IChooseSections {
    Builder: MapConstructor
    refresh(): void
}
interface IPropertyMapSectionProps {
    section: BuildingSection
    Builder: MapConstructor
    refresh(): void
}


// Service blocks

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


const BuildingAxisY: React.FC<IBuildingAxisY> = ({ floors }) => {
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


// View

const BuildingPanelView: React.FC<IBuildingPanelViewProps> = ({ map }) => {
    const [Map, setMap] = useState(new MapConstructor(map, null))
    const refresh = () => setMap(cloneDeep(Map))
    return (
        <PropertyMapView Builder={Map} refresh={refresh}></PropertyMapView>
    )
}






















const BuildingPanelEdit: React.FC<IBuildingPanelEditProps> = ({ map, updateMap: updateFormField }) => {
    const intl = useIntl()
    const [Map, setMap] = useState(new MapConstructor(map, updateFormField))
    const refresh = () => setMap(cloneDeep(Map))
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const isEmptyMap = Map.isEmpty()
    const changeMode = (mode) => {
        Map.setEditMode(mode)
        refresh()
    }
    const mode = Map.getEditMode()
    return (
        <>
            <Row align='middle' style={{ marginBottom: '40px' }} gutter={[45, 40]} justify='start'>
                {
                    (mode === 'addSection' || mode === 'addUnit') ? (
                        <Col flex={0} style={{ maxWidth: '400px' }}>
                            <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                                <Typography.Text type={'secondary'} >{AddLabel}</Typography.Text>
                                <Select value={mode} onChange={value => changeMode(value)} style={INPUT_STYLE}>
                                    <Option value='addSection'>{AddSection}</Option>
                                    <Option value='addUnit'>{AddUnit}</Option>
                                </Select>
                            </Space>
                        </Col>
                    ) : null
                }
                {
                    {
                        addSection: <AddSectionForm Builder={Map} refresh={refresh}></AddSectionForm>,
                        addUnit: <UnitForm Builder={Map} refresh={refresh}></UnitForm>,
                        editSection: <EditSectionForm Builder={Map} refresh={refresh}></EditSectionForm>,
                        editUnit: <UnitForm Builder={Map} refresh={refresh}></UnitForm>,
                    }[mode] || null
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
                        <PropertyMap
                            Builder={Map}
                            refresh={refresh}
                        />
                }
            </Row>
        </>
    )
}









const BuildingChooseSections: React.FC<IChooseSections> = ({ Builder, refresh }) => {
    const updateVisibleSections = (value) => {
        Builder.setVisibleSections(value)
        refresh()
    }
    const sections = Builder.getSections()
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


export const PropertyMap: React.FC<IEditMapProps> = ({ Builder, refresh }) => {
    const isEmptyMap = Builder.isEmpty()
    const allFloors = Builder.getPossibleFloors()
    const sections = Builder.getSections()
    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >
            {
                isEmptyMap ?
                    <Col span={24} style={{ marginTop: '60px', marginBottom: '60px' }}>
                        <EmptyBuildingBlock />
                    </Col>
                    :
                    <Col span={24} style={{ marginTop: '60px', whiteSpace: 'nowrap' }}>
                        <ScrollContainer className="scroll-container" style={{ marginTop: '60px', maxWidth: '1200px', maxHeight: '480px' }}>
                            <BuildingAxisY floors={allFloors} />
                            {
                                sections.map(section => {
                                    return (
                                        <PropertyMapSection
                                            key={section.id}
                                            section={section}
                                            Builder={Builder}
                                            refresh={refresh}
                                        >
                                            {
                                                allFloors.map(floorIndex => {
                                                    const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                    if (floorInfo && floorInfo.units.length) {
                                                        return (
                                                            <PropertyMapFloor key={floorInfo.id}>
                                                                {
                                                                    floorInfo.units.map(unit => {
                                                                        return (
                                                                            <PropertyMapUnit
                                                                                key={unit.id}
                                                                                unit={unit}
                                                                                Builder={Builder}
                                                                                refresh={refresh}
                                                                            ></PropertyMapUnit>
                                                                        )
                                                                    })
                                                                }
                                                            </PropertyMapFloor>
                                                        )
                                                    } else {
                                                        return (
                                                            <div key={`empty_${section.id}_${floorIndex}`} style={{ display: 'block', height: '40px', margin: '1px' }}>&nbsp;</div>
                                                        )
                                                    }
                                                })
                                            }
                                        </PropertyMapSection>
                                    )
                                })
                            }
                        </ScrollContainer>
                        {
                            <BuildingChooseSections Builder={Builder} refresh={refresh}></BuildingChooseSections>
                        }
                    </Col>
            }
        </Row>
    )
}


export const PropertyMapView: React.FC<IEditMapProps> = ({ Builder, refresh }) => {
    const isEmptyMap = Builder.isEmpty()
    const allFloors = Builder.getPossibleFloors()
    const sections = Builder.getSections()
    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >
            {
                isEmptyMap ?
                    <Col span={24} style={{ marginTop: '60px', marginBottom: '60px' }}>
                        <EmptyBuildingBlock />
                    </Col>
                    :
                    <Col span={24} style={{ marginTop: '60px', whiteSpace: 'nowrap' }}>
                        <ScrollContainer className="scroll-container" style={{ marginTop: '60px', maxWidth: '1200px', maxHeight: '480px' }}>
                            <BuildingAxisY floors={allFloors} />
                            {
                                sections.map(section => {
                                    return (
                                        <div key={section.id}
                                            style={{
                                                display: Builder.isSectionVisible(section.id) ? 'inline-block' : 'none',
                                                marginRight: '12px',
                                                textAlign: 'center',
                                            }}
                                        >{
                                                allFloors.map(floorIndex => {
                                                    const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                    if (floorInfo && floorInfo.units.length) {
                                                        return (
                                                            <div key={floorInfo.id} style={{ display: 'block' }}>
                                                                {
                                                                    floorInfo.units.map(unit => {
                                                                        return (
                                                                            <UnitButton
                                                                                key={unit.id}
                                                                                disabled
                                                                            >{unit.label}</UnitButton>                                                                
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        )
                                                    } else {
                                                        return (
                                                            <div key={`empty_${section.id}_${floorIndex}`} style={{ display: 'block', height: '40px', margin: '1px' }}>&nbsp;</div>
                                                        )
                                                    }
                                                })
                                            }
                                            <UnitButton
                                                secondary
                                                style={{ width: '100%', marginTop: '8px' }}
                                                disabled
                                            >{section.name}</UnitButton>
                                        </div>
                                    )
                                })
                            }
                        </ScrollContainer>
                        {
                            <BuildingChooseSections Builder={Builder} refresh={refresh}></BuildingChooseSections>
                        }
                    </Col>
            }
        </Row>
    )
}



const AddSectionForm: React.FC<IEditMapProps> = ({ Builder, refresh }) => {
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
        Builder.mapAddSection({ id: null, name, minFloor, maxFloor, unitsOnFloor })
        refresh()
        resetForm()
    }
    return (
        <>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{MinFloorLabel}</Typography.Text>
                    <InputNumber value={minFloor} onChange={v => setMinFloor(v)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{MaxFloorLabel}</Typography.Text>
                    <InputNumber value={maxFloor} onChange={v => setMaxFloor(v)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{UnitsOnFloorLabel}</Typography.Text>
                    <InputNumber value={unitsOnFloor} onChange={v => setUnitsOnFloor(v)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0}>
                <Button
                    key='submit'
                    secondary
                    onClick={handleFinish}
                    type='sberPrimary'
                    style={{ marginTop: '30px' }}
                    disabled={!(name.length && minFloor && maxFloor && unitsOnFloor)}
                > {AddLabel} </Button>
            </Col>
            <Col flex="auto" />
        </>
    )
}


const PropertyMapSection: React.FC<IPropertyMapSectionProps> = ({ section, children, Builder, refresh }) => {
    const chooseSection = (section) => {
        Builder.setSelectedSection(section)
        refresh()
    }
    return (
        <div
            style={{
                display: Builder.isSectionVisible(section.id) ? 'inline-block' : 'none',
                marginRight: '12px',
                textAlign: 'center',
            }}
        >
            {children}
            <UnitButton
                secondary
                style={{ width: '100%', marginTop: '8px' }}
                onClick={() => chooseSection(section)}
                selected={Builder.isSectionSelected(section.id)}
            >{section.name}</UnitButton>
        </div>
    )
}

const PropertyMapFloor: React.FC = ({ children }) => {
    return (
        <div style={{ display: 'block' }}>
            {children}
        </div>
    )
}

const PropertyMapUnit: React.FC<IPropertyMapUnitProps> = ({ Builder, refresh, unit }) => {
    const selectUnit = (unit) => {
        Builder.setSelectedUnit(unit)
        refresh()
    }
    return (
        <UnitButton
            onClick={() => selectUnit(unit)}
            selected={Builder.isUnitSelected(unit.id)}
        >{unit.label}</UnitButton>
    )
}


const UnitForm: React.FC<IEditMapProps> = ({ Builder, refresh }) => {
    const intl = useIntl()
    const mode = Builder.getEditMode()
    const SaveLabel = intl.formatMessage({ id: mode === 'editUnit' ? 'Save' : 'Add' })
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
        setFloors(Builder.getSectionFloorOptions(value))
        if (mode === 'editUnit') {
            const mapUnit = Builder.getSelectedUnit()
            if (value === mapUnit.section) {
                setFloor(mapUnit.floor)
            } else {
                setFloor(null)
            }
        }
    }

    useEffect(() => {
        setSections(Builder.getSectionOptions())
        const mapUnit = Builder.getSelectedUnit()
        if (mapUnit) {
            setFloors(Builder.getSectionFloorOptions(mapUnit.section))
            setLabel(mapUnit.label)
            setSection(mapUnit.section)
            setFloor(mapUnit.floor)
        }
    }, [Builder])

    const applyChanges = () => {
        const mapUnit = Builder.getSelectedUnit()
        Builder.mapUpdateUnit({ ...mapUnit, label, floor, section })
        refresh()
    }
    const deleteUnit = () => {
        const mapUnit = Builder.getSelectedUnit()
        Builder.mapRemoveUnit(mapUnit.id)
        refresh()
    }

    return (
        <>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={label} onChange={e => setLabel(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={updateSection} style={INPUT_STYLE} >
                        {sections.map((sec) => {
                            return <Option key={sec.id} value={sec.id}>{sec.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{FloorLabel}</Typography.Text>
                    <Select value={floor} onSelect={setFloor} style={INPUT_STYLE} >
                        {floors.map(floorOption => {
                            return <Option key={floorOption.id} value={floorOption.id}>{floorOption.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col flex={0}>
                <Button
                    secondary
                    onClick={applyChanges}
                    type='sberPrimary'
                    disabled={!(floor && section)}
                    style={{ marginTop: '30px' }}
                > {SaveLabel} </Button>
                {
                    mode === 'editUnit' ?
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
        </>
    )
}

const EditSectionForm: React.FC<IEditMapProps> = ({ Builder, refresh }) => {
    const section = Builder.getSelectedSection()
    const [name, setName] = useState('')
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })

    useEffect(() => {
        setName(section ? section.name : '')
    }, [section])

    const updateSection = () => {
        Builder.mapUpdateSection({ ...section, name })
        refresh()
    }

    const deleteSection = () => {
        Builder.mapRemoveSection(section.id)
        refresh()
    }

    return (
        <>
            <Col flex={0} >
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0} >
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


export {
    BuildingPanelEdit,
    BuildingPanelView,
}


