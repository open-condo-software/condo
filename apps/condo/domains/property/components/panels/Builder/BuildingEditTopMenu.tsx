/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { Dropdown, DropDownProps, Menu, MenuProps } from 'antd'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import {
    FlatIcon,
    FloorIcon,
    ParkingFloorIcon,
    ParkingIcon,
    ParkingPlaceIcon,
    SectionIcon,
} from '@condo/domains/common/components/icons/PropertyMapIcons'
import { colors } from '@condo/domains/common/constants/style'




import { MapEdit, MapViewMode } from './MapConstructor'

const DROPDOWN_TRIGGER: DropDownProps['trigger'] = ['hover', 'click']
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
  & .ant-dropdown-menu-item button:disabled {
    background-color: transparent;
    color: ${colors.black};
    opacity: 0.5;
  }
  & .ant-dropdown-menu-item button svg {
    margin-right: 8px;
    z-index: 1;
  }
`

interface IBuildingTopModalProps {
    menuClick: MenuProps['onClick']
    mapEdit: MapEdit
}

const BuildingEditTopMenu: React.FC<IBuildingTopModalProps> = ({ menuClick, mapEdit }) => {
    const intl = useIntl()
    const AddElementTitle = intl.formatMessage({ id: 'pages.condo.property.menu.MenuPlaceholder' })
    const AddSection = intl.formatMessage({ id: 'pages.condo.property.select.option.section' })
    const AddUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.unit' })
    const AddFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.floor' })
    const AddParkingLabel = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const AddParkingFloor = intl.formatMessage({ id: 'pages.condo.property.select.option.parkingFloor' })
    const AddParkingPlace = intl.formatMessage({ id: 'pages.condo.property.select.option.parkingPlace' })
    const AddParkingFacilityUnit = intl.formatMessage({ id: 'pages.condo.property.select.option.parking.unit' })

    const switchToSectionTab = useCallback(() => {
        if (mapEdit.viewMode !== MapViewMode.section) {
            mapEdit.viewMode = MapViewMode.section
        }
    }, [mapEdit])

    const switchToParkingTab = useCallback(() => {
        if (mapEdit.viewMode !== MapViewMode.parking) {
            mapEdit.viewMode = MapViewMode.parking
        }
    }, [mapEdit])

    const menuOverlay = useMemo(() => (
        <Menu css={MenuCss} onClick={menuClick} data-cy='property-map__edit-menu-container'>
            <Menu.Item key='addSection'>
                <Button
                    type='sberDefaultGradient'
                    data-cy='property-map__edit-menu__add-section-button'
                    secondary
                    onClick={switchToSectionTab}
                    icon={<SectionIcon />}
                >
                    {AddSection}
                </Button>
            </Menu.Item>
            <Menu.Item key='addSectionFloor' disabled={mapEdit.isEmptySections}>
                <Button
                    type='sberDefaultGradient'
                    disabled={mapEdit.isEmptySections}
                    secondary
                    onClick={switchToSectionTab}
                    icon={<FloorIcon />}
                >
                    {AddFloor}
                </Button>
            </Menu.Item>
            <Menu.Item key='addUnit' disabled={mapEdit.isEmptySections}>
                <Button
                    type='sberDefaultGradient'
                    data-cy='property-map__edit-menu__add-unit-button'
                    secondary
                    onClick={switchToSectionTab}
                    disabled={mapEdit.isEmptySections}
                    icon={<FlatIcon />}
                >
                    {AddUnit}
                </Button>
            </Menu.Item>
            <Menu.Item key='addParking'>
                <Button
                    type='sberDefaultGradient'
                    data-cy='property-map__edit-menu__add-parking-button'
                    secondary
                    onClick={switchToParkingTab}
                    icon={<ParkingIcon />}
                >
                    {AddParkingLabel}
                </Button>
            </Menu.Item>
            <Menu.Item key='addParkingFloor' disabled={mapEdit.isEmptyParking}>
                <Button
                    type='sberDefaultGradient'
                    secondary
                    disabled={mapEdit.isEmptyParking}
                    onClick={switchToParkingTab}
                    icon={<ParkingFloorIcon />}
                >
                    {AddParkingFloor}
                </Button>
            </Menu.Item>
            <Menu.Item key='addParkingUnit' disabled={mapEdit.isEmptyParking}>
                <Button
                    type='sberDefaultGradient'
                    data-cy='property-map__edit-menu__add-parking-unit-button'
                    secondary
                    onClick={switchToParkingTab}
                    disabled={mapEdit.isEmptyParking}
                    icon={<ParkingPlaceIcon />}
                >
                    {AddParkingPlace}
                </Button>
            </Menu.Item>
            <Menu.Item key='addParkingFacilityUnit' disabled={mapEdit.isEmptyParking}>
                <Button
                    type='sberDefaultGradient'
                    data-cy='property-map__edit-menu__add-parking-facility-unit-button'
                    secondary
                    onClick={switchToParkingTab}
                    disabled={mapEdit.isEmptyParking}
                    icon={<FlatIcon />}
                >
                    {AddParkingFacilityUnit}
                </Button>
            </Menu.Item>
        </Menu>
    ), [
        menuClick, switchToSectionTab, AddSection, mapEdit.isEmptySections, mapEdit.isEmptyParking,
        AddFloor, AddUnit, switchToParkingTab, AddParkingLabel, AddParkingFloor, AddParkingPlace, AddParkingFacilityUnit,
    ])

    return (
        <Dropdown
            trigger={DROPDOWN_TRIGGER}
            overlay={menuOverlay}
            css={DropdownCss}
            mouseEnterDelay={0}
        >
            <Button
                type='sberDefaultGradient'
                secondary
                data-cy='property-map__edit-menu-dropdown'
            >
                {AddElementTitle}<span>...</span>
            </Button>
        </Dropdown>
    )
}

export default BuildingEditTopMenu
