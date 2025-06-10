import React from 'react'

import * as condoIcons from '@open-condo/icons'
import { Input as Component } from '@open-condo/ui/src'
import { Button } from '@open-condo/ui/src'

import type { Meta, StoryObj } from '@storybook/react'

const singleIcons = Object.assign({}, ...Object.entries(condoIcons).map(([key, Icon]) => ({
    [`${key}-small`]: [<Icon size='small' color='grey' key={key} />],
    [`${key}-medium`]: [<Icon size='medium' color='grey' key={key} />],
    ['none']: [],
})))

const iconCombinations = {
    'copy-search': [
        <condoIcons.Copy size='small' color='grey' key='copy' />,
        <condoIcons.Search size='small' color='grey' key='search' />,
    ],
    'edit-copy': [
        <condoIcons.Edit size='small' color='grey' key='edit' />,
        <condoIcons.Copy size='small' color='grey' key='copy' />,
    ],
    'lock-eye': [
        <condoIcons.Lock size='small' color='grey' key='lock' />,
        <condoIcons.Eye size='small' color='grey' key='eye' />,
        <condoIcons.FileUp size='small' color='grey' key='eye-invisible' />,
    ],
    'full-set': [
        <condoIcons.Copy size='small' color='grey' key='copy' />,
        <condoIcons.Search size='small' color='grey' key='search' />,
        <condoIcons.Edit size='small' color='grey' key='edit' />,
        <condoIcons.Trash size='small' color='grey' key='trash' />,
    ],
}

const allPanelUtilsOptions = {
    ...singleIcons,
    ...iconCombinations,
}

export default {
    title: 'Components/Input',
    component: Component.TextArea,
    args: {
        placeholder: 'Placeholder',
        bottomPanelUtils: allPanelUtilsOptions['copy-search'],
        submitButton: <Button.Icon><condoIcons.ChevronUp size='small' /></Button.Icon>,
        autoSize: { minRows: 1, maxRows: 4 },
        disabled: false,
        rows: 1,
        showCount: true,
    },
    argTypes: {
        bottomPanelUtils: {
            options: Object.keys(allPanelUtilsOptions),
            mapping: allPanelUtilsOptions,
            control: {
                type: 'select',
            },
        },
    },
} as Meta<typeof Component.TextArea>

export const TextArea: StoryObj<typeof Component.TextArea> = {}
