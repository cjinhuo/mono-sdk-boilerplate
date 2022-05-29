/**
 * Returns true if the object is a function.
 * @param value The value to check
 */
export function isFunction(value: any): value is (..._args: any[]) => any {
  return typeof value === 'function'
}
