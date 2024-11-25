const KEYWORDS = {
    parking: ['автоместо', 'парковка', 'паркинг', 'машиноместо', 'гараж', 'м/м', 'мм', 'место', 'м/место', 'а/м', 'бокс', 'парк'],
    apartment: ['аппарт', 'апарт', 'ап', 'к/п'],
    commercial: ['офис', 'оф'],
    warehouse: ['помещение', 'подвал', 'помещ', 'пом', 'кл', 'кладовка', 'кладовая', 'нп', 'клад'],
    flat: ['квартира', 'кв', 'комн'],
}

const HOUSE_IDENTIFIERS = 'д|уч|дом|участок|двлд|домовладение'
const DEFAULT_UNIT = 'кв. 1'

module.exports = {
    KEYWORDS,
    HOUSE_IDENTIFIERS,
    DEFAULT_UNIT,
}