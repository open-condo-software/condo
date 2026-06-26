import { Row, Col } from 'antd'
import { useRouter } from 'next/router'
import React, { CSSProperties } from 'react'

import { Space, Typography, Button } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

import type { RowProps } from 'antd'


const FULL_SPAN = 24
const SECTION_GUTTER: RowProps['gutter'] = [0, 30]

const BLOCK_GAP = 24
const BLOCK_CONTENT_GAP = 16
const SEARCHING_MASCOT_IMG = '/mascot/searching.webp'
const IMG_STYLES: CSSProperties = { marginBottom: 24 }


export const SetupTab: React.FC = () => {
    const router = useRouter()
    const SetupIsNotCompletedTitle = 'Пока платежей и начислений нет'
    const SetupIsNotCompletedMessage = 'Настройте раздел'
    const StartSetupTitle = 'Настроить раздел'

    return (
        <Row gutter={SECTION_GUTTER}>
            <Col span={FULL_SPAN}>
                <BasicEmptyListView spaceSize={BLOCK_GAP} image={SEARCHING_MASCOT_IMG} imageStyle={IMG_STYLES}>
                    <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                        <Typography.Title level={3}>{SetupIsNotCompletedTitle}</Typography.Title>
                        <Typography.Text type='secondary'>{SetupIsNotCompletedMessage}</Typography.Text>
                    </Space>
                    <Space size={BLOCK_CONTENT_GAP} direction='vertical' align='center'>
                        <Button type='primary' onClick={() => router.push('/billing/setup?step=0')}>
                            {StartSetupTitle}
                        </Button>
                    </Space>
                </BasicEmptyListView>
            </Col>
        </Row>
    )
}