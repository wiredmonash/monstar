import { exec } from 'child_process';
import fs from 'fs';
import { readFile as readFileAsync } from 'node:fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';

import { TEST_PORT } from './setup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = util.promisify(exec);

/**
 * Creates a shell and runs artillery
 */
const runArtillery = async (scriptName: string) => {
  const scriptPath = path.join(__dirname, scriptName + '.yml');
  const reportPath = path.join(__dirname, scriptName + '.report.json');
  const testServerUrl = `http://localhost:${TEST_PORT}`;

  if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath);

  console.log(`Running ${scriptName}`);

  try {
    await execAsync(
      `npx artillery run -t "${testServerUrl}" -o "${reportPath}" "${scriptPath}"`
    );
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    console.error(`❌ Artillery CRASHED for ${scriptName}`);
    console.error(e.stdout);
    console.error(e.stderr);
    throw err;
  }

  const report = await readFileAsync(reportPath, 'utf-8');
  return JSON.parse(report);
};

export { runArtillery };
