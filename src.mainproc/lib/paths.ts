// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import   os                from 'os';
import   path              from 'path';
import { app }             from 'electron';
import { contentsRootDir } from '../settings';



export const curDir      = process.cwd();
export const thisDirName = app.getAppPath();


// NOTE: dropped file is passed by process.argv[1] on   packed environment
// NOTE: dropped file is passed by process.argv[2] on unpacked environment
let startupFilePath: string | undefined = process.argv[app.isPackaged ? 1 : 2];

let lastSrcDir = '';


export function getStartupFilePath() {
    return startupFilePath;
}

export function setStartupFilePath(p: string | undefined) {
    startupFilePath = p;
    return startupFilePath;
}

export function getLastSrcPath() {
    return lastSrcDir;
}

export function setLastSrcPath(p: string) {
    lastSrcDir = p;
    return lastSrcDir;
}

export function resetLastSrcPath() {
    lastSrcDir = path.join(thisDirName, contentsRootDir);
    return lastSrcDir;
}

export const tmpDir = path.normalize(path.join(os.tmpdir(), 'mdne-electron'));
export const tmpOutDir = path.normalize(path.join(tmpDir, 'out'));

// NOTE: BUG: electron 7 don't look automatically dynamic `/app.asar.unpacked/*` contents?
export const toUnpackedPath = (p: string) => app.isPackaged ?
    p.replace(/\/app.asar\//, '/app.asar.unpacked/') : p;

resetLastSrcPath();
