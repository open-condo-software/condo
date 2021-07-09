import { useIntl } from '@core/next/intl'
import { Col, Row, Typography, Input, Select, InputNumber, Space } from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import { DeleteFilled } from '@ant-design/icons'
import cloneDeep from 'lodash/cloneDeep'
import {
    EmptyBuildingBlock,
    EmptyFloor,
    BuildingAxisY,
    BuildingChooseSections,
} from './BuildingPanelCommon'
import { Button } from '@condo/domains/common/components/Button'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import {
    MapEdit,
    BuildingMap,
    BuildingUnit,
    BuildingSection,
} from './MapConstructor'
import { FullscreenWrapper, FullscreenHeader } from './Fullscreen'

import ScrollContainer from 'react-indiana-drag-scroll'

const { Option } = Select

const INPUT_STYLE = {
    width: '136px',
}

interface IBuildingPanelEditProps {
    map: BuildingMap
    updateMap: (map: BuildingMap) => void
    handleSave(): void
    address?: string
    mapValidationError?: string
}

export const BuildingPanelEdit: React.FC<IBuildingPanelEditProps> = ({ mapValidationError, map, updateMap: updateFormField, handleSave, address }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const builderFormRef = useRef<HTMLDivElement | null>(null)
    const [Map, setMap] = useState(new MapEdit(map, updateFormField))
    const scrollToForm = () => {
        if (builderFormRef && builderFormRef.current) {
            const rect = builderFormRef.current.getBoundingClientRect()
            const isVisible =  (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            )
            if (!isVisible) {
                builderFormRef.current.scrollIntoView()
            }
        }
    }
    const refresh = () => setMap(cloneDeep(Map))
    const changeMode = (mode) => {
        Map.editMode = mode
        refresh()
    }
    const mode = Map.editMode

    const [isFullscreen, setFullscreen] = useState(false)

    const toggleFullscreen = () => {
        localStorage && localStorage.setItem('isFullscreen', String(!isFullscreen))
        setFullscreen(!isFullscreen)
    }

    useEffect(() => {
        setFullscreen(address && localStorage && localStorage.getItem('isFullscreen') === 'true')
    }, [])

    return (
        <FullscreenWrapper mode={'edit'} className={isFullscreen ? 'fullscreen' : ''}>
            <FullscreenHeader edit={true}>
                <Row style={{ paddingBottom: '39px', marginRight: '36px' }}>
                    {address && <Col flex={0} style={{ marginTop: '10px' }}><b>{address}</b></Col>}
                    <Col style={{ marginLeft: 'auto' }}>
                        <Button
                            key='submit'
                            onClick={handleSave}
                            type='sberPrimary'
                            disabled={!address}
                        >
                            {SaveLabel}
                        </Button>
                    </Col>
                </Row>
                <Row align='middle' style={{ paddingBottom: '24px' }} gutter={[45, 10]} ref={builderFormRef} justify='start'>
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
                            addSection: <AddSectionForm Builder={Map} refresh={refresh}/>,
                            addUnit: <UnitForm Builder={Map} refresh={refresh}/>,
                            editSection: <EditSectionForm Builder={Map} refresh={refresh}/>,
                            editUnit: <UnitForm Builder={Map} refresh={refresh}/>,
                        }[mode] || null
                    }
                </Row>
            </FullscreenHeader>
            <Row>
                {
                    Map.isEmpty
                        ?
                        <Col span={24}>
                            <EmptyBuildingBlock />
                        </Col>
                        :
                        <ChessBoard
                            Builder={Map}
                            refresh={refresh}
                            scrollToForm={scrollToForm}
                            toggleFullscreen={toggleFullscreen}
                            isFullscreen={isFullscreen}
                        />
                }
                {
                    <Typography.Paragraph type="danger" style={{ width: '100%', textAlign: 'center' }}>
                        {mapValidationError}
                    </Typography.Paragraph>
                }
            </Row>
        </FullscreenWrapper>
    )
}

interface IChessBoardProps {
    Builder: MapEdit
    refresh(): void
    scrollToForm(): void
    toggleFullscreen?(): void
    isFullscreen?: boolean
}


const ChessBoard: React.FC<IChessBoardProps> = ({ Builder, refresh, scrollToForm, toggleFullscreen, isFullscreen }) => {
    const container = useRef<HTMLElement | null>(null)
    useEffect(() => {
        if (container.current) {
            if (Builder.previewSectionId) {
                const { scrollWidth, clientWidth, scrollHeight, clientHeight } = container.current
                container.current.scrollTo(scrollWidth - clientWidth, scrollHeight - clientHeight)
            }
        }
    }, [Builder])

    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >
            {
                Builder.isEmpty ?
                    <Col span={24} style={{ paddingTop: '60px', paddingBottom: '60px' }}>
                        <EmptyBuildingBlock />
                    </Col>
                    :
                    <Col span={24} style={{ whiteSpace: 'nowrap', position: 'static' }}>
                        <ScrollContainer
                            className="scroll-container"
                            vertical={false}
                            horizontal={true}
                            style={{ paddingTop: '16px', width: '100%', overflowY: 'hidden' }}
                            hideScrollbars={false}
                            nativeMobileScroll={true}
                            innerRef={container}
                        >
                            {
                                Builder.visibleSections.length > 0 ? <BuildingAxisY floors={Builder.possibleChosenFloors} /> : null
                            }
                            {
                                Builder.sections.map(section => {
                                    return (
                                        <PropertyMapSection
                                            key={section.id}
                                            section={section}
                                            Builder={Builder}
                                            refresh={refresh}
                                            scrollToForm={scrollToForm}
                                        >
                                            {
                                                Builder.possibleChosenFloors.map(floorIndex => {
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
                                                                                scrollToForm={scrollToForm}
                                                                            />
                                                                        )
                                                                    })
                                                                }
                                                            </PropertyMapFloor>
                                                        )
                                                    } else {
                                                        return (
                                                            <EmptyFloor key={`empty_${section.id}_${floorIndex}`} />
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
                            <BuildingChooseSections
                                isFullscreen={isFullscreen}
                                toggleFullscreen={toggleFullscreen}
                                Builder={Builder}
                                refresh={refresh}
                            />
                        }
                    </Col>
            }
        </Row>
    )
}

interface IPropertyMapSectionProps {
    section: BuildingSection
    Builder: MapEdit
    refresh: () => void
    scrollToForm: () => void
}

const PropertyMapSection: React.FC<IPropertyMapSectionProps> = ({ section, children, Builder, refresh, scrollToForm }) => {
    const chooseSection = (section) => {
        Builder.setSelectedSection(section)
        if (Builder.getSelectedSection()) {
            scrollToForm()
        }
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
                disabled={section.preview}
                preview={section.preview}
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

interface IPropertyMapUnitProps {
    unit: BuildingUnit
    Builder: MapEdit
    refresh: () => void
    scrollToForm: () => void
}

const PropertyMapUnit: React.FC<IPropertyMapUnitProps> = ({ Builder, refresh, unit, scrollToForm }) => {
    const selectUnit = (unit) => {
        Builder.setSelectedUnit(unit)
        if (Builder.getSelectedUnit()) {
            scrollToForm()
        }
        refresh()
    }
    return (
        <UnitButton
            onClick={() => selectUnit(unit)}
            disabled={unit.preview}
            preview={unit.preview}
            selected={Builder.isUnitSelected(unit.id)}
        >{unit.label}</UnitButton>
    )
}


interface IAddSectionFormProps {
    Builder: MapEdit
    refresh(): void
}

const AddSectionForm: React.FC<IAddSectionFormProps> = ({ Builder, refresh }) => {
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

    const [maxMinError, setMaxMinError] = useState(false)

    const resetForm = () => {
        setName('')
        setMinFloor(null)
        setMaxFloor(null)
        setUnitsOnFloor(null)
    }

    useEffect(() => {
        if (minFloor && maxFloor) {
            setMaxMinError((maxFloor < minFloor))
        }
        if (name && minFloor && maxFloor && unitsOnFloor && !maxMinError) {
            Builder.addPreviewSection({ id: '', name, minFloor, maxFloor, unitsOnFloor })
            refresh()
        } else {
            Builder.removePreviewSection()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, minFloor, maxFloor, unitsOnFloor])

    const handleFinish = () => {
        Builder.removePreviewSection()
        Builder.addSection({ id: '', name, minFloor, maxFloor, unitsOnFloor })
        refresh()
        resetForm()
    }
    return (
        <>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input allowClear={true} value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8} className={maxMinError ? 'ant-form-item-has-error' : ''}>
                    <Typography.Text type={'secondary'}>{MinFloorLabel}</Typography.Text>
                    <InputNumber value={minFloor} onChange={setMinFloor} style={INPUT_STYLE} type={'number'}/>
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8} className={maxMinError ? 'ant-form-item-has-error' : ''}>
                    <Typography.Text type={'secondary'}>{MaxFloorLabel}</Typography.Text>
                    <InputNumber value={maxFloor} onChange={setMaxFloor} style={INPUT_STYLE} type={'number'} />
                </Space>
            </Col>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{UnitsOnFloorLabel}</Typography.Text>
                    <InputNumber min={1} value={unitsOnFloor} onChange={setUnitsOnFloor} style={INPUT_STYLE} type={'number'}/>
                </Space>
            </Col>
            <Col flex={0}>
                <Button
                    key='submit'
                    secondary
                    onClick={handleFinish}
                    type='sberPrimary'
                    style={{ marginTop: '30px' }}
                    disabled={!(name.length && minFloor && maxFloor && unitsOnFloor && !maxMinError)}
                > {AddLabel} </Button>
            </Col>
            <Col flex="auto" />
        </>
    )
}


interface IUnitFormProps {
    Builder: MapEdit
    refresh(): void
}

const UnitForm: React.FC<IUnitFormProps> = ({ Builder, refresh }) => {
    const intl = useIntl()
    const mode = Builder.editMode
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
        } else {
            setFloor(null)
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [Builder])

    const resetForm = () => {
        setLabel('')
        setFloor('')
        setSection('')
    }

    useEffect(() => {
        if (label && floor && section && mode === 'addUnit') {
            Builder.addPreviewUnit({ id: '', label, floor, section })
            refresh()
        } else {
            Builder.removePreviewUnit()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [label, floor, section, mode])


    const applyChanges = () => {
        const mapUnit = Builder.getSelectedUnit()
        if (mapUnit) {
            Builder.updateUnit({ ...mapUnit, label, floor, section })
        } else {
            Builder.removePreviewUnit()
            Builder.addUnit({ id: '', label, floor, section })
            resetForm()
        }
        refresh()
    }

    const deleteUnit = () => {
        const mapUnit = Builder.getSelectedUnit()
        Builder.removeUnit(mapUnit.id)
        refresh()
        resetForm()
    }

    return (
        <>
            <Col flex={0}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input allowClear={true} value={label} onChange={e => setLabel(e.target.value)} style={INPUT_STYLE} />
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

interface IEditSectionFormProps {
    Builder: MapEdit
    refresh(): void
}

const EditSectionForm: React.FC<IEditSectionFormProps> = ({ Builder, refresh }) => {
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
        Builder.updateSection({ ...section, name })
        refresh()
    }

    const deleteSection = () => {
        Builder.removeSection(section.id)
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
