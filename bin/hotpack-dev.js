#!/usr/bin/env node

import program from 'commander'

import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'

process.env.NODE_ENV = 'development'
process.env.test = 1
program
  .usage('[options]')
  .option('-c,--clean', 'ignore file version,rebuild all files')
  .option('-f,--folder [folder]', 'config folder')
  .option('-m,--mock [mock]', 'mock port')
  .option('-p,--port [port]', 'web server port')
  .option('-s --server', 'server without')
  .option('-r --render', 'render by server')
  .option('-w,--watch [watch]', 'web socket port')

  .parse(process.argv)

const specialConfig = {
  env: 'development',
  port: program.port || 3000,
  mockPort: program.mock,
  hotPort: program.watch
}

if (program.clean) {
  specialConfig.clean = true
}

if (program.folder) {
  specialConfig.folder = program.folder
}
if (program.render) {
  specialConfig.render = true
}

async function init() {
  let app = null
  let config = await new Config(specialConfig).getDev()
  
  app = await new Spack({ config})
  await app.build()

  if (!program.server) {
    server({
      app
    })
    app.emit('afterServer')
  }
}
init()
