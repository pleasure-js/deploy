import { createNginxProxy } from './lib/create-nginx-proxy.js'
import { createDocker } from './lib/create-docker.js'
import inquirer from 'inquirer'

function parseArgs (args) {
  const parsed = {}
  let getNextV = false

  for (let i = 0; i < args.length; i++) {
    let val = args[i]
    if (getNextV && !/^--/.test(val)) {
      parsed[getNextV] = val
      getNextV = false
      continue
    } else if (/^--/.test(val)) {
      val = val.replace(/^[\-]+/, '')
      if (val.indexOf('=') > 0) {
        parsed[val.split('=', 2)[0]] = val.split('=', 2)[1]
        continue
      }
      getNextV = val
    }
    parsed[val] = true
  }
  parsed.$get = function (arg) {
    return arg in parsed ? parsed[arg] : false
  }
  return parsed
}

async function requestIfNotProvided (prompts, rawArgs) {
  const args = parseArgs(rawArgs)
  let answers = {}
  prompts = prompts.map(prompt => {
    if (args.$get(prompt.name)) {
      return
    }
    return prompt
  }).filter(Boolean)

  if (prompts.length > 0) {
    answers = await inquirer.prompt(prompts)
  }

  return Object.assign({}, args, answers)
}

export default function ({ printCommandsIndex, subcommand }) {
  return {
    name: 'deploy',
    help: 'orchestrates configuration for deployment',
    command ({ _: args }) {
      const DeployMain = {
        root: {
          command () {
            printCommandsIndex(DeployMain.commands)
          }
        },
        commands: [
          {
            name: 'nginx',
            help: 'creates an nginx config file',
            async command ({ _: args }) {
              // check for pleasure project
              // check configuration
              // ask for ip
              // ask for ports
              // ask for packages (actually, prompt a file where to set all of this up)

              const { nginxDestination, apiHost } = await requestIfNotProvided(
                [
                  {
                    name: 'nginxDestination',
                    help: 'The nginx config destination',
                    default: 'nginx.conf',
                    validate (s) {
                      return !s ? `Enter nginx.conf destination` : true
                    }
                  },
                  {
                    name: 'apiHost',
                    help: 'The API address',
                    default: 'api',
                    validate (s) {
                      return !s ? `Enter the address of the api` : true
                    }
                  }
                ],
                process.argv
              )
              createNginxProxy(nginxDestination, { apiHost })
              process.exit(0)
            }
          },
          {
            name: 'docker',
            help: 'creates a docker cloud file',
            async command () {
              // check for pleasure project
              // check configuration
              // ask for ip
              // ask for ports
              // ask for packages (actually, prompt a file where to set all of this up)
              const { localPort } = await inquirer.prompt(
                [
                  {
                    name: 'appURL',
                    help: 'Application URL (config for pleasure-api-client)',
                    default: 'http://localhost:8080',
                    validate (s) {
                      return !s ? `Enter local port binding` : true
                    }
                  },
                  {
                    name: 'localPort',
                    help: 'Port where you want the application running in the host machine.',
                    default: '8080',
                    validate (s) {
                      return !s ? `Enter local port binding` : true
                    }
                  }
                ]
              )
              createDocker(localPort).forEach(console.log.bind(console))
              process.exit(0)
            }
          }
        ]
      }
      const match = subcommand(DeployMain)
      match(args)
    }
  }
}
