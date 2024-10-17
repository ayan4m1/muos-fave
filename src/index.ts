import chalk from 'chalk';
import { existsSync } from 'fs';
import { globby } from 'globby';
import { program } from 'commander';
import { confirm, search } from '@inquirer/prompts';
import { join, basename, dirname, relative } from 'path/posix';

import { getPackageInfo } from './utils.js';
import { writeFile } from 'fs/promises';

try {
  const { name, version, description } = await getPackageInfo();

  await program
    .name(name)
    .version(version)
    .description(description)
    .action(async () => {
      const workingDir = process.cwd();
      const romDir = join(workingDir, 'roms');
      const favoriteDir = join(workingDir, 'MUOS', 'info', 'favourite');
      const romGlobber = globby(
        relative(process.cwd(), join(romDir, '**', '*.7z'))
      );
      const favoritesToAdd: string[] = [];

      if (!existsSync(romDir) || !existsSync(favoriteDir)) {
        console.log(
          `${chalk.red('ERROR:')} ${romDir} or ${favoriteDir} does not exist!`
        );
        console.log('Are you sure this is a muOS SD card?');
        return;
      }

      while (
        await confirm({
          message: 'Add another favorite?',
          default: true
        })
      ) {
        const selectedRom = await search<string>({
          message: 'Select a ROM or press Enter to finish',
          source: async (input) => {
            if (!input) {
              return [];
            }

            const results = [];

            for (const romPath of await romGlobber) {
              const console = basename(dirname(romPath));
              const filename = basename(romPath, '.7z');

              if (!filename.toLowerCase().includes(input.toLowerCase())) {
                continue;
              }

              results.push({
                name: filename,
                value: romPath,
                description: console
              });
            }

            return results;
          }
        });

        favoritesToAdd.push(selectedRom);
      }

      if (!favoritesToAdd.length) {
        console.log(`${chalk.yellow('WARN:')} No favorites to add!`);
        return;
      }

      for (const romPath of favoritesToAdd) {
        const favoritePath = join(
          favoriteDir,
          `${basename(romPath, '.7z')}.cfg`
        );

        await writeFile(
          favoritePath,
          romPath.replace('roms/', '/mnt/mmc/roms/'),
          'utf-8'
        );
      }
    })
    .parseAsync();
} catch (error) {
  console.error(error);
  process.exit(1);
}
