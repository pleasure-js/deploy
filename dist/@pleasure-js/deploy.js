/*!
 * @pleasure-js/deploy v1.0.0
 * (c) 2019-2020 Martin Rafael <tin@devtin.io>
 * MIT
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var utils = require('@pleasure-js/utils');
var fs = _interopDefault(require('fs'));
var mustache = _interopDefault(require('mustache'));
var path = _interopDefault(require('path'));
var inquirer = _interopDefault(require('inquirer'));

function createNginxProxy (dest, data = {}) {
  const { port, prefix } = utils.getConfig('api');
  const nginxTemplate = fs.readFileSync(path.join(__dirname, '../templates/nginx-config.conf')).toString();
  return fs.writeFileSync(dest, mustache.render(nginxTemplate, Object.assign({ port, prefix }, data)))
}

function createDocker ({localPort, appURL}) {
  /*
  ask for:
  - localPort
  - if .gitignore found, dockerignore equals .gitignore
   */
  const renderData = {
    localPort,
    appURL
  };
  const dockerApi = fs.readFileSync(path.join(__dirname, '../templates/Dockerfile-api')).toString();
  const dockerUI = fs.readFileSync(path.join(__dirname, '../templates/Dockerfile-ui')).toString();
  const dockerCompose = fs.readFileSync(path.join(__dirname, '../templates/docker-compose.yml')).toString();
  let dockerIgnore = fs.readFileSync(path.join(__dirname, '../templates/.dockerignore')).toString();

  const dockerfileApi = utils.findRoot('Dockerfile-api');
  const dockerfileUI = utils.findRoot('Dockerfile-ui');
  const dockerComposeFile = utils.findRoot('docker-compose.yml');
  const dockerignoreFile = utils.findRoot('.dockerignore');

  fs.writeFileSync(dockerfileApi, mustache.render(dockerApi, renderData));
  fs.writeFileSync(dockerfileUI, mustache.render(dockerUI, renderData));
  fs.writeFileSync(dockerComposeFile, mustache.render(dockerCompose, renderData));

  if (fs.existsSync(utils.findRoot('.gitignore'))) {
    dockerIgnore = fs.readFileSync(utils.findRoot('.gitignore'));
  }

  fs.writeFileSync(dockerignoreFile, dockerIgnore);
  const projectRoot = utils.findRoot();

  return [
    path.relative(projectRoot, dockerfileUI),
    path.relative(projectRoot, dockerfileApi),
    path.relative(projectRoot, dockerComposeFile),
    path.relative(projectRoot, dockerignoreFile)
  ]
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

  return Object.assign({}, args, answers)
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
              const { localPort, appURL } = await inquirer.prompt(
                [
                  {
                    name: 'appURL',
                    help: 'Application URL (config for @pleasure-js/api-client)',
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
              );
              createDocker({ localPort, appURL }).forEach(console.log.bind(console));
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

module.exports = index;
