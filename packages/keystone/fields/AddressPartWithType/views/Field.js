/** @jsx jsx */
import { FieldContainer, FieldInput, FieldLabel } from '@arch-ui/fields'
import { Input } from '@arch-ui/input'
import { jsx } from '@emotion/react'

const AddressPartWithTypeField = ({ onChange, autoFocus, field, errors, value = '{}', isDisabled }) => {
    const { name = '', typeShort = '', typeFull = '' } = JSON.parse(value)

    const canRead = errors.every(
        error => !(error instanceof Error && error.name === 'AccessDeniedError'),
    )
    const error = errors.find(error => error instanceof Error && error.name === 'AccessDeniedError')
    const htmlIdName = `ks-input-${field.path}name`
    const htmlIdTypeShort = `ks-input-${field.path}typeShort`
    const htmlIdTypeFull = `ks-input-${field.path}typeFull`

    const resolveOnChange = (fieldName) => (event) => {
        onChange(JSON.stringify({ ...JSON.parse(value), [fieldName]: event.target.value }))
    }

    return (
        <FieldContainer>
            <FieldLabel field={field} errors={errors}/>
            <FieldInput>
                <FieldContainer>
                    <FieldLabel field={{ ...field, label: 'Full type' }} htmlFor={htmlIdName}/>
                    <FieldInput>
                        <Input
                            autoComplete='off'
                            autoFocus={autoFocus}
                            required={field.isRequired}
                            type='text'
                            value={canRead ? typeFull : undefined}
                            placeholder={canRead ? undefined : error.message}
                            onChange={resolveOnChange('typeFull')}
                            id={htmlIdName}
                            isMultiline={false}
                            disabled={isDisabled}
                        />
                    </FieldInput>
                </FieldContainer>
                <FieldContainer>
                    <FieldLabel field={{ ...field, label: 'Short type' }} htmlFor={htmlIdTypeShort}/>
                    <FieldInput>
                        <Input
                            autoComplete='off'
                            autoFocus={autoFocus}
                            required={field.isRequired}
                            type='text'
                            value={canRead ? typeShort : undefined}
                            placeholder={canRead ? undefined : error.message}
                            onChange={resolveOnChange('typeShort')}
                            id={htmlIdTypeShort}
                            isMultiline={false}
                            disabled={isDisabled}
                        />
                    </FieldInput>
                </FieldContainer>
                <FieldContainer>
                    <FieldLabel field={{ ...field, label: 'Name' }} htmlFor={htmlIdTypeFull}/>
                    <FieldInput>
                        <Input
                            autoComplete='off'
                            autoFocus={autoFocus}
                            required={field.isRequired}
                            type='text'
                            value={canRead ? name : undefined}
                            placeholder={canRead ? undefined : error.message}
                            onChange={resolveOnChange('name')}
                            id={htmlIdTypeFull}
                            isMultiline={false}
                            disabled={isDisabled}
                        />
                    </FieldInput>
                </FieldContainer>
            </FieldInput>
        </FieldContainer>
    )
}
export default AddressPartWithTypeField
