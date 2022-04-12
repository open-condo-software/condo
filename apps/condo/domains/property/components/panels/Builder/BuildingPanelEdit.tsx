/** @jsx jsx */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseOutlined, DeleteFilled, DownOutlined } from '@ant-design/icons'
import { BuildingMap, BuildingSection, BuildingUnit, BuildingUnitType } from '@app/condo/schema'
import { Button } from '@condo/domains/common/components/Button'
import {
    FlatIcon,
    FloorIcon,
    InterFloorIcon,
    ParkingFloorIcon,
    ParkingIcon,
    ParkingPlaceIcon,
    SectionIcon,
} from '@condo/domains/common/components/icons/PropertyMapIcons'
import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MIN_SECTIONS_TO_SHOW_FILTER } from '@condo/domains/property/constants/property'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { IPropertyUIState } from '@condo/domains/property/utils/clientSchema/Property'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { css, jsx } from '@emotion/core'
import styled from '@emotion/styled'
import {
    Col,
    Dropdown,
    DropDownProps,
    Input,
    InputNumber,
    Menu,
    notification,
    Row,
    RowProps,
    Select,
    Space,
    Typography,
} from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import isEmpty from 'lodash/isEmpty'
import isNull from 'lodash/isNull'
import last from 'lodash/last'
import { useHotkeys } from 'react-hotkeys-hook'
import ScrollContainer from 'react-indiana-drag-scroll'
import {
    BuildingAxisY,
    BuildingChooseSections,
    BuildingViewModeSelect,
    EmptyBuildingBlock,
    EmptyFloor,
    MapSectionContainer, UnitTypeLegendItem,
} from './BuildingPanelCommon'

import { FullscreenHeader, FullscreenWrapper } from './Fullscreen'
import { MapEdit, MapViewMode } from './MapConstructor'

const { Option } = Select

const INPUT_STYLE = { width: '100%' }
const DROPDOWN_TRIGGER: DropDownProps['trigger'] = ['hover', 'click']
const DEBOUNCE_TIMEOUT = 800
const INSTANT_ACTIONS = ['addBasement', 'addAttic']

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
  padding: 12px 26px 12px 20px;
  
  & span:last-child {
    margin-left: 28px;
  }
`

const MenuCss = css`
  padding: 0;

  & .ant-dropdown-menu-item {
    padding: 4px 16px;
  }
  & .ant-dropdown-menu-item:first-child {
    padding: 16px 16px 4px 16px;
  }
  & .ant-dropdown-menu-item:last-child {
    padding: 4px 16px 16px 16px;
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
    padding: 0 18px;
    height: 60px;
    display: flex;
    align-items: center;
    border: 1px solid ${colors.backgroundWhiteSecondary};
  }
  & .ant-dropdown-menu-item button svg {
    margin-right: 8px;
    z-index: 1;
  }
`

interface ITopModalProps {
    visible: boolean
}

const TopModal = styled.div<ITopModalProps>`
  position: absolute;
  top: 10px;
  right: 22px;
  display: ${({ visible }) => visible ? 'flex' : 'none'};
  flex-direction: column;
  align-items: flex-start;
  border-radius: 12px;
  background-color: ${colors.white};
  padding: 24px;
  width: 315px;
  box-shadow: ${shadows.main};
  z-index: 4;
  
  & .ant-row {
    width: 100%;
  }
  & > .ant-row:first-child {
    margin-bottom: 20px;
  }
  & .ant-row .ant-input-number {
    border: 1px solid #D0D3E5;
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
    property?: IPropertyUIState
    mapValidationError?: string
}

interface IBuildingPanelTopModalProps {
    visible: boolean
    title: string | null
    onClose: () => void
}
const BUILDING_TOP_MODAL_TITLE_STYLE: React.CSSProperties = { fontWeight: 700 }

const BuildingPanelTopModal: React.FC<IBuildingPanelTopModalProps> = ({ visible, onClose, title, children }) => (
    <TopModal visible={visible}>
        <Row justify={'space-between'} align={'top'}>
            <Col span={22}>
                {title !== null && (
                    <Typography.Title level={4} style={BUILDING_TOP_MODAL_TITLE_STYLE}>{title}</Typography.Title>
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

const UNIT_TYPE_ROW_STYLE: React.CSSProperties = { marginTop: '28px', paddingLeft: '8px' }
const UNIT_TYPE_COL_STYLE: React.CSSProperties = { backgroundColor: colors.backgroundLightGrey, opacity: 0.9 }
const UNIT_TYPE_ROW_GUTTER: RowProps['gutter'] = [42, 0]

export const BuildingPanelEdit: React.FC<IBuildingPanelEditProps> = (props) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })
    const ChangesSaved = intl.formatMessage({ id: 'ChangesSaved' })
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.floor' })
    const AddParkingLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const AddInterFloorRoom = intl.formatMessage({ id: 'pages.condo.property.select.option.interfloorroom' })
    const AddParkingFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.parkingFloor' })
    const AddParkingPlace = intl.formatMessage({ id: 'pages.condo.property.select.option.parkingPlace' })
    const AddElementTitle = intl.formatMessage({ id: 'pages.condo.property.menu.MenuPlaceholder' })
    const AllSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.AllTitle' })
    const AllParkingSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.ParkingSectionSelect.AllTitle' })
    const SectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.OptionPrefix' })
    const ParkingSectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.ParkingSectionSelect.OptionPrefix' })
    const MapValidationError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const { mapValidationError, map, updateMap: updateFormField, handleSave, property } = props

    const quickSave = Property.useUpdate({}, () => notification.success({
        message: ChangesSaved,
        placement: 'bottomRight',
    }))
    const debouncedQuickSave = useCallback(
        debounce(() => quickSave({ map }, property), DEBOUNCE_TIMEOUT),
        [map, property]
    )

    const { push, query: { id } } = useRouter()
    const builderFormRef = useRef<HTMLDivElement | null>(null)
    const [mapEdit, setMapEdit] = useState(new MapEdit(map, updateFormField))

    const mode = mapEdit.editMode
    const sections = mapEdit.sections
    const address = get(property, 'address')

    const quickSaveCallback = useCallback((event) => {
        event.preventDefault()

        if (mapEdit.validate()) {
            debouncedQuickSave()
            return
        }
        notification.error({
            message: MapValidationError,
            placement: 'bottomRight',
        })
    }, [debouncedQuickSave, mapEdit])

    useHotkeys('ctrl+s', quickSaveCallback, [map, property])

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
        setMapEdit(cloneDeep(mapEdit))
    }, [mapEdit])

    const changeMode = useCallback((mode) => {
        mapEdit.editMode = mode
        refresh()
    }, [mapEdit, refresh])


    const onCancel = useCallback(() => {
        push(`/property/${id}`)
    }, [id, push])

    const menuClick = useCallback((event) => {
        if (INSTANT_ACTIONS.includes(event.key)) {
            if (isFunction(mapEdit[event.key])) mapEdit[event.key]()
            return
        }
        changeMode(event.key)
    }, [changeMode])

    const onModalCancel = useCallback(() => {
        changeMode(null)
    }, [changeMode])

    const onSelectSection = useCallback((id) => {
        mapEdit.setVisibleSections(id)
        refresh()
    }, [mapEdit, refresh])

    const onSelectParkingSection = useCallback((id) => {
        mapEdit.setVisibleParkingSections(id)
        refresh()
    }, [mapEdit, refresh])

    const onViewModeChange = useCallback((option) => {
        mapEdit.viewMode = option.target.value
        refresh()
    }, [mapEdit, refresh])

    const menuOverlay = useMemo(() => (
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
            <Menu.Item key={'addUnit'}>
                <Button type={'sberDefaultGradient'} secondary disabled={mapEdit.isEmptySections} icon={<FlatIcon />}>
                    {AddUnit}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addInterFloorRoom'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<InterFloorIcon />}>
                    {AddInterFloorRoom}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addParking'}>
                <Button type={'sberDefaultGradient'} secondary icon={<ParkingIcon />}>
                    {AddParkingLabel}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addParkingFloor'}>
                <Button type={'sberDefaultGradient'} secondary disabled icon={<ParkingFloorIcon />}>
                    {AddParkingFloor}
                </Button>
            </Menu.Item>
            <Menu.Item key={'addParkingUnit'}>
                <Button type={'sberDefaultGradient'} secondary disabled={mapEdit.isEmptyParking} icon={<ParkingPlaceIcon />}>
                    {AddParkingPlace}
                </Button>
            </Menu.Item>
        </Menu>
    ), [menuClick])

    const showViewModeSelect = !mapEdit.isEmptySections && !mapEdit.isEmptyParking
    const showSectionFilter = mapEdit.viewMode === MapViewMode.section && sections.length >= MIN_SECTIONS_TO_SHOW_FILTER
    const showParkingFilter = mapEdit.viewMode === MapViewMode.parking && mapEdit.parking.length >= MIN_SECTIONS_TO_SHOW_FILTER

    return (
        <FullscreenWrapper mode={'edit'} className='fullscreen'>
            <FullscreenHeader edit={true}>
                <Row css={TopRowCss} justify='space-between'>
                    {address && (
                        <Col flex={0}>
                            <Space size={20}>
                                <AddressTopTextContainer>{address}</AddressTopTextContainer>
                                {showSectionFilter && (
                                    <Select value={mapEdit.visibleSections} onSelect={onSelectSection}>
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
                                {showParkingFilter && (
                                    <Select value={mapEdit.visibleParkingSections} onSelect={onSelectParkingSection}>
                                        <Select.Option value={null} >{AllParkingSectionsTitle}</Select.Option>
                                        {
                                            mapEdit.parking.map(parkingSection => (
                                                <Select.Option key={parkingSection.id} value={parkingSection.id}>
                                                    {ParkingSectionPrefixTitle}{parkingSection.name}
                                                </Select.Option>
                                            ))
                                        }
                                    </Select>
                                )}
                            </Space>
                        </Col>
                    )}
                    <Col flex={0}>
                        <Space size={20}>
                            {
                                showViewModeSelect && (
                                    <BuildingViewModeSelect
                                        value={mapEdit.viewMode}
                                        onChange={onViewModeChange}
                                        disabled={mapEdit.editMode !== null}
                                    />
                                )
                            }
                            <Dropdown
                                trigger={DROPDOWN_TRIGGER}
                                overlay={menuOverlay}
                                css={DropdownCss}
                                mouseEnterDelay={0}
                            >
                                <Button type='sberDefaultGradient' secondary>{AddElementTitle}<span>...</span></Button>
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>
                <Row
                    style={UNIT_TYPE_ROW_STYLE}

                    hidden={mapEdit.viewMode === MapViewMode.parking}
                >
                    <Col flex={0} style={UNIT_TYPE_COL_STYLE}>
                        <Row gutter={UNIT_TYPE_ROW_GUTTER}>
                            {mapEdit.getUnitTypeOptions()
                                .filter(unitType => unitType !== BuildingUnitType.Flat)
                                .map((unitType, unitTypeKey) => (
                                    <Col key={unitTypeKey} flex={0}>
                                        <UnitTypeLegendItem unitType={unitType}>
                                            {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                                        </UnitTypeLegendItem>
                                    </Col>
                                ))}
                        </Row>
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
                            addSection: <AddSectionForm builder={mapEdit} refresh={refresh}/>,
                            addUnit: <UnitForm builder={mapEdit} refresh={refresh}/>,
                            editSection: <EditSectionForm builder={mapEdit} refresh={refresh}/>,
                            editUnit: <UnitForm builder={mapEdit} refresh={refresh}/>,
                            addParking: <AddParkingForm builder={mapEdit} refresh={refresh} />,
                            addParkingUnit: <ParkingUnitForm builder={mapEdit} refresh={refresh} />,
                            editParkingUnit: <ParkingUnitForm builder={mapEdit} refresh={refresh} />,
                            editParking: <EditParkingForm builder={mapEdit} refresh={refresh} />,
                        }[mode] || null), [mode, mapEdit, refresh])
                    }
                </BuildingPanelTopModal>
            </FullscreenHeader>
            <Row align='middle' style={{ height: '100%' }}>
                {
                    <ChessBoard
                        builder={mapEdit}
                        refresh={refresh}
                        scrollToForm={scrollToForm}
                        isFullscreen
                    >
                        <Space size={20} align={'center'}>
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
                            {
                                mapValidationError ? (
                                    <Typography.Paragraph type="danger" style={{ width: '100%', textAlign: 'center' }}>
                                        {mapValidationError}
                                    </Typography.Paragraph>
                                ) : null
                            }
                        </Space>
                    </ChessBoard>
                }
            </Row>
        </FullscreenWrapper>
    )
}

interface IChessBoardProps {
    builder: MapEdit
    refresh(): void
    scrollToForm(): void
    toggleFullscreen?(): void
    isFullscreen?: boolean
}

const CHESS_ROW_STYLE: React.CSSProperties = {
    width: '100%',
    textAlign: 'center',
}
const CHESS_SCROLL_HOLDER_STYLE: React.CSSProperties = {
    whiteSpace: 'nowrap',
    position: 'static',
    paddingBottom: '10px',
}
const CHESS_SCROLL_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    height: 'calc(100vh - 150px)',
    paddingBottom: '8px',
    display: 'flex',
    alignItems: 'center',
}
const CHESS_SCROLL_CONTAINER_INNER_STYLE: React.CSSProperties = {
    margin: 'auto',
    paddingBottom: '16px',
}
const SCROLL_CONTAINER_EDIT_PADDING = '315px'
const MENU_COVER_MAP_WIDTH = 800

const ChessBoard: React.FC<IChessBoardProps> = (props) => {
    const { builder, refresh, scrollToForm, toggleFullscreen, isFullscreen, children } = props
    const container = useRef<HTMLElement | null>(null)

    useEffect(() => {
        const childTotalWidth = container.current !== null
            ? container.current.querySelector('div').clientWidth
            : 0
        const shouldMoveContainer = builder.editMode !== null && !builder.isEmpty && childTotalWidth > MENU_COVER_MAP_WIDTH

        if (shouldMoveContainer) {
            container.current.style.paddingRight = SCROLL_CONTAINER_EDIT_PADDING
        } else {
            if (container.current !== null) container.current.style.paddingRight = '0px'
        }

        if (container.current && container.current.style.paddingRight !== '0px') {
            const lastSectionSelected = builder.editMode === 'editSection'
                && get(builder.getSelectedSection(), 'index') === builder.lastSectionIndex
            const lastParkingSelected = builder.editMode === 'editParking'
                && get(builder.getSelectedParking(), 'index') === builder.lastParkingIndex
            const addUnitToLastSection = builder.editMode === 'addUnit'
                && last(builder.sections).floors
                    .flatMap(floor => floor.units.map(unit => unit.id))
                    .includes(String(builder.previewUnitId))
            const addParkingUnitToLastSection = builder.editMode === 'addParkingUnit'
                && last(builder.parking).floors
                    .flatMap(floor => floor.units.map(unit => unit.id))
                    .includes(String(builder.previewParkingUnitId))
            const editUnitAtLastSection = builder.editMode === 'editUnit'
                && get(builder.getSelectedUnit(), 'sectionIndex') === builder.lastSectionIndex
            const editParkingUnitAtLastSection = builder.editMode === 'editParkingUnit'
                && get(builder.getSelectedParkingUnit(), 'sectionIndex') === builder.lastParkingIndex

            if (lastSectionSelected
                || lastParkingSelected
                || addParkingUnitToLastSection
                || addUnitToLastSection
                || editUnitAtLastSection
                || editParkingUnitAtLastSection) {
                const { scrollWidth, clientWidth, scrollHeight, clientHeight } = container.current
                container.current.scrollTo(scrollWidth - clientWidth, scrollHeight - clientHeight)
            }
        }
    }, [builder])

    return (
        <Row align='bottom' style={CHESS_ROW_STYLE} >
            {
                builder.isEmpty ?
                    <Col span={24}>
                        <EmptyBuildingBlock mode="edit" />
                        <BuildingChooseSections
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                            builder={builder}
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
                            <div style={CHESS_SCROLL_CONTAINER_INNER_STYLE}>
                                {
                                    builder.viewMode === MapViewMode.section
                                        ? !builder.isEmptySections && (
                                            <BuildingAxisY floors={builder.possibleChosenFloors} />
                                        )
                                        : !builder.isEmptyParking && (
                                            <BuildingAxisY floors={builder.possibleChosenParkingFloors} />
                                        )
                                }
                                {
                                    builder.viewMode === MapViewMode.section
                                        ? builder.sections.map(section => (
                                            <PropertyMapSection
                                                key={section.id}
                                                section={section}
                                                builder={builder}
                                                refresh={refresh}
                                                scrollToForm={scrollToForm}
                                            >
                                                <PropertyMapFloorContainer
                                                    builder={builder}
                                                    section={section}
                                                    refresh={refresh}
                                                    scrollToForm={scrollToForm}
                                                />
                                            </PropertyMapSection>

                                        ))
                                        : builder.parking.map(parkingSection => (
                                            <PropertyMapSection
                                                key={parkingSection.id}
                                                section={parkingSection}
                                                builder={builder}
                                                refresh={refresh}
                                                scrollToForm={scrollToForm}
                                                isParkingSection
                                            >
                                                <PropertyMapFloorContainer
                                                    builder={builder}
                                                    section={parkingSection}
                                                    refresh={refresh}
                                                    scrollToForm={scrollToForm}
                                                    isParkingSection
                                                />
                                            </PropertyMapSection>
                                        ))
                                }
                            </div>
                        </ScrollContainer>
                        <BuildingChooseSections
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                            builder={builder}
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
    builder: MapEdit
    refresh: () => void
    scrollToForm: () => void
    isParkingSection?: boolean
}
const FULL_SIZE_UNIT_STYLE: React.CSSProperties = { width: '100%', marginTop: '8px', display: 'block' }
const SECTION_UNIT_STYLE: React.CSSProperties = { ...FULL_SIZE_UNIT_STYLE, zIndex: 2 }

const PropertyMapSection: React.FC<IPropertyMapSectionProps> = (props) => {
    const { section, children, builder, refresh, scrollToForm, isParkingSection = false } = props
    const intl = useIntl()
    const SectionTitle = isParkingSection
        ? `${intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })} ${section.name}`
        : `${intl.formatMessage({ id: 'pages.condo.property.section.Name' })} ${section.name}`

    const chooseSection = useCallback(() => {
        if (isParkingSection) {
            builder.setSelectedParking(section)
            if (builder.getSelectedParking()) {
                scrollToForm()
            }
        } else {
            builder.setSelectedSection(section)
            if (builder.getSelectedSection()) {
                scrollToForm()
            }
        }
        refresh()
    }, [builder, refresh, scrollToForm, section, isParkingSection])

    const isSectionSelected = isParkingSection
        ? builder.isParkingSelected(section.id)
        : builder.isSectionSelected(section.id)

    const isSectionVisible = isParkingSection
        ? builder.isParkingSectionVisible(section.id)
        : builder.isSectionVisible(section.id)

    return (
        <MapSectionContainer visible={isSectionVisible}>
            {children}
            <UnitButton
                secondary
                style={SECTION_UNIT_STYLE}
                disabled={section.preview}
                preview={section.preview}
                onClick={chooseSection}
                selected={isSectionSelected}
            >{SectionTitle}</UnitButton>
        </MapSectionContainer>
    )
}

const PropertyMapFloorContainer: React.FC<IPropertyMapSectionProps> = (props) => {
    const { isParkingSection, refresh, builder, section, scrollToForm } = props
    const sectionFloors = isParkingSection ? builder.possibleChosenParkingFloors : builder.possibleChosenFloors
    return (
        <>
            {
                sectionFloors.map(floorIndex => {
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
                                                builder={builder}
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
        </>
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
    builder: MapEdit
    refresh: () => void
    scrollToForm: () => void
}

const PropertyMapUnit: React.FC<IPropertyMapUnitProps> = ({ builder, refresh, unit, scrollToForm }) => {
    const selectUnit = useCallback(() => {
        if (unit.unitType !== BuildingUnitType.Parking) {
            builder.setSelectedUnit(unit)
            if (builder.getSelectedUnit()) {
                scrollToForm()
            }
        } else {
            builder.setSelectedParkingUnit(unit)
            if (builder.getSelectedParkingUnit()) {
                scrollToForm()
            }
        }
        refresh()
    }, [refresh, unit, builder, scrollToForm])

    const isUnitSelected = unit.unitType === BuildingUnitType.Flat
        ? builder.isUnitSelected(unit.id)
        : builder.isParkingUnitSelected(unit.id)

    return (
        <UnitButton
            onClick={selectUnit}
            disabled={unit.preview}
            preview={unit.preview}
            selected={isUnitSelected}
            unitType={unit.unitType}
        >{unit.label}</UnitButton>
    )
}


interface IAddSectionFormProps {
    builder: MapEdit
    refresh(): void
}
const MODAL_FORM_ROW_GUTTER: RowProps['gutter'] = [0, 24]
const MODAL_FORM_ROW_BUTTONS_GUTTER: RowProps['gutter'] = [0, 16]
const MODAL_FORM_BUTTON_STYLE: React.CSSProperties = { marginTop: '12px' }

const AddSectionForm: React.FC<IAddSectionFormProps> = ({ builder, refresh }) => {
    const intl = useIntl()
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.numberOfSection' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const FloorCountLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.floorCount' })
    const UnitsOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.unitsOnFloor' })
    const CreateNewLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.create' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })
    const CopyLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.copy' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const ShowMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.showMinFloor' })
    const HideMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.hideMinFloor' })

    const [minFloor, setMinFloor] = useState(1)
    const [floorCount, setFloorCount] = useState(null)
    const [unitsOnFloor, setUnitsOnFloor] = useState(null)
    const [copyId, setCopyId] = useState<string | null>(null)
    const [minFloorHidden, setMinFloorHidden] = useState<boolean>(true)
    const [sectionName, setSectionName] = useState<string>(builder.nextSectionName)
    const [unitType, setUnitType] = useState<BuildingUnitType>(BuildingUnitType.Flat)

    const resetForm = useCallback(() => {
        setMinFloor(1)
        setFloorCount(null)
        setUnitsOnFloor(null)
    }, [])

    const toggleMinFloorVisible = useCallback(() => {
        if (!minFloorHidden) {
            setMinFloor(1)
        }
        setMinFloorHidden(!minFloorHidden)
    }, [minFloorHidden])

    const setMinFloorValue = useCallback((value) => { setMinFloor(value) }, [])
    const setFloorCountValue = useCallback((value) => { setFloorCount(value) }, [])
    const maxFloorValue = useMemo(() => {
        if (floorCount === 1) return minFloor
        if (minFloor > 0) return floorCount + minFloor - 1
        return floorCount + minFloor
    }, [floorCount, minFloor])

    useEffect(() => {
        if (minFloor && floorCount && unitsOnFloor && sectionName) {
            builder.addPreviewSection({
                id: '',
                name: sectionName,
                minFloor,
                maxFloor: maxFloorValue,
                unitsOnFloor,
            }, unitType)
            refresh()
        } else {
            builder.removePreviewSection()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minFloor, floorCount, unitsOnFloor, sectionName, unitType])

    useEffect(() => {
        if (copyId !== null) {
            builder.addPreviewCopySection(copyId)
        }
    }, [builder, copyId])

    const handleFinish = useCallback(() => {
        builder.removePreviewSection()
        if (copyId === null) {
            builder.addSection({ id: '', name: sectionName, minFloor, maxFloor: maxFloorValue, unitsOnFloor }, unitType)
            setSectionName(builder.nextSectionName)
        } else {
            builder.addCopySection(copyId)
        }

        refresh()
        resetForm()
    }, [refresh, resetForm, builder, sectionName, minFloor, unitsOnFloor, unitType, copyId, maxFloorValue])

    const setSectionNameValue = useCallback((value) => setSectionName(value ? value.toString() : ''), [])
    const isSubmitDisabled = copyId !== null ? false : !(minFloor && floorCount && unitsOnFloor)
    const isCreateColumnsHidden = copyId !== null
    const iconRotation = minFloorHidden ? 0 : 180
    const minFloorMargin = minFloorHidden ? '-28px' : 0

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Select value={copyId} onSelect={setCopyId} disabled={builder.isEmptySections}>
                    <Select.Option key={'create'} value={null}>{CreateNewLabel}</Select.Option>
                    {builder.map.sections.filter(section => !section.preview).map(section => (
                        <Select.Option
                            key={`copy-${section.id}`}
                            value={section.id}
                        >
                            {CopyLabel}{section.name}
                        </Select.Option>
                    ))}
                </Select>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{SectionNameLabel}</Typography.Text>
                    <InputNumber
                        value={sectionName}
                        min={1}
                        onChange={setSectionNameValue}
                        style={INPUT_STYLE}
                        type={'number'}
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{FloorCountLabel}</Typography.Text>
                    <InputNumber value={floorCount} onChange={setFloorCountValue} min={1} style={INPUT_STYLE} type={'number'} />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{UnitTypeLabel}</Typography.Text>
                    <Select value={unitType} onSelect={setUnitType}>
                        {Object.values(BuildingUnitType)
                            .filter(unitType => unitType !== BuildingUnitType.Parking)
                            .map((unitType, key) => (
                                <Select.Option key={`${key}-${unitType}`} value={unitType} title={unitType}>
                                    {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                                </Select.Option>
                            ))}
                    </Select>
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden} style={{ marginTop: minFloorMargin }}>
                <Space
                    direction={'vertical'}
                    size={8}
                    hidden={minFloorHidden}
                >
                    <Typography.Text type={'secondary'}>{MinFloorLabel}</Typography.Text>
                    <InputNumber
                        value={minFloor}
                        onChange={setMinFloorValue}
                        style={INPUT_STYLE}
                        type={'number'}
                    />
                </Space>
                <Typography.Text onClick={toggleMinFloorVisible} style={TEXT_BUTTON_STYLE}>
                    {minFloorHidden ? ShowMinFloor : HideMinFloor} <DownOutlined rotate={iconRotation}/>
                </Typography.Text>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
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
    builder: MapEdit
    refresh(): void
}
const IS_NUMERIC_REGEXP = /^\d+$/
const BUTTON_SPACE_SIZE = 40

const UnitForm: React.FC<IUnitFormProps> = ({ builder, refresh }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: mode === 'editUnit' ? 'Save' : 'Add' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.unit.Name' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const UnitTypeLabel = intl.formatMessage({ id: 'pages.condo.property.modal.UnitType' })

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')
    const [unitType, setUnitType] = useState<BuildingUnitType>(BuildingUnitType.Flat)

    const [sections, setSections] = useState([])
    const [floors, setFloors] = useState([])

    const updateSection = (value) => {
        setSection(value)
        setFloors(builder.getSectionFloorOptions(value))
        if (mode === 'editUnit') {
            const mapUnit = builder.getSelectedUnit()
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
        setSections(builder.getSectionOptions())
        const mapUnit = builder.getSelectedUnit()
        if (mapUnit) {
            setFloors(builder.getSectionFloorOptions(mapUnit.section))
            setLabel(mapUnit.label)
            setSection(mapUnit.section)
            setFloor(mapUnit.floor)
            setUnitType(mapUnit.unitType)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [builder])

    useEffect(() => {
        if (label && floor && section && unitType && mode === 'addUnit') {
            builder.addPreviewUnit({ id: '', label, floor, section, unitType })
            refresh()
        } else {
            builder.removePreviewUnit()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [label, floor, section, mode, unitType])

    const resetForm = useCallback(() => {
        setLabel('')
        setFloor('')
        setSection('')
    }, [])

    const applyChanges = useCallback(() => {
        const mapUnit = builder.getSelectedUnit()
        if (mapUnit) {
            builder.updateUnit({ ...mapUnit, label, floor, section, unitType })
        } else {
            builder.removePreviewUnit()
            builder.addUnit({ id: '', label, floor, section, unitType })
            resetForm()
        }
        refresh()
    }, [builder, refresh, resetForm, label, floor, section, unitType])

    const deleteUnit = useCallback(() => {
        const mapUnit = builder.getSelectedUnit()
        builder.removeUnit(mapUnit.id, IS_NUMERIC_REGEXP.test(mapUnit.label))
        refresh()
        resetForm()
    }, [resetForm, refresh, builder])

    const updateUnitType = useCallback((value) => {
        setUnitType(value)
    }, [])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text>{UnitTypeLabel}</Typography.Text>
                    <Select
                        value={intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                        onSelect={updateUnitType}
                        style={INPUT_STYLE}
                    >
                        {Object.values(BuildingUnitType)
                            .filter(unitType => unitType !== BuildingUnitType.Parking)
                            .map((unitType, unitTypeIndex) => (
                                <Option key={unitTypeIndex} value={unitType}>{intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}</Option>
                            ))}
                    </Select>
                </Space>
            </Col>
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
                <Space direction={'vertical'} size={BUTTON_SPACE_SIZE}>
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
    builder: MapEdit
    refresh(): void
}
const MODAL_FORM_EDIT_GUTTER: RowProps['gutter'] = [0, 40]
const MODAL_FORM_BUTTON_GUTTER: RowProps['gutter'] = [0, 16]

const EditSectionForm: React.FC<IEditSectionFormProps> = ({ builder, refresh }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name' })
    const NamePlaceholderLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.name.placeholder' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })

    const [name, setName] = useState<string>('')

    const section = builder.getSelectedSection()

    useEffect(() => {
        setName(section ? section.name : '')
    }, [section])

    const setNameValue = useCallback((value) => setName(value ? value.toString() : ''), [])

    const updateSection = useCallback(() => {
        builder.updateSection({ ...section, name })
        refresh()
    }, [builder, refresh, name, section])

    const deleteSection = useCallback(() => {
        builder.removeSection(section.id)
        refresh()
    }, [builder, refresh, section])

    return (
        <Row gutter={MODAL_FORM_EDIT_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <InputNumber
                        value={name}
                        min={1}
                        placeholder={NamePlaceholderLabel}
                        onChange={setNameValue}
                        style={INPUT_STYLE}
                    />
                </Space>
            </Col>
            <Row gutter={MODAL_FORM_BUTTON_GUTTER}>
                <Col span={24}>
                    <Button
                        secondary
                        onClick={updateSection}
                        type='sberDefaultGradient'
                        disabled={isEmpty(name)}
                    >{SaveLabel}</Button>
                </Col>
                <Col span={24}>
                    <Button
                        secondary
                        onClick={deleteSection}
                        type='sberDangerGhost'
                        icon={<DeleteFilled />}
                        style={FULL_SIZE_UNIT_STYLE}
                    >{DeleteLabel}</Button>
                </Col>
            </Row>
        </Row>
    )
}

interface IAddParkingFormProps {
    builder: MapEdit
    refresh(): void
}
const TEXT_BUTTON_STYLE: React.CSSProperties = { cursor: 'pointer', marginTop: '8px', display: 'block' }

const AddParkingForm: React.FC<IAddParkingFormProps> = ({ builder, refresh }) => {
    const intl = useIntl()
    const ParkingNameLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.numberOfParkingSection' })
    const MinFloorLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.minfloor' })
    const FloorCountLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.floorCount' })
    const ParkingOnFloorLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.parkingOnFloor' })
    const ShowMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.showMinFloor' })
    const HideMinFloor = intl.formatMessage({ id: 'pages.condo.property.parking.form.hideMinFloor' })
    const AddLabel = intl.formatMessage({ id: 'Add' })
    const CreateNewLabel = intl.formatMessage({ id: 'pages.condo.property.section.form.mode.create' })
    const CopyLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.mode.copy' })

    const [minFloor, setMinFloor] = useState<number>(1)
    const [floorCount, setFloorCount] = useState<number | null>(null)
    const [unitsOnFloor, setUnitsOnFloor] = useState(null)
    const [minFloorHidden, setMinFloorHidden] = useState<boolean>(true)
    const [copyId, setCopyId] = useState<string | null>(null)
    const [parkingName, setParkingName] = useState<string>(builder.nextParkingName)

    const toggleMinFloorVisible = useCallback(() => {
        setMinFloor(1)
        setMinFloorHidden(!minFloorHidden)
    }, [minFloorHidden])
    const setMinFloorValue = useCallback((value) => { setMinFloor(value) }, [])
    const setFloorCountValue = useCallback((value) => { setFloorCount(value) }, [])
    const setParkingNameValue = useCallback((value) => setParkingName(value ? value.toString() : ''), [])
    const maxFloorValue = useMemo(() => {
        if (floorCount === 1) return minFloor
        if (minFloor > 0) return floorCount + minFloor - 1
        return floorCount + minFloor
    }, [floorCount, minFloor])

    const resetForm = useCallback(() => {
        setMinFloor(1)
        setFloorCount(null)
        setUnitsOnFloor(null)
    }, [])

    useEffect(() => {
        if (minFloor && floorCount && unitsOnFloor && parkingName) {
            builder.addPreviewParking({
                id: '',
                name: parkingName,
                minFloor,
                maxFloor: maxFloorValue,
                unitsOnFloor,
            })
            refresh()
        } else {
            builder.removePreviewParking()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minFloor, floorCount, unitsOnFloor, parkingName])

    useEffect(() => {
        if (copyId !== null) {
            builder.addPreviewCopyParking(copyId)
        }
    }, [builder, copyId])

    const handleFinish = useCallback(() => {
        builder.removePreviewParking()
        if (copyId === null) {
            builder.addParking({ id: '', name: parkingName, minFloor, maxFloor: maxFloorValue, unitsOnFloor })
            setParkingName(builder.nextParkingName)
        } else {
            builder.addCopyParking(copyId)
        }

        refresh()
        resetForm()
    }, [refresh, resetForm, builder, minFloor, unitsOnFloor, maxFloorValue, parkingName, copyId])

    const isSubmitDisabled = copyId !== null ? false : !(minFloor && floorCount && unitsOnFloor)
    const isCreateColumnsHidden = copyId !== null
    const iconRotation = minFloorHidden ? 0 : 180
    const minFloorMargin = minFloorHidden ? '-28px' : 0

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Select value={copyId} onSelect={setCopyId} disabled={builder.isEmptyParking}>
                    <Select.Option key={'create'} value={null}>{CreateNewLabel}</Select.Option>
                    {builder.map.parking.filter(section => !section.preview).map(section => (
                        <Select.Option
                            key={`copy-${section.id}`}
                            value={section.id}
                        >
                            {CopyLabel} {section.name}
                        </Select.Option>
                    ))}
                </Select>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{ParkingNameLabel}</Typography.Text>
                    <InputNumber
                        value={parkingName}
                        min={1}
                        onChange={setParkingNameValue}
                        style={INPUT_STYLE}
                        type={'number'}
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{FloorCountLabel}</Typography.Text>
                    <InputNumber
                        value={floorCount}
                        onChange={setFloorCountValue}
                        style={INPUT_STYLE}
                        type={'number'}
                        min={1}
                    />
                </Space>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden} style={{ marginTop: minFloorMargin }}>
                <Space
                    direction={'vertical'}
                    size={8}
                    hidden={minFloorHidden}
                >
                    <Typography.Text type={'secondary'}>{MinFloorLabel}</Typography.Text>
                    <InputNumber
                        value={minFloor}
                        onChange={setMinFloorValue}
                        style={INPUT_STYLE}
                        type={'number'}
                    />
                </Space>
                <Typography.Text onClick={toggleMinFloorVisible} style={TEXT_BUTTON_STYLE}>
                    {minFloorHidden ? ShowMinFloor : HideMinFloor} <DownOutlined rotate={iconRotation} />
                </Typography.Text>
            </Col>
            <Col span={24} hidden={isCreateColumnsHidden}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{ParkingOnFloorLabel}</Typography.Text>
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

const EditParkingForm: React.FC<IEditSectionFormProps> = ({ builder, refresh }) => {
    const intl = useIntl()
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.parking.form.numberOfParkingSection' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })

    const [parkingName, setParkingName] = useState<string>('')

    const parkingSection = builder.getSelectedParking()

    const deleteParking = useCallback(() => {
        builder.removeParking(parkingSection.id)
        refresh()
    }, [builder, refresh, parkingSection])

    const updateParkingSection = useCallback(() => {
        builder.updateParking({ ...parkingSection, name: parkingName })
        refresh()
    }, [builder, refresh, parkingName, parkingSection])

    const setParkingNameValue = useCallback((value) => setParkingName(value ? value.toString() : ''), [])

    useEffect(() => {
        setParkingName(parkingSection ? parkingSection.name : '')
    }, [parkingSection])

    return (
        <Row gutter={MODAL_FORM_EDIT_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                    <InputNumber
                        value={parkingName}
                        min={1}
                        onChange={setParkingNameValue}
                        style={INPUT_STYLE}
                    />
                </Space>
            </Col>
            <Row gutter={MODAL_FORM_BUTTON_GUTTER}>
                <Col span={24}>
                    <Button
                        secondary
                        onClick={updateParkingSection}
                        type={'sberDefaultGradient'}
                    >
                        {SaveLabel}
                    </Button>
                </Col>
                <Col span={24}>
                    <Button
                        secondary
                        onClick={deleteParking}
                        type='sberDangerGhost'
                        icon={<DeleteFilled />}
                        style={FULL_SIZE_UNIT_STYLE}
                    >
                        {DeleteLabel}
                    </Button>
                </Col>
            </Row>
        </Row>
    )
}

const ParkingUnitForm: React.FC<IUnitFormProps> = ({ builder, refresh }) => {
    const intl = useIntl()
    const mode = builder.editMode
    const SaveLabel = intl.formatMessage({ id: mode === 'editParkingUnit' ? 'Save' : 'Add' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.property.parkingUnit.Name' })
    const SectionLabel = intl.formatMessage({ id: 'pages.condo.property.parkingSection.name' })
    const FloorLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const SectionTitlePrefix = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })

    const [label, setLabel] = useState('')
    const [floor, setFloor] = useState('')
    const [section, setSection] = useState('')

    const [sections, setSections] = useState([])
    const [floors, setFloors] = useState([])

    const updateSection = (value) => {
        setSection(value)
        setFloors(builder.getParkingSectionFloorOptions(value))
        if (mode === 'editParkingUnit') {
            const mapUnit = builder.getSelectedParkingUnit()
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
        setSections(builder.getParkingSectionOptions())
        const mapUnit = builder.getSelectedParkingUnit()
        if (mapUnit) {
            setFloors(builder.getParkingSectionFloorOptions(mapUnit.section))
            setLabel(mapUnit.label)
            setSection(mapUnit.section)
            setFloor(mapUnit.floor)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [builder])

    useEffect(() => {
        if (label && floor && section && mode === 'addParkingUnit') {
            builder.addPreviewParkingUnit({ id: '', label, floor, section })
            refresh()
        } else {
            builder.removePreviewParkingUnit()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [label, floor, section, mode])

    const resetForm = useCallback(() => {
        setLabel('')
        setFloor('')
        setSection('')
    }, [])

    const applyChanges = useCallback(() => {
        const mapUnit = builder.getSelectedParkingUnit()
        if (mapUnit) {
            builder.updateParkingUnit({ ...mapUnit, label, floor, section })
        } else {
            builder.removePreviewParkingUnit()
            builder.addParkingUnit({ id: '', label, floor, section })
            resetForm()
        }
        refresh()
    }, [builder, refresh, resetForm, label, floor, section])

    const deleteUnit = useCallback(() => {
        const mapUnit = builder.getSelectedParkingUnit()
        builder.removeParkingUnit(mapUnit.id, IS_NUMERIC_REGEXP.test(mapUnit.label))
        refresh()
        resetForm()
    }, [resetForm, refresh, builder])

    return (
        <Row gutter={MODAL_FORM_ROW_GUTTER} css={FormModalCss}>
            <Col span={24}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{SectionLabel}</Typography.Text>
                    <Select value={section} onSelect={updateSection} style={INPUT_STYLE}>
                        {sections.map((sec) => {
                            return <Option key={sec.id} value={sec.id}>{SectionTitlePrefix} {sec.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={8} style={INPUT_STYLE}>
                    <Typography.Text type={'secondary'} >{FloorLabel}</Typography.Text>
                    <Select value={floor} onSelect={setFloor} style={INPUT_STYLE}>
                        {floors.map(floorOption => {
                            return <Option key={floorOption.id} value={floorOption.id}>{floorOption.label}</Option>
                        })}
                    </Select>
                </Space>
            </Col>
            <Col span={24}>
                <Space direction={'vertical'} size={BUTTON_SPACE_SIZE}>
                    <Space direction={'vertical'} size={8}>
                        <Typography.Text type={'secondary'}>{NameLabel}</Typography.Text>
                        <Input allowClear={true} value={label} onChange={e => setLabel(e.target.value)} style={INPUT_STYLE} />
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
                            mode === 'editParkingUnit' && (
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
