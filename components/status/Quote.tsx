import type { Entity } from '@cutls/megalodon'
import { ja } from 'date-fns/locale'
import { SymbolView } from 'expo-symbols'
import React from 'react'
import { PlatformColor, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native'
import Avatar from '../Avatar'
import { Text } from '../themed/Text'
import { AccountName } from './AccountName'

import { emojify } from '@/utils/emojify'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}

type IConfig = {}
interface IProps {
	status: Entity.Status
	state: Entity.Status['quote_status_state']
	columnWidth: number
	config: IConfig
	//openFromOtherAccount: (status: Entity.Status) => void
	lang: 'ja' | 'en'
}
export const Quote = (props: IProps) => {
	const { status, columnWidth, lang, state } = props
	const { t } = useTranslation()
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const styles = createStyles({ width: columnWidth })
	const tagStyle = { a: { color: PlatformColor('link') }, p: { color: txtColor } } as const
	const locale = lang === 'ja' ? ja : undefined
	const fromNow = formatDistanceToNow(new Date(status.created_at), { addSuffix: true, locale })
	const basic = status.account
	const fontSize = 16
	const showGif = true
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
		<TouchableOpacity activeOpacity={0.7} style={{ display: 'flex', flexDirection: 'row', ...styles.container }}>
			<View style={{ marginLeft: 5 }}>
				<View style={{ display: 'flex', flexDirection: 'row' }}>
					<Avatar src={basic.avatar} size={20} />
					<AccountName account={basic} fontSize={18} width={columnWidth - left - 175} />
					<View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', width: 150, marginRight: 5 }}>
						<Text numberOfLines={1} style={{ color: PlatformColor('systemGray'), width: 150 - daySize, textAlign: 'right' }}>
							@{basic.acct}
						</Text>
						{basic.locked && <SymbolView name="lock" type="monochrome" tintColor={txtColor} size={16} />}
						<Text numberOfLines={1} style={{ color: PlatformColor('systemGray'), width: daySize, textAlign: 'right' }}>
							{fromNow}
						</Text>
					</View>
				</View>
				<HTML
					source={{ html: `${emojify(status.content, status.emojis, fontSize * 0.8, showGif)}` }}
					tagsStyles={tagStyle}
					customHTMLElementModels={renderers}
					contentWidth={columnWidth - left}
					classesStyles={{ invisible: { fontSize: 0.01 }, 'quote-inline': { display: 'none' } }}
					defaultTextProps={{ style: { fontSize: fontSize }, numberOfLines: 2 }}
					defaultViewProps={{ style: { width: columnWidth - left } }}
				/>
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
