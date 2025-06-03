import { useGetContactByUnitLazyQuery } from '@app/condo/gql'
import {
    BuildingMap,
    BuildingUnit,
    Contact as ContactType,
    ContactUnitTypeType,
    Property as PropertyType,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import { useIntl } from '@open-condo/next/intl'
import { Button, List, Modal, Space, Tooltip, Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'
import { Property } from '@condo/domains/property/utils/clientSchema'

import {
    BuildingAxisY,
    BuildingChooseSections,
    BuildingViewModeSelect,
    EmptyBuildingBlock,
    EmptyFloor,
    MapSectionContainer,
    UnitTypeLegendItem,
} from './BuildingPanelCommon'
import { AddressTopTextContainer } from './BuildingPanelEdit'
import { FullscreenHeader, FullscreenWrapper } from './Fullscreen'
import { MapView, MapViewMode } from './MapConstructor'
import { UnitButton } from './UnitButton/UnitButton'


interface IBuildingPanelViewProps extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    map: BuildingMap
}

export const BuildingPanelView: React.FC<IBuildingPanelViewProps> = ({ map, canManageProperties = false }) => {
    const mapView = new MapView(map)
    const [builderMap, setBuilderMap] = useState(mapView)
    // TODO(zuch): Ask for a better solution
    const refresh = () => setBuilderMap(cloneDeep(builderMap))
    return (
        <PropertyMapView builder={builderMap} refresh={refresh} canManageProperties={canManageProperties} />
    )
}

interface IPropertyMapViewProps extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    builder: MapView
    refresh(): void
}

const CHESS_ROW_STYLE: React.CSSProperties = {
    width: '100%',
    height: '100%',
    textAlign: 'center',
}
const CHESS_COL_STYLE: React.CSSProperties = {
    paddingTop: '60px',
    paddingBottom: '60px',
}
const CHESS_SCROLL_HOLDER_STYLE: React.CSSProperties = {
    whiteSpace: 'nowrap',
    position: 'static',
    paddingBottom: '10px',
}
const CHESS_SCROLL_CONTAINER_STYLE: React.CSSProperties = {
    paddingBottom: '20px',
    width: '100%',
    overflowY: 'hidden',
}
const UNIT_BUTTON_TOOLTIP_WRAPPER_STYLE: React.CSSProperties = { display: 'inline-block', marginRight: '8px' }
const FLOOR_CONTAINER_STYLE: React.CSSProperties = { display: 'block' }
const UNIT_TYPE_ROW_STYLE: React.CSSProperties = { paddingLeft: '8px' }
const FULLSCREEN_HEADER_STYLE: React.CSSProperties = { marginBottom: '28px', alignItems: 'center' }
const UNIT_TYPE_ROW_GUTTER: RowProps['gutter'] = [42, 0]
const TOOLTIP_MAX_CONTACT_DETAILS = 5

interface IUnitModalProps {
    property: PropertyType
    unit: BuildingUnit
    contactsLoading: boolean
    contacts: Array<ContactType>
    contactsError: boolean
}

export const UnitModal: React.FC<IUnitModalProps> = ({ property, unit, contactsLoading, contacts }) => {
    const intl = useIntl()
    const FieldUnitNameMessage = intl.formatMessage({ id: 'field.Name' })
    const FieldUnitTypeMessage = intl.formatMessage({ id: 'field.UnitType' })
    const UnitTypeMessage = intl.formatMessage({ id: `field.UnitType.${unit.unitType}` }).toLowerCase()

    const FieldContactNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const FieldPhoneMessage = intl.formatMessage({ id: 'Phone' })
    const RolePhoneMessage = intl.formatMessage({ id: 'field.Role' })

    const ContactsMessage = intl.formatMessage({ id: 'global.section.contacts' })
    const GoToContactMessage = intl.formatMessage({ id: 'pages.condo.property.map.modal.goToContacts' })

    const NoContactsTitleMessage = intl.formatMessage({ id: 'pages.condo.property.map.modal.noContacts.emptyView.title' })
    const NoContactsSubtitleMessage = intl.formatMessage({ id: 'pages.condo.property.map.modal.noContacts.emptyView.subtitle' })
    const NoContactsButtonLabel = intl.formatMessage({ id: 'AddContact' })

    return (
        <Row gutter={[0, 36]}>
            <Col span={24}>
                <List 
                    dataSource={[
                        {
                            label: FieldUnitNameMessage,
                            value: unit.label,
                        },
                        {
                            label: FieldUnitTypeMessage,
                            value: UnitTypeMessage,
                        },
                    ]}/>
            </Col>
            {(!contactsLoading && Array.isArray(contacts) && contacts.length > 0) && (
                <Col span={24}>
                    <Typography.Title level={4}>{ContactsMessage}</Typography.Title>
                </Col>
            )}
            {(!contactsLoading && Array.isArray(contacts) && contacts.length === 0) && (
                <BasicEmptyListView spaceSize={16} image='/dino/searching@2x.png'>
                    <Space align='center' direction='vertical' size={8}>
                        <Typography.Title level={3}>{NoContactsTitleMessage}</Typography.Title>
                        <Typography.Text type='secondary'>{NoContactsSubtitleMessage}</Typography.Text>
                    </Space>
                    <Button type='primary' href={`/contact/create?initialValues=${JSON.stringify( { property: property.id, unitName: unit.label, unitType: unit.unitType })}`}>{NoContactsButtonLabel}</Button>
                </BasicEmptyListView>
            )}
            {contacts?.map(contact => (
                <Col span={24} key={contact.id}>
                    <Row gutter={[0, 14]}>
                        <Col span={24}>
                            <List
                                dataSource={[
                                    {
                                        label: FieldContactNameMessage,
                                        value: contact?.name || '—',
                                    },
                                    {
                                        label: FieldPhoneMessage,
                                        value: contact?.phone || '—',
                                    },
                                    {
                                        label: RolePhoneMessage,
                                        value: contact?.role?.name || '—',
                                    },
                                ]}/>
                            <Row justify='end' style={{ marginTop: 8 }}>
                                <Typography.Link size='large' href={`/contact/${contact.id}`} target='_blank' rel='noreferrer'>
                                    {GoToContactMessage}
                                </Typography.Link>
                            </Row>
                        </Col>
                    </Row>
                </Col>
            ))}
        </Row>
    )
}

export const UnitTooltip: React.FC<IUnitModalProps> = ({ unit, contactsLoading, contacts, contactsError }) => {
    const intl = useIntl()
    const FieldUnitTypeMessage = intl.formatMessage({ id: 'field.UnitType' })
    const UnitTypeMessage = intl.formatMessage({ id: `field.UnitType.${unit.unitType}` }).toLowerCase()
    const ResidentNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const NoContactsMessage = intl.formatMessage({ id: 'pages.condo.property.map.modal.noContacts' })
    const TotalContactsMessage = intl.formatMessage({ id: 'pages.condo.property.map.modal.totalContacts' })
    const AndOthersMessage = intl.formatMessage({ id: 'AndOthers' })
    const ErrorLoadingContactsMessage = intl.formatMessage({ id: 'pages.condo.property.map.modal.errorLoadingContacts' })

    const contactsLines = useMemo(() => {
        if (!contactsLoading && contacts) {
            if (contacts.length === 0) {
                return [NoContactsMessage]
            }
            if (contacts.length === 1) {
                const contact = contacts[0]

                const result = [
                    `${ResidentNameMessage}: ${contact.name} ${contact?.role?.name ? `(${contact?.role?.name})` : ''}`,
                    `${PhoneMessage}: ${contact.phone}`,
                ]

                return result
            }
            else {
                const totalContacts = contacts.length

                const contactNames = []
                for (let i = 0; i < Math.min(totalContacts, TOOLTIP_MAX_CONTACT_DETAILS); ++i) {
                    if (contacts[i]?.name && typeof contacts[i]?.name === 'string') {
                        contactNames.push(contacts[i].name.trim())
                    }
                }

                if (totalContacts > TOOLTIP_MAX_CONTACT_DETAILS) {
                    contactNames.push(AndOthersMessage)
                }

                return [`${TotalContactsMessage}: ${totalContacts} (${contactNames.join(', ')})`]
            }
        }

        if (!contactsLoading && contactsError) {
            return [ErrorLoadingContactsMessage]
        }

        return []
    }, [contactsLoading, contacts])

    return (
        <div style={{ minWidth: '240px' }}>
            {`${FieldUnitTypeMessage}: ${UnitTypeMessage}`}<br/>
            {contactsLines.map((line, index) => (
                <span key={index}>
                    {line}<br/>
                </span>
            ))}
        </div>
    )
}

export const PropertyMapView: React.FC<IPropertyMapViewProps> = ({ builder, refresh, canManageProperties = false }) => {
    const intl = useIntl()
    const ParkingTitlePrefix = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const SectionNamePrefixTitle = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const UnitModalTitle = intl.formatMessage({ id: 'pages.condo.property.map.modal.title' })

    const { query: { id } } = useRouter()
    const { obj: property } = Property.useObject({ where: { id: id as string } })

    const [isFullscreen, setFullscreen] = useState(false)
    const toggleFullscreen = useCallback(() => {
        setFullscreen(!isFullscreen)
    }, [isFullscreen])

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)
    const toggleUnitModal = useCallback(() => {
        setIsUnitModalOpen(!isUnitModalOpen)
    }, [isUnitModalOpen])

    const [modalOpenedUnit, setModalOpenedUnit] = useState(null)

    const onViewModeChange = useCallback((option) => {
        builder.viewMode = option.target.value
        refresh()
    }, [builder, refresh])

    const unitTypeOptions = builder.getUnitTypeOptions()

    const UnitTypeOptionsLegend = useMemo(() => <Row
        gutter={UNIT_TYPE_ROW_GUTTER}
        style={UNIT_TYPE_ROW_STYLE}
    >
        {unitTypeOptions
            .map((unitType, unitTypeKey) => (
                <Col key={unitTypeKey} flex={0}>
                    <UnitTypeLegendItem unitType={unitType}>
                        {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                    </UnitTypeLegendItem>
                </Col>
            ))}
    </Row>, [builder.viewMode, unitTypeOptions])

    const showViewModeSelect = !builder.isEmptySections && !builder.isEmptyParking

    const [readyTooltip, setReadyTooltip] = useState<string | null>(null)
    const [lastOpenTooltip, setLastOpenTooltip] = useState<string | null>(null)

    const [getContacts, { loading: contactsLoading, data: contactsData, error: contactsError }] = useGetContactByUnitLazyQuery()

    const handleTooltipVisibilityChange = useCallback((unitId: string, visible: boolean, unit: BuildingUnit) => {
        if (!property) {
            return
        }

        if (visible) {
            setLastOpenTooltip(unitId)
            getContacts({
                variables: {
                    propertyId: property.id,
                    unitName: unit.label,
                    unitType: unit.unitType as unknown as ContactUnitTypeType,
                },
                fetchPolicy: 'cache-first',
            }).then(() => {
                setReadyTooltip(unitId)
            })
        } else {
            setLastOpenTooltip(null)
            setReadyTooltip(null)
        }
    }, [property?.id, getContacts])

    return (
        <FullscreenWrapper className={isFullscreen ? 'fullscreen' : '' }>
            <FullscreenHeader edit={false}>
                <Row justify='end' style={FULLSCREEN_HEADER_STYLE} hidden={!showViewModeSelect}>
                    {
                        isFullscreen ? (
                            <Col flex={1}>
                                <AddressTopTextContainer>{get(property, 'address')}</AddressTopTextContainer>
                            </Col>
                        ) : (
                            <Col flex={1}>
                                {UnitTypeOptionsLegend}
                            </Col>
                        )
                    }
                    {
                        showViewModeSelect && (
                            <Col flex={0}>
                                <BuildingViewModeSelect
                                    value={builder.viewMode}
                                    onChange={onViewModeChange}
                                />
                            </Col>
                        )
                    }
                </Row>
                {isFullscreen && UnitTypeOptionsLegend}
            </FullscreenHeader>
            <Modal title={UnitModalTitle} onCancel={toggleUnitModal} open={isUnitModalOpen}>
                <UnitModal
                    property={property}
                    unit={modalOpenedUnit}
                    contactsLoading={contactsLoading}
                    contacts={contactsData?.contacts}
                    contactsError={!!contactsError}
                />
            </Modal>
            <Row align='middle' style={CHESS_ROW_STYLE}>
                {
                    builder.isEmpty ?
                        <Col span={24} style={CHESS_COL_STYLE}>
                            <EmptyBuildingBlock canManageProperties={canManageProperties} />
                        </Col>
                        :
                        <Col span={24} style={CHESS_SCROLL_HOLDER_STYLE}>
                            <ScrollContainer
                                className='scroll-container'
                                style={CHESS_SCROLL_CONTAINER_STYLE}
                                vertical={false}
                                horizontal={true}
                                hideScrollbars={false}
                                nativeMobileScroll={true}
                            >
                                <BuildingAxisY floors={builder.possibleChosenFloors} />
                                {
                                    builder.sections.map(section => (
                                        <MapSectionContainer
                                            key={section.id}
                                            visible={builder.isSectionVisible(section.id)}
                                        >
                                            {
                                                builder.possibleChosenFloors.map(floorIndex => {
                                                    const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                    if (floorInfo && floorInfo.units.length) {
                                                        return (
                                                            <div key={floorInfo.id} style={FLOOR_CONTAINER_STYLE}>
                                                                {
                                                                    floorInfo.units.map(unit => {
                                                                        return (
                                                                            <Tooltip
                                                                                key={unit.id}
                                                                                title={
                                                                                    <UnitTooltip
                                                                                        property={property}
                                                                                        unit={unit}
                                                                                        contactsLoading={contactsLoading}
                                                                                        contacts={contactsData?.contacts}
                                                                                        contactsError={!!contactsError}
                                                                                    />
                                                                                }
                                                                                // We do not want to show tooltip before data is loaded, because that would cause interface to be jaggy,
                                                                                // because tooltip in loading state is different from tooltip with data
                                                                                open={lastOpenTooltip === unit.id && readyTooltip === unit.id}
                                                                                onOpenChange={(visible) => handleTooltipVisibilityChange(unit.id, visible, unit)}
                                                                                // Custom delay is implemented here, because we do not need user to spam with HTTP requests and eat all the available complexity
                                                                                mouseEnterDelay={0.3}
                                                                                placement='top'
                                                                            >
                                                                                <div style={UNIT_BUTTON_TOOLTIP_WRAPPER_STYLE}>
                                                                                    <UnitButton
                                                                                        type='unit'
                                                                                        key={unit.id}
                                                                                        unitType={unit.unitType}
                                                                                        onClick={() => {
                                                                                            setModalOpenedUnit(unit)
                                                                                            getContacts({
                                                                                                variables: {
                                                                                                    propertyId: property.id,
                                                                                                    unitName: unit.label,
                                                                                                    unitType: unit.unitType as unknown as ContactUnitTypeType,
                                                                                                },
                                                                                                fetchPolicy: 'cache-first',
                                                                                            })
                                                                                            toggleUnitModal()
                                                                                        }}
                                                                                    >
                                                                                        {unit.label}
                                                                                    </UnitButton>
                                                                                </div>
                                                                            </Tooltip>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        )
                                                    } else {
                                                        return (
                                                            <EmptyFloor key={`empty_${section.id}_${floorIndex}`} />
                                                        )
                                                    }
                                                })
                                            }
                                            <UnitButton
                                                type='section'
                                                block
                                                disabled
                                            >
                                                {`${builder.viewMode === MapViewMode.parking ? ParkingTitlePrefix : SectionNamePrefixTitle} ${section.name}`}
                                            </UnitButton>
                                        </MapSectionContainer>
                                    ))
                                }
                            </ScrollContainer>
                            <BuildingChooseSections
                                builder={builder}
                                refresh={refresh}
                                toggleFullscreen={toggleFullscreen}
                                isFullscreen={isFullscreen}
                                mode='view'
                            />
                        </Col>
                }
            </Row>
        </FullscreenWrapper>
    )
}
