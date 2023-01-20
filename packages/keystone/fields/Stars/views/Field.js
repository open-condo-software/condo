/** @jsx jsx */
import { FieldContainer, FieldInput, FieldLabel } from '@arch-ui/fields'
import { jsx } from '@emotion/react'

import Stars from './Stars'

const StarsField = ({ field, value, errors, onChange }) => (
    <FieldContainer>
        <FieldLabel htmlFor={`ks-input-${field.path}`} field={field} errors={errors}/>
        <FieldInput>
            <Stars count={field.config.starCount} value={value} onChange={onChange}/>
        </FieldInput>
    </FieldContainer>
)
export default StarsField
