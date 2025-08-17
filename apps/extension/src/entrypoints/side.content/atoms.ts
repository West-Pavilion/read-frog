import type { Browser } from '#imports'
import { atom, createStore } from 'jotai'

export const store = createStore()

export const isDraggingButtonAtom = atom(false)

// Translation port atom for browser.runtime.connect
export const translationPortAtom = atom<Browser.runtime.Port | null>(null)
export const enablePageTranslationAtom = atom(false)
