/** @jsx jsx */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { Col, Row, Typography, Input, Select, InputNumber, Space, Dropdown, Menu, RowProps } from 'antd'
import { css, jsx } from '@emotion/core'
import styled from '@emotion/styled'
import { fontSizes, colors, shadows } from '@condo/domains/common/constants/style'
import { DeleteFilled, DownOutlined, CloseOutlined } from '@ant-design/icons'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import { transitions } from '@condo/domains/common/constants/style'
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
} from './MapConstructor'
import {
    BuildingMap,
    BuildingUnit,
    BuildingSection,
} from '@app/condo/schema'
import { FullscreenWrapper, FullscreenHeader } from './Fullscreen'
import ScrollContainer from 'react-indiana-drag-scroll'
import {
    InterFloorIcon,
    FlatIcon,
    BasementIcon,
    FloorIcon,
    ParkingIcon,
    SectionIcon,
    CeilIcon,
} from '@condo/domains/common/components/icons/PropertyMapIcons'
import { MIN_SECTIONS_TO_SHOW_FILTER } from '@condo/domains/property/constants/property'


const { Option } = Select

const INPUT_STYLE = {
    width: '100%',
}

const TopRowCss = css`
  margin-top: 12px;
  position: relative;
  
  & .ant-select.ant-select-single .ant-select-selector {
    background-color: transparent;
    color: black;
    font-weight: 600;
    height: 40px;
  }
  & .ant-select.ant-select-single .ant-select-selection-search-input,
  & .ant-select.ant-select-single .ant-select-selector .ant-select-selection-item {
    height: 40px;
    line-height: 40px;
  }
  & .ant-select.ant-select-single .ant-select-arrow {
    color: black;
  }
  
  & .ant-select.ant-select-single.ant-select-open .ant-select-selector {
    background-color: black;
    color: white;
    border-color: transparent;
  }
  & .ant-select.ant-select-single.ant-select-open .ant-select-selection-item,
  & .ant-select.ant-select-single.ant-select-open .ant-select-arrow {
    color: white;
  }
`

const DropdownCss = css`
  height: 40px;
  padding: 6px 14px;
  
  &.ant-dropdown-open .anticon-down,
  &:hover .anticon-down {
    transition: ${transitions.allDefault};
    transform: rotate(180deg);
  }
`

const MenuCss = css`
  padding: 16px;

  & .ant-dropdown-menu-item {
    padding: 8px 12px;
  }
  & .ant-dropdown-menu-item,
  & .ant-dropdown-menu-item .ant-dropdown-menu-title-content {
    width: 100%;
  }
  & .ant-dropdown-menu-item:hover,
  & .ant-dropdown-menu-item-active {
    background-color: unset;
  }
  & .ant-dropdown-menu-item button {
    text-align: left;
    width: 100%;
    padding: 16px 18px;
    height: 60px;
    display: flex;
  }
  & .ant-dropdown-menu-item button svg {
    margin-right: 8px;
  }
`

interface ITopModalProps {
    visible: boolean
}

const TopModal = styled.div<ITopModalProps>`
  position: absolute;
  top: 60px;
  right: 24px;
  display: ${({ visible }) => visible ? 'flex' : 'none'};
  flex-direction: column;
  align-items: flex-start;
  border-radius: 12px;
  background-color: ${colors.white};
  padding: 20px;
  width: 315px;
  box-shadow: ${shadows.elevated};
  
  & .ant-row {
    width: 100%;
  }
  & > .ant-row:first-child {
    margin-bottom: 20px;
  }
`

const FormModalCss = css`
  & .ant-space,
  & button {
    width: 100%;
  }
`

export const AddressTopTextContainer = styled.div`
  font-size: ${fontSizes.content};
  line-height: 24px;
  font-weight: bold;
  padding: 8px;
`

interface IBuildingPanelEditProps {
    map: BuildingMap
    updateMap: (map: BuildingMap) => void
    handleSave(): void
    address?: string
    mapValidationError?: string
}

interface IBuildingPanelTopModalProps {
    visible: boolean
    title: string | null
    onClose: () => void
}

const BuildingPanelTopModal: React.FC<IBuildingPanelTopModalProps> = ({ visible, onClose, title, children }) => (
    <TopModal visible={visible}>
        <Row justify={'space-between'} align={'middle'}>
            <Col span={22}>
                {title !== null && (
                    <Typography.Title level={4} ellipsis>{title}</Typography.Title>
                )}
            </Col>
            <Col span={2}>
                <Button onClick={onClose} icon={<CloseOutlined />} size={'small'} type={'text'} />
            </Col>
        </Row>
        <Row>
            {children}
        </Row>
    </TopModal>
)

export const BuildingPanelEdit: React.FC<IBuildingPanelEditProps> = (props) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.floor' })
    const AddParking = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const AddInterFloorRoom = intl.formatMessage({ id: 'pages.condo.property.select.option.interfloorroom' })
    const AddBasement = intl.formatMessage({ id: 'pages.condo.property.select.option.basement' })
    const AddCeil = intl.formatMessage({ id: 'pages.condo.property.select.option.ceil' })
    const AddElementTitle = intl.formatMessage({ id: 'pages.condo.property.menu.MenuPlaceholder' })
    const AllSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.AllTitle' })
    const SectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.OptionPrefix' })

    const { mapValidationError, map, updateMap: updateFormField, handleSave, address } = props

    const { push, query: { id } } = useRouter()
    const builderFormRef = useRef<HTMLDivElement | null>(null)
    const [Map, setMap] = useState(new MapEdit(map, updateFormField))

    const mode = Map.editMode
    const sections = Map.sections

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

    const refresh = useCallback(() => {
        setMap(cloneDeep(Map))
    }, [Map])

    const changeMode = useCallback((mode) => {
        Map.editMode = mode
        refresh()
    }, [Map, refresh])


    const onCancel = useCallback(() => {
        push(`/property/${id}`)
    }, [id, push])

    const menuClick = useCallback((event) => {
        changeMode(event.key)
    }, [changeMode])

    const onModalCancel = useCallback(() => {
        changeMode(null)
    }, [changeMode])

    const onSelectSection = useCallback((id) => {
        Map.setVisibleSections(id)
        refresh()
    }, [Map, refresh])

    const menuOverlay = (
        <Menu css={MenuCss} onClick={menuClick}>
            <Menu.Item key={'addSection'}>
                <Button type={'sberDefaultGradient'} secondary icon={<SectionIcon />}>
                    {AddSection}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addFloor'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<FloorIcon />}>
                    {AddFloor}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addParking'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<ParkingIcon />}>
                    {AddParking}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addUnit'}>
                <Button type={'sberDefaultGradient'} secondary icon={<FlatIcon />}>
                    {AddUnit}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addInterFloorRoom'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<InterFloorIcon />}>
                    {AddInterFloorRoom}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addBasement'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<BasementIcon />}>
                    {AddBasement}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addCeil'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<CeilIcon />}>
                    {AddCeil}
                </Button>
            </Menu.Item>
        </Menu>
    )

    return (
        <FullscreenWrapper mode={'edit'} className='fullscreen'>
            <FullscreenHeader edit={true}>
                <Row css={TopRowCss} justify='space-between'>
                    {address && (
                        <Col flex={0}>
                            <Space size={20}>
                                <AddressTopTextContainer>{address}</AddressTopTextContainer>
                                {sections.length >= MIN_SECTIONS_TO_SHOW_FILTER && (
                                    <Select value={Map.visibleSections} onSelect={onSelectSection}>
                                        <Select.Option value={null} >{AllSectionsTitle}</Select.Option>
                                        {
                                            sections.map(section => (
                                                <Select.Option key={section.id} value={section.id}>
                                                    {SectionPrefixTitle}{section.name}
                                                </Select.Option>
                                            ))
                                        }
                                    </Select>
                                )}
                            </Space>
                        </Col>
                    )}
                    <Col flex={0}>
                        <Dropdown overlay={menuOverlay} css={DropdownCss}>
                            <Button type='sberBlack'>{AddElementTitle}<DownOutlined /></Button>
                        </Dropdown>
                    </Col>
                </Row>
                <BuildingPanelTopModal
                    visible={!isNull(mode)}
                    title={!isNull(mode) ?
                        intl.formatMessage({ id: `pages.condo.property.modal.title.${mode}` })
                        : null
                    }
                    onClose={onModalCancel}
                >
                    {
                        useMemo(() => ({
                            addSection: <AddSectionForm Builder={Map} refresh={refresh}/>,
                            addUnit: <UnitForm Builder={Map} refresh={refresh}/>,
                            editSection: <EditSectionForm Builder={Map} refresh={refresh}/>,
                            editUnit: <UnitForm Builder={Map} refresh={refresh}/>,
                        }[mode] || null), [mode, Map, refresh])
                    }
                </BuildingPanelTopModal>
            </FullscreenHeader>
            <Row align='middle' style={{ height: '100%' }}>
                {
                    <ChessBoard
                        Builder={Map}
                        refresh={refresh}
                        scrollToForm={scrollToForm}
                        isFullscreen
                    >
                        <Space size={20}>
                            <Button
                                key='submit'
                                onClick={handleSave}
                                type='sberDefaultGradient'
                                disabled={!address}
                            >
                                {SaveLabel}
                            </Button>
                            <Button
                                key='cancel'
                                onClick={onCancel}
                                type='sberDefaultGradient'
                                secondary
                            >
                                {CancelLabel}
                            </Button>
                        </Space>
                    </ChessBoard>
                }
                {
                    mapValidationError ? (
                        <Typography.Paragraph type="danger" style={{ width: '100%', textAlign: 'center' }}>
                            {mapValidationError}
                        </Typography.Paragraph>
                    ) : null
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

const CHESS_ROW_STYLE: React.CSSProperties = {
    width: '100%',
    textAlign: 'center',
}
const CHESS_COL_STYLE: React.CSSProperties = {
    paddingTop: '60px',
    paddingBottom: '60px',
}
const CHESS_SCROLL_HOLDER_STYLE: React.CSSProperties = {
    whiteSpace: 'nowrap',
    position: 'static',
    ...CHESS_COL_STYLE,
}
const CHESS_SCROLL_CONTAINER_STYLE: React.CSSProperties = {
    paddingBottom: '60px',
    width: '100%',
    overflowY: 'hidden',
}

const ChessBoard: React.FC<IChessBoardProps> = (props) => {
    const { Builder, refresh, scrollToForm, toggleFullscreen, isFullscreen, children } = props
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
        <Row align='bottom' style={CHESS_ROW_STYLE} >
            {
                Builder.isEmpty ?
                    <Col span={24} style={CHESS_COL_STYLE}>
                        <EmptyBuildingBlock mode="edit" />
                        <BuildingChooseSections
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                            Builder={Builder}
                            refresh={refresh}
                            mode="edit"
                        >
                            {children}
                        </BuildingChooseSections>
                    </Col>
                    :
                    <Col span={24} style={CHESS_SCROLL_HOLDER_STYLE}>
                        <ScrollContainer
                            className="scroll-container"
                            vertical={false}
                            horizontal={true}
                            style={CHESS_SCROLL_CONTAINER_STYLE}
                            hideScrollbars={false}
                            nativeMobileScroll={true}
                            innerRef={container}
                        >
                            {
                                !isEmpty(Builder.sections) && (
                                    <BuildingAxisY floors={Builder.possibleChosenFloors} />
                                )
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
                        <BuildingChooseSections
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                            Builder={Builder}
                            refresh={refresh}
                            mode="edit"
                        >
                            {children}
                        </BuildingChooseSections>
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
const MODAL_FORM_ROW_GUTTER: RowProps['gutter'] = [0, 20]
const MODAL_FORM_ROW_BUTTONS_GUTTER: RowProps['gutter'] = [0, 16]
const MODAL_FORM_BUTTON_STYLE: React.CSSProperties = { marginTop: '30px' }

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
    const isSubmitDisabled = !(name.length && minFloor && maxFloor && unitsOnFloor && !maxMinError)

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input allowClear={true} value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={8} className={maxMinError ? 'ant-form-item-has-error' : ''}>
                    <Typography.Text type={'secondary'}>{MinFloorLabel}</Typography.Text>
                    <InputNumber value={minFloor} onChange={setMinFloor} style={INPUT_STYLE} type={'number'}/>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={8} className={maxMinError ? 'ant-form-item-has-error' : ''}>
                    <Typography.Text type={'secondary'}>{MaxFloorLabel}</Typography.Text>
                    <InputNumber value={maxFloor} onChange={setMaxFloor} style={INPUT_STYLE} type={'number'} />
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{UnitsOnFloorLabel}</Typography.Text>
                    <InputNumber min={1} value={unitsOnFloor} onChange={setUnitsOnFloor} style={INPUT_STYLE} type={'number'}/>
                </Space>
            </Col>
            <Col span={24}>
                <Button
                    key='submit'
                    secondary
                    onClick={handleFinish}
                    type='sberDefaultGradient'
                    style={MODAL_FORM_BUTTON_STYLE}
                    disabled={isSubmitDisabled}
                > {AddLabel} </Button>
            </Col>
        </Row>
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
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
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
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input allowClear={true} value={label} onChange={e => setLabel(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={updateSection} style={INPUT_STYLE}>
                        {sections.map((sec) => {
                            return <Option key={sec.id} value={sec.id}>{sec.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={28}>
                    <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                        <Typography.Text type={'secondary'} >{FloorLabel}</Typography.Text>
                        <Select value={floor} onSelect={setFloor} style={INPUT_STYLE}>
                            {floors.map(floorOption => {
                                return <Option key={floorOption.id} value={floorOption.id}>{floorOption.label}</Option>
                            })}
                        </Select>
                    </Space>
                    <Row gutter={MODAL_FORM_ROW_BUTTONS_GUTTER}>
                        <Col span={24}>
                            <Button
                                secondary
                                onClick={applyChanges}
                                type='sberDefaultGradient'
                                disabled={!(floor && section)}
                            > {SaveLabel} </Button>
                        </Col>
                        {
                            mode === 'editUnit' && (
                                <Col span={24}>
                                    <Button
                                        secondary
                                        onClick={deleteUnit}
                                        type='sberDangerGhost'
                                        icon={<DeleteFilled />}
                                    >{DeleteLabel}</Button>
                                </Col>
                            )
                        }
                    </Row>
                </Space>
            </Col>
        </Row>
    )
}

interface IEditSectionFormProps {
    Builder: MapEdit
    refresh(): void
}

const EditSectionForm: React.FC<IEditSectionFormProps> = ({ Builder, refresh }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })

    const [name, setName] = useState('')
    const section = Builder.getSelectedSection()

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
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <Input value={name} placeholder={NamePlaceholderLabel} onChange={e => setName(e.target.value)} style={INPUT_STYLE} />
                </Space>
            </Col>
            <Col span={24}>
                <Button
                    secondary
                    onClick={updateSection}
                    type='sberDefaultGradient'
                >{SaveLabel}</Button>
            </Col>
            <Col span={24}>
                <Button
                    secondary
                    onClick={deleteSection}
                    type='sberDangerGhost'
                    icon={<DeleteFilled />}
                >{DeleteLabel}</Button>
            </Col>
        </Row>
    )
}
