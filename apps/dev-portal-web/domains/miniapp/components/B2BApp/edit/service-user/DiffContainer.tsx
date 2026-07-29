import { Col, Empty, Row, List } from 'antd'
import React from 'react'
import { useIntl, FormattedMessage } from 'react-intl'

import { PlusCircle } from '@open-condo/icons'
import { Typography } from '@open-condo/ui'

import type { ShowedPermissions } from '@/domains/miniapp/constants/b2bAppAccessRightSet'
import type { RowProps } from 'antd'


const SECTIONS_GUTTER: RowProps['gutter'] = [24, 24]
const FULL_COL_SPAN = 24

type DiffContainerProps = {
    added: Array<ShowedPermissions>
    removed: Array<ShowedPermissions>
    addedTitle?: string
    removedTitle?: string
}

export const DiffContainer: React.FC<DiffContainerProps> = ({ added, removed, addedTitle, removedTitle }) => {
    const intl = useIntl()
    const NoChangesText = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.diffContainer.noChanges.label' })
    const AddedLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.diffContainer.added.label' })
    const RemovedLabel = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.serviceUser.diffContainer.removed.label' })

    

    if (added.length === 0 && removed.length === 0) {
        return (
            <Empty
                image='/mascot/searching.webp'
                description={NoChangesText}
            />
        )
    }


    return (
        <Row gutter={SECTIONS_GUTTER}>
            {added.length > 0 && (
                <Col span={FULL_COL_SPAN}>
                    <List
                        size='small'
                        bordered
                        header={<Typography.Text strong>{addedTitle ?? AddedLabel}</Typography.Text>}
                        dataSource={added}
                        renderItem={(item) => (
                            <List.Item>
                                <Typography.Text size='medium'>
                                    <FormattedMessage id={`pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.permissions.${item}.label`} />
                                </Typography.Text>
                            </List.Item>
                        )}
                    />
                </Col>
            )}
            {removed.length > 0 && (
                <Col span={FULL_COL_SPAN}>
                    <List
                        size='small'
                        bordered
                        header={<Typography.Text strong>{removedTitle ?? RemovedLabel}</Typography.Text>}
                        dataSource={removed}
                        renderItem={(item) => (
                            <List.Item>
                                <Typography.Text size='medium'>
                                    <FormattedMessage id={`pages.apps.b2b.id.sections.serviceUser.accessRightSetForm.permissions.${item}.label`} />
                                </Typography.Text>
                            </List.Item>
                        )}
                    />
                </Col>
            )}
        </Row>
    )
}