import {
    BuildingUnitSubType,
} from '@app/condo/schema'
import { Row } from 'antd'
import { EllipsisConfig } from 'antd/lib/typography/Base'
import { useLayoutEffect, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'

import { getPropertyAddressParts } from '@condo/domains/property/utils/helpers'

import styles from './ClientAddressCard.module.css'


const ADDRESS_STREET_ONE_ROW_HEIGHT = 25
const ADDRESS_POSTFIX_ONE_ROW_HEIGHT = 22


export const ClientAddressCard = ({ onClick, active, property, organization, unitName, floorName, unitType, sectionName }) => {
    const intl = useIntl()
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const FlatMessage = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ParkingMessage = intl.formatMessage({ id: 'field.UnitType.prefix.parking' })
    const FloorMessage = intl.formatMessage({ id: 'field.ShortFloorName' })
    const SectionMessage = intl.formatMessage({ id: 'field.ShortSectionName' })

    const addressStreetRef = useRef<HTMLDivElement>()
    const addressPostfixRef = useRef<HTMLDivElement>()

    const [addressStreetEllipsis, setAddressStreetEllipsis] = useState<EllipsisConfig>({ rows: 2 })
    const [addressPostfixEllipsis, setAddressPostfixEllipsis] = useState<EllipsisConfig>({ rows: 2 })

    useLayoutEffect(() => {
        const addressStreetTextHeight = addressStreetRef.current.clientHeight
        const addressPostfixTextHeight = addressPostfixRef.current.clientHeight

        if (addressStreetTextHeight > ADDRESS_STREET_ONE_ROW_HEIGHT) {
            setAddressStreetEllipsis({ rows: 2 })
            setAddressPostfixEllipsis({ rows: 1 })
        } else if (addressPostfixTextHeight > ADDRESS_POSTFIX_ONE_ROW_HEIGHT) {
            setAddressStreetEllipsis({ rows: 1 })
            setAddressPostfixEllipsis({ rows: 2 })
        }
    }, [])

    const { text, postfix } = getPropertyAddressParts(property, DeletedMessage)
    const unitNamePrefix = unitType === BuildingUnitSubType.Parking ? ParkingMessage : FlatMessage
    const streetMessage = unitName ? text : text.substring(0, text.length - 1)

    return (
        <div data-active={active} className={styles.addressTabWrapper} onClick={onClick}>
            <div className={styles.addressTabContent}>
                <Space size={8} direction='vertical'>
                    <Typography.Paragraph
                        size='large'
                        ellipsis={{ rows: 2 }}
                        type='secondary'
                    >
                        {organization.name}
                    </Typography.Paragraph>

                    <Typography.Text
                        ref={addressStreetRef}
                        ellipsis={addressStreetEllipsis}
                        title={streetMessage}
                        strong
                    >
                        {streetMessage}
                    </Typography.Text>

                    {floorName || sectionName || unitName ? (
                        <Row style={{ gap: 4 }}>
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
            </div>
        </div>
    )
}

export const SearchByAddressCard = ({ onClick, active }) => {

    return (
        <div data-active={active} className={styles.addressTabWrapper} onClick={onClick}>
            <div className={styles.addressTabContent}>
                Поиск по адресу
            </div>
        </div>
    )
}