/*!
 * pleasure-deploy v1.0.0
 * (c) 2019-2019 Martin Rafael <tin@devtin.io>
 * MIT
 */
import { getConfig } from 'pleasure-utils';
import fs from 'fs';
import mustache from 'mustache';
import path from 'path';
import inquirer from 'inquirer';

function createNginxProxy (dest, data = {}) {
  const { port, prefix } = getConfig('api');
  const nginxTemplate = fs.readFileSync(path.join(__dirname, '../templates/nginx-config.conf')).toString();
  return fs.writeFileSync(dest, mustache.render(nginxTemplate, Object.assign({ port, prefix }, data)))
}

function parseArgs (args) {
  const parsed = {};
  let getNextV = false;

  for (let i = 0; i < args.length; i++) {
    let val = args[i];
    if (getNextV && !/^--/.test(val)) {
      parsed[getNextV] = val;
      getNextV = false;
      continue
    } else if (/^--/.test(val)) {
      val = val.replace(/^[\-]+/, '');
      if (val.indexOf('=') > 0) {
        parsed[val.split('=', 2)[0]] = val.split('=', 2)[1];
        continue
      }
      getNextV = val;
    }
    parsed[val] = true;
  }
  parsed.$get = function (arg) {
    return arg in parsed ? parsed[arg] : false
  };
  return parsed
}

async function requestIfNotProvided (prompts, rawArgs) {
  const args = parseArgs(rawArgs);
  let answers = {};
  prompts = prompts.map(prompt => {
    if (args.$get(prompt.name)) {
      return
    }
    return prompt
  }).filter(Boolean);

  if (prompts.length > 0) {
    answers = await inquirer.prompt(prompts);
  }

  const final = Object.assign({}, args, answers);
  console.log({ final });
  return final
}

function index ({ printCommandsIndex, subcommand }) {
  return {
    name: 'deploy',
    help: 'orchestrates configuration for deployment',
    command ({ _: args }) {
      const DeployMain = {
        root: {
          command () {
            printCommandsIndex(DeployMain.commands);
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
              );
              createNginxProxy(nginxDestination, { apiHost });
              process.exit(0);
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
              const { nginxDestination, apiHost } = await inquirer.prompt(
                [
                  {
                    name: 'nginxDestination',
                    default: 'nginx.conf',
                    validate (s) {
                      return !s ? `Enter nginx.conf destination` : true
                    }
                  },
                  {
                    name: 'apiHost',
                    default: 'api',
                    validate (s) {
                      return !s ? `Enter the address of the api` : true
                    }
                  }
                ]
              );
              createNginxProxy(nginxDestination, { apiHost });
              process.exit(0);
            }
          }
        ]
      };
      const match = subcommand(DeployMain);
      match(args);
    }
  }
}

export default index;
