import { mockAccount, type Account } from '@/entities/account'
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
