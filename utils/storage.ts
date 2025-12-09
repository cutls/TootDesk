import { mockAccount, type Account } from '@/entities/account'
import type { Entity, MegalodonInterface } from '@cutls/megalodon'
import Storage from 'expo-sqlite/kv-store'

export const listAccts = async () => {
	const value = (await Storage.getItem('acct')) || '[]'
	return JSON.parse(value) as Account[]
}
export const saveAccts = async (accts: Account[]) => {
	await Storage.setItem('acct', JSON.stringify(accts))
}
export const updateAcct = async (targetId: number, updatedFields: Partial<Account>) => {
	const accts = await listAccts()
	const updatedAccts = accts.map((a) => (a.id === targetId ? { ...a, ...updatedFields } : a))
	await saveAccts(updatedAccts)
}
export const removeAcct = async (targetId: number) => {
	const accts = await listAccts()
	const updatedAccts = accts.filter((a) => a.id !== targetId)
	await saveAccts(updatedAccts)
}
export const getAcctById = async (id: number): Promise<Account | null> => {
	const accts = await listAccts()
	return accts.find((a) => a.id === id) || null
}

export const getUsualAcct = async (): Promise<Account> => {
	const accts = await listAccts()
	const id = (await Storage.getItem('usualAcct')) || null
	if (!id) return accts[0] || mockAccount
	return accts.find((a) => a.id.toString() === id) || mockAccount
}

export const cachedGetEmojis = async (acctId: number, client: MegalodonInterface) => {
	const acct = await getAcctById(acctId)
	if (!acct) return []
	const value = (await Storage.getItem(`emoji-${acct.domain}`)) || '{"emojis":[],"updated":0}'
	const parsed = JSON.parse(value) as { emojis: Array<Entity.Emoji>; updated: number }
	const unixTime = Date.now()
	if (parsed.updated + 24 * 60 * 60 * 1000 < unixTime) {
		try {
			const res = await client.getInstanceCustomEmojis()
			const toStore = {
				emojis: res.data,
				updated: unixTime
			}
			await Storage.setItem(`emoji-${acct.domain}`, JSON.stringify(toStore))
			return res.data
		} catch (e) {
			return parsed.emojis
		}
	} else {
		return parsed.emojis
	}
}
