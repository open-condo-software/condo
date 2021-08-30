
const loadModelsByChunks = async ({
    context,
    model,
    where = {},
    sortBy = ['createdAt_ASC'],
    chunkSize = 100,
    limit = 100000,
}) => {
    let skip = 0
    let maxiterationsCount = Math.floor(limit / chunkSize)
    let newchunk = []
    let all = []
    do {
        newchunk = await model.getAll(context, where, { sortBy, first: chunkSize, skip: skip })
        all = all.concat(newchunk)
        skip += newchunk.length
    } while (--maxiterationsCount > 0 && newchunk.length)
    return all
}


module.exports = {
    loadModelsByChunks,
}
