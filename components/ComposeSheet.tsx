import type { Account } from '@/entities/account'
import type { Poll as IPoll } from '@/entities/status'
import { getAcctById, getUsualAcct } from '@/utils/storage'
import type { ActionProps, ComposeMode, IState } from '@/utils/type'
import generator, { type Entity, type MegalodonInterface } from '@cutls/megalodon'
import { BottomSheet, Host } from '@expo/ui/swift-ui'
import { ignoreSafeArea } from '@expo/ui/swift-ui/modifiers'
import { SymbolView } from 'expo-symbols'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, PlatformColor, StyleSheet, useColorScheme, useWindowDimensions, View } from 'react-native'
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
	composeAction: ActionProps | null
	clearComposeAction: () => void
}
interface IOptional {
	scheduled_at?: string
	poll?: IPoll
	editTargetId?: string
	in_reply_to_id?: string
	quoted_status_id?: string
}
export default function Navigator({ isOpened, setIsOpened, composeAction, clearComposeAction }: Props) {
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const [mode, setMode] = useState<ComposeMode>('compose')
	const [useAcct, setUseAcct] = useState<Account | null>(null)
	const [text, setText] = useState('')
	const [optional, setOptional] = useState<IOptional>({})
	const [vis, setVis] = useState<'public' | 'unlisted' | 'private' | 'direct' | 'local'>('public')
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const [client, setClient] = useState<MegalodonInterface | null>(null)
	const [maxChars, setMaxChars] = useState(500)
	const [maxPollsOptions, setMaxPollsOptions] = useState(4)
	const [isLoading, setIsLoading] = useState(false)
	const [cw, setCW] = useState('')
	const [uploaded, setUploaded] = useState<Array<Entity.Attachment | Entity.AsyncAttachment>>([])
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
	const post = async () => {
		setMode('loading')
		try {
			if (optional.editTargetId) {
				const editData = {
					...optional,
					spoiler_text: cw || undefined,
					visibility: vis,
					media_ids: uploaded.map((u) => u.id)
				}
				await client?.editStatus(optional.editTargetId, { status: text, ...editData })
			} else {
				const postData = {
					...optional,
					spoiler_text: cw || undefined,
					visibility: vis,
					media_ids: uploaded.map((u) => u.id)
				}
				await client?.postStatus(text, postData)
			}
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
		const fn = async () => {
			const accts = await getAcctById(composeAction?.acctId || 0)
			if (accts) setUseAcct(accts)
			if (composeAction?.type) setIsOpened(true)
			if (composeAction?.addText) setText(composeAction.addText)
			if (composeAction?.type === 'reply') setOptional((o) => ({ ...o, in_reply_to_id: composeAction.targetId }))
			if (composeAction?.type === 'quote') setOptional((o) => ({ ...o, quoted_status_id: composeAction.targetId }))
			if (composeAction?.type === 'edit') setOptional((o) => ({ ...o, editTargetId: composeAction.targetId }))
			if (composeAction?.visibility) {
				const priv = composeAction.visibility
				if (['public', 'unlisted', 'private', 'direct'].includes(priv || '')) setVis((priv as any) || 'public')
			}
			if (composeAction?.status) {
				const status = composeAction.status
				const priv = status.visibility
				if (['public', 'unlisted', 'private', 'direct'].includes(priv || '')) setVis((priv as any) || 'public')
				if (status.spoiler_text) setCW(status.spoiler_text)
				console.log(status.media_attachments)
				if (status.media_attachments && status.media_attachments.length > 0) setUploaded(status.media_attachments)
				setOptional((o) => {
					const newOptional: IOptional = { ...o }
					//if (status.scheduled_at) newOptional.scheduled_at = status.scheduled_at
					if (status.poll)
						newOptional.poll = {
							options: status.poll.options.map((o) => o.title),
							expires_in: status.poll.expires_at ? Math.floor((new Date(status.poll.expires_at).getTime() - Date.now()) / 1000) : 300,
							multiple: status.poll.multiple,
							hide_totals: false
						}
					return newOptional
				})
			}
		}
		fn()
	}, [composeAction])
	useEffect(() => {
		if (isOpened) {
			setMode('compose')
		} else {
			setText('')
			setOptional({})
			setCW('')
			setUploaded([])
			setVis('public')
			clearComposeAction()
		}
	}, [isOpened])
	if (!useAcct) return null
	return (
		<Host style={{ width, position: isOpened ? 'absolute' : undefined, zIndex: 1000 }}>
			<BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
				<View style={{ padding: 20 }}>
					{mode === 'compose' && (
						<>
							<View style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, alignItems: 'center', justifyContent: 'space-between' }}>
								<Button modifiers={[ignoreSafeArea({ regions: 'all'})]} variant="bordered" onPress={() => changeMode('acct')} style={{ flexGrow: 1 }}>
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
							{composeAction?.type && (
								<View style={{}}>
									<Text>{t(`composer.${composeAction.type}`)}</Text>
								</View>
							)}
						</>
					)}
					<Composer
						isOpened={mode === 'compose' && isOpened}
						client={client}
						post={post}
						defaultVis={vis}
						acct={useAcct}
						changeMode={changeMode}
						textState={{ text, setText }}
						cwState={{ cw, setCW }}
						uploadedState={{ uploaded, setUploaded }}
					/>
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
