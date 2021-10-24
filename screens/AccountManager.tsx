import React, { useState, useRef } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, Animated, Alert, FlatList, Linking } from 'react-native'
import { Text, View, TextInput, Button, TouchableOpacity } from '../components/Themed'
import { loginFirst, getAt } from '../utils/login'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import { Ionicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import { Swipeable } from 'react-native-gesture-handler'
import { commonStyle } from '../utils/styles'
import axios from 'axios'
import * as Notifications from 'expo-notifications'

const deviceWidth = Dimensions.get('window').width
const deviceHeight = StatusBar.currentHeight ? Dimensions.get('window').height : Dimensions.get('window').height - 20
const statusBar = StatusBar.currentHeight ? StatusBar.currentHeight : 20
export default function App({ navigation, route }: StackScreenProps<ParamList, 'AccountManager'>) {
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => (
				<TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Root')} style={{ marginLeft: 10 }}>
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
				const newAcct = await getAt(code)
				setAccounts(newAcct)
				if (__DEV__) pushNotf(newAcct[newAcct.length - 1])
				if (!__DEV__) Alert.alert(
					'情報',
					'ブラウザが表示されている場合は、閉じてください',
					[
						{
							text: 'OK',
							onPress: () => {
								pushNotf(newAcct[newAcct.length - 1])
							},
						},
					],
					{ cancelable: false }
				)
			} catch (e) { }
		}
		finalize(code)
	}
	const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
	const init = async () => {
		try {
			const newAcct = (await storage.getItem('accounts')) as S.Account[]
			setAccounts(newAcct)
			setReady(true)
			setAttemptingLogin(false)
			if (newAcct) {
				const useAcct = newAcct[0]
				const tls = await storage.getItem('timelines')
				if (!tls) {
					await storage.setItem('timelines', [
						{
							type: 'home',
							acct: useAcct.id,
							activated: true,
							key: `home ${useAcct.id} 0`,
							acctName: `${useAcct.acct}`,
							timelineData: {}
						}
					])
					await sleep(1000)
					navigation.replace('Root')
				}
			}
		} catch (e) { }
	}
	if (!ready) init()
	const [domain, setDomain] = useState('')
	const loginDo = async (domain: string) => {
		setAttemptingLogin(true)
		const ret = await loginFirst(domain)
		if (!ret) {
			alert('インスタンスが見つかりませんでした')
			setAttemptingLogin(false)
		} else {
			setList([])
		}
	}
	const codeDo = async (code: string) => {
		const newAcct = await getAt(code)
		console.log(newAcct, newAcct.length - 1)
		pushNotf(newAcct[newAcct.length - 1])
		setAccounts(newAcct)
		setCodeInput('')
		setAttemptingLogin(false)
		setDomain('')
	}
	const delAcct = (key: string) => {
		Alert.alert(
			'アカウントを削除します',
			'この操作は取り消せません。',
			[
				{
					text: 'キャンセル',
					onPress: () => true,
					style: 'cancel',
				},
				{
					text: '削除',
					onPress: async () => {
						const cl = []
						for (const acct of accounts) {
							if (acct.at !== key) cl.push(acct)
						}
						setAccounts(cl)
						await storage.setItem('accounts', cl)
					},
				},
			],
			{ cancelable: true }
		)

	}
	const allReset = () => {
		Alert.alert(
			'全てのデータを初期化します',
			'この操作は取り消せません。実行後はアプリを再起動してください。',
			[
				{
					text: 'キャンセル',
					onPress: () => true,
					style: 'cancel',
				},
				{
					text: '削除',
					onPress: async () => {
						storage.deleteAllItem()
					},
				},
			],
			{ cancelable: true }
		)

	}
	const pushNotf = async (acct: S.Account) => {
		async function registerForPushNotificationsAsync() {
			let token;
			if (!token) {
				const { status: existingStatus } = await Notifications.getPermissionsAsync();
				let finalStatus = existingStatus;
				if (existingStatus !== 'granted') {
					const { status } = await Notifications.requestPermissionsAsync();
					finalStatus = status;
				}
				if (finalStatus !== 'granted') {
					alert('プッシュ通知の許可が取れませんでした。');
					return;
				}
				token = (await Notifications.getExpoPushTokenAsync()).data
				console.log(token)
			} else {
				alert('Must use physical device for Push Notifications');
			}
			try {
				const data = await axios.post(`https://push.0px.io/subscribe`, {
					at: acct.at,
					domain: acct.domain,
					token,
					platform: 'expo'
				})
				console.log(data.data, {
					at: acct.at,
					domain: acct.domain,
					token,
					platform: 'expo'
				})
				Alert.alert('購読完了', 'プッシュ通知の購読が完了しました。')
				init()
			} catch (e) {
				console.log(e)
				init()
			}
		}
		Alert.alert(
			'プッシュ通知の利用',
			'このアプリケーションではプッシュ通知を利用できます。Mastodonからのデータは暗号化されますが、開発者管理のサーバで復号して各種通知サービスより送信します。このサーバに一時的にアクセストークンを送信しますが、これは保存されません。プッシュ通知サービスは無料で提供されるものですが、信頼性は保障しません。',
			[
				{
					text: 'キャンセル',
					onPress: () => init(),
					style: 'cancel',
				},
				{
					text: '承認',
					onPress: async () => {
						registerForPushNotificationsAsync()
					},
				},
			],
			{ cancelable: true }
		)
	}
	const renderRightActions = (
		progress: Animated.AnimatedInterpolation,
		dragAnimatedValue: Animated.AnimatedInterpolation,
		key: string
	) => {
		const opacity = dragAnimatedValue.interpolate({
			inputRange: [-150, 0],
			outputRange: [1, 0],
			extrapolate: 'clamp',
		})
		return (
			<View>
				<Animated.View style={[styles.deleteButton, { opacity }]}>
					<TouchableOpacity onPress={() => delAcct(key)}>
						<Text style={styles.deleteButtonText}>削除</Text>
					</TouchableOpacity>
				</Animated.View>
			</View>
		);
	};
	const renderItem = (e: any) => {
		const item = e.item as S.Account
		if (!item) return null
		return (<TouchableOpacity>
			<Swipeable renderRightActions={(a, b) => renderRightActions(a, b, item.at)}>
				<View style={styles.menu}>
					<Text>{item.name}</Text>
					<Text>{item.acct}</Text>
				</View>
				<View style={commonStyle.separator} />
			</Swipeable>
		</TouchableOpacity>)
	}
	const renderList = (e: any) => {
		return <TouchableOpacity onPress={() => setDomain(e.item)} style={{ height: 50, justifyContent: 'center' }}>
			<Text>{e.item}</Text>
		</TouchableOpacity>
	}
	const [list, setList] = React.useState([] as string[])
	const search = async (domain: string) => {
		setDomain(domain)
		if (domain.length > 3) {
			try {
				const data = await axios.get(`https://www.fediversesearch.com/search/?keyword=${domain}`)
				const usable = data.data.data
				const listAdd = usable.map((i: any) => i.uri)
				setList(listAdd)
			} catch (e: any) {

			}
		} else {
			setList([])
		}
	}
	return (
		<View style={styles.container}>
			<View>
				<FlatList data={accounts} renderItem={renderItem} />
			</View>
			<View>
				<Text>アカウントを追加</Text>
				{!attemptingLogin ? (
					<View>
						<View style={styles.horizonal}>
							<TextInput placeholder="ドメイン(mastodon.social)*" onChangeText={(text) => search(text)} style={[{ borderColor: domain ? 'black' : '#bf1313' }, styles.form]} value={domain} />
							<Button title="ログイン" onPress={async () => await loginDo(domain)} icon="add" style={{ width: '29%', marginLeft: '1%' }} />
						</View>
						{list.length ? (<View style={styles.horizonal}>
							<Text>Powered by </Text>
							<TouchableOpacity onPress={() => Linking.openURL('https://www.fediversesearch.com/?locale=ja')}>
								<Text style={commonStyle.link}>fediversesearch</Text>
							</TouchableOpacity>
						</View>) : null}
						<FlatList data={list} renderItem={renderList} keyExtractor={(e) => e} /></View>
				) : (
					<View style={styles.horizonal}>
						<TextInput placeholder="コード*" onChangeText={(text) => setCodeInput(text)} style={[{ borderColor: codeInput ? 'black' : '#bf1313' }, styles.form]} value={codeInput} />
						<Button title="ログイン" onPress={async () => await codeDo(codeInput)} icon="add" style={{ width: '29%', marginLeft: '1%' }} />
					</View>
				)}
				<Button onPress={() => allReset()} title="初期化" />
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
	swipedRow: {
		display: 'flex',
		justifyContent: 'center',
		alignContent: 'center',
		height: 50,
	},
	deleteButton: {
		display: 'flex',
		justifyContent: 'center',
		alignContent: 'center',
		backgroundColor: '#e83a00',
		height: 50,
		width: 100,
		paddingHorizontal: 10
	},
	deleteButtonText: {
		backgroundColor: '#e83a00',
		color: 'white',
		textAlign: 'right',
		fontSize: 20
	},
	menu: {
		borderBottomColor: '#eee',
		borderBottomWidth: 1,
		paddingVertical: 10,
		height: 50
	}
})
