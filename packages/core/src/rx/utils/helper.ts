/**
 * Returns true if the object is a function.
 * @param value The value to check
 */
export function isFunction(value: any): value is (..._args: any[]) => any {
  return typeof value === 'function'
}

export const nextTick = (cb: () => void) =>
  setTimeout(() => {
    cb()
  })

/**
 * Removes an item from an array, mutating it.
 * @param arr The array to remove the item from
 * @param item The item to remove
 */
export function arrRemove<T>(arr: T[] | undefined | null, item: T) {
  if (arr) {
    const index = arr.indexOf(item)
    0 <= index && arr.splice(index, 1)
  }
}
