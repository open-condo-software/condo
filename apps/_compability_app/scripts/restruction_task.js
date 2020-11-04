const get = require('lodash/get')
const fs = require('fs')

/*
* @path:string - path for json source;
* @ref:Array[string] - reference for source locale data
*       (if its equals undefined, parser will restruct full locale data);
*
* returns {
*   [key: String]: {
*       [field: string]: string|number|boolean|null|undefined;
*   }
* }
* */

export function restructData (path, ref, destination) {
    let json_data

    try {
        json_data = require(path)
    } catch (e) {
        console.log(`Something went wrong while trying to read: ${json_data};`)
    }

    const schema_source = ref ? get(json_data, ref) : json_data

    if (!schema_source || typeof schema_source !== 'object') {
        return
    }

    const sdlStruct = intlToSdl(schema_source)

    // TODO(pahaz): need to fix it! check `initial-data.js` structure! (part#2)
    fs.writeFileSync(destination, createSdlFileSource(sdlStruct), function (err) {
        if (err) {
            throw err
        }

        console.log('Sdl structure parsed!\nSdl source generated.')
    }
    )
}

function createSdlFileSource (content) {
    return `// generated at ${Date.now().toString()}\nmodule.exports = ${JSON.stringify(content)}`
}

function intlToSdl (intl_object) {
    const initial_data = {
        Test: [],
        Question: [],
        Answer: [],
    }

    for (let name in intl_object) {
        if (includes(initial_data.Test, name)) {
            const test = {
                name: name,
                questions: [],
            }

            intl_object[name].forEach(({ title, options }) => {
                if (includes(initial_data.Question, title)) {
                    const question = {
                        name: title,
                        answers: [],
                    }

                    options.forEach((option) => {
                        if (includes(initial_data.Answer, option)) {
                            initial_data.Answer.push({ name: option })
                            question.answers.push({ where: { name: option } })
                        }
                    })

                    initial_data.Question.push(question)
                    test.questions.push({ where: { name: title } })
                }
            })

            initial_data.Test.push(test)
        }
    }

    return initial_data
}

function includes (source, value) {
    return source.filter(({ name }) => name === value).length === 0
}
