// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import { BrowserWindow } from 'electron';



const windowMap = new Map<symbol | BrowserWindow, BrowserWindow>();


export function registerWindow(key: symbol | BrowserWindow, wnd: BrowserWindow): void {
    windowMap.set(key, wnd);
}


export function unregisterWindow(key: symbol | BrowserWindow): boolean {
    return windowMap.delete(key);
}


export function isRegistered(key: symbol | BrowserWindow): boolean {
    return windowMap.has(key);
}


export function getWindow(key: symbol | BrowserWindow): BrowserWindow | undefined {
    return windowMap.get(key);
}
