/**
 * @deprecated use waitFor
 */
const sleep = async (time) => (
    new Promise(resolve => {
        setTimeout(resolve, time)
    })
)

module.exports = {
    sleep,
}
