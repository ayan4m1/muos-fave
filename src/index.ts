import chalk from 'chalk';
import { globby } from 'globby';
import { program } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, PathLike } from 'fs';
import { confirm, search } from '@inquirer/prompts';
import { join, basename, dirname, relative } from 'path/posix';

import { getPackageInfo } from './utils.js';

type RomDetails = {
  name: string;
  console: string;
  path: PathLike;
};

try {
  const { name, version, description } = await getPackageInfo();

  await program
    .name(name)
    .version(version)
    .description(description)
    .action(async () => {
      const workingDir = process.cwd();
      const romDir = join(workingDir, 'roms');
      const infoDir = join(workingDir, 'MUOS', 'info');
      const coreDir = (platform: string): string =>
        join(infoDir, 'core', platform);
      const favoriteDir = join(infoDir, 'favourite');
      const romGlobber = globby(
        relative(process.cwd(), join(romDir, '**', '*.7z'))
      );
      const favoritesToAdd: RomDetails[] = [];

      if (!existsSync(romDir) || !existsSync(favoriteDir)) {
        console.log(
          `${chalk.red('ERROR:')} ${romDir} or ${favoriteDir} does not exist!`
        );
        console.log('Are you sure this is a muOS SD card?');
        return;
      }

      let keepGoing = true;

      while (keepGoing) {
        const selectedRom = await search<RomDetails>({
          message: 'Enter a game name to search for',
          source: async (input) => {
            if (!input) {
              return [];
            }

            const results = [];

            for (const romPath of (await romGlobber).filter((val) =>
              val.toLowerCase().includes(input.toLowerCase())
            )) {
              const console = basename(dirname(romPath));
              const name = basename(romPath, '.7z');

              results.push({
                name,
                value: {
                  console,
                  name,
                  path: romPath
                },
                description: console
              });
            }

            return results;
          }
        });

        favoritesToAdd.push(selectedRom);

        keepGoing = await confirm({
          message: 'Add another favorite?',
          default: true
        });
      }

      if (!favoritesToAdd.length) {
        console.log(`${chalk.yellow('WARN:')} No favorites to add!`);
        return;
      }

      for (const { console, name } of favoritesToAdd) {
        const filename = `${name}.cfg`;
        const configPath = join(coreDir(console), filename);
        const favoritePath = join(favoriteDir, filename);
        const coreConfigPath = join(coreDir(console), 'core.cfg');
        const coreConfig = await readFile(coreConfigPath, 'utf-8');

        await writeFile(
          configPath,
          `${name}
${coreConfig.trim()}
/mnt/sdcard/ROMS/
${console}
${name}.7z
`,
          'utf-8'
        );
        await writeFile(
          favoritePath,
          `/run/muos/storage/info/core/${console}/${name}.cfg`,
          'utf-8'
        );
      }

      console.log(
        `Successfully created ${chalk.green(favoritesToAdd.length)} favorite entries!`
      );
    })
    .parseAsync();
} catch (error) {
  console.error(error);
  process.exit(1);
}
