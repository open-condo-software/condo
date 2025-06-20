/** @jsx jsx */
import { BuildingMap, BuildingSection, BuildingUnit, Property as PropertyType } from '@app/condo/schema'
import { css, jsx } from '@emotion/react'
import styled from '@emotion/styled'
import { Col, notification, Row, RowProps, Space } from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import ScrollContainer from 'react-indiana-drag-scroll'

import { Close } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Button, Select, Tour, Typography } from '@open-condo/ui'

import { Button as OldButton } from '@condo/domains/common/components/Button'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { colors, fontSizes, shadows } from '@condo/domains/common/constants/style'
import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'
import { EditUnitsForm } from '@condo/domains/property/components/panels/Builder/forms/EditUnitsForm'
import { AddSectionForm, EditSectionForm } from '@condo/domains/property/components/panels/Builder/forms/SectionForm'
import { UnitForm } from '@condo/domains/property/components/panels/Builder/forms/UnitForm'
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
import { AddSectionFloorForm } from './forms/SectionFloorForm'
import { FullscreenHeader, FullscreenWrapper } from './Fullscreen'
import { MapEdit, MapEditMode, MapViewMode } from './MapConstructor'
import { UnitButton } from './UnitButton'


const DEBOUNCE_TIMEOUT = 800

const TopRowCss = css`
  margin-top: 12px;
  position: relative;
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
}

interface IBuildingPanelTopModalProps {
    visible: boolean
    title: string | null
    onClose: () => void
}

const BuildingPanelTopModal: React.FC<IBuildingPanelTopModalProps> = ({ visible, onClose, title, children }) => (
    <TopModal visible={visible}>
        <Row justify='space-between' align='top'>
            <Col span={22}>
                {title !== null && (
                    <Typography.Title level={4}>{title}</Typography.Title>
                )}
            </Col>
            <Col span={2}>
                <OldButton
                    onClick={onClose}
                    icon={<Close size='small' />}
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

        if (!canManageProperties) {
            return
        }

        if (!mapEdit.validate()) {
            notification.error({
                message: MapValidationError,
            })

            return
        }

        debouncedQuickSave()
    }, [debouncedQuickSave, mapEdit, canManageProperties, MapValidationError])

    useHotkeys('ctrl+s', quickSaveCallback, [map, property, canManageProperties])
}


export const BuildingPanelEdit: React.FC<IBuildingPanelEditProps> = (props) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })
    const AllSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.AllTitle' })
    const AllParkingSectionsTitle = intl.formatMessage({ id: 'pages.condo.property.ParkingSectionSelect.AllTitle' })
    const SectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.SectionSelect.OptionPrefix' })
    const ParkingSectionPrefixTitle = intl.formatMessage({ id: 'pages.condo.property.ParkingSectionSelect.OptionPrefix' })
    const MapValidationError = intl.formatMessage({ id: 'pages.condo.property.warning.modal.SameUnitNamesErrorMsg' })

    const { map, updateMap: updateFormField, handleSave, property, canManageProperties = false } = props

    const { push, query: { id } } = useRouter()
    const [mapEdit, setMapEdit] = useState(new MapEdit(map, updateFormField))

    const { user } = useAuth()
    const { currentStep, setCurrentStep } = Tour.useTourContext()
    const { count } = Property.useCount({
        where: { createdBy: { id: get(user, 'id', null) }, map_not: null },
    }, { skip: !user })

    const mode = mapEdit.editMode
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
        })
    }, [handleSave, mapEdit])

    const refresh = useCallback(() => {
        setMapEdit(cloneDeep(mapEdit))
    }, [mapEdit])

    const changeMode = useCallback((mode: MapEditMode) => {
        setDuplicatedUnitIds([])
        mapEdit.editMode = mode
        refresh()
    }, [mapEdit, refresh])

    const onCancel = useCallback(() => {
        push(`/property/${id}`)
    }, [id, push])

    const onModalCancel = useCallback(() => {
        changeMode(null)
    }, [changeMode])

    const onSelectSection = useCallback((id) => {
        mapEdit.setVisibleSections(id)
        refresh()
    }, [mapEdit, refresh])

    const onViewModeChange = useCallback((option) => {
        mapEdit.viewMode = option.target.value
        mapEdit.setVisibleSections(null)
        refresh()
    }, [mapEdit, refresh])

    const menuContent = useMemo(() => ({
        addSection: <AddSectionForm builder={mapEdit} refresh={refresh} />,
        addParking: <AddSectionForm builder={mapEdit} refresh={refresh} />,

        editSection: <EditSectionForm builder={mapEdit} refresh={refresh} />,
        editParking: <EditSectionForm builder={mapEdit} refresh={refresh} />,

        addSectionFloor: <AddSectionFloorForm builder={mapEdit} refresh={refresh} />,
        addParkingFloor: <AddSectionFloorForm builder={mapEdit} refresh={refresh} />,

        addUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        editUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        editUnits: <EditUnitsForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,

        addParkingUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        editParkingUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds}/>,
        editParkingUnits: <EditUnitsForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,

        addParkingFacilityUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
        editParkingFacilityUnit: <UnitForm builder={mapEdit} refresh={refresh} setDuplicatedUnitIds={setDuplicatedUnitIds} />,
    }[mode] || null), [mode, mapEdit, refresh])

    const { breakpoints } = useLayoutContext()

    const showViewModeSelect = !mapEdit.isEmptySections && !mapEdit.isEmptyParking
    const showSectionFilter = mapEdit.sections.length >= MIN_SECTIONS_TO_SHOW_FILTER
    const sectionOptions = useMemo(() => [
        { key: 'allSections', value: null, label: mapEdit.viewMode === MapViewMode.parking ? AllParkingSectionsTitle : AllSectionsTitle },
        ...mapEdit.sections.map(section => ({
            key: section.id,
            value: section.id,
            label: `${mapEdit.viewMode === MapViewMode.parking ? ParkingSectionPrefixTitle : SectionPrefixTitle}${section.name}`,
        })),
    ], [
        AllParkingSectionsTitle, AllSectionsTitle, ParkingSectionPrefixTitle, SectionPrefixTitle,
        mapEdit.sections, mapEdit.viewMode,
    ])

    const isSubmitDisabled = useMemo(() => !canManageProperties || !address || mapEdit.hasPreviewComponents, [address, canManageProperties, mapEdit.hasPreviewComponents])

    useEffect(() => {
        if (!isSubmitDisabled && !mapEdit.isEmpty && count === 0) {
            setCurrentStep(1)
        } else {
            setCurrentStep(0)
        }
    }, [count, isSubmitDisabled, mapEdit, setCurrentStep])

    return (
        <FullscreenWrapper className='fullscreen'>
            <FullscreenHeader edit={true}>
                <Row css={TopRowCss} justify='space-between' gutter={[0, 8]}>
                    {address && (
                        <Col flex={0}>
                            <Space size={20} className='map-edit-address-container'>
                                <AddressTopTextContainer>{address}</AddressTopTextContainer>
                                {showSectionFilter && (
                                    <Select
                                        value={mapEdit.visibleSections}
                                        onChange={onSelectSection}
                                        options={sectionOptions}
                                    />
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
                            <BuildingEditTopMenu changeMode={changeMode} mapEdit={mapEdit} />
                        </Space>
                    </Col>
                </Row>
                <Row
                    style={UNIT_TYPE_ROW_STYLE}
                    hidden={!breakpoints.TABLET_LARGE}
                >
                    <Col flex={0} style={UNIT_TYPE_COL_STYLE}>
                        <Row gutter={UNIT_TYPE_ROW_GUTTER}>
                            {mapEdit.getUnitTypeOptions()
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
                        intl.formatMessage({ id: `pages.condo.property.modal.title.${mode}` as FormatjsIntl.Message['ids'] })
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
                            type='primary'
                            disabled={isSubmitDisabled}
                            focus={currentStep === 1}
                        >
                            {SaveLabel}
                        </Button>
                        <Button
                            key='cancel'
                            onClick={onCancel}
                            type='secondary'
                        >
                            {CancelLabel}
                        </Button>
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
                                <BuildingAxisY floors={builder.possibleChosenFloors} />
                                {
                                    builder.sections.map(section => (
                                        <PropertyMapSection
                                            key={section.id}
                                            section={section}
                                            builder={builder}
                                            refresh={refresh}
                                            isParkingSection={builder.viewMode === MapViewMode.parking}
                                        >
                                            <PropertyMapFloorContainer
                                                builder={builder}
                                                section={section}
                                                refresh={refresh}
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

const PropertyMapSection: React.FC<IPropertyMapSectionProps> = (props) => {
    const { section, children, builder, refresh, isParkingSection = false } = props
    const intl = useIntl()
    const SectionTitle = isParkingSection
        ? `${intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })} ${section.name}`
        : `${intl.formatMessage({ id: 'pages.condo.property.section.Name' })} ${section.name}`

    const chooseSection = useCallback(() => {
        builder.setSelectedSection(section)
        refresh()
    }, [builder, refresh, section])

    const isSectionSelected = builder.isSectionSelected(section.id)
    const isSectionVisible = builder.isSectionVisible(section.id)

    return (
        <MapSectionContainer visible={isSectionVisible}>
            {children}
            <UnitButton
                block
                type='section'
                disabled={section.preview}
                preview={section.preview}
                onClick={chooseSection}
                selected={isSectionSelected}
                data-cy='property-map__section-button'
            >
                {SectionTitle}
            </UnitButton>
        </MapSectionContainer>
    )
}

const PropertyMapFloorContainer: React.FC<IPropertyMapSectionProps> = (props) => {
    const { refresh, builder, section, duplicatedUnitIds } = props
    return (
        <>
            {
                builder.possibleChosenFloors.map(floorIndex => {
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
        builder.removePreviewUnit()
        builder.setSelectedUnit(unit)
        refresh()
    }, [refresh, builder, unit])

    const isUnitSelected = builder.isUnitSelected(unit.id)

    const isDuplicated = duplicatedUnitIds.includes(unit.id)

    return useMemo(() => (
        <UnitButton
            type='unit'
            onClick={selectUnit}
            disabled={unit.preview}
            isDuplicated={isDuplicated}
            preview={unit.preview}
            selected={isUnitSelected}
            unitType={unit.unitType}
            data-cy='property-map__unit-button'
        >
            {unit.label}
        </UnitButton>),
    [selectUnit, unit?.preview, unit?.unitType, unit?.label, isDuplicated, isUnitSelected])
}
