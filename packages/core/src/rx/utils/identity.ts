/**
 * This function takes one parameter and just returns it. Simply put,
 * this is like `<T>(x: T): T => x`
 *
 * @param x Any value that is returned by this function
 * @returns The value passed as the first parameter to this function
 */
export function identity<T>(x: T): T {
  return x
}
