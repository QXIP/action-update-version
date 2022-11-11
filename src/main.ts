import path from 'path';
import fs from 'fs';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import glob from 'glob';
import git from 'child_process';

const run = async () => {
    core.info('🖨️ Setting input and environment variables');
    const root = process.env.GITHUB_WORKSPACE as string;
    const author = process.env.GITHUB_ACTOR as string;
    const email = `${ author }@users.noreply.github.com`;
    const hash = git.execSync('git rev-parse HEAD').toString().trim()
    const regex = new RegExp(/\bversion\s*['"]\s*.*\s*['"]/i);
    const branch = core.getInput('branch');

    // Output the last commit hash
    core.info(`📝 Last commit hash is '${hash}'`);

    // Auto create a new tag incrementing the last number
    let tag = git.execSync('git describe --tags --abbrev=0').toString().trim();
    const tagParts = tag.split('.');
    const lastPart = tagParts.pop();
    if (lastPart) {
        const newTag = tagParts.join('.') + '.' + (parseInt(lastPart) + 1);
        core.info(`🔖 Creating new tag ${ newTag }`);
        git.execSync(`git tag ${ newTag }`);
        git.execSync(`git push origin ${ newTag }`);

        // Delete the old tag
        core.info(`🔖 Deleting old tag ${ tag }`);
        git.execSync(`git tag -d ${ tag }`);
        git.execSync(`git push origin :refs/tags/${ tag }`);

        tag = newTag;
    }

    // Go through every 'fxmanifest.lua' file in the repository and update the version number if the
    // author is "Asaayu" and the version number matches the regular expression.
    glob("**/fxmanifest.lua", { cwd: root }, async (err: any, files: any) => {
        if (err) { throw err; }

        // Loop through all files
        for (const file of files) {
            core.info(`⌛ Checking file '${file}'`);

            // Read the file
            const filePath = path.join(root, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');

            // Check if the author is "Asaayu" using a regular expression
            const authorMatch = fileContent.match(/author\s*['"]\s*Asaayu\s*['"]/i);
            if (!authorMatch) {
                core.info('❌ Author is not "Asaayu", skipping');
                continue;
            }

            // Check if the version number matches the regular expression
            const versionMatch = fileContent.match(regex);
            if (!versionMatch) {
                core.info('❌ Version number does not match regular expression, skipping');
                continue;
            }

            // Update the version number
            const newFileContent = fileContent.replace(regex, `version '${tag}@${hash}'`);
            fs.writeFileSync(filePath, newFileContent);
            core.info('😀 Updating version number');
        }
    });

    // Wait for the files to be updated
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Commit the changes
    core.info('✔️ Committing file changes');
    await exec.exec('git', ['config', '--global', 'user.name', author]);
    await exec.exec('git', ['config', '--global', 'user.email', email]);
    await exec.exec('git', ['commit', '-am', `Updated fxmanifest.lua versions to '${tag}@${hash}'`]);
    await exec.exec('git', ['push', '-u', 'origin', `HEAD:${branch}`]);
};

run()
    .then(() => core.info('✅ Updated fxmanifest.lua versions successfully'))
    .catch(error => core.setFailed(error.message));
