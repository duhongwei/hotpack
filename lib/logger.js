import chalk from 'chalk'

export default class {
  constructor({ loggerPrefix, silent = false, env, isHot }) {
    this.prefix = loggerPrefix
    this.silent = silent
    this.env = env
    this.isHot = isHot
    this.oldSilt = null
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

    //热加载的时候，后面的错误会覆盖这条，所以需要把后面的不输出，方便看这条错误
    if (this.isHot) {
      this.silentNext()
      return
    }
    if (this.env == 'production') {
      process.exit(1)
    }
    if (mustExit) {
      process.exit(1)
    }
  }
  silentNext() {
    this.oldSilent = this.silent
    this.silent = true
  }
  restoreNext() {
    this.silent = this.oldSilent
    this.oldSilent = null
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