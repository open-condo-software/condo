import omit from 'lodash/omit'
import React from 'react'

import { Typography, MarkdownCodeWrapper } from '@open-condo/ui'

import { Alert } from '@/domains/docs/components/Alert'
import { CardLink } from '@/domains/docs/components/CardLink'
import { Grid } from '@/domains/docs/components/Grid'
import { Link } from '@/domains/docs/components/Link'
import { Tabs } from '@/domains/docs/components/Tabs'
import { AmountDistributionCalculator } from '@/domains/docs/components/widgets/AmountDistributionCalculator'

import type { MDXComponents } from 'mdx/types'

export const MDXMapping: MDXComponents = {
    h1: (props) => <Typography.Title {...omit(props, 'ref')} level={1}/>,
    h2: (props) => <Typography.Title {...omit(props, 'ref')} level={2}/>,
    h3: (props) => <Typography.Title {...omit(props, 'ref')} level={3}/>,
    h4: (props) => <Typography.Title {...omit(props, 'ref')} level={4}/>,
    h5: (props) => <Typography.Title {...omit(props, 'ref')} level={5}/>,
    h6: (props) => <Typography.Title {...omit(props, 'ref')} level={6}/>,
    p: (props) => <Typography.Paragraph {...omit(props, 'ref')} type='inherit'/>,
    li: ({ children, ...restProps }) => <li {...restProps}><Typography.Text type='inherit'>{children}</Typography.Text></li>,
    pre: (props) => <MarkdownCodeWrapper {...props}/>,
    a: (props) => <Link {...props}/>,
    Alert,
    Tabs,
    Grid,
    CardLink,
    AmountDistributionCalculator,
}
