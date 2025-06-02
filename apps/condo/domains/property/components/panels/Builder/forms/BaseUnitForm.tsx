import { RowProps } from 'antd'
import React from 'react'

import { MapEdit } from '@condo/domains/property/components/panels/Builder/MapConstructor'

export interface IPropertyMapModalForm {
    builder: MapEdit
    refresh(): void
    setDuplicatedUnitIds?: React.Dispatch<React.SetStateAction<string[]>>
}

export const MODAL_FORM_ROW_GUTTER: RowProps['gutter'] = [0, 24]
export const MODAL_FORM_ROW_BUTTONS_GUTTER: RowProps['gutter'] = [0, 16]
export const MODAL_FORM_EDIT_GUTTER: RowProps['gutter'] = [0, 28]
export const MODAL_FORM_BUTTON_GUTTER: RowProps['gutter'] = [0, 16]
export const INPUT_STYLE = { width: '100%' }
