import {
    BuildingUnitSubType,
    Property as PropertyType,
    Organization as OrganizationType,
} from '@app/condo/schema'
import { Row } from 'antd'
import { EllipsisConfig } from 'antd/lib/typography/Base'
import { useLayoutEffect, useRef, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'

import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'

import styles from './ClientAddressCard.module.css'


const ADDRESS_STREET_ONE_ROW_HEIGHT = 25
const ADDRESS_POSTFIX_ONE_ROW_HEIGHT = 22
const ONE_ROW_ELLIPSIS: EllipsisConfig = { rows: 1 }
const TWO_ROWS_ELLIPSIS: EllipsisConfig = { rows: 2 }

interface IClientAddressCardProps {
    onClick: () => void
    active?: boolean
    property: Pick<PropertyType, 'id' | 'address'>
    organization: Pick<OrganizationType, 'id' | 'name' | 'phoneNumberPrefix'>
    unitName?: string
    floorName?: string
    unitType?: string
    sectionName?: string
    showOrganizationMessage?: boolean
}

export const ClientAddressCard: React.FC<IClientAddressCardProps> = ({ onClick, active, property, organization, unitName, floorName, unitType, sectionName, showOrganizationMessage }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const FlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ParkingMessage = intl.formatMessage({ id: 'field.UnitType.prefix.parking' })
    const FloorMessage = intl.formatMessage({ id: 'field.ShortFloorName' })
    const SectionMessage = intl.formatMessage({ id: 'field.ShortSectionName' })

    const addressStreetRef = useRef<HTMLDivElement>()
    const addressPostfixRef = useRef<HTMLDivElement>()

    const [addressStreetEllipsis, setAddressStreetEllipsis] = useState<EllipsisConfig>(TWO_ROWS_ELLIPSIS)
    const [addressPostfixEllipsis, setAddressPostfixEllipsis] = useState<EllipsisConfig>(TWO_ROWS_ELLIPSIS)

    useLayoutEffect(() => {
        const addressStreetTextHeight = addressStreetRef.current?.clientHeight
        const addressPostfixTextHeight = addressPostfixRef.current?.clientHeight

        if (addressStreetTextHeight > ADDRESS_STREET_ONE_ROW_HEIGHT) {
            setAddressStreetEllipsis(TWO_ROWS_ELLIPSIS)
            setAddressPostfixEllipsis(ONE_ROW_ELLIPSIS)
        } else if (addressPostfixTextHeight > ADDRESS_POSTFIX_ONE_ROW_HEIGHT) {
            setAddressStreetEllipsis(ONE_ROW_ELLIPSIS)
            setAddressPostfixEllipsis(TWO_ROWS_ELLIPSIS)
        }
    }, [])

    const { text, postfix } = getPropertyAddressParts(property, DeletedMessage)
    const unitNamePrefix = unitType === BuildingUnitSubType.Parking ? ParkingMessage : FlatMessage
    const streetMessage = unitName ? text : text.substring(0, text.length - 1)

    return (
        <div data-active={active} className={styles.addressTabWrapper} onClick={onClick}>
            <div className={styles.addressTabContent}>
                <Space size={4} direction='vertical'>
                    {
                        showOrganizationMessage && (
                            <Typography.Paragraph
                                size='large'
                                ellipsis={TWO_ROWS_ELLIPSIS}
                                type='secondary'
                            >
                                {organization.name}
                            </Typography.Paragraph>
                        )
                    }
                    <Space size={4} direction='vertical'>
                        <Space size={0} direction='vertical'>
                            <Typography.Text
                                ref={addressStreetRef}
                                ellipsis={addressStreetEllipsis}
                                title={streetMessage}
                                strong
                            >
                                {streetMessage}
                            </Typography.Text>
                            {floorName || sectionName || unitName ? (
                                <Row className={styles.unitRows}>
                                    <Typography.Text
                                        ref={addressStreetRef}
                                        ellipsis={addressStreetEllipsis}
                                        title={streetMessage}
                                        strong
                                    >
                                        {unitNamePrefix} {unitName}
                                    </Typography.Text>

                                    {sectionName && floorName && (
                                        <Typography.Text type='secondary'>
                                    ({SectionMessage} {sectionName}, {FloorMessage} {floorName})
                                        </Typography.Text>
                                    )}
                                </Row>
                            ) : null}
                        </Space>
                        <Typography.Paragraph
                            size='medium'
                            ref={addressPostfixRef}
                            ellipsis={addressPostfixEllipsis}
                            title={postfix}
                            type='secondary'
                        >
                            {postfix}
                        </Typography.Paragraph>
                    </Space>
                </Space>
            </div>
        </div>
    )
}

interface ISearchByAddressCardProps {
    onClick: () => void
    active?: boolean
}

export const SearchByAddressCard: React.FC<ISearchByAddressCardProps> = ({ onClick, active }) => {
    const intl = useIntl()
    const SearchByAddressMessage = intl.formatMessage({ id: 'pages.clientCard.searchByAddress' })
    
    return (
        <div data-active={active} className={styles.addressTabWrapper} onClick={onClick}>
            <div className={styles.addressTabContent}>
                <Space 
                    size={20}
                    direction='horizontal'
                    align='center'
                    height='100%'
                    className={styles.addressSearchTabWrapper}
                >
                    <Search />
                    <Typography.Title level={4}>{SearchByAddressMessage}</Typography.Title>
                </Space>
            </div>
        </div>
    )
}