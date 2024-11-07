import { FilterFilled } from '@ant-design/icons'
import React, { CSSProperties } from 'react'

import { colors } from '../constants/style'

const STYLE_FILTERED: CSSProperties = { color: colors.sberPrimary[5] }
const STYLE_NO_COLOR: CSSProperties = { color: undefined }

/**
 * @deprecated use getFilterIcon from "apps/condo/domains/common/components/Table/Filters.tsx"
 */
export const getFilterIcon = filtered => <FilterFilled style={filtered ? STYLE_FILTERED : STYLE_NO_COLOR} />
