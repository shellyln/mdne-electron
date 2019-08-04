// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import * as fs   from 'fs';
import * as path from 'path';
import { app }   from 'electron';



export const appConfig = JSON.parse(
    fs.readFileSync(path.join(app.getAppPath(), 'config/app-config.json')).toString());
