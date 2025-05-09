#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServerOnAvailablePortStartingAt, buildCompiler } from './server.js';
import path from 'path';

function pascalToKebab(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase();
}

yargs(hideBin(process.argv))
  .scriptName('webani')
  .command(
    'component [name] [directory]',
    'Generate a new WebaniComponent with the give name.',
    (yargs) => {
      return yargs.positional('name', {
        type: 'string',
        describe: 'Name of the component to generate',
        demandOption: true,
      });
    },
    (argv) => {
      const { name, directory } = argv;
      const fileName = `${pascalToKebab(name)}.component.ts`;
      const filePath = path.join(directory, fileName);
      
      const content = 
        `export class ${name}Component extends Component {
          objectConstructor() { 
            return new WebaniCollection();
          }
        }
        
        export const ${name} = ${name}Component.GetComponent();
        `;
      
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
          console.error(`Error writing file: ${err}`);
        } else {
          console.log(`Component ${fileName} created in ${directory}`);
        }
      });
    }
  )
  .command(
    'build [path]',
    'Build your animations and start a server which displays them using the Webani runtime.',
    (yargs) => {
      return yargs.positional('path', {
        type: 'string',
        describe: 'Path to your animations. If unspecified, Webani will look for an index.ts in the directory where the the command is being executed.',
        demandOption: false,
      });
    },
    (argv) => {
      buildCompiler(argv.path);
      startServerOnAvailablePortStartingAt(3000);
    }
  )
  .demandCommand(1, 'Please provide a command.')
  .help()
  .strict()
  .parse();