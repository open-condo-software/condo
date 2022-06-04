/**
 * @deprecated use awaitFor
 */
const sleep = async (time) => (
    new Promise(resolve => {
        setTimeout(resolve, time)
    })
)

module.exports = {
    sleep,
}
