/** @jsx jsx */
import { CloseOutlined } from '@ant-design/icons'
import { BuildingMap, BuildingSection, BuildingUnit, BuildingUnitSubType, Property as PropertyType } from '@app/condo/schema'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import {
    Col,
    notification,
    Row,
    RowProps,
    Space,
    Typography,
} from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import isNull from 'lodash/isNull'
import last from 'lodash/last'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import ScrollContainer from 'react-indiana-drag-scroll'

import { useIntl } from '@open-condo/next/intl'

import Select from '@condo/domains/common/components/antd/Select'
import { Button } from '@condo/domains/common/components/Button'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'
import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'
import { AddSectionFloor } from '@condo/domains/property/components/panels/Builder/forms/FloorForm'
import { AddParkingForm, EditParkingForm } from '@condo/domains/property/components/panels/Builder/forms/ParkingForm'
import { ParkingUnitForm } from '@condo/domains/property/components/panels/Builder/forms/ParkingUnitForm'
import { AddSectionForm, EditSectionForm } from '@condo/domains/property/components/panels/Builder/forms/SectionForm'
import { UnitForm } from '@condo/domains/property/components/panels/Builder/forms/UnitForm'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MIN_SECTIONS_TO_SHOW_FILTER } from '@condo/domains/property/constants/property'
import { Property } from '@condo/domains/property/utils/clientSchema'

import BuildingEditTopMenu from './BuildingEditTopMenu'
import {
    BuildingAxisY,
    BuildingChooseSections,
    BuildingViewModeSelect,
    EmptyBuildingBlock,
    EmptyFloor,
    MapSectionContainer,
    PropertyMapFloor,
    UnitTypeLegendItem,
} from './BuildingPanelCommon'
import { FullscreenHeader, FullscreenWrapper } from './Fullscreen'
import { MapEdit, MapEditMode, MapViewMode } from './MapConstructor'

const DEBOUNCE_TIMEOUT = 800
const INSTANT_ACTIONS = ['addBasement', 'addAttic']

const TopRowCss = css`
  margin-top: 12px;
  position: relative;
  
  & .ant-select.ant-select-single .ant-select-selector {
    background-color: transparent;
    color: black;
    font-weight: 600;
    height: 48px;
  }
  & .ant-select.ant-select-single .ant-select-selection-search-input,
  & .ant-select.ant-select-single .ant-select-selector .ant-select-selection-item {
    height: 48px;
    line-height: 48px;
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

export const AddressTopTextContainer = styled.div`
  font-size: ${fontSizes.content};
  line-height: 24px;
  font-weight: bold;
  padding: 8px;
`

interface IBuildingPanelEditProps extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    map: BuildingMap
    updateMap: (map: BuildingMap) => void
    handleSave(): void
    property?: PropertyType
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
        <Row justify='space-between' align='top'>
            <Col span={22}>
                {title !== null && (
                    <Typography.Title level={4} style={BUILDING_TOP_MODAL_TITLE_STYLE}>{title}</Typography.Title>
                )}
            </Col>
            <Col span={2}>
                <Button
                    onClick={onClose}
                    icon={<CloseOutlined />}
                    size='small'
                    type='text'
                    data-cy='property-map__top-modal__close-button'
                />
            </Col>
        </Row>
        <Row data-cy='property-map__top-modal__children-container'>
            {children}
        </Row>
    </TopModal>
)

const UNIT_TYPE_ROW_STYLE: React.CSSProperties = { marginTop: '8px' }
const UNIT_TYPE_COL_STYLE: React.CSSProperties = {
    backgroundColor: colors.backgroundLightGrey,
    opacity: 0.94,
    borderRadius: '8px',
    paddingLeft: '8px',
    paddingRight: '8px',
}
const UNIT_TYPE_ROW_GUTTER: RowProps['gutter'] = [42, 0]

const useHotkeyToSaveProperty = ({ map, mapEdit, property, canManageProperties }) => {
    const intl = useIntl()
    const ChangesSaved = intl.formatMessage({ id: 'ChangesSaved' })
    const MapValidationError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const quickSave = Property.useUpdate({}, () => notification.success({
        message: ChangesSaved,
        placement: 'bottomRight',
    }))
    const debouncedQuickSave = useCallback(
        debounce(() => quickSave({ map }, property), DEBOUNCE_TIMEOUT),
        [map, property]
    )

    const quickSaveCallback = useCallback((event) => {
        event.preventDefault()

        if (!canManageProperties || mapEdit.validate() || !mapEdit.hasPreviewComponents) {
            debouncedQuickSave()
            return
        }
        notification.error({
            message: MapValidationError,
            placement: 'bottomRight',
        })
    }, [debouncedQuickSave, mapEdit, canManageProperties, MapValidationError])

    useHotkeys('ctrl+s', quickSaveCallback, [map, property, canManageProperties])
}

const BUILDING_PANEL_EDIT_ERROR_STYLE: React.CSSProperties = { width: '100%', textAlign: 'center', marginBottom: 'unset' }

export const BuildingPanelEdit: React.FC<IBuildingPanelEditProps> = (props) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })
    const AllSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.AllTitle' })
    const AllParkingSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.ParkingSectionSelect.AllTitle' })
    const SectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.OptionPrefix' })
    const ParkingSectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.ParkingSectionSelect.OptionPrefix' })
    const MapValidationError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const { mapValidationError, map, updateMap: updateFormField, handleSave, property, canManageProperties = false } = props

    const { push, query: { id } } = useRouter()
    const [mapEdit, setMapEdit] = useState(new MapEdit(map, updateFormField))

    const mode = mapEdit.editMode
    const sections = mapEdit.sections
    const address = get(property, 'address')

    const [duplicatedUnitIds, setDuplicatedUnitIds] = useState<string[]>([])

    useHotkeyToSaveProperty({ map, mapEdit, property, canManageProperties })

    const saveCallback = useCallback(() => {
        if (mapEdit.validate()) {
            handleSave()
            return
        }

        notification.error({
            message: MapValidationError,
            placement: 'bottomRight',
        })
    }, [handleSave, mapValidationError, mapEdit])

    const refresh = useCallback(() => {
        setMapEdit(cloneDeep(mapEdit))
    }, [mapEdit])

    const changeMode = useCallback((mode) => {
        setDuplicatedUnitIds([])
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

    const menuContent = useMemo(() => ({
        addSection: <AddSectionForm builder={mapEdit} refresh={refresh} />,
        addUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        editSection: <EditSectionForm builder={mapEdit} refresh={refresh} />,
        editUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        addParking: <AddParkingForm builder={mapEdit} refresh={refresh} />,
        addParkingUnit: <ParkingUnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        editParkingUnit: <ParkingUnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds}/>,
        editParking: <EditParkingForm builder={mapEdit} refresh={refresh} />,
        addSectionFloor: <AddSectionFloor builder={mapEdit} refresh={refresh} />,
    }[mode] || null), [mode, mapEdit, refresh, duplicatedUnitIds])

    const { breakpoints } = useLayoutContext()

    const showViewModeSelect = !mapEdit.isEmptySections && !mapEdit.isEmptyParking
    const showSectionFilter = mapEdit.viewMode === MapViewMode.section && sections.length >= MIN_SECTIONS_TO_SHOW_FILTER
    const showParkingFilter = mapEdit.viewMode === MapViewMode.parking && mapEdit.parking.length >= MIN_SECTIONS_TO_SHOW_FILTER

    return (
        <FullscreenWrapper className='fullscreen'>
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
                        <Space size={20} style={{ flexDirection: !breakpoints.TABLET_LARGE ? 'column-reverse' : 'row' }}>
                            {
                                showViewModeSelect && (
                                    <BuildingViewModeSelect
                                        value={mapEdit.viewMode}
                                        onChange={onViewModeChange}
                                        disabled={mapEdit.editMode !== null}
                                    />
                                )
                            }
                            <BuildingEditTopMenu menuClick={menuClick} mapEdit={mapEdit} />
                        </Space>
                    </Col>
                </Row>
                <Row
                    style={UNIT_TYPE_ROW_STYLE}
                    hidden={mapEdit.viewMode === MapViewMode.parking || !breakpoints.TABLET_LARGE}
                >
                    <Col flex={0} style={UNIT_TYPE_COL_STYLE}>
                        <Row gutter={UNIT_TYPE_ROW_GUTTER}>
                            {mapEdit.getUnitTypeOptions()
                                .filter(unitType => unitType !== BuildingUnitSubType.Flat)
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
                    {menuContent}
                </BuildingPanelTopModal>
            </FullscreenHeader>
            <Row align='middle' style={{ height: '100%' }}>
                <ChessBoard
                    builder={mapEdit}
                    refresh={refresh}
                    isFullscreen
                    duplicatedUnitIds={duplicatedUnitIds}
                >
                    <Space size={20} align='center'>
                        <Button
                            key='submit'
                            data-cy='property-map__save-map-button'
                            onClick={saveCallback}
                            type='sberDefaultGradient'
                            disabled={!canManageProperties || !address || mapEdit.hasPreviewComponents}
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
                                <Typography.Paragraph type='danger' style={BUILDING_PANEL_EDIT_ERROR_STYLE}>
                                    {mapValidationError}
                                </Typography.Paragraph>
                            ) : null
                        }
                    </Space>
                </ChessBoard>
            </Row>
        </FullscreenWrapper>
    )
}

interface IChessBoardProps {
    builder: MapEdit
    refresh(): void
    toggleFullscreen?(): void
    isFullscreen?: boolean
    duplicatedUnitIds?: string[]
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
    paddingTop: '24px',
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
    const { builder, refresh, toggleFullscreen, isFullscreen, duplicatedUnitIds, children } = props
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
            const lastSectionSelected = builder.editMode === MapEditMode.EditSection
                && get(builder.getSelectedSection(), 'index') === builder.lastSectionIndex
            const lastParkingSelected = builder.editMode === MapEditMode.EditParking
                && get(builder.getSelectedParking(), 'index') === builder.lastParkingIndex
            const addUnitToLastSection = builder.editMode === MapEditMode.AddUnit
                && last(builder.sections).floors
                    .flatMap(floor => floor.units.map(unit => unit.id))
                    .includes(String(builder.previewUnitId))
            const addParkingUnitToLastSection = builder.editMode === MapEditMode.AddParkingUnit
                && last(builder.parking).floors
                    .flatMap(floor => floor.units.map(unit => unit.id))
                    .includes(String(builder.previewParkingUnitId))
            const editUnitAtLastSection = builder.editMode === MapEditMode.EditUnit
                && get(builder.getSelectedUnit(), 'sectionIndex') === builder.lastSectionIndex
            const editParkingUnitAtLastSection = builder.editMode === MapEditMode.EditParkingUnit
                && get(builder.getSelectedParkingUnit(), 'sectionIndex') === builder.lastParkingIndex

            if (lastSectionSelected
                || lastParkingSelected
                || addParkingUnitToLastSection
                || addUnitToLastSection
                || editUnitAtLastSection
                || editParkingUnitAtLastSection) {
                const { scrollWidth, clientWidth, scrollHeight, clientHeight } = container.current

                if (lastSectionSelected || lastParkingSelected) {
                    container.current.scrollTo(scrollWidth - clientWidth, scrollHeight - clientHeight)
                    return
                }
                container.current.scrollLeft = scrollWidth - clientWidth
            }
        }
    }, [builder])

    return (
        <Row align='bottom' style={CHESS_ROW_STYLE} >
            {
                builder.isEmpty ?
                    <Col span={24}>
                        <EmptyBuildingBlock mode='edit' />
                        <BuildingChooseSections
                            isFullscreen={isFullscreen}
                            toggleFullscreen={toggleFullscreen}
                            builder={builder}
                            refresh={refresh}
                            mode='edit'
                        >
                            {children}
                        </BuildingChooseSections>
                    </Col>
                    :
                    <Col span={24} style={CHESS_SCROLL_HOLDER_STYLE}>
                        <ScrollContainer
                            className='scroll-container'
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
                                            >
                                                <PropertyMapFloorContainer
                                                    builder={builder}
                                                    section={section}
                                                    refresh={refresh}
                                                    duplicatedUnitIds={duplicatedUnitIds}
                                                />
                                            </PropertyMapSection>

                                        ))
                                        : builder.parking.map(parkingSection => (
                                            <PropertyMapSection
                                                key={parkingSection.id}
                                                section={parkingSection}
                                                builder={builder}
                                                refresh={refresh}
                                                isParkingSection
                                            >
                                                <PropertyMapFloorContainer
                                                    builder={builder}
                                                    section={parkingSection}
                                                    refresh={refresh}
                                                    isParkingSection
                                                    duplicatedUnitIds={duplicatedUnitIds}
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
                            mode='edit'
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
    isParkingSection?: boolean
    duplicatedUnitIds?: string[]
}
const FULL_SIZE_UNIT_STYLE: React.CSSProperties = { width: '100%', marginTop: '8px', display: 'block' }
const SECTION_UNIT_STYLE: React.CSSProperties = { ...FULL_SIZE_UNIT_STYLE, zIndex: 2 }

const PropertyMapSection: React.FC<IPropertyMapSectionProps> = (props) => {
    const { section, children, builder, refresh, isParkingSection = false } = props
    const intl = useIntl()
    const SectionTitle = isParkingSection
        ? `${intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })} ${section.name}`
        : `${intl.formatMessage({ id: 'pages.condo.property.section.Name' })} ${section.name}`

    const chooseSection = useCallback(() => {
        if (isParkingSection) {
            builder.setSelectedParking(section)
        } else {
            builder.setSelectedSection(section)
        }
        refresh()
    }, [builder, refresh, section, isParkingSection])

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
                data-cy='property-map__section-button'
            >{SectionTitle}</UnitButton>
        </MapSectionContainer>
    )
}

const PropertyMapFloorContainer: React.FC<IPropertyMapSectionProps> = (props) => {
    const { isParkingSection, refresh, builder, section, duplicatedUnitIds } = props
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
                                                duplicatedUnitIds={duplicatedUnitIds}
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

interface IPropertyMapUnitProps {
    unit: BuildingUnit
    builder: MapEdit
    refresh: () => void
    duplicatedUnitIds?: string[]
}

const PropertyMapUnit: React.FC<IPropertyMapUnitProps> = ({ builder, refresh, unit, duplicatedUnitIds }) => {
    const selectUnit = useCallback(() => {
        if (unit.unitType !== BuildingUnitSubType.Parking) {
            builder.removePreviewUnit()
            builder.setSelectedUnit(unit)
        } else {
            builder.removePreviewParkingUnit()
            builder.setSelectedParkingUnit(unit)
        }
        refresh()
    }, [refresh, unit, builder])

    const isUnitSelected = unit.unitType === BuildingUnitSubType.Flat
        ? builder.isUnitSelected(unit.id)
        : builder.isParkingUnitSelected(unit.id)

    const isDuplicated = duplicatedUnitIds.includes(unit.id)

    return useMemo(() => (
        <UnitButton
            onClick={selectUnit}
            disabled={unit.preview}
            isDuplicated={isDuplicated}
            preview={unit.preview}
            selected={isUnitSelected}
            unitType={unit.unitType}
            data-cy='property-map__unit-button'
        >{unit.label}</UnitButton>),
    [unit, isUnitSelected, isDuplicated])
}
