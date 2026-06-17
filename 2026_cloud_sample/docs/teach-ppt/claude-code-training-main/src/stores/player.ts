import { reactive } from 'vue'

const STORAGE_KEY = 'slide-presenter.player'

const state = reactive({
  name: '',
})

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data?.name) state.name = data.name
    }
  } catch {}
}

function setName(name: string) {
  state.name = name.trim()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: state.name }))
}

function clear() {
  state.name = ''
  localStorage.removeItem(STORAGE_KEY)
}

// 初始載入
loadFromStorage()

export function usePlayerStore() {
  return {
    get name() { return state.name },
    set name(val: string) { state.name = val },
    setName,
    clear,
    loadFromStorage,
  }
}
