const getRandomBetween = (min, max) => min + Math.floor(Math.random() * (max - min))

const getRandomItem = list => list[getRandomBetween(0, list.length - 1)]

module.exports = {
    getRandomItem,
}