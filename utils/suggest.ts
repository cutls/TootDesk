import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import { cachedGetEmojis } from './storage'
interface Suggested {
	type: 'emoji' | 'acct' | 'tag'
	emoji?: Entity.Emoji
	acct?: Entity.Account
	tag?: Entity.Tag
}
export const suggest = async (startPosition: number | undefined, inputText: string, acctId: number, client: MegalodonInterface): Promise<[Suggested[], string]> => {
	const first1 = inputText.slice(0, startPosition)
	const firstArr = first1.split(' ')
	const first = firstArr[firstArr.length - 1]
	const emojiRegExp = /:([a-zA-Z0-9_]{3,})/
	const tagRegExp = /#([^- ]|\S){3,}\s?/
	const acctRegExp = /@[a-zA-Z0-9_]{3,}/
	const emojiM = first.match(emojiRegExp)
	const tagM = first.match(tagRegExp)
	const acctM = first.match(acctRegExp)
	if (emojiM) {
		try {
			const useData = await cachedGetEmojis(acctId, client)
			const filteredEmoji = useData.filter((e) => !!e.shortcode.match(emojiM[1])).map((e) => ({ type: 'emoji' as const, emoji: e }))
			return [filteredEmoji.slice(0, 20), emojiM[0]]
		} catch (e: any) {
			console.error(e)
		}
	} else if (tagM || acctM) {
		try {
			const q = { q: '' }
			if (tagM) q.q = tagM[0]
			if (acctM) q.q = acctM[0]
			const data = (await client.search(q.q)).data
			if (data.hashtags.length && tagM) return [data.hashtags.slice(0, 20).map((t) => ({ type: 'tag' as const, tag: t })), tagM[0]]
			if (data.accounts.length && acctM) return [data.accounts.slice(0, 20).map((a) => ({ type: 'acct' as const, acct: a })), acctM[0]]
			return [[], '']
		} catch (e: any) {
			console.error(e)
		}
	}
	return [[], '']
}
