import type { PackageJson } from '@npmcli/package-json';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import packageJsonModule from '@npmcli/package-json';

const getInstallDirectory = (): string =>
  dirname(fileURLToPath(import.meta.url));

const getPackageJsonPath = (): string => resolve(getInstallDirectory(), '..');

export const getPackageInfo = async (): Promise<PackageJson> =>
  (await packageJsonModule.load(getPackageJsonPath()))?.content;
