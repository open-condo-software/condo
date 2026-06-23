import { Col, Row } from 'antd'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import {
    B2C_LOGO_MAIN_COLOR,
    B2C_LOGO_SECONDARY_COLOR,
} from '@/domains/miniapp/constants/common'

import { MediaUpload } from './MediaUpload'

import type { MediaRestrictions } from './MediaUpload'
import type { RowProps } from 'antd'

const MEDIA_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_SPAN_COL = 24

export const MediaSubsection: React.FC<{ id: string }> = () => {
    const intl = useIntl()
    const MainIconTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.media.items.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.media.items.main.description' })

    const mainIconRestrictions: MediaRestrictions = useMemo(() => ({
        size: {
            width: { min: 100, max: 100 },
            height: { min: 100, max: 120 },
        },
        colors: [
            { value: B2C_LOGO_MAIN_COLOR, textColor: 'white' },
            { value: B2C_LOGO_SECONDARY_COLOR, textColor: 'black' },
        ],
    }), [])

    return (
        <Row gutter={MEDIA_GUTTER}>
            <Col span={FULL_SPAN_COL}>
                <MediaUpload
                    title={MainIconTitle}
                    description={MainIconDescription}
                    restrictions={mainIconRestrictions}
                    maxFiles={1}
                />
            </Col>
        </Row>
    )
}