import type { Account } from '@/entities/account'
import { confirmDialog, CONTINUE } from '@/utils/alert'
import { uploadCallback } from '@/utils/picture'
import { suggest } from '@/utils/suggest'
import type { ComposeMode, IState } from '@/utils/type'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { Button as SwiftButton } from '@expo/ui/swift-ui'
import { ignoreSafeArea } from '@expo/ui/swift-ui/modifiers'
import { Image } from 'expo-image'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, InputAccessoryView, PlatformColor, StyleSheet, TextInput, TouchableOpacity, useColorScheme, useWindowDimensions, View } from 'react-native'
import { Text } from '../themed/Text'
import { Button } from '../ui/Button'
import { Dropdown } from '../ui/Dropdown'
interface Props {
	textState: { text: string, setText: IState<string> }
	cwState: { cw: string, setCW: IState<string> }
	uploadedState: { uploaded: Array<Entity.Attachment | Entity.AsyncAttachment>, setUploaded: IState<Array<Entity.Attachment | Entity.AsyncAttachment>> }
	acct: Account
	isOpened: boolean
	changeMode: (m: ComposeMode) => void
	visState: { vis: 'public' | 'unlisted' | 'private' | 'direct' | 'local', setVis: IState<'public' | 'unlisted' | 'private' | 'direct' | 'local'> }
	post: () => void
	client: MegalodonInterface | null
}
interface Suggested {
	type: 'emoji' | 'acct' | 'tag'
	emoji?: Entity.Emoji
	acct?: Entity.Account
	tag?: Entity.Tag
}

const data = [
	{ title: 'composer.vis.public', value: 'public', systemImage: 'globe' as const },
	{ title: 'composer.vis.unlisted', value: 'unlisted', systemImage: 'eye.slash' as const },
	{ title: 'composer.vis.private', value: 'private', systemImage: 'person.2.fill' as const },
	{ title: 'composer.vis.direct', value: 'direct', systemImage: 'envelope.fill' as const }
]
export default function Composer({ acct, post, isOpened, changeMode, textState, cwState, uploadedState, visState, client }: Props) {
	const { text, setText } = textState
	const { cw, setCW } = cwState
	const { vis, setVis } = visState
	const { uploaded, setUploaded } = uploadedState
	const { t } = useTranslation()
	const { width } = useWindowDimensions()
	const styles = createStyles({ width })
	const colorScheme = useColorScheme()
	const isDark = colorScheme === 'dark'
	const textColor = PlatformColor('label')
	const textInput = React.useRef<TextInput>(null)
	const [isCW, setIsCW] = useState(!!cw)
	const [suggested, setSuggested] = useState<Array<Suggested>>([])

	const [selection, setSelection] = useState({ start: 0, end: 0 })
	const [deleteTxt, setDeleteTxt] = useState('')
	const [uploading, setUploading] = useState(0)
	const uploadStatus = (i: number) => setUploading(i)
	const upload = async (result: Entity.Attachment | Entity.AsyncAttachment) => setUploaded((prev) => [...prev, result])
	const deleteItem = async (id: string) => {
		if (!await confirmDialog(t('confirm'), t('composer.deleteAttachmentConfirm'), CONTINUE, (s) => t(s))) return
		setUploaded((prev) => prev.filter((a) => a.id !== id))
	}
	const sSelect = (inputIt: string) => {
		const firstRaw = text.slice(0, selection.start) || ''
		const newReg = new RegExp(`${deleteTxt}.?\\s?$`)
		const first = firstRaw.replace(newReg, '')
		const end = text.slice(selection.start) || ''
		setText(`${first}${inputIt}${end ? '' : ' '}${end}`)
		setSuggested([])
	}
	const renderSuggest = (item: Suggested) => {
		if (item.emoji)
			return (
				<TouchableOpacity style={[styles.suggested]} onPress={() => sSelect(`:${item.emoji?.shortcode}:`)}>
					<Image source={{ uri: item.emoji?.url }} style={styles.sImg} />
					<Text style={styles.sTxt}>:{item.emoji?.shortcode}:</Text>
				</TouchableOpacity>
			)
		if (item.tag)
			return (
				<TouchableOpacity style={[styles.suggested]} onPress={() => sSelect(`#${item.tag?.name}`)}>
					<Text style={styles.sTxt}>#{item.tag?.name}</Text>
				</TouchableOpacity>
			)
		if (item.acct)
			return (
				<TouchableOpacity style={[styles.suggested]} onPress={() => sSelect(`@${item.acct?.acct}`)}>
					<Image source={{ uri: item.acct?.avatar }} style={styles.sImg} />
					<Text style={styles.sTxt}>@{item.acct?.acct}</Text>
				</TouchableOpacity>
			)
		return null
	}
	useEffect(() => {
		if (isOpened) textInput.current?.focus()
	}, [isOpened])
	useEffect(() => {
		const main = async () => {
			//setSuggestLoading(true)
			if (!client) return
			const data = await suggest(selection.start, text, acct.id, client)
			setSuggested(data[0])
			setDeleteTxt(data[1])
			//setSuggestLoading(false)
		}
		main()
	}, [selection])
	return (
		<View style={{ display: isOpened ? 'contents' : 'none' }}>
			<View style={{ flexDirection: 'row', marginBottom: 5, justifyContent: 'flex-end' }}>
				{uploaded.map((a) => <Button key={a.id} onPress={() => deleteItem(a.id)} modifiers={[ignoreSafeArea({ regions: 'all' })]}>
					<Image
						source={{ uri: a.preview_url || a.url || '' }}
						style={{ width: 50, height: 50, borderRadius: 10, marginHorizontal: 2 }}
					/>
				</Button>)}
				{Array.from({ length: uploading }).map((_, i) => (
					<View
						key={i.toString()}
						style={{ width: 50, height: 50, borderRadius: 10, marginHorizontal: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: PlatformColor('secondarySystemBackground') }}
					>
						<ActivityIndicator />
					</View>
				))}
			</View>
			{isCW && (
				<View style={styles.cwWrap}>
					<TextInput value={cw} onChangeText={(t) => setCW(t)} multiline={false} style={[styles.cw]} placeholder={t('composer.cwPlaceholder')} placeholderTextColor={isDark ? 'lightgray' : 'gray'} />
				</View>
			)}
			<TextInput
				value={text}
				onChangeText={(t) => setText(t)}
				ref={textInput}
				multiline={true}
				style={[styles.textarea, { height: isCW ? 100 : 200, color: textColor }]}
				placeholder={t('composer.placeholder')}
				placeholderTextColor={isDark ? 'lightgray' : 'gray'}
				inputAccessoryViewID="textAreaSuggest"
				onSelectionChange={({ nativeEvent: { selection } }) => {
					setSelection(selection)
				}}
			/>
			{suggested.length > 0 && (
				<InputAccessoryView nativeID="textAreaSuggest">
					<View style={{ backgroundColor: PlatformColor('systemBackground'), height: 40, width: '100%' }}>
						<FlatList
							data={suggested as any}
							horizontal={true}
							renderItem={({ item }: any) => renderSuggest(item)}
							keyExtractor={(s) => s.id || s.shortcode}
							style={{}}
							keyboardShouldPersistTaps="handled"
						/>
					</View>
				</InputAccessoryView>
			)}
			<View style={{ display: 'flex', justifyContent: 'flex-end', marginVertical: 5, paddingBottom: 10, flexDirection: 'row', gap: 2 }}>
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="line.3.horizontal" onPress={() => changeMode('menu')} modifiers={[]} />
				<Button style={{ width: 55, height: 50 }} color={isCW ? PlatformColor('systemYellow') : undefined} variant="glass" onPress={() => setIsCW(!isCW)} modifiers={[]}>
					CW
				</Button>
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="face.smiling" onPress={() => changeMode('emoji')} modifiers={[]} />
				<Dropdown data={data} onSelect={(title) => setVis(title as any)} modifiers={[]} style={{ width: 50, height: 50 }}>
					<SwiftButton variant="glass" systemImage={data.find((d) => d.value === vis)?.systemImage || 'globe'} />
				</Dropdown>
				<Button style={{ width: 50, height: 50 }} variant="glass" systemImage="photo" onPress={() => uploadCallback(upload, uploadStatus, client)} modifiers={[]} />
				<Button
					style={{ width: 100, height: 50 }}
					variant="glassProminent"
					color="teal"
					systemImage="square.and.pencil"
					onPress={() => post()}
					modifiers={[]}
				>
					{t('composer.post')}
				</Button>
			</View>
		</View>
	)
}
const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		textarea: {
			width: width - 40
		},
		acctContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingBottom: 10,
			height: 40
		},
		username: {
			fontSize: 16,
			marginLeft: 10
		},
		cwWrap: {
			marginBottom: 10,
			borderBottomWidth: 1,
			borderColor: PlatformColor('separator'),
			paddingBottom: 10
		},
		cw: {},
		suggested: {
			height: 40,
			marginHorizontal: 5,
			display: 'flex',
			flexDirection: 'row',
			alignItems: 'center'
		},
		sImg: {
			width: 20,
			height: 20
		},
		sTxt: {
			marginLeft: 5
		}
	})
