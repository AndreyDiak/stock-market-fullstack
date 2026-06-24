import { create } from 'zustand'
import { http } from '../lib/http'
import type { User } from '../api/types'

interface UsersState {
  user: User | null
  loading: boolean
  loadProfile: () => Promise<void>
  clearProfile: () => void
}

export const useUsersStore = create<UsersState>((set) => ({
  user: null,
  loading: false,

  loadProfile: async () => {
    set({ loading: true })
    try {
      const user = await http.get('users/me').json<User>()
      set({ user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  clearProfile: () => set({ user: null }),
}))
