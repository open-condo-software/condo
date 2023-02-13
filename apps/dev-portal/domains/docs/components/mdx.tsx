import omit from 'lodash/omit'
import React from 'react'


import { Typography, Alert } from '@open-condo/ui'

import type{ MDXComponents } from 'mdx/types'

export const MDXMapping: MDXComponents = {
    h1: (props) => <Typography.Title {...omit(props, 'ref')} level={1}/>,
    h2: (props) => <Typography.Title {...omit(props, 'ref')} level={2}/>,
    h3: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
    h4: (props) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
    h5: (props) => <Typography.Title {...omit(props, 'ref')} level={5}/>,
    h6: (props) => <Typography.Title {...omit(props, 'ref')} level={6}/>,
    p: (props) => <Typography.Paragraph {...omit(props, 'ref')} type='secondary'/>,
    li: ({ children, ...restProps }) => <li {...restProps}><Typography.Text type='secondary'>{children}</Typography.Text></li>,
    Alert,
}