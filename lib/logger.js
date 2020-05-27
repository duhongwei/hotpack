import chalk from 'chalk'

export default class {
  constructor({ silent = false, env, isHot }) {
    this.prefix = ' spack.'
    this.silent = silent
    this.env = env
    this.isHot = isHot
    this.oldSilt = null
  }
  log(msg) {
    if (this.silent) return
    console.log(chalk.blue(this.prefix + 'info'), msg)
  }
  error(msg, mustExist) {
    if (this.silent) return
    console.log()
    console.error(chalk.red(this.prefix + 'error'), msg)
    console.log()
    this.silentNext()
    if (this.env === 'production' || mustExist) {
      process.exit(1)
    }
    if (this.env == 'development' && !this.isHot) {
      process.exit(1)
    }
  }
  silentNext() {
    this.oldSilent = this.silent
    this.silent = false
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