import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { ja } from 'date-fns/locale'
import { SymbolView } from 'expo-symbols'
import React, { useRef, useState } from 'react'
import { ActionSheetIOS, ActivityIndicator, findNodeHandle, PlatformColor, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import Avatar from '../Avatar'
import { Text } from '../themed/Text'
import { AccountName } from './AccountName'

import type { Account } from '@/entities/account'
import { confirmDialog, CONTINUE } from '@/utils/alert'
import { emojify } from '@/utils/emojify'
import { formatDistanceToNow } from 'date-fns'
import { Link, useRouter } from 'expo-router'
import { openBrowserAsync } from 'expo-web-browser'
import { useTranslation } from 'react-i18next'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { Attachment } from './Attachments'
import { Card } from './Card'
import { Quote } from './Quote'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}

type IConfig = {}
interface IProps {
	status: Entity.Status
	client: MegalodonInterface
	acct: Account
	columnWidth: number
	config: IConfig
	statusAction: (status: Entity.Status, type: 'reply' | 'quote' | 'edit') => void
	//openFromOtherAccount: (status: Entity.Status) => void
	filters: Array<Entity.Filter>
	lang: 'ja' | 'en'
	updateStatus: (newStatus: Entity.Status) => void
	composeAction: (type: 'quote' | 'reply' | 'edit', target: Entity.Status) => void
}

const data = [
	{ value: 'public', systemImage: 'globe' as const },
	{ value: 'unlisted', systemImage: 'eye.slash' as const },
	{ value: 'private', systemImage: 'person.2.fill' as const },
	{ value: 'direct', systemImage: 'envelope.fill' as const }
]
const actions = [{ title: 'timeline.action.quote', value: 'quote', systemImage: 'quote.bubble' as const }]
const actionOnlyMe = [
	{ title: 'timeline.action.edit', value: 'edit', systemImage: 'pencil' as const },
	{ title: 'timeline.action.delete', value: 'delete', systemImage: 'trash' as const, isDestructive: true }
]
//const isP = (content: string) => (content.startsWith('<p') ? content : `<p>${content}</p>`)
const isP = (content: string) => content
const shortenTime = (time: string, isJa: boolean) => {
	const start = time.replace('約', '').replace('about', '')
	const en = start.replace('days', 'd').replace('day', 'd').replace('hours', 'h').replace('hour', 'h').replace('minutes', 'm').replace('minute', 'm').replace('seconds', 's').trim()
	return isJa ? `${en.replace(' ', '')}前` : en.trim()
}
export const Status = (props: IProps) => {
	const { status: statusRaw, client, columnWidth, lang, updateStatus, acct, composeAction } = props
	const status = statusRaw.reblog ? statusRaw.reblog : statusRaw
	const isMe = acct.username === status.account.acct
	const { t } = useTranslation()
	const theme = useColorScheme()
	const router = useRouter()
	const dropdownRef = useRef<View>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const styles = createStyles({ width: columnWidth })
	const [isOpen, setIsOpen] = useState(!status.spoiler_text)
	const locale = lang === 'ja' ? ja : undefined
	const fromNow = shortenTime(formatDistanceToNow(new Date(status.created_at), { addSuffix: false, locale }), lang === 'ja')
	const basic = status.account
	const fontSize = 14
	const showGif = true
	const showCount = true
	const avatarSize = 45
	const left = avatarSize + 25
	const action = async (type: 'bt' | 'fav' | 'bookmark') => {
		setIsProcessing(true)
		try {
			let response: any = null
			if (type === 'bt' && !status.reblogged) response = await client.reblogStatus(status.id)
			else if (type === 'bt' && status.reblogged) response = await client.unreblogStatus(status.id)
			else if (type === 'fav' && !status.favourited) response = await client.favouriteStatus(status.id)
			else if (type === 'fav' && status.favourited) response = await client.unfavouriteStatus(status.id)
			else if (type === 'bookmark' && !status.bookmarked) response = await client.bookmarkStatus(status.id)
			else if (type === 'bookmark' && status.bookmarked) response = await client.unbookmarkStatus(status.id)
			const newStatus = response.data as Entity.Status
			updateStatus(newStatus)
		} finally {
			setIsProcessing(false)
		}
	}
	const handleLink = (url: string) => {
		const mentionCheck = status.mentions.find((m) => m.url === url)
		if (mentionCheck) {
			router.push(`/user?acctId=${acct.id}&userId=${mentionCheck.id}`)
		} else {
			openBrowserAsync(url)
		}
	}
	const dropdown = async () => {
		const d = await new Promise<string>((resolve) => ActionSheetIOS.showActionSheetWithOptions(
			{
				options: otherAction.map((a) => t(a.title)),
				anchor: findNodeHandle(dropdownRef.current) || undefined,
				destructiveButtonIndex: otherAction.findIndex((a) => a.value === 'delete') || undefined
			},
			(i) => resolve(otherAction[i].value)
		))
		if (d === 'quote') composeAction('quote', status)
		if (d === 'edit') composeAction('edit', status)
		if (d === 'delete') {
			if (!(await confirmDialog(t('timeline.action.delete'), t('timeline.action.deleteConfirm'), CONTINUE, (s) => t(s)))) return
			client.deleteStatus(status.id)
		}
	}
	const otherAction = isMe ? [...actions, ...actionOnlyMe] : actions
	return (
		<View style={{ width: columnWidth, paddingHorizontal: 10, paddingVertical: 5 }}>
			{statusRaw.reblog && (
				<View style={{ display: 'flex', flexDirection: 'row', marginBottom: 5 }}>
					<SymbolView name="repeat" type="monochrome" tintColor={PlatformColor('systemBlue')} size={fontSize * 1.2} />
					<Text style={{ marginLeft: 5, color: PlatformColor('systemGray') }}>{t('timeline.status.rebloggedBy', { name: statusRaw.account.display_name || statusRaw.account.acct })}</Text>
				</View>
			)}
			<View style={{ display: 'flex', flexDirection: 'row' }}>
				<View style={{ width: avatarSize, alignItems: 'center' }}>
					<Link href={`/user?acctId=${acct.id}&userId=${basic.id}`} push asChild>
						<Link.Preview style={{ backgroundColor: PlatformColor('systemBackground') }} />
						<Link.Trigger>
							<Avatar src={basic.avatar} size={avatarSize} />
						</Link.Trigger>
					</Link>
					<View style={{ marginTop: 2 }} />
					<Text numberOfLines={1} style={{ color: PlatformColor('systemGray'), textAlign: 'center', fontSize: 10 }}>
						{fromNow}
					</Text>
					<View style={{ marginTop: 2 }} />
					<SymbolView name={data.find((d) => d.value === status.visibility)?.systemImage || 'questionmark'} size={12} type="monochrome" tintColor={PlatformColor('systemGray')} />
					<View style={{ marginTop: 2 }} />
					{isProcessing && <ActivityIndicator size="small" />}
				</View>

				<View style={{ marginLeft: 5 }}>
					<View style={{ display: 'flex', flexDirection: 'row' }}>
						<AccountName account={basic} fontSize={fontSize * 1.1} width={columnWidth - left - 155} />
						<View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', width: 150, marginRight: 5 }}>
							<Text numberOfLines={1} style={{ color: PlatformColor('systemGray'), width: 150, textAlign: 'right' }}>
								@{basic.acct}
							</Text>
						</View>
					</View>
					{status.spoiler_text && (
						<View style={styles.cwWrap}>
							<Text style={{ fontSize: fontSize, marginRight: 2, width: columnWidth - 180 }}>{status.spoiler_text}</Text>
							<TouchableOpacity
								activeOpacity={0.7}
								onPress={() => setIsOpen(!isOpen)}
								style={{ padding: 5, borderRadius: 5, borderWidth: 1, backgroundColor: PlatformColor('systemGray3'), width: 90 }}
							>
								<Text style={{ fontSize: fontSize, textAlign: 'center' }}>{!isOpen ? t('timeline.status.showMore') : t('timeline.status.showLess')}</Text>
							</TouchableOpacity>
						</View>
					)}
					{isOpen && (
						<View style={{ minHeight: 30, display: 'flex', marginTop: 5 }}>
							<HTML
								source={{ html: `${emojify(isP(status.content), status.emojis, fontSize * 0.8, showGif)}` }}
								tagsStyles={{ p: { color: txtColor }, a: { color: PlatformColor('link') } }}
								customHTMLElementModels={renderers}
								contentWidth={columnWidth - left}
								classesStyles={{
									invisible: { color: PlatformColor('link') },
									ellipsis: { color: PlatformColor('link') },
									'quote-inline': { display: 'none' },
									mention: { color: PlatformColor('link') },
									hashtag: { color: PlatformColor('link') }
								}}
								baseStyle={{ color: txtColor, fontSize: fontSize }}
								defaultViewProps={{ style: { width: columnWidth - left } }}
								renderersProps={{ a: { onPress: (e, href) => handleLink(href) } }}
							/>
						</View>
					)}
					{status.quote_status && <Quote status={status.quote_status} columnWidth={columnWidth - left} config={{}} lang={lang} state={status.quote_status_state} />}
					{status.card && <Card card={status.card} columnWidth={columnWidth - left} />}
					<Attachment attachments={status.media_attachments} width={columnWidth - left} isSensitive={status.sensitive} />
					<View style={{ display: 'flex', flexDirection: 'row', marginVertical: 10, paddingHorizontal: 10, justifyContent: 'space-between', width: columnWidth - left }}>
						<TouchableOpacity style={styles.action} onPress={() => composeAction('reply', status)}>
							<SymbolView name="arrowshape.turn.up.left" type="monochrome" tintColor={txtColor} size={fontSize * 1.2} />
							<Text style={{ marginLeft: 5 }}>{showCount ? status.replies_count.toLocaleString() : ''}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.action} onPress={() => action('bt')}>
							<SymbolView name="repeat" type="monochrome" tintColor={status.reblogged ? PlatformColor('systemBlue') : txtColor} size={fontSize * 1.2} />
							<Text style={{ marginLeft: 5 }}>{showCount ? status.reblogs_count.toLocaleString() : ''}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.action} onPress={() => action('fav')}>
							<SymbolView name={status.favourited ? 'star.fill' : 'star'} type="monochrome" tintColor={status.favourited ? PlatformColor('systemYellow') : txtColor} size={fontSize * 1.2} />
							<Text style={{ marginLeft: 5 }}>{showCount ? status.favourites_count.toLocaleString() : ''}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.action} onPress={() => action('bookmark')}>
							<SymbolView name={status.bookmarked ? 'bookmark.fill' : 'bookmark'} type="monochrome" tintColor={status.bookmarked ? PlatformColor('systemRed') : txtColor} size={fontSize * 1.2} />
						</TouchableOpacity>
						<TouchableOpacity ref={dropdownRef} style={styles.action} onPress={() => dropdown()}>
							<SymbolView name="ellipsis" type="monochrome" tintColor={txtColor} size={fontSize * 1.2} />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</View>
	)
}

const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		cwWrap: {
			flexDirection: 'row',
			display: 'flex',
			width: width - 65,
			alignItems: 'center',
			justifyContent: 'space-between',
			borderWidth: 1,
			borderColor: PlatformColor('systemYellow'),
			padding: 5,
			marginVertical: 5,
			borderRadius: 5,
			borderLeftWidth: 10
		},
		action: {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center'
		}
	})
