import { getConfig } from 'pleasure-utils'
import fs from 'fs'
import mustache from 'mustache'
import path from 'path'

export function createNginxProxy (dest, data = {}) {
  const { port, prefix } = getConfig('api')
  const nginxTemplate = fs.readFileSync(path.join(__dirname, '../templates/nginx-config.conf')).toString()
  return fs.writeFileSync(dest, mustache.render(nginxTemplate, Object.assign({ port, prefix }, data)))
}
