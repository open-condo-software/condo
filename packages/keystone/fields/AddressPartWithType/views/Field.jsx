/** @jsx jsx */
import { jsx } from '@emotion/react'
import { FieldContainer, FieldInput, FieldLabel } from '@open-arch-ui/fields'
import { Input } from '@open-arch-ui/input'
import Select from '@open-arch-ui/select'
import get from 'lodash/get'

const AddressPartWithTypeField = ({ onChange, autoFocus, field, errors, value = '{}', isDisabled }) => {
    //todo(AleX83Xpert) maybe add a boolean field to control displaying of some address part within address string (suggestion's value)
    const { name = '', typeShort = '', typeFull = '' } = JSON.parse(value || '{}')

    const canRead = errors.every(
        error => !(error instanceof Error && error.name === 'AccessDeniedError'),
    )
    const error = errors.find(error => error instanceof Error && error.name === 'AccessDeniedError')
    const htmlIdName = `ks-input-${field.path}name`
    const htmlIdTypeShort = `ks-input-${field.path}typeShort`
    const htmlIdTypeFull = `ks-input-${field.path}typeFull`

    const typeFullAllowedValues = get(field, ['allowedValues', 'typeFull'])

    const resolveOnChange = (fieldName) => (event) => {
        onChange(JSON.stringify({ ...JSON.parse(value), [fieldName]: event.target.value }))
    }

    const resolveOnSelectChange = (fieldName) => (newValue) => {
        onChange(JSON.stringify({ ...JSON.parse(value), [fieldName]: newValue.value }))
    }

    return (
        <FieldContainer>
            <FieldLabel field={field} errors={errors}/>
            <FieldInput>
                <FieldContainer>
                    <FieldLabel field={{ ...field, label: 'Full type' }} htmlFor={htmlIdName}/>
                    <FieldInput>
                        {
                            typeFullAllowedValues
                                ? (
                                    <Select
                                        autoFocus={autoFocus}
                                        required={field.isRequired}
                                        value={canRead ? { label: typeFull, value: typeFull } : undefined}
                                        placeholder={canRead ? undefined : error.message}
                                        options={typeFullAllowedValues.map((item) => ({ label: item, value: item }))}
                                        onChange={resolveOnSelectChange('typeFull')}
                                        isClearable={false}
                                        id={`react-select-${htmlIdTypeFull}`}
                                        inputId={htmlIdTypeFull}
                                        instanceId={htmlIdTypeFull}
                                        isDisabled={isDisabled}
                                        showSearch={false}
                                    />
                                )
                                : (
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
                                )
                        }
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
