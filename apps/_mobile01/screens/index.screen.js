import React, { useContext } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { Button, Divider, Icon, Layout, TopNavigation } from '@ui-kitten/components'
import { Entypo } from '@expo/vector-icons'

import { ThemeContext } from '../context/theme'

export const IndexScreen = ({ navigation }) => {
    const themeContext = useContext(ThemeContext)

    const navigateDetails = () => {
        navigation.navigate('Details')
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <TopNavigation title='MyApp' alignment='center'/>
            <Divider/>
            <Layout style={styles.container}>
                <Button onPress={navigateDetails}>OPEN!</Button>
                <Entypo size={32} name="folder" color="black"/>
                <Icon
                    style={styles.icon}
                    fill='#8F9BB3'
                    name='shopping-bag-outline'
                />
                <Button style={{ marginVertical: 4 }} onPress={themeContext.toggleTheme}>TOGGLE THEME</Button>
            </Layout>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: 32,
        height: 32,
    },
})
