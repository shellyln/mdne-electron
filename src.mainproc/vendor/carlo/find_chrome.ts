/**
 * Original code:
 * https://github.com/GoogleChromeLabs/carlo/blob/master/lib/find_chrome.js
 */

/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Copyright (c) 2020 Shellyl_N and Authors
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable no-console */
// tslint:disable: no-console

'use strict';

import * as fs                 from 'fs';
import * as path               from 'path';
import { homedir }             from 'os';
import { execSync,
         execFileSync }        from 'child_process';
import * as puppeteer          from 'puppeteer-core';
import { PUPPETEER_REVISIONS } from 'puppeteer-core/lib/esm/puppeteer/revisions';



// https://github.com/GoogleChromeLabs/carlo/blob/master/API.md#carlolaunchoptions
export interface CarloLaunchOptions {
    width?: number;
    height?: number;
    top?: number;
    left?: number;
    bgcolor?: string;
    channel?: string[];
    icon?: Buffer | string;
    paramsForReuse?: any;
    title?: string;
    userDataDir?: string;
    executablePath?: string;
    args?: string[];
    localDataDir?: string;
}


interface Priority {
    regex: RegExp;
    weight: number;
}


const newLineRegex = /\r?\n/;


function darwin(canary?: boolean): string | undefined {
    const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
        '/Versions/A/Frameworks/LaunchServices.framework' +
        '/Versions/A/Support/lsregister';
    const grepexpr = canary ? 'google chrome canary' : 'google chrome';
    const result =
        execSync(`${LSREGISTER} -dump  | grep -i '${grepexpr}\\?.app$' | awk '{$1=""; print $0}'`);

    const paths = result.toString().split(newLineRegex).filter(a => a).map(a => a.trim());
    paths.unshift(canary ? '/Applications/Google Chrome Canary.app' : '/Applications/Google Chrome.app');

    for (const p of paths) {
        if (p.startsWith('/Volumes')) {
            continue;
        }
        const inst = path.join(p, canary ? '/Contents/MacOS/Google Chrome Canary' : '/Contents/MacOS/Google Chrome');
        if (canAccess(inst)) {
            return inst;
        }
    }
    return void 0;
}


/**
 * Look for linux executables in 3 ways
 * 1. Look into CHROME_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for google-chrome-stable & google-chrome executables by using the which command
 */
function linux(canary?: boolean): string | undefined {
    let installations: string[] = [];

    // Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
        path.join(homedir(), '.local/share/applications/'),
        '/usr/share/applications/',
    ];
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findChromeExecutables(folder));
    });

    // Look for google-chrome(-stable) & chromium(-browser) executables by using the which command
    const executables = [
        'google-chrome-stable',
        'google-chrome',
        'chromium-browser',
        'chromium',
    ];
    executables.forEach(executable => {
        try {
            const chromePath =
                execFileSync('which', [executable], { stdio: 'pipe' }).toString().split(newLineRegex)[0];
            if (canAccess(chromePath)) {
                installations.push(chromePath);
            }
        } catch (e) {
            // Not installed.
        }
    });

    if (! installations.length) {
        throw new Error('The environment variable CHROME_PATH must be set to executable of a build of Chromium version 54.0 or later.');
    }

    const priorities: Priority[] = [
        { regex: /chrome-wrapper$/, weight: 51 },
        { regex: /google-chrome-stable$/, weight: 50 },
        { regex: /google-chrome$/, weight: 49 },
        { regex: /chromium-browser$/, weight: 48 },
        { regex: /chromium$/, weight: 47 },
    ];

    if (process.env.CHROME_PATH) {
        priorities.unshift({ regex: new RegExp(`${process.env.CHROME_PATH}`), weight: 101 });
    }

    return sort(uniq(installations.filter(Boolean)), priorities)[0];
}


function win32(canary?: boolean): string | undefined {
    const suffix = canary ?
        `${path.sep}Google${path.sep}Chrome SxS${path.sep}Application${path.sep}chrome.exe` :
        `${path.sep}Google${path.sep}Chrome${path.sep}Application${path.sep}chrome.exe`;
    const prefixes: string[] = [
        process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'],
    ].filter(Boolean) as string[];

    let result: string | undefined;
    prefixes.forEach(prefix => {
        const chromePath = path.join(prefix, suffix);
        if (canAccess(chromePath)) {
            result = chromePath;
        }
    });

    return result;
}


function sort(installations: string[], priorities: Priority[]) {
    const defaultPriority = 10;
    return installations
        // assign priorities
        .map(inst => {
            for (const pair of priorities) {
                if (pair.regex.test(inst))
                    return { path: inst, weight: pair.weight };
            }
            return { path: inst, weight: defaultPriority };
        })
        // sort based on priorities
        .sort((a, b) => (b.weight - a.weight))
        // remove priority flag
        .map(pair => pair.path);
}


function canAccess(file: fs.PathLike) {
    if (! file) {
        return false;
    }

    try {
        fs.accessSync(file);
        return true;
    } catch (e) {
        return false;
    }
}


function uniq<T>(arr: T[]) {
    return Array.from(new Set(arr));
}


function findChromeExecutables(folder: fs.PathLike) {
    const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
    const chromeExecRegex = '^Exec=/.*/(google-chrome|chrome|chromium)-.*';

    const installations: string[] = [];
    if (canAccess(folder)) {
        // Output of the grep & print looks like:
        //    /opt/google/chrome/google-chrome --profile-directory
        //    /home/user/Downloads/chrome-linux/chrome-wrapper %U
        let execPaths: Buffer;

        // Some systems do not support grep -R so fallback to -r.
        // See https://github.com/GoogleChrome/chrome-launcher/issues/46 for more context.
        try {
            execPaths = execSync(`grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`);
        } catch (e) {
            execPaths = execSync(`grep -Er "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`);
        }

        const execPathsStr = execPaths.toString()
            .split(newLineRegex)
            .map(execPath => execPath.replace(argumentsRegex, '$1'));

        execPathsStr.forEach(execPath => canAccess(execPath) && installations.push(execPath));
    }

    return installations;
}


async function downloadChromium(options: CarloLaunchOptions, targetRevision?: string) {
    const browserFetcher = puppeteer.createBrowserFetcher({ path: options.localDataDir });
    const revision = targetRevision || PUPPETEER_REVISIONS.chromium;
    const revisionInfo = browserFetcher.revisionInfo(revision);

    // Do nothing if the revision is already downloaded.
    if (revisionInfo.local) {
        return revisionInfo;
    }

    // Override current environment proxy settings with npm configuration, if any.
    try {
        console.log(`Downloading Chromium r${revision}...`);
        const newRevisionInfo = await browserFetcher.download(revisionInfo.revision);
        console.log('Chromium downloaded to ' + newRevisionInfo.folderPath);
        let localRevisions = await browserFetcher.localRevisions();

        localRevisions = localRevisions.filter(rev => rev !== revisionInfo.revision);
        // Remove previous chromium revisions.
        const cleanupOldVersions = localRevisions.map(rev => browserFetcher.remove(rev));

        await Promise.all(cleanupOldVersions);
        return newRevisionInfo;
    } catch (error) {
        console.error(`ERROR: Failed to download Chromium r${revision}!`);
        console.error(error);
        return null;
    }
}


// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function findChrome(options: CarloLaunchOptions) {
    if (options.executablePath) {
        return { executablePath: options.executablePath, type: 'user' };
    }

    const config = new Set<string>(options.channel || ['stable']);
    let executablePath: string | undefined;

    // Always prefer canary.
    if (config.has('canary') || config.has('*')) {
        if (process.platform === 'linux') {
            executablePath = linux(true);
        } else if (process.platform === 'win32') {
            executablePath = win32(true);
        } else if (process.platform === 'darwin') {
            executablePath = darwin(true);
        }

        if (executablePath) {
            return {
                executablePath,
                type: 'canary',
            };
        }
    }

    // Then pick stable.
    if (config.has('stable') || config.has('*')) {
        if (process.platform === 'linux') {
            executablePath = linux();
        } else if (process.platform === 'win32') {
            executablePath = win32();
        } else if (process.platform === 'darwin') {
            executablePath = darwin();
        }

        if (executablePath) {
            return {
                executablePath,
                type: 'stable',
            };
        }
    }

    // always prefer puppeteer revision of chromium
    if (config.has('chromium') || config.has('*')) {
        const revisionInfo = await downloadChromium(options);
        return {
            executablePath: revisionInfo?.executablePath,
            type: revisionInfo?.revision,
        };
    }

    for (const item of config) {
        if (! item.startsWith('r')) {
            continue;
        }
        const revisionInfo = await downloadChromium(options, item.substring(1));
        return {
            executablePath: revisionInfo?.executablePath,
            type: revisionInfo?.revision,
        };
    }

    return {};
}
