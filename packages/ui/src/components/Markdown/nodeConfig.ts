import React from 'react'

import { Typography } from '../Typography'

export type RenderType = 'default' | 'inline'

export type NodeConfig = {
    component: React.ComponentType<any>
    props?: Record<string, any>
    getProps?: (attrs: Record<string, any>) => Record<string, any>
}

/**
 * Unified config map for markdown node rendering.
 * Single source of truth: both Markdown (read-only) and RichTextArea (editor)
 * use this config to determine which UI-kit component to render for each node type.
 *
 * Consumers provide children differently:
 * - Markdown (react-markdown): passes `children` prop directly
 * - RichTextArea (TipTap): passes `<NodeViewContent />` as children
 */
export const NODE_CONFIG_BY_TYPE: Record<RenderType, Record<string, NodeConfig>> = {
    default: {
        heading: {
            component: Typography.Title,
            getProps: (attrs) => ({ level: attrs.level }),
        },
        listItem: {
            component: Typography.Text,
            props: { type: 'secondary' },
        },
    },
    inline: {
        heading: {
            component: Typography.Paragraph,
            props: { strong: true, type: 'primary' },
        },
        paragraph: {
            component: Typography.Paragraph,
            props: { type: 'primary' },
        },
        listItem: {
            component: Typography.Text,
        },
    },
}
