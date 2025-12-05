import {
    useCheckEmployeeExistenceLazyQuery,
    useCreateOrganizationEmployeeRoleMutation,
    useGetOrganizationEmployeeRolesByOrganizationQuery,
    useGetTicketCategoryClassifiersQuery,
} from '@app/condo/gql'
import {
    InviteNewOrganizationEmployeeInput,
    OrganizationEmployeeRoleTicketVisibilityTypeType,
} from '@app/condo/schema'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { SPECIAL_CHAR_REGEXP } from '@condo/domains/common/constants/regexps'
import { Columns, ObjectCreator, RowNormalizer, RowValidator } from '@condo/domains/common/utils/importer'
import { useInviteNewOrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

let rolesIdsByName = {}
let specializationIdsByName = {}

export const useEmployeeImporterFunctions = (): [Columns, RowNormalizer, RowValidator, ObjectCreator] => {
    const intl = useIntl()

    const NameTitle = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneTitle = intl.formatMessage({ id: 'Phone' })
    const RoleTitle = intl.formatMessage({ id: 'employee.Role' })
    const EmailTitle = intl.formatMessage({ id: 'field.EMail' })
    const PositionTitle = intl.formatMessage({ id: 'employee.Position' })
    const SpecializationTitle = intl.formatMessage({ id: 'employee.Specializations' })
    const AllSpecializationsTitle = intl.formatMessage({ id: 'employee.AllSpecializations' })

    const IncorrectRowFormatMessage = intl.formatMessage({ id: 'errors.import.IncorrectRowFormat' })
    const EmptyNameMessage = intl.formatMessage({ id: 'errors.import.employee.EmptyName' })
    const NameWithSpecialCharactersMessage = intl.formatMessage({ id: 'errors.import.employee.NameWithSpecialCharacters' })
    const IncorrectPhoneMessage = intl.formatMessage({ id: 'errors.import.employee.IncorrectPhone' })
    const EmptyRoleMessage = intl.formatMessage({ id: 'errors.import.employee.EmptyRole' })
    const IncorrectEmailMessage = intl.formatMessage({ id: 'errors.import.IncorrectEmailFormat' })
    const SpecializationNotFoundMessage = (specializations: string) => intl.formatMessage({ id: 'errors.import.employee.SpecializationNotFound' }, { specializations })
    const AlreadyInvitedPhoneMessage = intl.formatMessage({ id: 'errors.import.employee.AlreadyInvitedPhone' })
    const AlreadyInvitedEmailMessage = intl.formatMessage({ id: 'errors.import.employee.AlreadyInvitedEmail' })
    const CheckEmployeeExistsFailedMessage = intl.formatMessage({ id: 'errors.import.employee.CheckEmployeeExistsFailed' })

    const { organization } = useOrganization()
    const userOrganizationId = organization.id

    const inviteEmployeeAction = useInviteNewOrganizationEmployee({ organization: { id: userOrganizationId } }, () => {
        return
    })

    const [checkEmployeeExists] = useCheckEmployeeExistenceLazyQuery({
        fetchPolicy: 'network-only',
    })

    const { data: employeeRoles, loading: isRolesLoading } = useGetOrganizationEmployeeRolesByOrganizationQuery({
        variables: {
            organizationId: userOrganizationId,
        },
    })

    if (!isRolesLoading) {
        rolesIdsByName = employeeRoles?.roles.reduce((result, current) => ({
            ...result,
            [String(current.name).toLowerCase().trim()]: current.id,
        }), {})
    }

    const { data: ticketCategoryClassifiers, loading: isSpecializationsLoading } = useGetTicketCategoryClassifiersQuery({
        variables: {
            where: {
                OR: [
                    { organization_is_null: true },
                    { organization: { id: userOrganizationId } },
                ],
            },
        },
    })

    if (!isSpecializationsLoading) {
        specializationIdsByName = ticketCategoryClassifiers?.classifiers?.reduce((result, current) => ({
            ...result,
            [String(current.name).toLowerCase().trim()]: current.id,
        }), {}) || {}
    }

    const columns: Columns = [
        { name: NameTitle + '*', type: 'string', required: true },
        { name: PhoneTitle + '*', type: 'string', required: true },
        { name: RoleTitle + '*', type: 'string', required: true },
        { name: SpecializationTitle, type: 'string', required: false },
        { name: PositionTitle, type: 'string', required: false },
        { name: EmailTitle, type: 'string', required: false },
    ]

    const employeeNormalizer: RowNormalizer = async (row) => {
        if (row.length !== columns.length) return { row }

        const addons = {
            name: null,
            phone: null,
            role: null,
            email: null,
            position: null,
            specializations: [],
            hasAllSpecializations: false,
        }

        const [name, phone, role, specialization, position, email] = row

        addons.name = String(name?.value ?? '').trim()

        let phoneValue = String(phone?.value ?? '').trim()
        if (phoneValue.startsWith('8')) {
            phoneValue = '+7' + phoneValue.substring(1)
        }
        addons.phone = normalizePhone(phoneValue, true)

        addons.role = String(role?.value ?? '').trim().toLowerCase()

        const emailValue = String(email?.value ?? '').trim()
        if (emailValue) {
            addons.email = normalizeEmail(emailValue) || null
        }

        addons.position = String(position?.value ?? '').trim() || null

        const specializationValue = String(specialization?.value ?? '').trim()
        if (specializationValue) {
            if (specializationValue.toLowerCase() === AllSpecializationsTitle.toLowerCase()) {
                addons.hasAllSpecializations = true
            } else {
                addons.specializations = specializationValue.split(',')
                    .map(value => value.trim().toLowerCase())
                    .filter(Boolean)
            }
        }

        return { row, addons }
    }

    const employeeValidator: RowValidator = async (row) => {
        if (!row) return false
        const errors = []

        if (!row?.addons) errors.push(IncorrectRowFormatMessage)

        const name = row?.addons?.name
        if (!name) {
            errors.push(EmptyNameMessage)
        } else if (SPECIAL_CHAR_REGEXP.test(name)) {
            errors.push(NameWithSpecialCharactersMessage)
        }

        const phone = row?.addons?.phone
        if (!phone) {
            errors.push(IncorrectPhoneMessage)
        }

        const roleName = row?.addons?.role
        if (!roleName) {
            errors.push(EmptyRoleMessage)
        }

        const email = row?.addons?.email
        const emailValue = String(row?.row?.[5]?.value ?? '').trim()
        if (emailValue && email === null) {
            errors.push(IncorrectEmailMessage)
        }

        if (phone || email) {
            try {

                const { data } = await checkEmployeeExists({
                    variables: {
                        organizationId: userOrganizationId,
                        ...(phone ? { phone } : {}),
                        ...(email ? { email: email } : {}),
                    },
                })

                if (data?.objs?.length) {
                    if (phone && data.objs.some(employee => employee.phone === phone)) {
                        errors.push(AlreadyInvitedPhoneMessage)
                    }
                    if (row?.addons?.email && data.objs.some(employee => employee.email === row.addons.email)) {
                        errors.push(AlreadyInvitedEmailMessage)
                    }
                }
            } catch (e) {
                errors.push(CheckEmployeeExistsFailedMessage)
                console.error('Error checking existing employee:', e)
            }
        }

        const specializationNames = row?.addons?.specializations || []
        if (specializationNames.length && !row?.addons?.hasAllSpecializations) {
            const missingSpecializations = specializationNames.filter((name) => !specializationIdsByName?.[name])
            if (missingSpecializations.length) {
                errors.push(SpecializationNotFoundMessage(missingSpecializations.join(', ')))
            }
        }

        if (errors.length) {
            row.errors = errors
            return false
        }

        return true
    }

    const [createEmployeeRole] = useCreateOrganizationEmployeeRoleMutation()

    const employeeCreator: ObjectCreator = async (row) => {
        if (!row) return

        const name = row.addons.name
        const phone = row.addons.phone
        const roleName = row.addons.role
        const email = row.addons.email
        const position = row.addons.position
        const hasAllSpecializations = row.addons.hasAllSpecializations

        try {
            let roleId = rolesIdsByName[roleName]

            if (!roleId) {
                const newRole = await createEmployeeRole({
                    variables: {
                        data : {
                            organization: { connect : { id: userOrganizationId } },
                            ticketVisibilityType: OrganizationEmployeeRoleTicketVisibilityTypeType.Organization,
                            name: roleName,
                            dv: 1,
                            sender: getClientSideSenderInfo(),
                        },
                    } } )
                roleId = newRole.data.role.id
                rolesIdsByName[roleName] = roleId
            }

            const employeeData: Omit<InviteNewOrganizationEmployeeInput, 'organization'> = {
                name,
                phone,
                dv: 1,
                sender: getClientSideSenderInfo(),
                role: { id: roleId },
            }

            if (email) {
                employeeData.email = email
            }

            if (position) {
                employeeData.position = position
            }

            if (hasAllSpecializations) {
                employeeData.hasAllSpecializations = true
            } else if (row.addons.specializations?.length) {
                const specializationIds = row.addons.specializations
                    .map((name) => specializationIdsByName[name])
                    .filter(Boolean)
                    .map((id) => ({ id }))

                if (specializationIds.length) {
                    employeeData.specializations = specializationIds
                }
            }

            await inviteEmployeeAction(employeeData)
        } catch (error) {
            row.errors = [String(error.message || error)]
            row.shouldBeReported = true
        }
    }

    return [columns, employeeNormalizer, employeeValidator, employeeCreator]
}
