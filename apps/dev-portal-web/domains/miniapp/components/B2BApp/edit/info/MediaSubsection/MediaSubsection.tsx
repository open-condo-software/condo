import { Col, Row } from 'antd'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import {
    B2C_LOGO_MAIN_COLOR,
    B2C_LOGO_SECONDARY_COLOR,
} from '@/domains/miniapp/constants/common'

import { AppCard } from './AppCard'
import { MediaUpload } from './MediaUpload'

import type { MediaRestrictions, PreviewRender } from './MediaUpload'
import type { RowProps } from 'antd'

import { useGetB2BAppQuery } from '@/gql'

const MEDIA_GUTTER: RowProps['gutter'] = [40, 40]
const FULL_SPAN_COL = 24

export const MediaSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const MainIconTitle = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.media.items.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'pages.apps.b2b.id.sections.info.media.items.main.description' })

    const { data } = useGetB2BAppQuery({ variables: { id } })

    const mainIconRestrictions: MediaRestrictions = useMemo(() => ({
        mimetypes: ['image/webp', 'image/png'],
        maxFileSize: 1024 * 1024 * 2,
    }), [])

    const logoPreview: PreviewRender = useCallback((items) => {
        const logoUrl = items[0]?.previewUrl
        return <AppCard img={logoUrl} title={data?.app?.name ?? ''} description={data?.app?.shortDescription} />
    }, [data?.app?.name, data?.app?.shortDescription])

    return (
        <Row gutter={MEDIA_GUTTER}>
            <Col span={FULL_SPAN_COL}>
                <MediaUpload
                    formName='update-b2b-app-logo-form'
                    title={MainIconTitle}
                    description={MainIconDescription}
                    restrictions={mainIconRestrictions}
                    maxFiles={1}
                    renderPreview={logoPreview}
                />
            </Col>
        </Row>
    )
}