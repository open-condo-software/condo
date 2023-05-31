/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { trackedVisit } from './helpers'

const TICKET_CREATE_URL = '/ticket/create'
const TICKET_VIEW_URL = '/ticket'

class TicketCreate {
/*
    Elements:
        organization-select-item
        ticket__property-address-search-input
        ticket__property-address-search-option
        unit-name-input-item
        user__unit-name-input-option
        ticket__description-input
        ticket__place-select-item
        ticket__category-select-item
        ticket-problem-select-item
        ticket__classifier-option
        ticket__submit-button
*/

    visit (): this {
        trackedVisit(TICKET_CREATE_URL)
        return this
    }

    clickAndInputAddress (address: string): this {
        cy.get('[data-cy=ticket__property-address-search-input] input').should('be.visible')
        cy.wait('@getAllProperties')

        cy.get('[data-cy=ticket__property-address-search-input] input')
            .click({ force: true })
            .focus()
            // .type(address.slice(0, 5))
        return this
    }

    chooseAddressForTicket (): this {
        cy.get('[data-cy=ticket__property-address-search-option').should('be.visible')
        cy.get('[data-cy=ticket__property-address-search-input] input').click().type('{downArrow}').type('{enter}')
        cy.wait('@getAllProperties')
        return this
    }

    clickAndInputUnitName (unitName: string): this {
        cy.get('[data-cy=unit-name-input-item] .ant-select-selection-search').should('be.visible')
        cy.get('[data-cy=unit-name-input-item] input')
            .click({ force: true })
            .type(unitName)
        return this
    }

    chooseUnitName (): this {
        cy.get('[data-cy=user__unit-name-input-option]')
            .first()
            .click()
        return this
    }

    clickAndInputDescription (description): this {
        cy.get('[data-cy=ticket__description-input]')
            .click()
            .type(description)
        return this
    }

    selectProblemWithCategoryClassifier (): this {
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
            .type('{enter}')

        // Auto classificator can set second classifier value by itself:
        if (cy.get('[data-cy="ticket__category-select-item"]').within(() => cy.get('[class=ant-select-selection-item]'))) {
            return this
        }

        cy.get('[data-cy=ticket__category-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
            .type('{enter}')
        return this
    }

    clickOnSubmitButton (): this {
        cy.get('[data-cy=ticket__submit-button]').click()
        cy.wait('@createTicket')

        cy.location('pathname', { timeout: 10000 }).should('contain', TICKET_VIEW_URL)
        return this
    }
}

class TicketView {
/*
    Elements:
        ticket__filter-isWarranty
        ticket__filter-isPayable
        ticket__filter-isEmergency
        ticket__table
        ticket__filters-button
        common__filters-button-submit
        common__filters-button-reset
*/
    visit (): this {
        cy.visit(TICKET_VIEW_URL)
        cy.location('pathname').should('equal', TICKET_VIEW_URL)
        cy.wait('@getAllOrganizationEmployees')
        cy.wait('@getAllTicketStatuses')
        cy.wait('@getAllUserTicketCommentReadTimes')
        cy.wait('@getAllPropertyScopeOrganizationEmployees')
        cy.wait('@getAllTickets')
        return this
    }

    clickIsWarrantyCheckbox (): this {
        cy.get('[data-cy=ticket__filter-isWarranty]').should('not.be.disabled').click()
        cy.location('search').should('contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 0)

        cy.get('[data-cy=ticket__filter-isWarranty]').click()
        cy.location('search').should('not.contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        return this
    }

    clickIsPayableCheckbox (): this {
        cy.get('[data-cy=ticket__filter-isPayable]').click()
        cy.location('search').should('contain', 'isPayable')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 0)

        cy.get('[data-cy=ticket__filter-isPayable]').click()
        cy.location('search').should('not.contain', 'isPayable')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        return this
    }

    clickIsEmergencyCheckbox (): this {
        cy.get('[data-cy=ticket__filter-isEmergency]').click()
        cy.location('search').should('contain', 'isEmergency')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 0)

        cy.get('[data-cy=ticket__filter-isEmergency]').click()
        cy.location('search').should('not.contain', 'isEmergency')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        return this
    }

    clickOnGlobalFiltersButton (): this {
        cy.get('[data-cy=ticket__filters-button]').click()
        cy.wait('@getAllTicketFilterTemplates')

        return this
    }

    typeAddressSearchInput (propertyAddress: string): this {
        cy.wait(['@selectProperty', '@getAllTicketClassifiers', '@selectOrganizationEmployee', '@getAllOrganizationEmployees'])
        cy.get('input#property')
            .click()
            .type(propertyAddress.slice(0, 5))
        cy.wait('@selectProperty')

        cy.get('[data-cy=search-input--option]').should('be.visible')
        cy.get('[data-cy=search-input--option]').click()
        cy.get('[data-cy=common__filters-button-submit]').click()

        cy.wait('@getAllTickets')
        cy.location('search').should('contain', 'property')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        cy.get('[data-cy=common__filters-button-reset]').filter(':visible').click()
        cy.wait('@getAllTickets')
        cy.location('search').should('not.contain', 'property')
        cy.location('search').should('be.empty')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        return this
    }
}

class TicketEdit {
/*
    Elements:
        ticket__table
        ticket__status-select
        ticket__status-select-option
        ticket__update-link
        ticket__deadline-item
        ticket__assignee-item
        ticket__apply-changes-button
 */
    visit (ticket): this {
        cy.visit(`${TICKET_VIEW_URL}/${ticket.id}`)
        cy.wait([
            '@getAllTickets',
            '@getAllTicketFiles',
            '@getAllOrganizationEmployees',
            '@getAllTicketStatuses',
            '@getAllTicketComments',
            '@getAllTicketChanges',
            '@getAllTicketPropertyHints',
            '@getAllUserTicketCommentReadTimes',
            '@getAllOrganizationEmployeeSpecializations',
            '@getAllPropertyScopeProperties',
            '@getAllPropertyScopes',
            '@getAllPropertyScopeOrganizationEmployees',
            '@getAllTicketPropertyHintProperties',
            '@getAllIncidentProperties',
            '@getAllIncidents',
        ])

        return this
    }

    changeTicketStatus (): this {
        cy.wait('@getAllTickets')
        cy.wait('@getAllTicketClassifiers')
        cy.wait('@getAllTicketFiles')
        cy.wait('@getAllTicketStatuses')
        cy.wait('@getAllOrganizationEmployees')

        cy.get('[data-cy=ticket__status-select]').click()
        cy.get('[data-cy=ticket__status-select]').should('have.class', 'ant-select-open')

        cy.get('[data-cy=ticket__status-select-option]').first().click()

        return this
    }

    clickUpdateTicketLink (): this {
        cy.get('[data-cy=ticket__update-link]').click()

        cy.wait([
            '@getAllTickets',
            '@getAllTicketClassifiers',
            '@getAllProperties',
        ])

        cy.location('pathname').should('contain', '/update')

        return this
    }

    clickProblemClassifier (): this {
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search').click()

        cy.get('[data-cy=ticket__classifier-option]').first().click()
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search').should('not.have.class', '.ant-select-open')

        cy.get('[data-cy=ticket__category-select-item] .ant-select-selection-search').click().type('{downArrow}')
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket__classifier-option]')
            .first()
            .click({ force: true })

        return this
    }

    clickTicketDeadline (): this {
        cy.get('[data-cy=ticket__deadline-item] input').click()
        cy.get('.ant-picker-today-btn').click()

        return this
    }

    clickAssigneeInput (): this {
        cy.get('[data-cy=ticket__assignee-item] input')
            .click()
            .type('{downArrow}')
            .type('{enter}')

        return this
    }

    clickApplyChanges (): this {
        cy.get('[data-cy=ticket__apply-changes-button]').click()
        cy.location('pathname').should('not.contain', '/update')

        return this
    }
}

class TicketImport {
/*
Elements:
    data-importer--upload
    data-importer--success
    data-importer--error
*/

    visitTicketsPage (): this {
        trackedVisit(TICKET_VIEW_URL)
        cy.location('pathname').should('equal', TICKET_VIEW_URL)
        cy.wait(['@getAllTickets'])

        return this
    }

    importTicketTable (filePath: string): this {
        cy.get('[data-cy=data-importer--upload]', { timeout: 30000 })
            .selectFile(filePath, { force: true })

        return this
    }

    waitCreatingTicket (): this {
        cy.wait(['@selectContact', '@createTicket'], { timeout: 60000 })

        return this
    }

    waitFetchingContact (): this {
        cy.wait('@selectContact', { timeout: 60000 })

        return this
    }

    waitSuccessModal (): this {
        cy.get('[data-cy=data-importer--success]', { timeout: 30000 })
            .should('be.visible')

        return this
    }

    waitErrorModal (): this {
        cy.get('[data-cy=data-importer--error]', { timeout: 30000 })
            .should('be.visible')

        return this
    }
}

export {
    TicketCreate,
    TicketView,
    TicketEdit,
    TicketImport,
}
