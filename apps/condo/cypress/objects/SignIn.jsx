/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-undef */
import { HOME_PAGE_URL } from './HomePage'

const SIGNIN_URL = `${HOME_PAGE_URL}/auth/signin/`

class SignIn {

    visit () {
        cy.visit(SIGNIN_URL)
    }

    fillPhone (value) {
        const field = cy.get('[data-ci=signin-phone-item] input')
        field.clear()
        field.type(value)
        return this
    }

    fillPassword (value) {
        const field = cy.get('[data-ci=signin-password-item] input')
        field.clear()
        field.type(value)
        return this
    }

    signin () {
        const button = cy.get('[data-ci=signin-button]')
        button.click()
    }
}

export {
    SignIn,
    SIGNIN_URL,
}
