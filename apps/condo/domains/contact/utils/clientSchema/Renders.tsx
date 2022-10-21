import { Space, Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import React  from 'react'
import { TicketTag } from '@condo/domains/ticket/components/TicketTag'
import { CONTACT_IS_VERIFIED_TAGS_COLORS } from '@condo/domains/contact/constants/constants'

export const getIsVerifiedRender = (intl, search: FilterValue) => {

    const VerifiedMessage = intl.formatMessage({ id: 'pages.condo.contact.Verified' })
    const NotVerified = intl.formatMessage({ id: 'pages.condo.contact.NotVerified' })

    return function render (isVerified, record) {
        const color = isVerified ? 'green' : 'red'
        const extraProps = { style: { color } }

        return (
            <Space direction='vertical' size={7}>
                <TicketTag
                    color={ CONTACT_IS_VERIFIED_TAGS_COLORS[`${record.isVerified ? 'verified' : 'notVerified' }`]}>
                    {record.isVerified ? <Typography.Text>{VerifiedMessage}</Typography.Text> : <Typography.Text>{NotVerified}</Typography.Text>}
                </TicketTag>
            </Space>
        )
    }
}
