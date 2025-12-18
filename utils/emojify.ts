import type { Entity } from '@cutls/megalodon'
import { stripTags } from './string'

export const emojify = (content: string, emojis: Entity.Emoji[], fontSize = 20, showGif = true) => {
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
