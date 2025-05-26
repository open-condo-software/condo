// NOTE: "/index" is important here,
// since by default "main" will redirect to v2 compute,
// which use JSON.stringify and not that lazy as v1 (index)
const sizeof = require('object-sizeof/index')


module.exports = {
    computeObjectSizeInBytes: sizeof,
}