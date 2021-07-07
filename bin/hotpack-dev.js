#!/usr/bin/env node
import program from 'commander'
import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'
//开发环境
process.env.NODE_ENV = 'development'
//数据接口，开发的时候默认使用开发接口，开发的时候也可以使用测试接口 test 可选值有 development,test,production
process.env.DATA_ENV = 'development'
program
  .usage('[options]')
  .option('-c,--clean', 'ignore file version,rebuild all files')
  .option('-f,--folder [folder]', 'config folder')
  .option('-p,--port [port]', 'web server port')
  .option('-s --server', 'server without')
  .option('-r --render', 'render by server')
  .option('-t,--test', 'test or not')
  .option('-w,--watch [watch]', 'web socket port')

  .parse(process.argv)

const options = program.opts();

const specialConfig = {
  env: 'development',
  port: options.port || 3000,
  mockPort: options.mock,
  hotPort: options.watch
}
if (options.test) {
  process.env.DATA_ENV = 'test'
}

if (options.clean) {
  specialConfig.clean = true
}

if (options.folder) {
  specialConfig.folder = options.folder
}
if (options.render) {
  specialConfig.render = { enable: true }
}

async function init() {
  let app = null
  let config = await new Config(specialConfig).getDev()

  app = await new Spack({ config })
  await app.build()

  if (!options.server) {
    server({
      app
    })
    app.emit('afterServer')
  }
}
init()
