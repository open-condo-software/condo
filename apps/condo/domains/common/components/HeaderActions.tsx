import { useIntl } from '@core/next/intl'
import { LinkWithIcon } from './LinkWithIcon'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { colors } from '../constants/style'
import React from 'react'
import { MessageDescriptor } from '@formatjs/intl/src/types'
import { useRouter } from 'next/router'
import get from 'lodash/get'

interface IReturnBackHeaderActionProps {
    descriptor: MessageDescriptor
    path: ((id: string) => string) | string
}

export const ReturnBackHeaderAction: React.FC<IReturnBackHeaderActionProps> = (props) => {
    const { descriptor, path } = props
    const intl = useIntl()
    const BackMessage = intl.formatMessage(descriptor)
    const { query } = useRouter()
    const url = typeof path === 'string' ? path : path(String(get(query, 'id')))

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={url}
        >
            {BackMessage}
        </LinkWithIcon>
    )
}