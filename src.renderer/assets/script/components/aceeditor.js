// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import { saveFile }              from '../libs/backend-api.js';
import { notifyEditorDirty,
         alertWrap }             from '../libs/backend-wrap.js';
import AppState,
       { updateAppIndicatorBar } from '../libs/appstate.js';
import { getInputFormat,
         getAceEditorMode }      from '../libs/modes.js';



export default class AceEditor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.editor = null;

        this.outerWrapRef = React.createRef();
    }

    componentDidMount() {
        this.editor = ace.edit(this.props.id);
        this.editor.setFontSize(this.props.fontSize);
        this.editor.setTheme('ace/theme/monokai');
        this.editor.session.setMode('ace/mode/markdown');
        this.editor.commands.addCommand({
            name: 'save',
            bindKey: { win: 'Ctrl-S', mac: 'Cmd-S' },
            exec: async (editor) => {
                if (AppState.filePath) {
                    try {
                        // NOTE: In the browser backend, the filepath and filename may change on the first save.

                        const fileInfo = await saveFile(editor.getValue(), AppState.filePath);
                        AppState.filePath = fileInfo.path;
                        AppState.inputFormat = getInputFormat(AppState.filePath);

                        editor.session.setMode(getAceEditorMode(AppState.inputFormat));
                        editor.session.getUndoManager().markClean();
                        notifyEditorDirty(false);
                        updateAppIndicatorBar();
                    } catch (e) {
                        await alertWrap(e);
                    }
                } else {
                    this.props.onSaveAs({});
                }
            }
        })

        this.editor.on('change', (o) => {
            if (this.props.onChange) {
                this.props.onChange(o);
            }
        });
        this.editor.session.on('changeScrollTop', (y) => {
            if (this.props.onChangeScrollTop) {
                this.props.onChangeScrollTop(y, this.editor.session.getScreenLength() * this.editor.renderer.lineHeight);
            }
        });
        this.editor.session.on('changeScrollLeft', (x) => {
            if (this.props.onChangeScrollLeft) {
                this.props.onChangeScrollLeft(x);
            }
        });

        AppState.AceEditor = AppState.AceEditor || {};
        AppState.AceEditor[this.props.id] = this.editor;
    }

    render() {
        return (lsx`
        (div (@ (ref ${this.outerWrapRef})
                (className
                    ($concat "AceEditorOuterWrap"
                             ${this.props.stretched ? " stretched" : ""}
                             ${this.props.collapsed ? " collapsed" : ""} )))
            (div (@ (id ${this.props.id})
                    (className "AceEditorDiv") )))`
        );
    }
}
