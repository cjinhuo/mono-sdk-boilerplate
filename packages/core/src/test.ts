const TestTypes = {
  one = 'one',
  two = 'two'
}
const testValue = {
  one: {
    data: 1
  },
  two: {
    data: {
      test: 1
    }
  }
}

type enumkeys = keyof TestTypes
type TestValueType = typeof testValue
type aa = keyof TestValueType
const get = (eventSets: TestValueType) => {
  const fn = <T extends enumkeys>(event: T) => eventSets[event] as TestValueType[T]
  console.log(fn)
  return fn
}

const a = {
  one: 'one',
  two: 'two'
}

const aValue = {
  one: {
    data: 1
  },
  two: {
    data: {
      test: 1
    }
  }
}
const getType = <E extends Record<string, any>, R extends Record<keyof E, any>>(eventSets: R) => {
  type keys = keyof E
  const fn = <T extends keys>(event: T) => eventSets[event] as R[T]
  console.log(fn)
  return fn
}

const get2 = getType<typeof a, typeof aValue>(aValue)
get2('two').data.test

const a = {
  one: 'one',
  two: 'two'
}
enum aaaa {
  one = 'one',
  two = 'two'
}

const aValue = {
  one: {
    data: 1
  },
  two: {
    data: {
      test: 1
    }
  }
}
const get3Type = <E extends Record<string, string>, R extends Record<keyof E, any>>(
  eventSets: R
) => {
  type keys = keyof E
  const fn = <T extends keys>(event: T) => eventSets[event] as R[T]
  console.log(fn)
  return fn
}

const get3 = get3Type<typeof aaaa, typeof aValue>(aValue)
get2('two').data.test
