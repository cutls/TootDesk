import type { Entity } from '@cutls/megalodon'
import { ja } from 'date-fns/locale'
import { SymbolView } from 'expo-symbols'
import React from 'react'
import { PlatformColor, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import Avatar from '../Avatar'
import { Text } from '../themed/Text'
import { AccountName } from './AccountName'

import type { Settings } from '@/entities/settings'
import { emojify } from '@/utils/emojify'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}

type IConfig = Settings['timeline']
interface IProps {
	acctId: string
	status: Entity.Status
	state: Entity.Status['quote_status_state']
	columnWidth: number
	config: IConfig
	//openFromOtherAccount: (status: Entity.Status) => void
	lang: 'ja' | 'en'
}
const QuoteHTML = React.memo(({ status, fontSize, showGif, txtColor, columnWidth }: { status: Entity.Status; columnWidth: number; fontSize: number; showGif: boolean; txtColor: string }) => (
	<HTML
		source={{ html: `${emojify(status.content, status.emojis, fontSize * 0.8, showGif)}` }}
		tagsStyles={{ p: { color: txtColor }, a: { color: PlatformColor('link') } }}
		customHTMLElementModels={renderers}
		contentWidth={columnWidth}
		classesStyles={{
			invisible: { color: PlatformColor('link') },
			ellipsis: { color: PlatformColor('link') },
			'quote-inline': { display: 'none' },
			mention: { color: PlatformColor('link') },
			hashtag: { color: PlatformColor('link') }
		}}
		baseStyle={{ color: txtColor }}
	/>
))
export const Quote = (props: IProps) => {
	const { status, columnWidth, lang, state, acctId } = props
	const { t } = useTranslation()
	const router = useRouter()
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const styles = createStyles({ width: columnWidth })
	const tagStyle = { a: { color: PlatformColor('link') }, p: { color: txtColor } } as const
	const locale = lang === 'ja' ? ja : undefined
	const fromNow = formatDistanceToNow(new Date(status.created_at), { addSuffix: true, locale })
	const basic = status.account
	const fontSize = 14
	const showGif = props.config.animation === 'yes'
	const left = 20
	const daySize = lang === 'ja' ? 60 : 80
	if (state !== 'accepted') {
		return (
			<View style={styles.container}>
				<Text>{t(`timeline.quoteState.${state}`)}</Text>
			</View>
		)
	}
	return (
		<TouchableOpacity onPress={() => router.push(`/detail?acctId=${acctId}&statusId=${status.id}`)} activeOpacity={0.7} style={{ display: 'flex', flexDirection: 'row', ...styles.container }}>
			<View style={{ marginLeft: 5 }}>
				<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
					<Avatar src={showGif ? basic.avatar : basic.avatar_static} size={20} />
					<AccountName account={basic} fontSize={14} width={columnWidth - left - 175} />
					<View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', width: 150, marginRight: 5 }}>
						<Text numberOfLines={1} style={{ color: PlatformColor('systemGray'), width: 150 - daySize, textAlign: 'right', fontSize: 12 }}>
							@{basic.acct}
						</Text>
						{basic.locked && <SymbolView name="lock" type="monochrome" tintColor={txtColor} size={16} />}
						<Text numberOfLines={1} style={{ color: PlatformColor('systemGray'), width: daySize, textAlign: 'right', fontSize: 12 }}>
							{fromNow}
						</Text>
					</View>
				</View>
				<QuoteHTML status={status} fontSize={fontSize} showGif={showGif} txtColor={txtColor} columnWidth={columnWidth} />
			</View>
		</TouchableOpacity>
	)
}

const createStyles = ({ width }: { width: number }) =>
	StyleSheet.create({
		container: {
			width: width,
			padding: 5,
			borderWidth: 1,
			borderColor: PlatformColor('systemGray3'),
			borderRadius: 8,
			marginTop: 5
		}
	})
