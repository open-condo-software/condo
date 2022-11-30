import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ContactFields, ContactsEditor, IContactEditorProps } from './index'
import { OrganizationEmployeeRole } from '@app/condo/schema'

interface IContactsEditorHookArgs {
    // Organization scope for contacts autocomplete and new contact, that can be created
    organization: string,
    role?: OrganizationEmployeeRole,
    allowLandLine?: boolean,
}

interface IContactsEditorHookResult {
    ContactsEditorComponent: React.FC<IContactEditorProps>
}

export const useContactsEditorHook = ({ organization, role, allowLandLine }: IContactsEditorHookArgs): IContactsEditorHookResult => {
    const [shouldCreateContact, setShouldCreateContact] = useState(false)

    const shouldCreateContactRef = useRef(shouldCreateContact)
    useEffect(() => {
        shouldCreateContactRef.current = shouldCreateContact
    }, [shouldCreateContact])

    const handleChangeContact = (values, isNew) => {
        setShouldCreateContact(isNew)
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
        ContactsEditorComponent,
    }
}
