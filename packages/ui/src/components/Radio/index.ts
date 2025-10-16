import { Radio as RadioComponent } from './radio'
import { RadioGroup } from './radiogroup'
import './style.less'

type RadioType = typeof RadioComponent & {
    Group: typeof RadioGroup
} 

const Radio = RadioComponent as RadioType
Radio.Group = RadioGroup

/** @deprecated we will remove this import in next major release, use {@link Radio.Group} instead */
const DeprecatedRadioGroup = RadioGroup

export type { RadioProps } from './radio'
export type { RadioGroupProps, ItemGroupProps } from './radiogroup'

export {
    Radio,
    DeprecatedRadioGroup as RadioGroup,
}

