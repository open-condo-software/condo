/** @jsx jsx */
import { css, jsx } from '@emotion/react'
import { CheckboxPrimitive } from '@open-arch-ui/controls'
import { FieldContainer, FieldDescription, FieldInput } from '@open-arch-ui/fields'
import { Lozenge } from '@open-arch-ui/lozenge'
import { colors, gridSize } from '@open-arch-ui/theme'
import { ShieldIcon } from '@primer/octicons-react'
import { useEffect, useState } from 'react'

const Checkbox = ({ label, value, onChange }) => {
    const checked = value || false
    const htmlID = `ks-input-${label}`
    return (
        <div css={css`display: flex; align-items: center;`}>
            <label htmlFor={htmlID}>{label}</label>
            <FieldInput css={{ height: 35, order: '-1' }}>
                <CheckboxPrimitive
                    autoFocus={false}
                    checked={checked}
                    onChange={event => onChange({ [label]: event.target.checked })}
                    id={htmlID}
                />
            </FieldInput>
        </div>
    )
}

const OptionsField = ({ onChange, autoFocus, field, value, errors }) => {
    const initialState = value ? value : field.getDefaultValue()
    const [values, setValues] = useState(initialState)
    useEffect(() => {
        onChange(values)
    }, [values, onChange])

    const handleChange = newValue => {
        setValues({ ...values, ...newValue })
    }

    const accessError = (errors || []).find(
        error => error instanceof Error && error.name === 'AccessDeniedError',
    )

    return (
        <FieldContainer>
            <div
                css={{
                    color: colors.N60,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    paddingBottom: gridSize,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}
            >
                {field.label}
            </div>
            {accessError ? (
                <ShieldIcon title={accessError.message} css={{ color: colors.N20, marginRight: '1em' }}/>
            ) : null}
            {field.config.isRequired ? <Lozenge appearance='primary'> Required </Lozenge> : null}
            {field.config.adminDoc && <FieldDescription>{field.config.adminDoc}</FieldDescription>}
            <div>
                {field.config.options.map(label => (
                    <Checkbox
                        key={`ks-input-${label}`}
                        autoFocus={autoFocus}
                        value={values[label]}
                        label={label}
                        onChange={handleChange}
                    />
                ))}
            </div>
        </FieldContainer>
    )
}

export default OptionsField
