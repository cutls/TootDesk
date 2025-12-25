import { create } from 'zustand'

type Store = {
    preventRefresh: Record<string, boolean>
    setPreventRefresh: (id: string, value: boolean) => void
}
export const usePreventFirstRefreshStore = create<Store>((set) => ({
    preventRefresh: {},
    setPreventRefresh: (id, value) => set((state) => ({ preventRefresh: { ...state.preventRefresh, [id]: value } }))
}))
