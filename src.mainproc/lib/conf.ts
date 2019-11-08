// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import * as fs            from 'fs';
import * as path          from 'path';
import { app }            from 'electron';
import { toUnpackedPath } from './paths';



// NOTE: BUG: electron 7 don't look automatically dynamic `/app.asar.unpacked/*` contents?
export const appConfig = JSON.parse(
    fs.readFileSync(
        toUnpackedPath(path.join(app.getAppPath(), 'config/app-config.json')),
    ).toString());
