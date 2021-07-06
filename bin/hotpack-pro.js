#!/usr/bin/env node

import program from 'commander'
import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'

//打包，生产环境
process.env.NODE_ENV = 'production'
global.__VUE_OPTIONS_API__ = true
global.__VUE_PROD_DEVTOOLS__ = false
//数据接口，发布的时候默认使用生产接口，发布的时候也可以使用测试接口 test 可选值有 development,test,production
process.env.DATA_ENV = 'production'
program
  .usage('[options]')
  .option('-c,--clean', 'ignore file version,rebuild all files')
  .option('-p,--port [port]', 'web server port')
  .option('-s --server', 'server without')
  .option('-f,--folder [folder]', 'config folder')
  .option('-t,--test', 'test or not')
  .option('-d,--dist [dist]', 'destination directory')
  .option('-r --render', 'render by server')
  .parse(process.argv)

const options = program.opts();

const specialConfig = {
  env: 'production',
  port: options.port || 3000,
  isHot: false
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
if (options.dist) {
  specialConfig.dist = options.dist
}
if (options.render) {
  specialConfig.renderEnabled = true
  
}

async function init() {
  let app = null
  let config = await new Config(specialConfig).getPro()

  app = await new Spack({ config })
  await app.build()

  if (options.server) {
    server({
      app
    })
  }
}

init()

