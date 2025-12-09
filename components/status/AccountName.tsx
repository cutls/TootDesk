import { stripTags } from '@/utils/string'
import type { Entity } from '@cutls/megalodon'
import React from 'react'
import { PlatformColor, useColorScheme } from 'react-native'
import HTML, { defaultHTMLElementModels, HTMLContentModel } from 'react-native-render-html'
import { Text } from '../themed/Text'
const renderers = {
	img: defaultHTMLElementModels.img.extend({
		contentModel: HTMLContentModel.mixed
	})
}
interface FromTootToAcctName {
	account: Entity.Account
	fontSize?: number
	showWithoutEllipsis?: boolean
	width: number
}
export const emojify = (content: string, emojis: Entity.Emoji[], fontSize = 20, showGif = true) => {
	//const twemojified = twemoji.parse(content, { }).replace(/class="emoji"/g, `class="emoji" style="width: ${miniEmoji ? '1' : '1.1'}rem; height: ${miniEmoji ? '0.7' : '1.1'}rem"`)
	const twemojified = content || ''
	let emojified = twemojified
	for (const emoji of emojis) {
		const reg = new RegExp(`:${emoji.shortcode}:`, 'g')
		const emojiHtmlRaw = `<img src="${showGif ? emoji.url : emoji.static_url}" width="${fontSize}" height="${fontSize}">`
		const isOnlyEmojiReg = new RegExp(`^s?:${emoji.shortcode}:s?$`, 'g')
		// なぜか絵文字だけのpostだった場合に、その絵文字が中央に寄ってしまうので、ゼロ幅スペースをいれて誤魔化す
		const isOnlyEmoji = !!stripTags(content).match(isOnlyEmojiReg)
		const emojiHtml = `${isOnlyEmoji ? '​' : ''}${emojiHtmlRaw}${isOnlyEmoji ? '' : ''}`
		emojified = emojified.replace(reg, emojiHtml)
	}

	return emojified
}
export const AccountName = (props: FromTootToAcctName) => {
	const { account, showWithoutEllipsis, width, fontSize = 20 } = props
	const textProps = showWithoutEllipsis ? {} : { numberOfLines: 1 }
	const theme = useColorScheme()
	const isDark = theme === 'dark'
	const txtColor = isDark ? 'white' : 'black'
	const tagStyle = { a: { color: PlatformColor('link') }, p: { color: txtColor } } as const
	const showGif = true
	return account.display_name ? (
		<HTML
			source={{ html: `<p>${emojify(account.display_name, account.emojis, fontSize * 0.8, showGif)}</p>` }}
			tagsStyles={tagStyle}
			customHTMLElementModels={renderers}
			contentWidth={width}
			defaultTextProps={{ style: { fontSize: fontSize, fontWeight: 'bold' }, numberOfLines: 1 }}
			defaultViewProps={{ style: { width } }}
		/>
	) : (
		<Text style={{ fontWeight: 'bold', fontSize }}>{account.username}</Text>
	)
}
