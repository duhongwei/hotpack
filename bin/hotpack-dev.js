#!/usr/bin/env node

import program from 'commander'

import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'
//开发环境
process.env.NODE_ENV = 'development'
//是否使用测试接口，开发的时候默认使用开发接口，开发的时候也可以使用测试接口
process.env.test = 0
program
  .usage('[options]')
  .option('-c,--clean', 'ignore file version,rebuild all files')
  .option('-f,--folder [folder]', 'config folder')
  //.option('-m,--mock [mock]', 'mock port')
  .option('-p,--port [port]', 'web server port')
  .option('-s --server', 'server without')
  .option('-r --render', 'render by server')
  .option('-t,--test', 'test or not')
  .option('-w,--watch [watch]', 'web socket port')

  .parse(process.argv)

const specialConfig = {
  env: 'development',
  port: program.port || 3000,
  mockPort: program.mock,
  hotPort: program.watch
}
if (program.test) {
  process.env.test = 1
}

if (program.clean) {
  specialConfig.clean = true
}

if (program.folder) {
  specialConfig.folder = program.folder
}
if (program.render) {
  specialConfig.renderEnabled = true
}

async function init() {
  let app = null
  let config = await new Config(specialConfig).getDev()

  app = await new Spack({ config })
  await app.build()

  if (!program.server) {
    server({
      app
    })
    //app.emit('afterServer')
  }
}
init()
