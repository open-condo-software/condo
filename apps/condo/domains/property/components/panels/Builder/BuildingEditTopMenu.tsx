import React, { useCallback, useMemo } from 'react'

import { Car, Doors, Flat, Floor, Parking, FloorParking } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Dropdown } from '@open-condo/ui'

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

const DROPDOWN_PROPS = {
    className: 'add-element-dropdown',
    'data-cy': 'property-map__edit-menu-dropdown',
}

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

    const items = useMemo(() => [
        {
            key: 'addSection',
            label: AddSection,
            icon: <Doors />,
            onClick: changeMapMode,
            'data-cy': 'property-map__edit-menu__add-section-button',
        },
        {
            key: 'addSectionFloor',
            label: AddFloor,
            icon: <Floor />,
            onClick: changeMapMode,
            disabled: mapEdit.isEmptySections,
        },
        {
            key: 'addUnit',
            label: AddUnit,
            icon: <Flat />,
            onClick: changeMapMode,
            disabled: mapEdit.isEmptySections,
            'data-cy': 'property-map__edit-menu__add-unit-button',
        },
        {
            key: 'addParking',
            label: AddParkingLabel,
            icon: <Parking />,
            onClick: changeMapMode,
            'data-cy': 'property-map__edit-menu__add-parking-button',
        },
        {
            key: 'addParkingFloor',
            label: AddParkingFloor,
            icon: <FloorParking />,
            onClick: changeMapMode,
            disabled: mapEdit.isEmptyParking,
        },
        {
            key: 'addParkingUnit',
            label: AddParkingPlace,
            icon: <Car />,
            onClick: changeMapMode,
            disabled: mapEdit.isEmptyParking,
            'data-cy': 'property-map__edit-menu__add-parking-unit-button',
        },
        {
            key: 'addParkingFacilityUnit',
            label: AddParkingFacilityUnit,
            icon: <Flat />,
            onClick: changeMapMode,
            disabled: mapEdit.isEmptyParking,
        },
    ], [
        AddFloor, AddParkingFacilityUnit, AddParkingFloor, AddParkingLabel, AddParkingPlace, AddSection,
        AddUnit, changeMapMode, mapEdit.isEmptyParking, mapEdit.isEmptySections,
    ])

    return (
        <Dropdown.Button
            dropdownProps={DROPDOWN_PROPS}
            items={items}
            type='secondary'
        >
            {AddElementTitle}
        </Dropdown.Button>
    )
}

export default BuildingEditTopMenu
