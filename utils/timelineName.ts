import type { TimelineKind } from '@/entities/timeline'
import generator from '@cutls/megalodon'
import type { SFSymbol } from 'expo-symbols'
import { getAcctById } from './storage'

export const makeTimelineNameWithAcctId = async (kind: string, kindLocalized: string, acctId: string): Promise<string> => {
	const acct = await getAcctById(acctId)
	if (!acct) return kindLocalized || kind
	return `${kindLocalized} (${acct.username}@${acct.domain})`
}
export const makeListTimelineNameWithAcctId = async (kind: string, kindLocalized: string, acctId: string, listId: string): Promise<string> => {
	try {
		const acct = await getAcctById(acctId)
		if (!acct) return kindLocalized || kind
		const https = `https://${acct.domain}`
		const client = generator(acct.sns, https, acct.accessToken)
		const listData = await client.getList(listId)
		const listName = listData.data.title
		return `${listName} (${acct.username}@${acct.domain})`
	} catch {
		return 'List'
	}
}
export const icon = (kind: TimelineKind): SFSymbol => {
	if (kind === 'home') return 'house.fill'
	if (kind === 'notifications') return 'bell.fill'
	if (kind === 'local') return 'person.2.fill'
	if (kind === 'public') return 'globe'
	if (kind === 'list') return 'list.bullet'
	if (kind === 'bookmarks') return 'bookmark.fill'
	if (kind === 'direct') return 'envelope.fill'
	if (kind === 'favourites') return 'star.fill'
	if (kind === 'tag') return 'tag.fill'
	return 'rectangle.stack.person.crop'
}
