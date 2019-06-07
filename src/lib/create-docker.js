import { getConfig, findRoot } from 'pleasure-utils'
import fs from 'fs'
import mustache from 'mustache'
import path from 'path'

export function createDocker (localPort) {
  /*
  ask for:
  - localPort
  - if .gitignore found, dockerignore equals .gitignore
   */
  const renderData = {
    localPort
  }
  const dockerApi = fs.readFileSync(path.join(__dirname, '../templates/Dockerfile-api')).toString()
  const dockerUI = fs.readFileSync(path.join(__dirname, '../templates/Dockerfile-ui')).toString()
  const dockerCompose = fs.readFileSync(path.join(__dirname, '../templates/docker-compose.yml')).toString()
  let dockerIgnore = fs.readFileSync(path.join(__dirname, '../templates/.dockerignore')).toString()

  const dockerfileApi = findRoot('Dockerfile-api')
  const dockerfileUI = findRoot('Dockerfile-ui')
  const dockerComposeFile = findRoot('docker-compose.yml')
  const dockerignoreFile = findRoot('.dockerignore')

  fs.writeFileSync(dockerfileApi, mustache.render(dockerApi, renderData))
  fs.writeFileSync(dockerfileUI, mustache.render(dockerUI, renderData))
  fs.writeFileSync(dockerComposeFile, mustache.render(dockerCompose, renderData))

  if (fs.existsSync(findRoot('.gitignore'))) {
    dockerIgnore = fs.readFileSync(findRoot('.gitignore'))
  }

  fs.writeFileSync(dockerignoreFile, dockerIgnore)
  const projectRoot = findRoot()

  return [
    path.relative(projectRoot, dockerfileUI),
    path.relative(projectRoot, dockerfileApi),
    path.relative(projectRoot, dockerComposeFile),
    path.relative(projectRoot, dockerignoreFile)
  ]
}
