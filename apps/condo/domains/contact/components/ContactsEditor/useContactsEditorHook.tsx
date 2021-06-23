import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Contact } from '../../utils/clientSchema'
import { ContactsEditor, IContactEditorProps } from './index'

interface IContactsEditorHookArgs {
    // Organization scope for contacts autocomplete and new contact, that can be created
    organization: string,
}

interface IContactsEditorHookResult {
    createContact: (organization: string, property: string, unitName: string) => Promise<void>,
    ContactsEditorComponent: React.FC<IContactEditorProps>,
}

export const useContactsEditorHook = ({ organization }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    // Field value will be initialized only on user interaction.
    // In case of no interaction, no create action will be performed
    const [contactFields, setContactFields] = useState({})
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

    const createContactAction = Contact.useCreate({}, () => Promise.resolve())

    const handleChangeContact = (values, isNew) => {
        setContactFields(values)
        setShouldCreateContact(isNew)
    }

    const createContact = async (organization, property, unitName) => {
        if (shouldCreateContactRef.current) {
            try {
                return await createContactAction({
                    ...contactFieldsRef.current,
                    organization,
                    property,
                    unitName,
                })
            } catch (e) {
                // Duplicated contacts should be figured out on the client,
                // and "create" action should not be performed.
                // In case of violation of unique constraint on `Contact` table,
                // be silent for a user, but make a record in log.
                if (e.message.match('Contact_uniq')) {
                    console.error(e)
                } else {
                    throw (e)
                }
            }
        }
    }

    const ContactsEditorComponent: React.FC<IContactEditorProps> = useMemo(() => {
        const ContactsEditorWrapper = (props) => (
            <ContactsEditor
                {...props}
                organization={organization}
                onChange={handleChangeContact}
            />
        )
        return ContactsEditorWrapper
    }, [])

    return {
        createContact,
        ContactsEditorComponent,
    }
}