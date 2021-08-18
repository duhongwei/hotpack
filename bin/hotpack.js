#!/usr/bin/env node
import commander from 'commander'
import fs from 'fs'
import { fileURLToPath } from 'url';
import { join } from 'path'
const __filename = fileURLToPath(import.meta.url);

let info = fs.readFileSync(join(__filename, '../../', 'package.json'), 'utf-8')
info = JSON.parse(info)

commander
  .usage('<command> [options]')
  .command('pro', 'production build')
  .command('dev', 'dev build', { isDefault: true })
  .option('-v,--version', 'version of hotpack')
  .version(info.version)
  .parse(process.argv)
