import { create } from "zustand"

const useAppStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

export default useAppStore
