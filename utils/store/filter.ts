import type { Entity } from '@cutls/megalodon'
import { create } from 'zustand'

type Store = {
	filters: { [acctId: string]: Entity.Filter[] }
	getFilters: (acctId: string, context: string) => Entity.Filter[]
	setFilters: (acctId: string, filters: Entity.Filter[]) => void
}
export const useFilterStore = create<Store>((set, get) => ({
	filters: {},
	getFilters: (acctId: string, context: string) => {
		return get().filters[acctId]?.filter((f) => f.context.includes(context)) || []
	},
	setFilters: (acctId: string, filters: Entity.Filter[]) => {
		set((state) => ({
			filters: {
				...state.filters,
				[acctId]: filters
			}
		}))
	}
}))
