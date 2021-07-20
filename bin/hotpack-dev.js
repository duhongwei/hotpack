#!/usr/bin/env node
import program from 'commander'
import server from '../lib/server.js'
import Config from '../lib/Config.js'
import Spack from '../lib/Spack.js'
import fs from 'fs'
import { fileURLToPath } from 'url';
import {join} from 'path'
const __filename = fileURLToPath(import.meta.url);

let info = fs.readFileSync(join(__filename, '../../', 'package.json'), 'utf-8')
info=JSON.parse(info)

//node enviroment.  development or production
process.env.NODE_ENV = 'development'
//data enviroment.  development,test or production
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
  .option('-v,--version','version of hotpack')
  .version(info.version)
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
