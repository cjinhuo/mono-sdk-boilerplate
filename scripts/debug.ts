import dbg from 'debug'

import { PACKAGE_NAME } from './constant'

export const debugFactory = (namespace: string) => dbg(`${PACKAGE_NAME}:cli:${namespace}`)
