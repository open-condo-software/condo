import React, { useState } from 'react'

import { Steps as Component, Button, Space } from '@open-condo/ui/src'

import type { StoryFn, Meta, StoryObj } from '@storybook/react-webpack5'

export default {
    title: 'Components/Steps',
    component: Component,
    argTypes: {
        items: { control: false },
        noReturnMessage: { control: 'text' },
    },
} as Meta<typeof Component>

const Template: StoryFn<typeof Component> = (args) => {
    const { items, ...restProps } = args
    const [current, setCurrent] = useState(0)

    return (
        <>
            <Component
                items={items}
                current={current}
                {...restProps}
                onChange={setCurrent}
            />
            <div style={{ marginTop: 40 }} className='content'>
                <Space size={12} direction='horizontal'>
                    <Button
                        type='secondary'
                        danger
                        children='Reset'
                        onClick={() => setCurrent(0)}
                    />
                    <Button
                        type='primary'
                        children='Next step!'
                        onClick={() => setCurrent((prev) => prev + 1)}
                        disabled={current + 1 >= items.length}
                    />
                </Space>
            </div>
        </>
    )
}

export const Simple: StoryObj<typeof Component> = {
    render: Template,
    args: {
        items: [
            { title: 'First step' },
            { title: 'Second step with additional text to show' },
            { title: 'Third step' },
            { title: 'Fourth step' },
        ],
    },
}

export const WithBreakpoints: StoryObj<typeof Component> = {
    render: Template,
    args: {
        items: [
            { title: 'First step' },
            { title: 'Second step' },
            { title: 'BREAKPOINT NO RETURN', breakPoint: true },
            { title: 'Fourth step' },
        ],
    },
}

export const Many: StoryObj<typeof Component> = {
    render: Template,
    args: {
        items: [
            { title: 'First step' },
            { title: 'Second step' },
            { title: 'BREAKPOINT NO RETURN', breakPoint: true },
            { title: 'Fourth step' },
            {
                title:
          'Fifth step with extra text so it can take up to 3 lines of text. Damn, that\'s a lot',
            },
            { title: 'Another breakpoint', breakPoint: true },
            { title: 'Seven is lucky one' },
            { title: 'Final step' },
            { title: 'One more...' },
            { title: 'We\'re done!' },
        ],
    },
}

export const Spacy: StoryObj<typeof Component> = {
    render: Template,
    args: {
        items: [{ title: 'We should take' }, { title: 'All possible space' }],
    },
}
