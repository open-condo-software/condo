import { restructData } from './restruction_task'

const fs = require('fs')
const tmp_dir = 'spec_tmp'

describe('Restriction_task', () => {
    beforeEach(() => {
        if (fs.existsSync(tmp_dir)){
            fs.readdirSync(tmp_dir).forEach(file => {
                fs.unlinkSync(`${tmp_dir}/${file}`)
            })
        } else {
            fs.mkdirSync(tmp_dir)
        }
    })

    afterEach(() => {
        fs.readdirSync(tmp_dir).forEach(file => {
            fs.unlinkSync(`${tmp_dir}/${file}`)
        })
        fs.rmdirSync(tmp_dir)
    })

    it('should restruct intl data to sdl ', () => {
        const mock_data = {
            exampleTest: [
                {
                    'title': 'First question Title',
                    'options': [
                        'First',
                        'Second',
                        'Third',
                        'Fourth',
                    ],
                },
                {
                    'title': 'Second question Title',
                    'options': [
                        'First1',
                        'Second1',
                        'Third1',
                        'Fourth1',
                    ],
                },
            ],
        }
        const expected = {
            'Answer': [
                {
                    'name': 'First',
                },
                {
                    'name': 'Second',
                },
                {
                    'name': 'Third',
                },
                {
                    'name': 'Fourth',
                },
                {
                    'name': 'First1',
                },
                {
                    'name': 'Second1',
                },
                {
                    'name': 'Third1',
                },
                {
                    'name': 'Fourth1',
                },
            ],
            'Question': [
                {
                    'answers': [
                        {
                            'where': {
                                'name': 'First',
                            },
                        },
                        {
                            'where': {
                                'name': 'Second',
                            },
                        },
                        {
                            'where': {
                                'name': 'Third',
                            },
                        },
                        {
                            'where': {
                                'name': 'Fourth',
                            },
                        },
                    ],
                    'name': 'First question Title',
                },
                {
                    'answers': [
                        {
                            'where': {
                                'name': 'First1',
                            },
                        },
                        {
                            'where': {
                                'name': 'Second1',
                            },
                        },
                        {
                            'where': {
                                'name': 'Third1',
                            },
                        },
                        {
                            'where': {
                                'name': 'Fourth1',
                            },
                        },
                    ],
                    'name': 'Second question Title',
                },
            ],
            'Test': [
                {
                    'name': 'exampleTest',
                    'questions': [
                        {
                            'where': {
                                'name': 'First question Title',
                            },
                        },
                        {
                            'where': {
                                'name': 'Second question Title',
                            },
                        },
                    ],
                },
            ],
        }

        fs.writeFileSync(`${tmp_dir}/mock.json`, JSON.stringify(mock_data))
        restructData(`../${tmp_dir}/mock.json`, '', `${tmp_dir}/result.js`)
        const restructed_data = require(`../${tmp_dir}/result.js`)

        expect(restructed_data).toStrictEqual(expected)
    })
})
