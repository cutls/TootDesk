import { defaultSetting, type Settings } from '@/entities/settings'
import { create } from 'zustand'

type Store = {
	config: Settings
	setConfig: (config: Settings) => void
}
export const useConfigStore = create<Store>((set) => ({
	config: defaultSetting,
	setConfig: (config) => set(() => ({ config }))
}))
