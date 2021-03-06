// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import { resourceBaseDirectory,
         nativeConfirmSync,
         saveFileAs,
         getStartupFile,
         openURL,
         openNewWindow }         from '../libs/backend-api.js';
import { notifyEditorDirty,
         alertWrap,
         confirmWrap }           from '../libs/backend-wrap.js';
import AppState,
       { updateAppIndicatorBar } from '../libs/appstate.js';
import start                     from '../libs/start.js';
import { getInputFormat,
         isPreviewable,
         getAceEditorMode }      from '../libs/modes.js';
import { escapeHtml }            from '../libs/escape.js';
import commandRunner             from '../libs/cmdrunner.js';
import { saveAsFilter,
         exportFilter }          from '../libs/filefilters';

import { getSuggests as getAppSuggests,
         getOperators as getAppOperators }  from '../libs/commands/app.js';
import { getSuggests as getModeSuggests,
         getOperators as getModeOperators } from '../libs/commands/mode.js';
import { getSuggests as getMdSuggests,
         getOperators as getMdOperators }   from '../libs/commands/md.js';



const LOCAL_STORAGE_KEY = '_mdne_app_settings__Xlnuf3Ao';
const LOCAL_STORAGE_VERSION = 2;
const LOCAL_STORAGE_INITIAL = JSON.stringify({
    version: LOCAL_STORAGE_VERSION,
    editor: {},
    renderer: {},
    app: {},
});


export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.state.stretched = true;
        this.state.syncPreview = false;
        this.state.isPdf = false;
        this.state.useScripting = false;
        this.state.currentAceId = 'editor';
        this.state.splitterMoving = false;
        this.state.darkThemePreview = false;
        this.state.counter = 0;

        this.aceFontSize = 14;
        this.scheduleRerenderPreview = false;
        this.savedEditorStyleWidth = null;
        this.savedPreviewScrollY = 0;

        this.commandBoxRef = React.createRef();
        this.editorRef = React.createRef();
        this.editorPlaceholderRef = React.createRef();
        this.splitterRef = React.createRef();
        this.rootRef = React.createRef();
        this.fileDropDialogRef = React.createRef();
        this.fileOpenDialogRef = React.createRef();
        this.fileSaveDialogRef = React.createRef();
        this.settingsDialogRef = React.createRef();

        AppState.invalidate = () => this.setState({counter: this.state.counter + 1});

        window.onbeforeunload = (ev) => {
            // TODO: check all Ace editors
            const editor = AppState.AceEditor[this.state.currentAceId];
            const isClean = editor.session.getUndoManager().isClean();
            if (! isClean) {
                if (nativeConfirmSync) {
                    // NOTE: do not show prompt here on electron environment.
                } else {
                    ev.preventDefault(); 
                    return '';
                }
            }
            return void 0;
        }

        commandRunner.install(config => {
            const getCurrentAceId = () => this.state.currentAceId;
            const operators = [
                ...getAppOperators({app: this}),
                ...getModeOperators({getCurrentAceId}),
                ...getMdOperators({getCurrentAceId}),
            ];
            config.funcs = (config.funcs || []).concat(operators);
            // config.macros = (config.macros || []).concat(macros);
            // config.symbols = (config.symbols || []).concat(symbols);
            return config;
        });
        // commandRunner.setGlobals({});

        {
            const appSettings = this.getAppSettings();
            this.state.darkThemePreview = appSettings.renderer?.darkThemePreview ?? false;
            AppState.skipDropDialog = appSettings.app?.skipDropDialog ?? false;
        }

        {
            const ua = window.navigator.userAgent;
            // NOTE: Chromium Edge treats as Chrome.
            this.isChrome =
                ua.match(' Chrome/') &&
                !ua.match(' CriOS/') &&
                !ua.match(' OPR/') &&
                !ua.match(' Presto/') &&
                !ua.match(' Vivaldi/') &&
                !ua.match(' Iron Safari/') &&
                !ua.match(' Sleipnir/') &&
                !ua.match(' Mobile Safari/');
        }
    }

    componentDidMount() {
        {
            const elems = document.querySelectorAll('.dropdown-trigger');
            /* const instances = */ M.Dropdown.init(elems, {
                constrainWidth: false,
            });
        }
        {
            const elems = document.querySelectorAll('.tooltipped');
            /* const instances = */ M.Tooltip.init(elems, {});
        }
        {
            const elems = document.querySelectorAll('select');
            /* const instances = */ M.FormSelect.init(elems, {});
        }
        {
            const elems = document.querySelectorAll('.command-box-input.autocomplete');
            /* const instances = */ M.Autocomplete.init(elems, {
                data: Object.assign(
                    getAppSuggests(),
                    getModeSuggests(),
                    getMdSuggests(),
                ),
            });
        }
        if (window.dialogPolyfill) {
            // initialize polyfill emulated elements
            const dialogs = document.querySelectorAll('dialog');
            for (let i = 0; i < dialogs.length; i++) {
                const dialog = dialogs[i];
                dialogPolyfill.registerDialog(dialog);
            }
        }

        {
            const appSettings = this.getAppSettings();
            ace.config.loadModule('ace/ext/language_tools', () => {
                const editor = AppState.AceEditor[this.state.currentAceId];
                editor.setOptions({...JSON.parse(LOCAL_STORAGE_INITIAL).editor, ...appSettings.editor ?? {}});
            });
        }

        document.onkeyup = (ev) => {
            if (ev.ctrlKey && ev.shiftKey && ev.keyCode === 79) {
                // Ctrl+Shift+O
                this.commandBoxRef.current.focus();
            }
        };

        const setEditorNewFile = () => {
            AppState.inputFormat = 'md';
            notifyEditorDirty(false);

            updateAppIndicatorBar();

            const editor = AppState.AceEditor[this.state.currentAceId];
            editor.clearSelection();
            editor.session.setMode(getAceEditorMode(AppState.inputFormat));
            editor.setValue('');
            editor.clearSelection();
            editor.session.getUndoManager().markClean();

            this.setState({counter: this.state.counter + 1});
        };

        getStartupFile()
        .then(file => {
            if (file) {
                AppState.filePath = file.path;
                AppState.inputFormat = getInputFormat(AppState.filePath);
                notifyEditorDirty(false);
    
                updateAppIndicatorBar();
    
                const editor = AppState.AceEditor[this.state.currentAceId];
                editor.clearSelection();
                editor.session.setMode(getAceEditorMode(AppState.inputFormat));
                editor.setValue(file.text);
                editor.clearSelection();
                editor.session.getUndoManager().markClean();
                editor.moveCursorTo(0, 0);

                this.setState({counter: this.state.counter + 1});
            } else {
                setEditorNewFile();
                if (! AppState.skipDropDialog) {
                    this.openFileOpenDialog();
                }
            }
        })
        // eslint-disable-next-line no-unused-vars
        .catch(e => {
            setEditorNewFile();
            if (! AppState.skipDropDialog) {
                this.openFileOpenDialog();
            }
        });
    }

    getAppSettings() {
        return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || LOCAL_STORAGE_INITIAL);
    }

    saveAppSettings(settings) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        return settings;
    }

    afterFileOpen() {
        this.rootRef.current.contentWindow.location.replace(`${resourceBaseDirectory}empty.html`);

        this.setState({stretched: true});
        this.savedEditorStyleWidth = null;
        this.savedPreviewScrollY = 0;
        this.editorRef.current.outerWrapRef.current.style.width = null;
        this.editorPlaceholderRef.current.style.width = null;

        document.activeElement.blur();

        setTimeout(() => {
            // adjust wrapping and horizontal scroll bar
            const editor = AppState.AceEditor[this.state.currentAceId];
            editor.resize(true);
        }, 30);
    }

    openFileOpenDialog() {
        this.fileDropDialogRef.current.showModal({
            aceId: this.state.currentAceId,
            fileOpenDialog: this.fileOpenDialogRef.current,
        }, () => this.afterFileOpen());
    }

    // eslint-disable-next-line no-unused-vars
    async handleFileOpenClick(ev) {
        const editor = AppState.AceEditor[this.state.currentAceId];
        const isClean = editor.session.getUndoManager().isClean();
        if (! isClean) {
            if (! await confirmWrap('Changes you made may not be saved.\nAre you sure want to discard changes?')) {
                return;
            }
        }
        this.openFileOpenDialog();
    }

    // eslint-disable-next-line no-unused-vars
    handleStretchedClick(ev) {
        this.setState({stretched: !this.state.stretched});
        if (this.state.stretched) {
            // collapsed
            this.editorRef.current.outerWrapRef.current.style.width = this.savedEditorStyleWidth;
            this.editorPlaceholderRef.current.style.width = this.savedEditorStyleWidth;
            setTimeout(() => this.rootRef.current.contentWindow.scrollTo(
                this.rootRef.current.contentWindow.scrollX,
                this.savedPreviewScrollY,
            ), 30);
        } else {
            // stretched
            try {
                this.savedEditorStyleWidth = this.editorRef.current.outerWrapRef.current.style.width;
                this.savedPreviewScrollY = this.rootRef.current.contentWindow.scrollY;
            } catch (e) {
                // NOTE: ignore errors
            }
            this.editorRef.current.outerWrapRef.current.style.width = null;
            this.editorPlaceholderRef.current.style.width = null;
        }
        document.activeElement.blur();

        setTimeout(() => {
            // adjust wrapping and horizontal scroll bar
            const editor = AppState.AceEditor[this.state.currentAceId];
            editor.resize(true);
        }, 30);
    }

    // eslint-disable-next-line no-unused-vars
    handleSyncPreviewClick(ev) {
        this.setState({syncPreview: !this.state.syncPreview});
        document.activeElement.blur();
    }

    // eslint-disable-next-line no-unused-vars
    handleIsPdfClick(ev) {
        this.setState({isPdf: !this.state.isPdf});
        document.activeElement.blur();
    }

    // eslint-disable-next-line no-unused-vars
    handleUseScriptingClick(ev) {
        this.setState({useScripting: !this.state.useScripting});
        document.activeElement.blur();
    }

    // eslint-disable-next-line no-unused-vars
    handleShowClick(ev) {
        if (this.state.stretched) {
            this.editorRef.current.outerWrapRef.current.style.width = this.savedEditorStyleWidth;
            this.editorPlaceholderRef.current.style.width = this.savedEditorStyleWidth;
        }

        if (this.state.isPdf &&
            (window._MDNE_BACKEND_CAPS_NO_PDF_RENDERER ||
             window._MDNE_BACKEND_CAPS_NO_PDF_PREVIEW_PLUGIN)) {
            // do nothing
        } else {
            this.setState({stretched: false});
        }
        const editor = AppState.AceEditor[this.state.currentAceId];

        if (! isPreviewable(AppState.inputFormat)) {
            // eslint-disable-next-line no-console
            console.error(`Preview of ${AppState.inputFormat} format is not supported.`);
            this.rootRef.current.contentWindow.location.replace(`${resourceBaseDirectory}error.html`);
        } else {
            if (this.state.isPdf) {
                start(editor.getValue(), {
                    inputFormat: AppState.inputFormat,
                    outputFormat: 'pdf',
                    rawInput:
                        (AppState.inputFormat !== 'md' &&
                        AppState.inputFormat !== 'html') ||
                            this.state.useScripting ? false : true,
                }, null, AppState.filePath)
                .then(outputUrl => {
                    this.rootRef.current.contentWindow.location.replace(outputUrl);
                })
                .catch(async (e) => {
                    // eslint-disable-next-line no-console
                    console.error(e);
                    this.rootRef.current.contentWindow.location.replace(`${resourceBaseDirectory}error.html`);
                });
            } else {
                start(editor.getValue(), {
                    inputFormat: AppState.inputFormat,
                    outputFormat: 'html',
                    rawInput:
                        (AppState.inputFormat !== 'md' &&
                        AppState.inputFormat !== 'html') ||
                            this.state.useScripting ? false : true,
                    darkTheme: this.state.darkThemePreview ? true : false,
                }, null, AppState.filePath)
                .then(outputUrl => {
                    this.rootRef.current.contentWindow.location.replace(outputUrl);
                    setTimeout(() => this.rootRef.current.contentWindow.scrollTo(
                        this.rootRef.current.contentWindow.scrollX,
                        Math.min(
                            this.savedPreviewScrollY,
                            this.rootRef.current.contentWindow.document.documentElement?.scrollHeight
                                ?? this.savedPreviewScrollY,
                        ),
                    ), 30);
                })
                .catch(async (e) => {
                    // eslint-disable-next-line no-console
                    console.error(e);
                    this.rootRef.current.contentWindow.location.replace(`${resourceBaseDirectory}error.html`);
                });
            }

            setTimeout(() => {
                // adjust wrapping and horizontal scroll bar
                const editor = AppState.AceEditor[this.state.currentAceId];
                editor.resize(true);
            }, 30);
        }
        document.activeElement.blur();
    }

    handleSaveClick(ev) {
        if (AppState.filePath) {
            const editor = AppState.AceEditor[this.state.currentAceId];
            editor.execCommand('save');
        } else {
            this.handleSaveAsClick(ev);
        }
    }

    async fileSaveAs(currentDir, fileName) {
        const editor = AppState.AceEditor[this.state.currentAceId];

        const fileInfo = await saveFileAs(editor.getValue(), currentDir, fileName);
        // eslint-disable-next-line require-atomic-updates
        AppState.filePath = fileInfo.path;
        // eslint-disable-next-line require-atomic-updates
        AppState.inputFormat = getInputFormat(AppState.filePath);

        editor.session.setMode(getAceEditorMode(AppState.inputFormat));
        editor.session.getUndoManager().markClean();
        notifyEditorDirty(false);
        updateAppIndicatorBar();

        this.setState({counter: this.state.counter + 1});
    }

    // eslint-disable-next-line no-unused-vars
    handleSaveAsClick(ev) {
        this.fileSaveDialogRef.current.showModal({
            title: 'Save as',
            currentAceId: this.state.currentAceId,
            currentFilePath: AppState.filePath,
            forExport: false,
            fileTypes: saveAsFilter,
            intent: 'saveas',
        }, async (currentDir, fileName) => {
            try {
                await this.fileSaveAs(currentDir, fileName);
            } catch (e) {
                await alertWrap(e);
            }
        });
    }

    async fileExport(currentDir, fileName) {
        const editor = AppState.AceEditor[this.state.currentAceId];

        const ext = fileName.lastIndexOf('.') >= 0 ?
            fileName.toLowerCase().slice(fileName.lastIndexOf('.')) : '';
        await start(editor.getValue(), {
            inputFormat: AppState.inputFormat,
            outputFormat: ext === '.pdf' ? 'pdf' : 'html',
            rawInput:
                (AppState.inputFormat !== 'md' &&
                 AppState.inputFormat !== 'html') ||
                    this.state.useScripting ? false : true,
        }, null, AppState.filePath, currentDir, fileName);
    }

    getEntireText() {
        const editor = AppState.AceEditor[this.state.currentAceId];
        return editor.getValue();
    }

    getSelectedText() {
        const editor = AppState.AceEditor[this.state.currentAceId];
        return editor.getSelectedText();
    }

    insertText(text) {
        const editor = AppState.AceEditor[this.state.currentAceId];
        editor.session.insert(editor.getCursorPosition(), text);
        return text;
    }

    // eslint-disable-next-line no-unused-vars
    async handleExportClick(ev) {
        if (! isPreviewable(AppState.inputFormat)) {
            await alertWrap(`Preview of ${AppState.inputFormat} format is not supported.`);
        } else {
            this.fileSaveDialogRef.current.showModal({
                title: 'Export',
                currentAceId: this.state.currentAceId,
                currentFilePath: AppState.filePath,
                forExport: true,
                fileTypes: exportFilter,
                intent: 'export',
            }, async (currentDir, fileName) => {
                try {
                    await this.fileExport(currentDir, fileName);
                } catch (e) {
                    await alertWrap(e);
                }
            });
        }
    }

    // eslint-disable-next-line no-unused-vars
    handleSettingsClick(ev) {
        const editor = AppState.AceEditor[this.state.currentAceId];
        const appSettings = this.getAppSettings();

        this.settingsDialogRef.current.showModal(
            {
                editor: editor.getOptions(),
                renderer: appSettings.renderer ?? {},
                app: appSettings.app ?? {},
            },
            (settings) => {
                settings.version = LOCAL_STORAGE_VERSION;
                editor.setOptions(settings.editor);
                this.saveAppSettings(settings);
                this.setState({
                    darkThemePreview: settings.renderer?.darkThemePreview ?? false,
                });
                AppState.skipDropDialog = settings.app?.skipDropDialog;
            },
        );
    }

    // eslint-disable-next-line no-unused-vars
    handleAceEditorOnChange(o) {
        if (! AppState.fileChanged) {
            const editor = AppState.AceEditor[this.state.currentAceId];
            if (!(editor.curOp && editor.curOp.command.name)) {
                return;
            }
            notifyEditorDirty(true);
            updateAppIndicatorBar();
            // NOTE: Don't update state!
        }

        if (!this.state.stretched && this.state.syncPreview && !this.state.isPdf) {
            if (! isPreviewable(AppState.inputFormat)) {
                return;
            }
            if (!this.scheduleRerenderPreview) {
                this.scheduleRerenderPreview = true;
                setTimeout(() => {
                    const editor = AppState.AceEditor[this.state.currentAceId];

                    start(editor.getValue(), {
                        inputFormat: AppState.inputFormat,
                        outputFormat: 'html',
                        rawInput:
                            (AppState.inputFormat !== 'md' &&
                             AppState.inputFormat !== 'html') ||
                                this.state.useScripting ? false : true,
                        darkTheme: this.state.darkThemePreview ? true : false,
                    }, null, AppState.filePath)
                    .then(outputUrl => {
                        if (outputUrl.startsWith('data:') || outputUrl.startsWith('blob:')) {
                            // emulation
                            this.rootRef.current.contentWindow.location.replace(outputUrl);
                        } else {
                            // carlo
                            this.rootRef.current.contentWindow.location.reload(true);
                        }
                        this.scheduleRerenderPreview = false;
                    })
                    .catch(e => {
                        this.scheduleRerenderPreview = false;
                        // eslint-disable-next-line no-console
                        console.error(e);
                    });
                }, 3000);
            }
        }
    }

    handleAceEditorOnChangeScrollTop(y, totalHeight) {
        if (!this.state.stretched && !this.state.isPdf) {
            try {
                const w = y / totalHeight;
                const scrollY = this.rootRef.current.contentWindow.document.documentElement.scrollHeight * w;
                this.rootRef.current.contentWindow.scrollTo(
                    this.rootRef.current.contentWindow.scrollX,
                    scrollY,
                );
                this.savedPreviewScrollY = scrollY;
            } catch (e) {
                // emulation
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    handleAceEditorOnChangeScrollLeft(x) {
        // if (!this.state.stretched && !this.state.isPdf) {
        //     this.rootRef.current.contentWindow.scrollTo(x, this.rootRef.current.contentWindow.scrollTop);
        // }
    }

    handleCommandBoxOnKeyDown(ev) {
        const clearBox = () => {
            this.commandBoxRef.current.value = '';
            const instance = M.Autocomplete.getInstance(
                document.querySelectorAll('.command-box-input.autocomplete')[0]);
            instance.close();
        };

        if (ev.keyCode === 13) {
            if (this.commandBoxRef.current.value.trim() === '') {
                clearBox();
            } else {
                const command = `(${this.commandBoxRef.current.value})`;
                commandRunner(command)
                .then(r => {
                    clearBox();
                    if (typeof r === 'string' && r.trim() === '') {
                        return;
                    }
                    if (r === null || r === void 0) {
                        return;
                    }
                    if (Array.isArray(r) && r.length === 0) {
                        return;
                    }
                    M.toast({
                        html: escapeHtml(String(r)).replace(/\r?\n/g, '<br>'),
                        classes: 'teal darken-4',
                    });
                })
                .catch(e => {
                    clearBox();
                    M.toast({
                        html: escapeHtml(String(e)),
                        classes: 'red darken-4',
                    });
                });
            }
        } else if (ev.keyCode === 27) {
            clearBox();
            document.activeElement.blur();
        }
    }

    // eslint-disable-next-line no-unused-vars
    handleCommandBoxOnBlur(ev) {
        M.Toast.dismissAll();
        const editor = AppState.AceEditor[this.state.currentAceId];
        editor.focus();
    }

    handleSplitterOnPointerDown(ev) {
        this.setState({splitterMoving: true});
        const moveHandler = (ev2) => {
            const maxWidth = Math.max(Math.min(ev2.clientX - 5, window.innerWidth - 440), 400);
            const width = `${Math.round(maxWidth / window.innerWidth * 100)}%`;
            this.editorRef.current.outerWrapRef.current.style.width = width;
            this.editorPlaceholderRef.current.style.width = width;
        };
        const upHandler = (ev2) => {
            window.onpointermove = null;
            window.onpointerup = null;
            this.splitterRef.current.releasePointerCapture(ev2.pointerId);
            this.setState({splitterMoving: false});
            setTimeout(() => {
                this.rootRef.current.contentWindow.scrollTo(
                    this.rootRef.current.contentWindow.scrollX,
                    this.savedPreviewScrollY,
                );

                // adjust wrapping and horizontal scroll bar
                const editor = AppState.AceEditor[this.state.currentAceId];
                editor.resize(true);
            }, 30);
        };
        window.onpointermove = moveHandler;
        window.onpointerup = upHandler;
        this.splitterRef.current.setPointerCapture(ev.pointerId);
    }

    render() {
        const isEmulation = window._MDNE_BACKEND_TYPE === 'BROWSER_EMULATION';
        const iframeSrc = `${resourceBaseDirectory}empty.html`;

        return (lsx`
        (Template
            (div (@ (className "AppMainMenuWrap"))
                (a (@ (className "AppMainMenu dropdown-trigger btn-floating")
                      (data-target "dropdown1") )
                    (i (@ (className "AppMainMenuIcon material-icons large")) "dehaze") )
                (ul (@ (id "dropdown1")
                       (className "dropdown-content") )
                    (MenuItem (@ (icon "add_box")
                                 (caption "New window")
                                 (onClick ${() => { openNewWindow() }}) ))
                    (MenuItem (@ (icon "folder_open")
                                 (caption "Open...")
                                 (onClick ${(ev) => this.handleFileOpenClick(ev)}) ))
                    (MenuItem (@ (icon "save")
                                 (caption "Save (Ctrl+S)")
                                 (onClick ${(ev) => this.handleSaveClick(ev)}) ))
                    (MenuItem (@ (icon "save")
                                 (caption "Save as...")
                                 (onClick ${(ev) => this.handleSaveAsClick(ev)}) ))
                    (MenuItem (@ (icon "publish")
                                 (caption "Export...")
                                 (onClick ${(ev) => this.handleExportClick(ev)}) ))
                    (MenuDivider)
                    (MenuItem (@ (icon "find_in_page")
                                 (caption "Find... (Ctrl+F)")
                                 (onClick ${() => {
                                     const editor = AppState.AceEditor['editor'];
                                     editor.execCommand('find');
                                 }}) ))
                    (MenuDivider)
                    (MenuItem (@ (icon "settings")
                                 (caption "Settings...")
                                 (onClick ${(ev) => this.handleSettingsClick(ev)}) ))
                    (MenuItem (@ (icon "help_outline")
                                 (caption "Help")
                                 (onClick ${() => openURL('https://github.com/shellyln/mdne')}) )) )
                (Switch (@ (caption "Sync preview")
                           (offText "OFF")
                           (onText  "ON")
                           (elClass "hide-on-smallest")
                           (checked ${this.state.syncPreview})
                           (onClick ${(ev) => this.handleSyncPreviewClick(ev)}) ))
                ($if ${!window._MDNE_BACKEND_CAPS_NO_PDF_RENDERER}
                    (Switch (@ (caption "Preview format")
                            (offText "HTML")
                            (onText  "PDF")
                            (elClass "hide-on-smallest")
                            (checked ${this.state.isPdf})
                            (onClick ${(ev) => this.handleIsPdfClick(ev)}) )))
                (Switch (@ (caption "Scripting")
                           (offText "OFF")
                           (onText  "ON")
                           (elClass "hide-on-smallest")
                           (checked ${this.state.useScripting})
                           (onClick ${(ev) => this.handleUseScriptingClick(ev)}) ))
                (span (@ (style (flexGrow "2"))) " ")
                (div (@ (className "row command-box-input-outer") )
                    (div (@ (className "input-field col s9 command-box-input-inner") )
                        (input (@ (ref ${this.commandBoxRef})
                                  (className "CommandBoxInput command-box-input autocomplete")
                                  (type "text")
                                  (placeholder ($concat
                                      "Command palette    (" ${
                                      isEmulation && this.isChrome ? 'Alt+Ctrl+Shift+O' :'Ctrl+Shift+O'
                                      } ")" ))
                                  (spellcheck "false")
                                  (onBlur ${(ev) => this.handleCommandBoxOnBlur(ev)})
                                  (onKeyDown ${(ev) => this.handleCommandBoxOnKeyDown(ev)}) ))))
                (button (@ (style (textTransform "none")
                                  (margin "0 3px") )
                           (className "btn tooltipped")
                           (data-tooltip "Update preview")
                           (onClick ${(ev) => this.handleShowClick(ev)}) )
                    (i (@ (className "material-icons")) "visibility") )
                (button (@ (style (textTransform "none")
                                  (margin "0 3px") )
                           (className "btn tooltipped")
                           (data-tooltip "Toggle preview")
                           (onClick ${(ev) => this.handleStretchedClick(ev)}) )
                    (i (@ (className "material-icons")) "chrome_reader_mode") ))
            (div (@ (className "AppMainContentWrap"))
                (AceEditor (@ (ref ${this.editorRef})
                              (id "editor")
                              (stretched ${this.state.stretched ? true: false})
                              (collapsed ${this.state.splitterMoving ? true: false})
                              (fontSize ${this.aceFontSize})
                              (onSaveAs ${(o) => this.handleSaveAsClick(o)})
                              (onChange ${(o) => this.handleAceEditorOnChange(o)})
                              (onChangeScrollTop ${(y, totalHeight) => this.handleAceEditorOnChangeScrollTop(y, totalHeight)})
                              (onChangeScrollLeft ${(x) => this.handleAceEditorOnChangeScrollLeft(x)}) ))
                (div (@ (ref ${this.editorPlaceholderRef})
                        (className ($concat "AceEditorPlaceholder"
                                   ${this.state.splitterMoving ? "" : " collapsed"}) ) ))
                (div (@ (ref ${this.splitterRef})
                        (className ($concat "Splitter"
                                   ${this.state.stretched ? " collapsed" : ""}))
                        (onPointerDown ${(ev) => this.handleSplitterOnPointerDown(ev)}) ))
                (div (@ (className ($concat "OutputIframePlaceholder"
                                   ${this.state.splitterMoving ? "" : " collapsed"}) ) ))
                (iframe (@ (ref ${this.rootRef})
                           (src ${iframeSrc})
                           (style (background-color ${this.state.darkThemePreview && AppState.inputFormat === 'md' ? '#1b1f23' : 'white'}))
                           ; (sandbox "")
                           (className ($concat "OutputIframe"
                                      ${this.state.stretched || this.state.splitterMoving ? " collapsed" : ""}) ) ))
                (div (@ (id "appIndicatorBar")
                        (className "AppIndicatorBar")) "") )
            (FileDropDialog (@ (ref ${this.fileDropDialogRef})))
            (FileOpenDialog (@ (ref ${this.fileOpenDialogRef})))
            (FileSaveDialog (@ (ref ${this.fileSaveDialogRef})))
            (SettingsDialog (@ (ref ${this.settingsDialogRef}))) )`
        );
    }
}
