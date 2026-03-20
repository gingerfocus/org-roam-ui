import { useState, useCallback } from 'react'

interface UseUndoState<T> {
  past: T[]
  present: T
  future: T[]
}

interface UseUndoActions<T> {
  past: T[]
  present: T
  future: T[]
  set: (newPresent: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  reset: (newPresent: T) => void
}

type UseUndoReturn<T> = [T, UseUndoActions<T>]

export function useUndo<T>(initialPresent: T): UseUndoReturn<T> {
  const [state, setState] = useState<UseUndoState<T>>({
    past: [],
    present: initialPresent,
    future: [],
  })

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  const set = useCallback((newPresent: T) => {
    setState((currentState) => ({
      past: [...currentState.past, currentState.present],
      present: newPresent,
      future: [],
    }))
  }, [])

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) return currentState

      const previous = currentState.past[currentState.past.length - 1]
      const newPast = currentState.past.slice(0, -1)

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) return currentState

      const next = currentState.future[0]
      const newFuture = currentState.future.slice(1)

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((newPresent: T) => {
    setState({
      past: [],
      present: newPresent,
      future: [],
    })
  }, [])

  return [
    state.present,
    {
      past: state.past,
      present: state.present,
      future: state.future,
      set,
      undo,
      redo,
      canUndo,
      canRedo,
      reset,
    },
  ]
}
