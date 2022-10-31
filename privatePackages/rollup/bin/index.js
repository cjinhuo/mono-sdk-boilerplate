const { spawn } = require('child_process')
const fg = require('fast-glob')
const { join } = require('path')

const argv = process.argv.slice(2).pop()
const pwd = process.env.PWD
const rollupRunRoot = join(pwd, argv)
console.log('pwd', rollupRunRoot)
const rollupEntries = fg.sync(`${rollupRunRoot}/*rollup.js`, { onlyFiles: true })
console.log('rollupEntries', rollupEntries)

// 用 cpu 核数 来控制进程
rollupEntries.forEach((item) => {
  spawn(`rollup`, ['-c', item])
})
