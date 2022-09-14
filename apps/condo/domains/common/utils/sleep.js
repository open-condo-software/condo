/**
 * @deprecated for usage in tests, use `waitFor`
 */
const sleep = async (time) => (
    new Promise(resolve => {
        setTimeout(resolve, time + 1)
    })
)

module.exports = {
    sleep,
}
