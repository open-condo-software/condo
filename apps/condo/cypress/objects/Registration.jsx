/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */
/*
Step 1
register-phone-item
register-button

Step 2
register-smscode-item

Step 3
register-name-item
register-email-item
register-password-item
register-confirmpassword-item
registercomplete-button
*/
import { HOME_PAGE_URL } from './Home'

const REGISTER_URL = `${HOME_PAGE_URL}/auth/register/`

class Registration {

    visit () {
        cy.visit(REGISTER_URL)
        return this
    }

    fillPhone (value) {
        const field = cy.get('[data-ci=register-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillSMSCode (value) {
        const field = cy.get('[data-ci=register-smscode-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillName (value) {
        const field = cy.get('[data-ci=register-name-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillEmail (value) {
        const field = cy.get('[data-ci=register-email-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-ci=register-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillConfirmPassword (value) {
        const field = cy.get('[data-ci=register-confirmpassword-item] input')
        field.clear()
        field.type(value)
        return this
    }

    startRegistration () {
        const button = cy.get('[data-ci=register-button]')
        button.click()
        return this
    }

    completeRegistration () {
        const button = cy.get('[data-ci=registercomplete-button]')
        button.click()
        return this
    }
}

export {
    Registration,
    REGISTER_URL,
}
