import type { Account } from '@/entities/account'
import type { Poll as IPoll } from '@/entities/status'
import { getUsualAcct } from '@/utils/storage'
import type { ComposeMode, IState, PostComposer } from '@/utils/type'
import generator, { type MegalodonInterface } from '@cutls/megalodon'
import { BottomSheet, Host } from '@expo/ui/swift-ui'
import { SymbolView } from 'expo-symbols'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
import { options } from 'superagent'
import Avatar from './Avatar'
import Acct from './composer/Acct'
import Composer from './composer/Composer'
import Emoji from './composer/Emoji'
import Menu from './composer/Menu'
import Poll from './composer/Poll'
import Schedule from './composer/Schedule'
import { Text } from './themed/Text'
import { Button } from './ui/Button'

interface Props {
	isOpened: boolean
	setIsOpened: IState<boolean>
}
interface IOptional {
	scheduled_at?: string
	poll?: IPoll
}
export default function Navigator({ isOpened, setIsOpened }: Props) {
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const [mode, setMode] = useState<ComposeMode>('compose')
	const [useAcct, setUseAcct] = useState<Account | null>(null)
	const [text, setText] = useState('')
	const [optional, setOptional] = useState<IOptional>({})
	const [vis, setVis] = useState<'public' | 'unlisted' | 'private' | 'direct'>('public')
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [maxChars, setMaxChars] = useState(500)
	const [maxPollsOptions, setMaxPollsOptions] = useState(4)
	const [isLoading, setIsLoading] = useState(false)
	const changeMode = (m: ComposeMode) => {
		setMode(m)
	}
	const addEmoji = (e: string) => {
		if (e) setText((t) => `${t} :${e}: `)
		setMode('compose')
	}
	const addSchedule = (date: Date | null) => {
		setOptional((o) => ({ ...o, scheduled_at: date ? date.toISOString() : undefined }))
		setMode('compose')
	}
	const addPoll = (poll: IPoll | null) => {
		setOptional((o) => ({ ...o, poll: poll || undefined }))
		setMode('compose')
	}
	const post = async (p: PostComposer) => {
		setMode('loading')
		try {
			const postData = {
				...options,
				...p
			}
			await client?.postStatus(text, postData)
			setIsOpened(false)
		} finally {
			setMode('compose')
		}
	}
	const loadClient = async (acct: Account) => {
		const https = `https://${acct.domain}`
		const client = generator(acct.sns, https, acct.accessToken)
		setClient(client)
		const instance = await client.getInstance()
		const dataMaxChars = instance.data.configuration.statuses.max_characters
		setMaxPollsOptions(instance.data.configuration.polls?.max_options || 4)
		setMaxChars(dataMaxChars || 500)
		const { data: acctInfo } = await client.verifyAccountCredentials()
		const priv = acctInfo.source?.privacy
		if (['public', 'unlisted', 'private', 'direct'].includes(priv || '')) setVis((priv as any) || 'public')
	}
	useEffect(() => {
		const fn = async () => {
			const accts = await getUsualAcct()
			setUseAcct(accts)
		}
		fn()
	}, [])
	useEffect(() => {
		if (useAcct) loadClient(useAcct)
		if (useAcct) setMode('compose')
	}, [useAcct])
	useEffect(() => {
		if (isOpened) {
			setMode('compose')
			setText('')
			setOptional({})
		}
	}, [isOpened])
	if (!useAcct) return null
	return (
		<Host style={{ width }}>
			<BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
				<View style={{ padding: 20 }}>
					{mode === 'compose' && (
						<View style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
							<Button variant="bordered" onPress={() => changeMode('acct')} style={{ flexGrow: 1 }}>
								<View style={styles.acctContainer}>
									<View>
										<Avatar src={useAcct.avatar || useAcct.favicon} fallback={useAcct.sns} size={20} />
									</View>
									<Text style={[styles.username, { color: textColor }]} numberOfLines={1}>
										{useAcct.username}@{useAcct.domain}
									</Text>
								</View>
							</Button>
							<View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5, width: 80 }}>
								{optional.scheduled_at && <SymbolView type="monochrome" tintColor={textColor} name="clock" size={16} />}
								{optional.poll && <SymbolView type="monochrome" tintColor={textColor} name="checklist" size={16} />}
								<Text>{maxChars - text.length}</Text>
							</View>
						</View>
					)}
					<Composer isOpened={mode === 'compose'} client={client} post={post} defaultVis={vis} acct={useAcct} changeMode={changeMode} text={text} setText={setText} />
					{mode === 'acct' && <Acct change={(r) => setUseAcct(r)} />}
					{mode === 'emoji' && <Emoji client={client} add={(r) => addEmoji(r)} />}
					{mode === 'menu' && <Menu changeMode={changeMode} />}
					{mode === 'schedule' && <Schedule defaultSchedule={optional.scheduled_at || null} changeMode={changeMode} addSchedule={addSchedule} />}
					{mode === 'poll' && <Poll defaultPoll={optional.poll || null} maxPollsOptions={maxPollsOptions} changeMode={changeMode} addPoll={addPoll} />}
					{mode === 'loading' && (
						<View style={{ width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' }}>
							<ActivityIndicator />
						</View>
					)}
				</View>
			</BottomSheet>
		</Host>
	)
}

const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		acctContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingBottom: 10,
			height: 40
		},
		username: {
			fontSize: 16,
			marginLeft: 10
		}
	})
