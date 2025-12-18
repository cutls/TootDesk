import generator from '@cutls/megalodon'
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
