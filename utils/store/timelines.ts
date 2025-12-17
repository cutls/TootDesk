import type { Timeline } from '@/entities/timeline'
import { create } from 'zustand'

type Store = {
	timelines: Timeline[]
	setTimelines: (timelines: Timeline[]) => void
}
export const useTimelineStore = create<Store>((set) => ({
	timelines: [],
	setTimelines: (timelines) => set(() => ({ timelines }))
}))
