import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import { IndexScreen } from './screens/index.screen'
import { DetailsScreen } from './screens/details.screen'

const { Navigator, Screen } = createStackNavigator()

const HomeNavigator = () => (
    <Navigator headerMode='none'>
        <Screen name='Index' component={IndexScreen}/>
        <Screen name='Details' component={DetailsScreen}/>
    </Navigator>
)

export const AppNavigator = () => (
    <NavigationContainer>
        <HomeNavigator/>
    </NavigationContainer>
)
