import { Upload, Row, Col } from 'antd'
import get from 'lodash/get'
import React from 'react'
import { useIntl } from 'react-intl'

import { Download } from '@open-condo/icons'
import { Space, Typography } from '@open-condo/ui'

import {
    DEFAULT_B2C_LOGO_URL,
    B2C_LOGO_MIN_SIZE,
    B2C_LOGO_MAX_SIZE,
    B2C_LOGO_ALLOWED_MIMETYPES,
    B2C_LOGO_MAX_FILE_SIZE_IN_BYTES,
} from '@/domains/miniapp/constants/common'
import { useImageValidator } from '@/domains/miniapp/hooks/useImageValidator'

import { B2CAppCard } from './B2CAppCard'
import styles from './IconsSubsection.module.css'

import type { RowProps } from 'antd'

import { useAuth } from '@/lib/auth'
import { useGetB2CAppQuery } from '@/lib/gql'

const ROW_ICONS_CONTENT_GUTTER: RowProps['gutter'] = [12, 12]
const COL_FULL_SPAN = 24


const UploadImageText: React.FC = () => {
    const intl = useIntl()
    const UploadImageMessage = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.action.uploadImage' })

    return (
        <Typography.Link size='medium'>
            <Space size={8} direction='horizontal'>
                <Download size='medium'/>
                {UploadImageMessage}
            </Space>
        </Typography.Link>
    )
}

export const IconsSubsection: React.FC<{ id: string }> = ({ id }) => {
    const intl = useIntl()
    const MainIconTitle = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.main.title' })
    const MainIconDescription = intl.formatMessage({ id: 'apps.b2c.sections.info.icons.main.description' }, {
        format: 'png',
        minSize: B2C_LOGO_MIN_SIZE,
        maxSize: B2C_LOGO_MAX_SIZE,
    })

    const { user } = useAuth()
    const variables = { id, creator: { id: user?.id } }
    const { data } = useGetB2CAppQuery({ variables })

    const name = get(data, ['objs', '0', 'name'], '')
    const logo = get(data, ['objs', '0', 'logo', 'publicUrl'], DEFAULT_B2C_LOGO_URL)

    const beforeUpload = useImageValidator({
        restrictMimeTypes: B2C_LOGO_ALLOWED_MIMETYPES,
        sizeLimit: B2C_LOGO_MAX_FILE_SIZE_IN_BYTES,
        dimensionsLimit: {
            max: { width: B2C_LOGO_MAX_SIZE, height: B2C_LOGO_MAX_SIZE },
            min: { width: B2C_LOGO_MIN_SIZE, height: B2C_LOGO_MIN_SIZE },
        },
    })

    return (
        <div className={styles.subSectionContainer}>
            <B2CAppCard name={name} logo={logo}/>
            <Row gutter={ROW_ICONS_CONTENT_GUTTER}>
                <Col span={COL_FULL_SPAN}>
                    <Typography.Title type='secondary' level={4}>{MainIconTitle}</Typography.Title>
                </Col>
                <Col span={COL_FULL_SPAN}>
                    <Typography.Paragraph size='medium'>{MainIconDescription}</Typography.Paragraph>
                </Col>
                <Col span={COL_FULL_SPAN}>
                    <Upload
                        listType='picture'
                        beforeUpload={beforeUpload}
                    >
                        <UploadImageText/>
                    </Upload>
                </Col>
            </Row>
        </div>
    )
}