/**
 * @typedef {Object} NormalizedBuildingData
 * @property {string} country "Russia"
 * @property {string?} region "Sverdlovsk region"
 * @property {string?} area "Невьянский"
 * @property {string} city "Yekaterinburg"
 * @property {string?} settlement "Шурала"
 * @property {string?} street "Lenina"
 * @property {string} building "66", "66a"
 * @property {string?} block "литера 23"
 * @property {string?} unitType "room", "flat", "box"
 * @property {string?} unitName "428", "42/8"
 */

/**
 * @typedef {Object} NormalizedBuilding
 * @property {string} value "Russia, Sverdlovsk region, Yekaterinburg, Lenina, 66"
 * @property {NormalizedBuildingData} data
 */
