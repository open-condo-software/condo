/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const TICKET_CREATE_URL = '/ticket/create'
const TICKET_VIEW_URL = '/ticket'

const BASE_SIDE_EFFECTS = ['@getAllOnBoardings', '@getAllOnBoardingSteps', '@getAllOrganizationEmployees', '@getOrganizationEmployeeById']

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

    visit () {
        cy.visit(TICKET_CREATE_URL)
        cy.wait(BASE_SIDE_EFFECTS)
        return this
    }

    clickAndInputAddress (address) {
        cy.get('[data-cy=ticket__property-address-search-input] input', {
            timeout: 5000,
        }).should('be.visible')
        cy.wait('@getAllProperties')

        cy.get('[data-cy=ticket__property-address-search-input] input')
            .click({ force: true })
            .focus()
            // .type(address.slice(0, 5))
        return this
    }

    chooseAddressForTicket () {
        cy.get('[data-cy=ticket__property-address-search-option', {
            timeout: 5000,
        }).should('be.visible')
        cy.get('[data-cy=ticket__property-address-search-input] input').click().type('{downArrow}').type('{enter}')
        return this
    }

    clickAndInputUnitName (unitName) {
        cy.wait('@getAllProperties')
        cy.get('[data-cy=unit-name-input-item] .ant-select-selection-search')
            .click({ force: true })
            .type(unitName)
        return this
    }

    chooseUnitName () {
        cy.get('[data-cy=user__unit-name-input-option]')
            .first()
            .click()
        return this
    }

    clickAndInputDescription (description) {
        cy.get('[data-cy=ticket__description-input]')
            .click()
            .type(description)
        return this
    }

    selectProblemWithCategoryClassifier () {
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search')
            .click()

        cy.get('[data-cy=ticket__classifier-option]')
            .first()
            .click()
        cy.wait('@getAllDivisions')
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search').should('not.have.class', '.ant-select-open')

        cy.get('[data-cy=ticket__category-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket__classifier-option]')
            .first()
            .click()
        return this
    }

    clickOnSubmitButton () {
        cy.get('[data-cy=ticket__submit-button]')
            .click()

        cy.location('pathname').should('not.eq', TICKET_CREATE_URL)
        cy.location('pathname').should('contain', TICKET_VIEW_URL)
        return this
    }
}

class TicketView {
/*
    Elements:
        ticket__filter-isWarranty
        ticket__filter-isPaid
        ticket__filter-isEmergency
        ticket__table
        ticket__filters-button
        common__filters-button-submit
        common__filters-button-reset
*/
    visit () {
        cy.visit(TICKET_VIEW_URL)
        cy.location('pathname').should('equal', TICKET_VIEW_URL)
        cy.wait([...BASE_SIDE_EFFECTS, '@getAllTickets'])
        return this
    }

    clickIsWarrantyCheckbox () {
        cy.get('[data-cy=ticket__filter-isWarranty]').click()
        cy.location('search').should('contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 0)

        cy.get('[data-cy=ticket__filter-isWarranty]').click()
        cy.location('search').should('not.contain', 'isWarranty')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        return this
    }

    clickIsPaidCheckbox () {
        cy.get('[data-cy=ticket__filter-isPaid]').click()
        cy.location('search').should('contain', 'isPaid')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 0)

        cy.get('[data-cy=ticket__filter-isPaid]').click()
        cy.location('search').should('not.contain', 'isPaid')
        cy.wait('@getAllTickets')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        return this
    }

    clickIsEmergencyCheckbox () {
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

    clickOnGlobalFiltersButton () {
        cy.get('[data-cy=ticket__filters-button]').click()
        cy.wait('@getAllTicketFilterTemplates')

        return this
    }

    typeAddressSearchInput (propertyAddress) {
        cy.get('input#property')
            .click()
            .type(propertyAddress.slice(0, 5))
            .type('{downArrow}')
            .type('{enter}')

        cy.get('[data-cy=common__filters-button-submit]').click()

        cy.wait('@getAllTickets')
        cy.location('search').should('contain', 'property')
        cy.get('[data-cy=ticket__table] tbody tr').should('have.length.greaterThan', 3)

        cy.get('[data-cy=common__filters-button-reset]').click()
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
    visit (ticket) {
        cy.visit(`${TICKET_VIEW_URL}/${ticket.id}`)
        cy.wait([
            ...BASE_SIDE_EFFECTS,
            '@getAllTickets',
            '@getAllTicketFiles',
            '@getAllOrganizationEmployees',
            '@getAllTicketStatuses',
            '@getAllTicketComments',
            '@getAllTicketChanges',
            '@getAllTicketPropertyHints',
            '@getAllUserTicketCommentReadTimes',
        ])

        return this
    }

    changeTicketStatus () {
        cy.wait('@getAllTickets')
        cy.wait('@getAllTicketClassifiers')
        cy.wait('@getAllTicketFiles')
        cy.wait('@getAllTicketStatuses')
        cy.wait('@getAllOrganizationEmployees')

        cy.get('[data-cy=ticket__status-select]')
            .click()
        cy.get('[data-cy=ticket__status-select]').should('have.class', 'ant-select-open')

        cy.get('[data-cy=ticket__status-select-option]', {
            timeout: 5000,
        }).first().click()

        return this
    }

    clickUpdateTicketLink () {
        cy.get('[data-cy=ticket__update-link]').click()

        cy.wait([
            '@getAllTickets',
            '@getAllTicketClassifiers',
            '@getAllProperties',
            '@getAllOrganizationEmployees',
        ])

        cy.location('pathname').should('contain', '/update')

        return this
    }

    clickProblemClassifier () {
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search')
            .click()

        cy.get('[data-cy=ticket__classifier-option]')
            .first()
            .click()
        cy.wait('@getAllDivisions')
        cy.get('[data-cy=ticket__place-select-item] .ant-select-selection-search').should('not.have.class', '.ant-select-open')

        cy.get('[data-cy=ticket__category-select-item] .ant-select-selection-search')
            .click()
            .type('{downArrow}')
        cy.get('.ant-select-dropdown:not(.ant-select-dropdown-hidden) [data-cy=ticket__classifier-option]')
            .first()
            .click()
        return this
    }

    clickTicketDeadline () {
        cy.get('[data-cy=ticket__deadline-item]').click()
        cy.get('.ant-picker-today-btn').click()

        return this
    }

    clickAssigneeInput () {
        cy.get('[data-cy=ticket__assignee-item] input')
            .click()
            .type('{downArrow}')
            .type('{enter}')

        return this
    }

    clickApplyChanges () {
        cy.get('[data-cy=ticket__apply-changes-button]').click()
        cy.location('pathname').should('not.contain', '/update')

        return this
    }
}

export {
    TicketCreate,
    TicketView,
    TicketEdit,
}
