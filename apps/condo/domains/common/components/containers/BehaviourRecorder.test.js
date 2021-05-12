// import TestRenderer from 'react-test-renderer';
import BehaviorRecorder, { injectParamsFor, parseParamsFor } from './BehaviorRecorder'


const CORRECT_PLERDY_PARAMS = '{"site_hash_code": "4b23250e438223063d2fb9af042a8199", "suid": 17358}'

const CORRECT_PLERDY_PARSED_PARAMS = {
    site_hash_code: '4b23250e438223063d2fb9af042a8199',
    suid: 17358,
}

const CORRECT_PLERDY_HTML = '<script type="text/javascript" defer>var _protocol = (("https:" == document.location.protocol) ? " https://" : " http://");var _site_hash_code = "4b23250e438223063d2fb9af042a8199";var _suid = 17358;</script><script type="text/javascript" defer src="https://a.plerdy.com/public/js/click/main.js"></script>'

describe('BehaviorRecorder', () => {
    describe('plerdy', () => {

        // TODO(antonal): figure out how to fetch Next.js Config in Test environment
        // TypeError: Cannot destructure property 'publicRuntimeConfig' of '(0 , _config.default)(...)' as it is undefined.
        // it('renders correctly', () => {
        //     const result = TestRenderer.create(
        //         <BehaviorRecorder engine="plerdy"/>
        //     )
        //     expect(result.toJSON()).toMatchObject({
        //         type: 'div',
        //         props: {
        //             engine: 'plerdy'
        //         },
        //         children: CORRECT_PLERDY_HTML
        //     })
        // })

        describe('injectParamsFor', () => {
            it('produces correct html to embed', () => {
                const params = {
                    site_hash_code: '4b23250e438223063d2fb9af042a8199',
                    suid: 17358,
                }
                expect(injectParamsFor.plerdy(params)).toBe(CORRECT_PLERDY_HTML)
            })
        })

        describe('parseParamsFor', () => {
            it('returns parsed object when provided JSON-string is correct', () => {
                expect(parseParamsFor.plerdy(CORRECT_PLERDY_PARAMS)).toMatchObject(CORRECT_PLERDY_PARSED_PARAMS)
            })

            it('throws exception, when provided JSON-string is in Relaxed JSON Format', () => {
                const relaxedJsonParams = '{site_hash_code: "4b23250e438223063d2fb9af042a8199", suid: 17358}'
                expect(() => {
                    parseParamsFor.plerdy(relaxedJsonParams)
                }).toThrow('Incorrect JSON syntax in config for Plerdy behaviour recorder')
            })

            it('throws error when provided correct JSON-string has incorrect "site_hash_code" param', () => {
                [
                    '4b23250e438223063d2fb9af042a819',   // too short
                    '4b23250e438223063d2fb9af042a81991', // too wide
                    '-b23250e438223063d2fb9af042a8199',  // forbidden symbols
                    '_b23250e438223063d2fb9af042a8199',  // forbidden symbols
                ].map(sample => {
                    expect(() => {
                        parseParamsFor.plerdy(`{"site_hash_code": "${sample}", "suid": 17358}`)
                    }).toThrow('Incorrect value of site_hash_code param for Plerdy behaviour recorder')
                })
            })
        })
    })
})