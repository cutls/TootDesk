import { useEffect, useState } from 'react'
import { Keyboard, KeyboardEvent } from 'react-native'

export const useKeyboard = (): [number] => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  function onKeyboardDidShow(e: KeyboardEvent): void {
    setKeyboardHeight(e.endCoordinates.height)
  }

  function onKeyboardDidHide(): void {
    setKeyboardHeight(0)
  }

  useEffect(() => {
    const e1 = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow)
    const e2 = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide)
    return (): void => {
      e1.remove()
      e2.remove()
    }
  }, [])

  return [keyboardHeight]
}