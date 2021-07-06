import chalk from 'chalk'

export default class {
  constructor({ loggerPrefix, silent = false, env, isHot }) {
    this.prefix = loggerPrefix
    this.silent = silent
    this.env = env
    this.isHot = isHot
  }
  log(msg) {
    if (this.silent) return
    console.log(chalk.blue(this.prefix + 'info'), msg)
  }
  error(msg, mustExit) {

    console.log()
    if (!this.silent) {
      console.error(chalk.red(this.prefix + 'error'), msg)
    }
    console.log()
    if (this.isHot) {

      return
    }
    if (this.env == 'production') {
      process.exit(1)
    }
    if (mustExit) {
      process.exit(1)
    }
  }

  silent(silent) {
    this.silent = silent
  }
  success(msg) {
    if (this.silent) {
      return
    }
    console.log()
    console.log(chalk.yellow(this.prefix + 'success'), msg)
    console.log()
  }
}