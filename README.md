# mdne-electron - Markdown Neo Edit for Electron

<img src="https://raw.githubusercontent.com/shellyln/mdne-electron/master/docs/logo.svg?sanitize=true" title="logo" style="width: 200px">

### A simple markdown and code editor powered by [Markdown-it](https://github.com/markdown-it/markdown-it), [Ace](https://ace.c9.io/) and [Electron](https://electronjs.org/).

[![npm](https://img.shields.io/npm/v/mdne-electron.svg)](https://www.npmjs.com/package/mdne-electron)
[![GitHub release](https://img.shields.io/github/release/shellyln/mdne-electron.svg)](https://github.com/shellyln/mdne-electron/releases)
[![.github/workflows/test.yml](https://github.com/shellyln/mdne-electron/workflows/.github/workflows/test.yml/badge.svg)](https://github.com/shellyln/mdne-electron/actions)
[![GitHub forks](https://img.shields.io/github/forks/shellyln/mdne-electron.svg?style=social&label=Fork)](https://github.com/shellyln/mdne-electron/fork)
[![GitHub stars](https://img.shields.io/github/stars/shellyln/mdne-electron.svg?style=social&label=Star)](https://github.com/shellyln/mdne-electron)

![screenshet](https://raw.githubusercontent.com/shellyln/mdne-electron/master/docs/screenshot.png)


## Features
* Live preview of Markdown, HTML, [LSX](https://github.com/shellyln/liyad#what-is-lsx) formats.
* Export Markdown, HTML, and LSX into PDF or HTML.
* Code highlighting.
  * C#
  * CSS
  * Dockerfile
  * Go
  * GraphQL
  * HTML
  * INI
  * Java
  * JavaScript
  * JSON
  * JSON5
  * JSX
  * Kotlin
  * Latex
  * Less
  * Lisp
  * Makefile
  * Markdown
  * Protobuf
  * Python
  * R
  * Ruby
  * Rust
  * Sass
  * Scss
  * Shell script
  * SQL
  * SVG
  * Tex
  * TOML
  * TSX
  * TypeScript
  * XML
  * YAML
* Markdown extended syntax
  * Many markdown-it plugins are enabled. See [here](https://github.com/shellyln/menneu#features).
* Scripting and value expansion
  * See [here](https://github.com/shellyln/menneu#lisp-block-expansion).
* Full screen mode (F11)


## Distributions and Integrations

* [mdne-electron](https://github.com/shellyln/mdne-electron)
  * Standalone offline desktop app for Windows/Mac/Linux.
    * *This repository*
    * [Electron](https://electronjs.org/) app
* [mdne online](https://github.com/shellyln/mdne-electron)
  * Online markdown editor for Chrome/Chromium Edge/Firefox.
    * *This repository*
    * [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) (Progressive Web Apps)
* [mdne-sf](https://github.com/shellyln/mdne-sf)
  * Edit Salesforce record's field. (browser app)
  * Markdown preview Visualforce page example
* [mdne](https://github.com/shellyln/mdne)
  * Offline desktop app for Google Chrome browser + Node.js.
    * [Carlo](https://github.com/GoogleChromeLabs/carlo) app
* [mdne-for-kintone](https://github.com/shellyln/mdne-for-kintone)
  * Edit kintone record's field. (browser app)


## CLI
Please use [Ménneu](https://github.com/shellyln/menneu#use-cli) CLI.


## Live demo (mdne online; PWA)
* [https://shellyln.github.io/mdne/](https://shellyln.github.io/mdne/)

#### Live demo browser requirements
* Google Chrome: latest
* Chromium Edge: latest
* Firefox: latest

#### Live demo restrictions
* Rendering / exporting to PDF is not available.
* Save and SaveAs commands download the file being edited.


----
## Requirements

* [Optional] Google Chrome (latest)
  * for previewing as or exporting as PDF


----

## Build scripts

### Project setup
```sh
npm ci

# npm install    # it causes a dependency update
```

### Build for production
```sh
npm run build
```

### Build for production (only electron main process)
```sh
npm run build:mainproc
```

### Build for production (only electron renderer process)
```sh
npm run build:renderer
```

### Build _mdne online_ PWA app
```sh
npm run build:browser
```

### Clean project
```sh
npm run clean
```

### Start electron app for debug
```sh
npm start
```

### Build electron distribution executable files (unpacked)
```sh
# npm run clean
# npm run build
npm run dist:unpacked
```

### Build electron distribution executable files (packing to the installer)
```sh
# npm run clean
# npm run build
npm run dist          # build for current machine

# npm run dist:win    # build for windows (x64)
# npm run dist:linux  # build for linux (x64)
# npm run dist:mac    # build for macos (x64)
```

### Run tests
```
npm run test
```

### Linting
```
npm run lint
```

---
## Change window title bar color (Windows)

* DWM.reg

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\DWM]
"ColorPrevalence"=dword:00000001
"AccentColor"=dword:00242120
"AccentColorInactive"=dword:0043403c
```

---

## **Electron Documentation (security)**
See [this](https://electronjs.org/docs/tutorial/security) guide.


----
## License
[ISC](https://github.com/shellyln/mdne-electron/blob/master/LICENSE.md)  
Copyright (c) 2019-2020 Shellyl_N and Authors.

## Bundled softwares' license

* [Ace](https://github.com/ajaxorg/ace): [license](https://github.com/ajaxorg/ace/blob/master/LICENSE) (BSD-3-Clause)
* [Carlo](https://github.com/GoogleChromeLabs/carlo): [license](https://github.com/GoogleChromeLabs/carlo/blob/master/LICENSE) (Apache License 2.0)
* [Materialize](https://materializecss.com/): [license](https://github.com/Dogfalo/materialize/blob/v1-dev/LICENSE) (MIT)
* [Normalize.css](https://necolas.github.io/normalize.css/): [license](https://github.com/necolas/normalize.css/blob/master/LICENSE.md) (MIT)
* [github-markdown-css](https://github.com/sindresorhus/github-markdown-css): [license](https://github.com/sindresorhus/github-markdown-css/blob/gh-pages/license) (MIT)
* [highlight.js](https://github.com/highlightjs/highlight.js): [license](https://github.com/highlightjs/highlight.js/blob/master/LICENSE) (BSD 3-Clause)
* [React](https://reactjs.org/): [license](https://github.com/facebook/react/blob/master/LICENSE) (MIT)
* [pako](https://github.com/nodeca/pako): [license](https://github.com/nodeca/pako/blob/master/LICENSE) (MIT + ZLIB)
* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill): [license](https://github.com/GoogleChrome/dialog-polyfill/blob/master/LICENSE) (BSD-3-Clause)
