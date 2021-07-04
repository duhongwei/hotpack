#!/usr/bin/env node

import program from 'commander'

import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'

//打包，生产环境
process.env.NODE_ENV = 'production'
global.__VUE_OPTIONS_API__ = true
global.__VUE_PROD_DEVTOOLS__ = false
process.env.DATA_ENV = 'production'
program
  .usage('[options]')
  .option('-c,--clean', 'ignore file version,rebuild all files')
  .option('-p,--port [port]', 'web server port')
  .option('-s --server', 'server without')
  .option('-f,--folder [folder]', 'config folder')
  .option('-t,--test', 'test or not')
  .option('-d,--dist [dist]', 'destination directory')
  .option('-r --render [dist]', 'render by server')
  .parse(process.argv)

const specialConfig = {
  env: 'production',
  port: program.port || 3000,
  isHot: false
}

if (program.test) {
  process.env.DATA_ENV = 'test'
}
if (program.clean) {
  specialConfig.clean = true
}
if (program.folder) {
  specialConfig.folder = program.folder
}
if (program.dist) {
  specialConfig.dist = program.dist
}
if (program.render) {
  specialConfig.renderEnabled = true
  /**
   * 发布到服务器或docker的时候，绝对路径是不一样的，需要替换预计编译时的绝对路径
   * 所以只有发布的时候才会这样写  形如 hotpack -r /app/_render_
   */
  if (typeof program.render == 'string') {
    specialConfig.render = {
      publishPath: program.render
    }
  }
}

async function init() {
  let app = null
  let config = await new Config(specialConfig).getPro()

  app = await new Spack({ config })
  await app.build()

  if (program.server) {
    server({
      app
    })
  }
}

init()

