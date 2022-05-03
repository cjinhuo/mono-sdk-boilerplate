import { Command, Option, Cli } from 'clipanion'

import { debugFactory } from './debug'

const [_node, _app, ...args] = process.argv

const log = debugFactory('bundle')
class HelloCommand extends Command {
  // Positional option
  name = Option.String(`-p,--package`)

  async execute() {
    log('Hello, world!')
    setTimeout(() => {
      log('Hello, world!')
    }, 1000)
    this.context.stdout.write(`Hello ${this.name}!\n`)
  }
}

const cli = new Cli({
  binaryLabel: 'cjh',
  enableColors: true
})

cli.register(HelloCommand)

cli.runExit(args)
