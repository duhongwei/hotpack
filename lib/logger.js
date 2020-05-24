import chalk from 'chalk'

export default class {
  constructor({ silent = false } = {}) {
    this.prefix = ' spack.'
    this.silent = silent
  }
  log(msg) {
    if (this.silent) return
    console.log(chalk.blue(this.prefix + 'info'), msg)
  }
  error(msg) {
    if (this.silent) return
    console.log()
    console.error(chalk.red(this.prefix + 'error'), msg)
    console.log()
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