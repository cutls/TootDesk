import type { Account } from '@/entities/account'
import Storage from 'expo-sqlite/kv-store'

export const listAccts = async () => {
	const value = (await Storage.getItem('acct')) || '[]'
	return JSON.parse(value) as Account[]
}
