import React from 'react'

import { ComponentMeta, ComponentStory } from '@storybook/react'
import { Test } from '../../src'

export default {
    title: 'Components/Test',
    component: Test,
} as ComponentMeta<typeof Test>

const Template: ComponentStory<typeof Test> = () => <Test/>

export const Primary = Template.bind({})