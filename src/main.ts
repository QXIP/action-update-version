import path from 'path';
import fs from 'fs';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import glob from "glob";
import git from 'child_process';

const run = async () => {
    core.info('Setting input and environment variables');
    const root = process.env.GITHUB_WORKSPACE as string;
    const tag = (process.env.GITHUB_REF as string).replace('refs/tags/', '');
    const author = process.env.GITHUB_ACTOR as string;
    const email = `${ author }@users.noreply.github.com`;
    const version = git.execSync('git rev-parse HEAD').toString().trim()
    const regex = new RegExp(core.getInput('version-regexp'));
    const branch = core.getInput('branch');

    core.info('Setting up git');
    await exec.exec('git', ['config', '--global', 'user.name', author]);
    await exec.exec('git', ['config', '--global', 'user.email', email]);

    core.info('Last commit hash is ' + version);

    // Go through every 'fxmanifest.lua' file in the repository and update the version number if the
    // author is "Asaayu" and the version number matches the regular expression.

    // Using glob to find all files in the repository
    glob("**/fxmanifest.lua", { cwd: root }, async (err: any, files: any) => {
        if (err) { throw err; }

        // Loop through all files
        for (const file of files) {
            core.info(`Checking '${file}'`);

            // Read the file
            const filePath = path.join(root, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');

            // Check if the author is "Asaayu" using a regular expression
            const authorMatch = fileContent.match(/author\s*['"]\s*Asaayu\s*['"]/i);
            if (!authorMatch) {
                core.info('Author is not "Asaayu", skipping');
                continue;
            }

            // Check if the version number matches the regular expression
            const versionMatch = fileContent.match(regex);
            if (!versionMatch) {
                core.info('Version number does not match regular expression, skipping');
                continue;
            }

            // Update the version number
            const newVersion = tag.replace('v', '');
            const newFileContent = fileContent.replace(regex, newVersion);
            fs.writeFileSync(filePath, newFileContent);
        }
    });

    // Commit the changes
    core.info('Committing file changes');
    await exec.exec('git', ['config', '--global', 'user.name', author]);
    await exec.exec('git', ['config', '--global', 'user.email', email]);
    await exec.exec('git', ['commit', '-am', version]);
    await exec.exec('git', ['push', '-u', 'origin', `HEAD:${branch}`]);
};

run()
    .then(() => core.info('Updated fxmanifest.lua versions successfully'))
    .catch(error => core.setFailed(error.message));
