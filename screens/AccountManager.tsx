import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { StyleSheet, StatusBar, Dimensions, Platform, Modal, Animated, FlatList, Linking, useWindowDimensions, useColorScheme, ActivityIndicator } from 'react-native'
import { Text, View, TextInput, Button, TouchableOpacity } from '../components/Themed'
import * as WebBrowser from 'expo-web-browser'
import { loginFirst, getAt, refresh } from '../utils/login'
import { ParamList } from '../interfaces/ParamList'
import * as S from '../interfaces/Storage'
import * as Alert from '../utils/alert'
import { Octicons } from '@expo/vector-icons'
import * as storage from '../utils/storage'
import { StackScreenProps } from '@react-navigation/stack'
import { Swipeable } from 'react-native-gesture-handler'
import { commonStyle } from '../utils/styles'
import axios from 'axios'
import * as Notifications from 'expo-notifications'
import * as Updates from 'expo-updates'
import TimelineProps from '../interfaces/TimelineProps'
import i18n from '../utils/i18n'
import { LoadingContext } from '../utils/context/loading'
const platform = Platform.OS === 'ios' ? 'iOS' : 'Android'

export default function App({ navigation, route }: StackScreenProps<ParamList, 'AccountManager'>) {

	const allReset = async () => {
		const a = await Alert.promise(i18n.t('全てのデータを初期化します'), i18n.t('この操作は取り消せません。実行後はアプリを再起動します。'), Alert.DELETE)
		if (a === 1) {
			storage.deleteAllItem()
			Updates.reloadAsync()
		}
	}
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const bgColorValAI = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
	const bgColorAI = { backgroundColor: bgColorValAI }
	useLayoutEffect(() => {
		navigation.setOptions({
			headerStyle: { backgroundColor: isDark ? 'black' : 'white' },
			headerTitleStyle: { color: isDark ? 'white' : 'black' },
			headerLeft: () => (
				<TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Root')} onLongPress={allReset} style={{ marginLeft: 10 }}>
					<Octicons name="arrow-left" size={30} color={isDark ? 'white' : 'black'} />
				</TouchableOpacity>
			),
		});
	}, [navigation, allReset, isDark])

	const { height, width } = useWindowDimensions()
	const deviceWidth = width
	const deviceHeight = StatusBar.currentHeight ? height : height - 20
	const styles = createStyle(deviceWidth, deviceHeight)

	const [accounts, setAccounts] = useState([] as S.Account[])
	const [attemptingLogin, setAttemptingLogin] = useState(false)
	const [loading, setLoading] = useState(false)
	const [detailConfig, setDetailConfig] = useState(false)
	const [myNotify, setMyNotify] = useState('push.0px.io')
	const [via, setVia] = useState(`TootDesk(${platform})`)
	const [ready, setReady] = useState(false)
	const [codeInput, setCodeInput] = useState('')
	const [rootLoading, setRootLoading] = useState<null | string>(null)
	const [list, setList] = useState([] as string[])
	let code: string
	let state: string
	useEffect(() => {
		if (route.params) {
			code = route.params.code
			state = route.params.state
			if (!code) return
			const finalize = async (code: string) => {
				try {
					const newAcct = await getAt(code)
					setAccounts(newAcct)
					if (!__DEV__) {
						WebBrowser.dismissBrowser()
						pushNotf(newAcct[newAcct.length - 1])
					}
					//if (__DEV__) pushNotf(newAcct[newAcct.length - 1])
				} catch (e) {
					console.error(e)
				}
			}
			finalize(code)
		}
	}, [route, myNotify])
	const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
	const init = async () => {
		try {
			const newAcct = (await storage.getItem('accounts')) as S.Account[]
			setAccounts(newAcct)
			setReady(true)
			setAttemptingLogin(false)
			setLoading(false)
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
					Updates.reloadAsync()
				}
			}
		} catch (e) { }
	}
	if (!ready) init()
	const [domain, setDomain] = useState('')
	const loginDo = async (domain: string) => {
		setAttemptingLogin(true)
		setLoading(true)
		try {
			const ret = await loginFirst(domain, via)
			if (!ret) {
				alert(i18n.t('インスタンスが見つかりませんでした'))
				setAttemptingLogin(false)
				setLoading(false)
			} else {
				const codeM = ret.match(/(\?|&)code=([^&]+)/)
				if (!codeM) return
				codeDo(codeM[2])
				setList([])
			}
		} catch (e: any) {
			setAttemptingLogin(false)
			setLoading(false)
		}

	}
	const codeDo = async (code: string) => {
		setLoading(true)
		const newAcct = await getAt(code)
		setLoading(false)
		console.log(newAcct, newAcct.length - 1)
		pushNotf(newAcct[newAcct.length - 1])
		setAccounts(newAcct)
		setCodeInput('')
		setAttemptingLogin(false)
		setDomain('')
	}
	const delAcct = async (key: string) => {
		try {
			const a = await Alert.promise(i18n.t('アカウントを削除します'), i18n.t('この操作は取り消せません。'), Alert.DELETE)
			let target: any = null
			if (a === 1) {
				const cl = []
				for (const acct of accounts) {
					if (acct.at !== key) cl.push(acct)
					if (acct.at === key) target = acct
				}
				const timelines: TimelineProps[] = await storage.getItem('timelines')
				if (!target) return Alert.alert('Error', i18n.t('アカウントを削除できません。このアカウントに関係するカラムしか存在しないため、削除するとタイムラインも全て無くなってしまうためです。'))
				const newTl = timelines.filter((item) => item.acct !== target.id)
				if (!newTl.length) return Alert.alert('Error', i18n.t('アカウントを削除できません。このアカウントに関係するカラムしか存在しないため、削除するとタイムラインも全て無くなってしまうためです。'))
				setAccounts(cl)
				await storage.setItem('accounts', cl)
				await storage.setItem('timelines', newTl)
			}
		} catch (e) {
			console.error(e)
		}
	}
	const pushNotf = async (acct: S.Account) => {
		async function registerForPushNotificationsAsync(pushDomain: string) {
			let token
			try {
				if (!token) {
					const { status: existingStatus } = await Notifications.getPermissionsAsync()
					let finalStatus = existingStatus;
					if (existingStatus !== 'granted') {
						const { status } = await Notifications.requestPermissionsAsync()
						finalStatus = status;
					}
					if (finalStatus !== 'granted') {
						alert(i18n.t('プッシュ通知の許可が取れませんでした。'))
						return;
					}
					token = (await Notifications.getExpoPushTokenAsync()).data
					console.log(token)
				} else {
					alert('Must use physical device for Push Notifications')
				}
				const data = await axios.post(`https://${pushDomain}/subscribe`, {
					at: acct.at,
					domain: acct.domain,
					token,
					platform: 'expo'
				})
				Alert.alert(i18n.t('購読完了'), i18n.t('プッシュ通知の購読が完了しました。'))
				acct.pushNotification = pushDomain
				await storage.updateCertainItem('accounts', 'id', acct.id, acct)
				init()
			} catch (e) {
				Alert.alert('エラー', `${e}`)
				console.log(e)
				init()
			}
		}
		if (acct.pushNotification) {
			registerForPushNotificationsAsync(acct.pushNotification)
		} else {
			const a = await Alert.promise(i18n.t('プッシュ通知の利用'), i18n.t(`このアプリケーションではプッシュ通知を利用できます。Mastodonからのデータは暗号化されますが、"%{t}"で復号して各種通知サービスより送信します。このサーバに一時的にアクセストークンを送信しますが、これは保存されません。`, { t: myNotify }), [{ text: i18n.t('キャンセル'), style: 'cancel' }, { text: i18n.t('承認'), style: 'destructive' }])
			if (a === 1) {
				registerForPushNotificationsAsync(myNotify)
			} else {
				init()
			}
		}
	}
	const renderRightActions = (
		progress: Animated.AnimatedInterpolation<number>,
		dragAnimatedValue: Animated.AnimatedInterpolation<number>,
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
	}
	const renderItem = (e: any) => {
		const item = e.item as S.Account
		if (!item) return null
		return (<TouchableOpacity onPress={async () => { setRootLoading('Refreshing'); await refresh(item.id);setRootLoading(null); pushNotf(item) }}>
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
		<LoadingContext.Provider value={{ loading: rootLoading, setLoading: setRootLoading }}>
			<View style={{ width: deviceWidth, backgroundColor: isDark ? 'black' : 'white' }}>
				<View style={styles.container}>
					<View>
						<FlatList data={accounts} keyExtractor={(item) => item.id} renderItem={renderItem} />
					</View>
					<View>
						<Text>{i18n.t('アカウントを追加')}</Text>
						{!attemptingLogin ? (
							<View>
								<View style={styles.horizonal}>
									<TextInput placeholder={`${i18n.t('ドメイン')}(mastodon.social)*`} onChangeText={(text) => search(text)} style={[{ borderColor: domain ? 'black' : '#bf1313' }, styles.form]} value={domain} />
									<Button title={i18n.t('ログイン')} onPress={async () => await loginDo(domain)} icon="sign-in" style={{ width: '29%', marginLeft: '1%' }} loading={loading} />
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
								<TextInput placeholder={`${i18n.t('コード')}(mastodon.social)*`} onChangeText={(text) => setCodeInput(text)} style={[{ borderColor: codeInput ? 'black' : '#bf1313' }, styles.form]} value={codeInput} />
								<Button title={i18n.t('ログイン')} onPress={async () => await codeDo(codeInput)} icon="sign-in" style={{ width: '29%', marginLeft: '1%' }} loading={loading} />
							</View>
						)}
						<View style={{ height: 10 }} />
						{detailConfig ? <View>
							<Text>{i18n.t('TootDesk対応通知サーバのドメインを入力してください')}({i18n.t('初期値')}: push.0px.io)</Text>
							<TextInput placeholder={i18n.t('サーバ')} onChangeText={(text) => setMyNotify(text)} style={[{ borderColor: codeInput ? 'black' : '#bf1313' }, styles.form]} value={myNotify} />
							<Text>{i18n.t('認証時のアプリ名(via, 初期値: "TootDesk(%{t})")', { t: platform })}</Text>
							<TextInput placeholder="via*" onChangeText={(text) => setVia(text)} style={[{ borderColor: codeInput ? 'black' : '#bf1313' }, styles.form]} value={via} />
						</View>
							: <TouchableOpacity onPress={() => setDetailConfig(true)}>
								<Text style={{ textDecorationLine: 'underline' }}>{i18n.t('通知サーバ, viaを設定する')}</Text>
							</TouchableOpacity>}
					</View>
				</View>
			</View>
			<Modal visible={!!rootLoading} transparent={true}>
				<View style={[styles.rootLoading, bgColorAI]}>
					<ActivityIndicator size="large" />
					<Text style={commonStyle.rootLoadingText}>{rootLoading}</Text>
				</View>
			</Modal>
		</LoadingContext.Provider>
	)
}
let android = false
if (Platform.OS === 'android') android = true
function createStyle(deviceWidth: number, deviceHeight: number) {
	const useWidth = deviceWidth > 500 ? 500 : deviceWidth
	return StyleSheet.create({
		container: {
			flex: 0,
			height: deviceHeight,
			padding: 10,
			width: useWidth,
			marginLeft: deviceWidth > 500 ? (deviceWidth - useWidth) / 2 : 0
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
		},
		rootLoading: {
			width: 200,
			height: 100,
			top: (deviceHeight / 2) - 50,
			left: (deviceWidth / 2) - 100,
			justifyContent: 'center',
			borderRadius: 10,
		},
	})
}