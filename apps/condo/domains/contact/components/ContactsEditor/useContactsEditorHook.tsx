import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Contact } from '../../utils/clientSchema'
import { ContactFields, ContactsEditor, IContactEditorProps } from './index'
import { IContactUIState } from '../../utils/clientSchema/Contact'
import { IOrganizationEmployeeRoleUIState } from '@condo/domains/organization/utils/clientSchema/OrganizationEmployeeRole'
import { PROPERTY_REQUIRED_ERROR } from '@condo/domains/common/constants/errors'
import { BuildingUnitSubType } from '@app/condo/schema'

interface IContactsEditorHookArgs {
    // Organization scope for contacts autocomplete and new contact, that can be created
    organization: string,
    role?: IOrganizationEmployeeRoleUIState,
    allowLandLine?: boolean,
}

type CreateContactType = (organization: string, property: string, unitName: string, unitType?: BuildingUnitSubType) => Promise<IContactUIState>

interface IContactsEditorHookResult {
    createContact: CreateContactType,
    ContactsEditorComponent: React.FC<IContactEditorProps>,
    // Explicitly indicates, that we have enough data to call `createContact` action
    canCreateContact: boolean,
}

export const useContactsEditorHook = ({ organization, role, allowLandLine }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    // Field value will be initialized only on user interaction.
    // In case of no interaction, no create action will be performed
    // @ts-ignore
    const [contactFields, setContactFields] = useState<ContactFields>({})
    const [shouldCreateContact, setShouldCreateContact] = useState(false)

    // Closure of `createContact` will be broken, when it will be assigned to another constant outside of this hook
    // Refs are used to keep it

    const contactFieldsRef = useRef(contactFields)
    useEffect(() => {
        contactFieldsRef.current = contactFields
    }, [contactFields])

    const shouldCreateContactRef = useRef(shouldCreateContact)
    useEffect(() => {
        shouldCreateContactRef.current = shouldCreateContact
    }, [shouldCreateContact])

    // @ts-ignore
    const createContactAction = Contact.useCreate({}, () => Promise.resolve())

    const handleChangeContact = (values, isNew) => {
        setContactFields(values)
        setShouldCreateContact(isNew)
    }

    const createContact: CreateContactType = async (organization, property, unitName, unitType = BuildingUnitSubType.Flat) => {
        if (shouldCreateContactRef.current) {
            // property is a required field for contact creation
            if (!property) {
                throw new Error(`${PROPERTY_REQUIRED_ERROR}] no property selected for contact`)
            }
            try {
                return await createContactAction({
                    phone: contactFieldsRef.current.phone,
                    name: contactFieldsRef.current.name,
                    organization,
                    property,
                    unitName,
                    unitType,
                })
            } catch (e) {
                // Duplicated contacts should be figured out on the client,
                // and "create" action should not be performed.
                // In case of violation of unique constraint on `Contact` table,
                // be silent for a user, but make a record in log.
                console.error(e)
                if (!e.message.match('Contact_uniq')) {
                    throw e
                }
            }
        }
    }

    const organizationRef = useRef(organization)
    useEffect(() => {
        organizationRef.current = organization
    }, [organization])

    const roleRef = useRef(role)
    useEffect(() => {
        roleRef.current = role
    }, [role])

    const ContactsEditorComponent: React.FC<IContactEditorProps> = useMemo(() => {
        const ContactsEditorWrapper = (props) => (
            <ContactsEditor
                {...props}
                role={roleRef.current}
                organization={organizationRef.current}
                onChange={handleChangeContact}
                allowLandLine={allowLandLine}
            />
        )
        return ContactsEditorWrapper
    }, [])

    return {
        createContact,
        canCreateContact: !!contactFields.phone && !!contactFields.name,
        ContactsEditorComponent,
    }
}
