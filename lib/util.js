import crypto from 'crypto'
import { sep } from 'path'
function md5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}
function path2key(path) {
  let p = path.split(/[?#]/)[0]
  p = p.split(/\/|\\/).join('/')
  if (p[0] === '/') {
    p = p.substr(1)
  }
  return p
}
function isImage(path) {
  return /^(gif|jpg|png|jpeg|svg)$/.test(path)
}
function isText(path) {
  return /^(js|css|html|htm|tpl|vue|jsx|wxss|wxml|json|wxs|less|ts)$/.test(path)
}
function isHtml(path) {
  return /\.html$/.test(path)
}
function isWeb(path) {
  let reg = new RegExp(`${sep}web${sep}`)
  return reg.test(path)
}
function isServer(path) {
  let reg = new RegExp(`${sep}serer${sep}`)
  return reg.test(path)
}
function format(tpl, data) {
  return tpl.replace(/{{([^}]+)}}/g, function (match, key) {
    return data[key]
  });
}
function isJs(path) {
  return /\.js$/.test(path)
}
export {
  isJs,
  format,
  isHtml,
  isWeb,
  isServer,
  isImage,
  isText,
  md5,
  path2key
}
export default {
  isJs,
  format,
  isHtml,
  isWeb,
  isServer,
  isImage,
  isText,
  md5,
  path2key
}