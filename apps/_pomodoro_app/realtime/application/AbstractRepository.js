/**
 * A repository to hold various data
 */
//todo(toplenboren) make async
class AbstractRepository {
    getEntityById(id) {}
    setEntityById(id, val) {}
    removeEntityById(id, val) {}
}

module.exports = AbstractRepository
