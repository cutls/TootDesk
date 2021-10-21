import React, { useState, useRef } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal } from 'react-native'
import { Text, View, TextInput, Button, TouchableOpacity } from '../components/Themed'
import { loginFirst, getAt } from '../utils/login'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import { Ionicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'

const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = StatusBar.currentHeight ? StatusBar.currentHeight : 20
export default function App({ navigation, route }: StackScreenProps<ParamList, 'AccountManager'>) {
    React.useLayoutEffect(() => {
        navigation.setOptions({
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.replace('Root')}>
                <Ionicons name="arrow-back" size={30} />
            </TouchableOpacity>
          ),
        });
      }, [navigation]);
    
	const [accounts, setAccounts] = useState([] as S.Account[])
	const [attemptingLogin, setAttemptingLogin] = useState(false)
    const [ready, setReady] = useState(false)
	const [codeInput, setCodeInput] = useState('')
	let code: string
	let state: string
	if (route.params) {
		code = route.params.code
		state = route.params.state
		const finalize = async (code: string) => {
			try {
				await getAt(code)
				const newAcct = (await storage.getItem('accounts')) as S.Account[]
				await setAccounts(newAcct)
			} catch (e) {}
		}
		finalize(code)
	}
	const init = async () => {
		try {
			const newAcct = (await storage.getItem('accounts')) as S.Account[]
			await setAccounts(newAcct)
            setReady(true)
		} catch (e) {}
	}
	if(!ready) init()
	const [domain, setDomain] = useState('')
	const loginDo = async (domain: string) => {
        setAttemptingLogin(true)
		const ret = await loginFirst(domain)
		if (!ret) {
            alert('インスタンスが見つかりませんでした')
            setAttemptingLogin(false)
        }
	}
	const codeDo = async (code: string) => {
		await getAt(code)
		const newAcct = (await storage.getItem('accounts')) as S.Account[]
		alert(`ログインできました`)
		await setAccounts(newAcct)
        setCodeInput('')
        setAttemptingLogin(false)
	}
	return (
		<View style={styles.container}>
            <View>
                <Text>アカマネ建設予定地</Text>
            </View>
			<View>
				<Text>アカウントを追加</Text>
				{!attemptingLogin ? (
					<View style={styles.horizonal}>
						<TextInput placeholder="ドメイン(mastodon.social)*" onChangeText={(text) => setDomain(text)} style={[{ borderColor: domain ? 'black' : '#bf1313' }, styles.form]} value={domain} />
						<Button title="ログイン" onPress={async () => await loginDo(domain)} icon="add" style={{ width: '29%', marginLeft: '1%' }} />
					</View>
				) : (
					<View style={styles.horizonal}>
						<TextInput placeholder="コード*" onChangeText={(text) => setCodeInput(text)} style={[{ borderColor: codeInput ? 'black' : '#bf1313' }, styles.form]} value={codeInput} />
						<Button title="ログイン" onPress={async () => await codeDo(codeInput)} icon="add" style={{ width: '29%', marginLeft: '1%' }} />
					</View>
				)}
			</View>
		</View>
	)
}
let android = false
if (Platform.OS === 'android') android = true
const styles = StyleSheet.create({
	container: {
		flex: 0,
		height: deviceHeight,
		padding: 10,
		width: 500,
		maxWidth: deviceWidth,
	},
	horizonal: {
		flexDirection: 'row',
	},
	form: {
		marginVertical: 2,
		borderWidth: 1,
		width: '70%',
		padding: 10,
		borderRadius: 10,
	},
})
