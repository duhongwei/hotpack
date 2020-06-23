#!/usr/bin/env node

import program from 'commander'

import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'

process.env.NODE_ENV = 'production'

program
  .usage('[options]')
  .option('-c,--clean', 'ignore file version,rebuild all files')
  .option('-p,--port [port]', 'web server port')
  .option('-s --server', 'server without')
  .option('-f,--folder [folder]', 'config folder')
  .parse(process.argv)

const specialConfig = {
  env: 'production',
  port: program.port || 3000,
  isHot:false
}

if (program.clean) {
  specialConfig.clean = true
}
if (program.folder) {
  specialConfig.folder = program.folder
}
async function init() {
  const c = new Config(specialConfig)
  const config = await c.getPro()

  const app = await new Spack({ config })

  await app.build()

  if (program.server) {
    server({
      app
    })
  }
}
init()
