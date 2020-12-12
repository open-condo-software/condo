import { List } from 'antd'
import { Card } from './Card'
/*
*
* type Function {
  label: String
  id: ID!
  owner: User
  isPublished: Boolean
  language: FunctionLanguageType
  signature: JSON
  description: String
  body: String
}
*
* */

export const data = [
    {
        id: "flattenFunction",
        marketplace_name: "Flatten function",
        description: "Функция flatten сворачивает объект в плоскую структуру",
        owner: {
            name: "Василий пупкин",
            id: "id"
        },
        language: "JavaScript",
        body:
            "export const flatten = (object) => {"+
            "            return Object.assign({}, ...function _flatten ( objectBit, path = '', prefix = '') {" +
            "                return [].concat(" +
            "                    ...Object.keys(objectBit).map(" +
            "                        key => typeof objectBit[key] === 'object'" +
            "                            ? _flatten(objectBit[key],`${path}${prefix}${key}`, '.')" +
            "                            : ({ [`${path}${prefix}${key}`]: objectBit[key] })" +
            "                    )" +
            "                )" +
            "            }(object))" +
            "        }" +
            ",",
        signature: "{\"name\":\"flatten\",\"args\":[{\"name\":\"object\",\"type\":\"Object\"}],\"return\":\"Object\"}",
    },
];

const grid_options = {
    gutter: 16,
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    xxl: 4,
};

export const ItemList = () => {
    return (
        <List
            grid={grid_options}
            dataSource={data}
            renderItem={(item) => <Card item={item}/>}
        />
    )
};
