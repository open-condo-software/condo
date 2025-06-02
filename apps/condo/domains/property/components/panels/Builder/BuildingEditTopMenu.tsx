/** @jsx jsx */
import { jsx } from '@emotion/react'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Dropdown } from '@open-condo/ui'

import {
    FlatIcon,
    FloorIcon,
    ParkingFloorIcon,
    ParkingIcon,
    ParkingPlaceIcon,
    SectionIcon,
} from '@condo/domains/common/components/icons/PropertyMapIcons'

import { MapEdit, MapEditMode, MapViewMode } from './MapConstructor'


const TOP_MENU_MAP_SECTION_MODS = [
    MapEditMode.AddSection,
    MapEditMode.AddSectionFloor,
    MapEditMode.AddUnit,
]

const TOP_MENU_MAP_PARKING_MODS = [
    MapEditMode.AddParking,
    MapEditMode.AddParkingFloor,
    MapEditMode.AddParkingUnit,
    MapEditMode.AddParkingFacilityUnit,
]

interface IBuildingTopModalProps {
    changeMode: (mode: MapEditMode) => void
    mapEdit: MapEdit
}

const BuildingEditTopMenu: React.FC<IBuildingTopModalProps> = ({ changeMode, mapEdit }) => {
    const intl = useIntl()
    const AddElementTitle = intl.formatMessage({ id: 'pages.condo.property.menu.MenuPlaceholder' })
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.floor' })
    const AddParkingLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const AddParkingFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.parkingFloor' })
    const AddParkingPlace = intl.formatMessage({ id: 'pages.condo.property.select.option.parkingPlace' })
    const AddParkingFacilityUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.parking.unit' })

    const changeMapMode = useCallback((event) => {
        const newMode: MapEditMode = event.key
        let newMapViewMode
        if (TOP_MENU_MAP_SECTION_MODS.includes(newMode)) {
            newMapViewMode = MapViewMode.section
        } else if (TOP_MENU_MAP_PARKING_MODS.includes(newMode)) {
            newMapViewMode = MapViewMode.parking
        }
        if (typeof newMapViewMode !== 'undefined' && mapEdit.viewMode !== newMapViewMode) {
            mapEdit.viewMode = newMapViewMode
        }

        changeMode(event.key)
    }, [changeMode, mapEdit])

    // data-cy='property-map__edit-menu-container' было у Menu.
    // Надо поменять cypress тесты видимо будет QA.

    return (
        <Dropdown.Button
            items={[
                {
                    key: 'addSection',
                    label: AddSection,
                    icon: <SectionIcon />,
                    onClick: changeMapMode,
                    //'data-cy': 'property-map__edit-menu__add-section-button',
                },
                {
                    key: 'addSectionFloor',
                    label: AddFloor,
                    icon: <FloorIcon />,
                    onClick: changeMapMode,
                    disabled: mapEdit.isEmptySections,
                },
                {
                    key: 'addUnit',
                    label: AddUnit,
                    icon: <FlatIcon />,
                    onClick: changeMapMode,
                    disabled: mapEdit.isEmptySections,
                    // 'data-cy': 'property-map__edit-menu__add-unit-button'
                },
                {
                    key: 'addParking',
                    label: AddParkingLabel,
                    icon: <ParkingIcon />,
                    onClick: changeMapMode,
                    // 'data-cy': 'property-map__edit-menu__add-parking-button'
                },
                {
                    key: 'addParkingFloor',
                    label: AddParkingFloor,
                    icon: <ParkingFloorIcon />,
                    onClick: changeMapMode,
                    disabled: mapEdit.isEmptyParking,
                },
                {
                    key: 'addParkingUnit',
                    label: AddParkingPlace,
                    icon: <ParkingPlaceIcon />,
                    onClick: changeMapMode,
                    disabled: mapEdit.isEmptyParking,
                    //'data-cy': 'property-map__edit-menu__add-parking-unit-button'
                },
                {
                    key: 'addParkingFacilityUnit',
                    label: AddParkingFacilityUnit,
                    icon: <FlatIcon />,
                    onClick: changeMapMode,
                    disabled: mapEdit.isEmptyParking,
                    //'data-cy': 'property-map__edit-menu__add-parking-facility-unit-button'
                },
            ]}
            type='secondary'
        >
            {AddElementTitle}
        </Dropdown.Button>
    )
}

export default BuildingEditTopMenu
