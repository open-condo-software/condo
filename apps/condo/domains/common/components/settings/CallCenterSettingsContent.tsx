import React, { useCallback, useState } from 'react'
import { Col, Row, Typography } from 'antd'
import get from 'lodash/get'

import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import Input from '@condo/domains/common/components/antd/Input'
import { CardsContainer } from '@condo/domains/miniapp/components/AppSelector/CardsContainer'
import { TicketOrganizationSetting } from '@condo/domains/ticket/utils/clientSchema'
import {
    TicketOrganizationDeadlineCard,
} from '@condo/domains/ticket/components/TicketOrganizationDeadline/TicketOrganizationDeadlineCard'

export const CallCenterSettingsContent: React.FC = () => {
    const intl = useIntl()
    const CallCenterTitle = intl.formatMessage({ id: 'CallCenter' })
    const SearchPlaceholder = intl.formatMessage({ id: 'search' })

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const { obj: ticketOrganizationSetting } = TicketOrganizationSetting.useObject({
        where: {
            organization: { id: userOrganizationId },
        },
    })

    const [search, setSearch] = useState<string>('')

    // todo (DOMA-1564) search
    const handleSearch = useCallback((event) => {
        setSearch(event.target.value)
    }, [])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <Typography.Title level={3}>{CallCenterTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row>
                        <Col span={10}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={handleSearch}
                                value={search}
                                allowClear
                            />
                        </Col>
                    </Row>
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <CardsContainer cardsPerRow={3}>
                    <TicketOrganizationDeadlineCard ticketOrganizationSetting={ticketOrganizationSetting}/>
                </CardsContainer>
            </Col>
        </Row>
    )
}
