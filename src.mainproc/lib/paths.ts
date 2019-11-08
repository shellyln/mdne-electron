// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln

import   path              from 'path';
import { app }             from 'electron';
import { contentsRootDir } from '../settings';



export const curDir      = process.cwd();
export const thisDirName = app.getAppPath();

let lastSrcDir = '';


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

// NOTE: BUG: electron 7 don't look automatically dynamic `/app.asar.unpacked/*` contents?
export const toUnpackedPath = (p: string) => app.isPackaged ?
    p.replace(/\/app.asar\//, '/app.asar.unpacked/') : p;

resetLastSrcPath();
