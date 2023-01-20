import TestRenderer from 'react-test-renderer'

import BehaviorRecorder, { htmlFor, parseParamsFor } from './BehaviorRecorder'

const CORRECT_PLERDY_PARAMS = '{"site_hash_code": "1234567890abcdefghijklmnopqrstyv", "suid": 12345}'

const CORRECT_PLERDY_PARSED_PARAMS = {
    site_hash_code: '1234567890abcdefghijklmnopqrstyv',
    suid: 12345,
}

jest.mock('next/config', () => () => ({
    publicRuntimeConfig: {
        behaviorRecorder: {
            plerdy: CORRECT_PLERDY_PARAMS,
        },
    },
}))

const CORRECT_PLERDY_HTML = '<script type="text/javascript" defer>var _protocol = (("https:" == document.location.protocol) ? " https://" : " http://");var _site_hash_code = "1234567890abcdefghijklmnopqrstyv";var _suid = 12345;</script><script type="text/javascript" defer src="https://a.plerdy.com/public/js/click/main.js"></script>'

describe('BehaviorRecorder', () => {
    describe('plerdy', () => {

        it('renders html in div for correct config params', () => {
            const result = TestRenderer.create(
                <BehaviorRecorder engine='plerdy'/>
            )
            expect(result.toJSON()).toMatchObject({
                type: 'div',
                props: {
                    dangerouslySetInnerHTML: {
                        __html: CORRECT_PLERDY_HTML,
                    },
                },
            })
        })

        it('renders null for not supported engine', () => {
            const result = TestRenderer.create(
                <BehaviorRecorder engine='not_supported_engine'/>
            )
            expect(result.toJSON()).toBeNull()
        })

        // TODO(antonal): figure out how to mock Next Config for each test case
        // When we call `jest.mock` inside of test case, it throws an error:
        // >> The module factory of `jest.mock()` is not allowed to reference any out-of-scope variables.

        // it('renders null for incorrect config params', () => {
        //     const result = TestRenderer.create(
        //         <BehaviorRecorder engine="plerdy"/>
        //     )
        //     expect(result).toBeNull()
        // })

        describe('injectParamsFor', () => {
            it('produces correct html to embed', () => {
                expect(htmlFor.plerdy(CORRECT_PLERDY_PARSED_PARAMS)).toBe(CORRECT_PLERDY_HTML)
            })
        })

        describe('parseParamsFor', () => {
            it('returns parsed object when provided JSON-string is correct', () => {
                expect(parseParamsFor.plerdy(CORRECT_PLERDY_PARAMS)).toMatchObject(CORRECT_PLERDY_PARSED_PARAMS)
            })

            it('throws exception, when provided JSON-string is in Relaxed JSON Format', () => {
                const relaxedJsonParams = `{site_hash_code: "${CORRECT_PLERDY_PARSED_PARAMS.site_hash_code}", suid: ${CORRECT_PLERDY_PARSED_PARAMS.suid}`
                expect(() => {
                    parseParamsFor.plerdy(relaxedJsonParams)
                }).toThrow('Incorrect JSON syntax in config for Plerdy behaviour recorder')
            })

            it('throws error when provided correct JSON-string has incorrect "site_hash_code" param', () => {
                [
                    '1234567890abcdefghijklmnopqrsty',   // too short
                    '1234567890abcdefghijklmnopqrstyvw', // too wide
                    '-1234567890abcdefghijklmnopqrsty',  // forbidden symbols
                    '_1234567890abcdefghijklmnopqrsty',  // forbidden symbols
                ].map(sample => {
                    expect(() => {
                        parseParamsFor.plerdy(`{"site_hash_code": "${sample}", "suid": ${CORRECT_PLERDY_PARSED_PARAMS.suid}}`)
                    }).toThrow('Incorrect value of site_hash_code param for Plerdy behaviour recorder')
                })
            })
        })
    })
})