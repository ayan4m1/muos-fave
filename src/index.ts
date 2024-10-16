import { program } from 'commander';

import { getPackageInfo } from './utils.js';

try {
  const { name, version, description } = await getPackageInfo();

  await program
    .name(name)
    .version(version)
    .description(description)
    .action(() => {})
    .parseAsync();
} catch (error) {
  console.error(error);
  process.exit(1);
}
