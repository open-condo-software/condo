const conf = require('@open-condo/config')
const name = process.argv[2]
console.log(conf[name] || '')
