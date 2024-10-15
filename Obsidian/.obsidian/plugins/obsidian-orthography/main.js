'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function getDefaultData() {
    return {
        displayRunner: true,
        useGrammar: false,
        language: 'en, ru, uk'
    };
}
class OrthographySettings {
    constructor(plugin, emitter) {
        this.plugin = plugin;
        this.data = getDefaultData();
        this.emitter = emitter;
    }
    get displayRunner() {
        const { data } = this;
        return data.displayRunner;
    }
    set displayRunner(value) {
        const { data } = this;
        data.displayRunner = value;
        this.emitter.trigger('onUpdateSettings', this.data);
    }
    get useGrammar() {
        const { data } = this;
        return data.useGrammar;
    }
    set useGrammar(value) {
        const { data } = this;
        data.useGrammar = value;
        this.emitter.trigger('onUpdateSettings', this.data);
    }
    get language() {
        const { data } = this;
        return data.language;
    }
    set language(value) {
        const { data } = this;
        data.language = value;
        this.emitter.trigger('onUpdateSettings', this.data);
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const { plugin } = this;
            this.data = Object.assign(getDefaultData(), yield plugin.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const { plugin, data } = this;
            if (plugin && data) {
                yield plugin.saveData(data);
            }
        });
    }
}

// Grammer popup
const O_POPUP = 'obsidian-orthography-popup';
const O_POPUP_DISABLED = 'obsidian-orthography-popup--disabled';
const O_POPUP_CONTROLS = 'obsidian-orthography-popup-controls';
const O_POPUP_ITEM = 'obsidian-orthography-popup-item';
const O_POPUP_RESIZED = 'obsidian-orthography-popup--resized';
const O_POPUP_ITEM_OPENED = 'obsidian-orthography-popup-item--opened';
const O_POPUP_WORD_TO_REPLACE = 'obsidian-orthography-word-to-replace';
// Runner
const O_RUNNER = 'obsidian-orthography-runner';
const O_RUNNER_HIDDEN = 'obsidian-orthography-runner--hidden';
const O_RUNNER_LOADING = 'obsidian-orthography-runner--loading';
// Highlight
const O_HIGHLIGHT = 'obsidian-orthography-highlight';
const O_HIGHLIGHT_FOCUSED = 'obsidian-orthography-highlight--focused';

const O_RUNNER_ICON = '⌘';
const O_RUNNER_ICON_CLEAR = '✕';
const O_NOT_OPEN_FILE = 'Please open a file first.';
const O_SERVER_ERROR = 'The server is not responding. Please check your Internet connection.';
const O_NO_ERROR = 'Spelling errors not found!';

const UIControls = (hasData) => {
    return `
      <div class="obsidian-orthography-popup-controls">
        ${hasData
        ? '<button id="reloader" class="obsidian-orthography-popup-reload" title="Restart the orthography checker">Reload</button>'
        : ''}
        <div id="closer" class="obsidian-orthography-popup-close" title="Close popup">✕</div>
      </div>
    `;
};

const JOIN_BY = '<span style="opacity: 0.5;">or</span>&nbsp;';
const renderHints = (card, index) => {
    const { replacements, text, begin, highlightText } = card;
    if (card.category === 'Determiners') {
        return replacements
            .map((item) => {
            return `
          <span
            data-toreplace="${item}"
            data-index="${index}"
            data-begin="${begin}"
            data-text="${text}"
            class="obsidian-orthography-word-to-replace obsidian-orthography-popup-replacement"
            title="Click to correct your spelling">
              <b>${item}</b>&nbsp${highlightText}
          </span>`;
        })
            .join(JOIN_BY);
    }
    // ----------- FOR REMOVE HINTS ----------- //
    if (card.category === 'Formatting' ||
        card.category === 'BasicPunct' ||
        card.category === 'Wordiness' ||
        card.category === 'Conjunctions') {
        return `
      <span
        data-begin="${begin}"
        data-text="${text}"
        data-toreplace="${replacements[0]}"
        class="obsidian-orthography-word-to-replace obsidian-orthography-popup-hightligh--red">${highlightText || ''}
      </span>
    `;
    }
    if (card.category === 'Prepositions') {
        return replacements
            .map((item) => {
            return `
        <span
          data-toreplace="${item}"
          data-index="${index}"
          data-begin="${begin}"
          data-text="${highlightText}"
          class="obsidian-orthography-word-to-replace obsidian-orthography-popup-replacement"
          title="Click to correct your spelling"
        >
          <b>${item}</b>&nbsp${highlightText}
        </span>`;
        })
            .join(JOIN_BY);
    }
    return replacements
        .map((item) => {
        return `
        <span class="obsidian-orthography-popup-card--line-through">${highlightText}</span>
        <span
          data-toreplace="${item}"
          data-index="${index}"
          data-begin="${begin}"
          data-text="${text}"
          class="obsidian-orthography-word-to-replace obsidian-orthography-popup-replacement"
          title="Click to correct your spelling"
        >
          ${item}
        </span>`;
    })
        .join(JOIN_BY);
};
const UIHints = (alerts) => {
    if (!alerts || !alerts.length)
        return '';
    return alerts
        .map((card, index) => {
        const { impact, highlightText, minicardTitle, explanation, cardLayout, begin } = card;
        return `
          <div data-begin="${begin}" id="obsidian-orthography-popup-item-${index}" class="obsidian-orthography-popup-item ${impact}">
            <div class="obsidian-orthography-popup-minicard">
              <div>${highlightText || ''}</div>
              ${minicardTitle
            ? `<div class="obsidian-orthography-popup-item-sugg">${minicardTitle}</div>`
            : ''}
              <div class="obsidian-orthography-popup-arrows">
                <svg width="10" viewBox="0 0 10 10"><path d="M5 4.3L.85.14c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7L5 5.7 9.85.87c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0L5 4.28z" stroke="none" transform="translate(0 3) rotate(0)"></path></svg>
                <svg width="10" viewBox="0 0 10 10"><path d="M5 4.3L.85.14c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7L5 5.7 9.85.87c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0L5 4.28z" stroke="none" transform="translate(0 3) rotate(0)"></path></svg>
              </div>
            </div>
            <div class="obsidian-orthography-popup-card">
              <div>${cardLayout.group || ''}</div>
              <div class="obsidian-orthography-popup-card-content">
                ${renderHints(card, index)}
              </div>
              <div>${explanation || ''}</div>
            </div>
          </div>
        `;
    })
        .join('');
};

const UIHintsFallback = () => {
    const hintsFallback = `
    <div class="obsidian-orthography-hints-fallback">
      <button id="runner">
        Run orthography check
      </button>
      <p>Alpha version</p>
    </div>
  `;
    return hintsFallback;
};

const UILoader = () => {
    const loader = `
    <div class="obsidian-orthography-loader">
      Checking...
    </div>
  `;
    return loader;
};

const UIBar = (data, loading) => {
    const hasData = data && data.alerts && data.alerts.length;
    const controls = UIControls(!!hasData);
    const fallback = loading ? UILoader() : UIHintsFallback();
    const cards = hasData ? UIHints(data.alerts) : fallback;
    return `${controls}${cards}`;
};

let self$2;
class OrthographyPopup {
    constructor(app, settings, emitter) {
        this.popupOffset = [0, 0];
        this.moverSelected = false;
        this.created = false;
        this.app = app;
        this.settings = settings;
        this.emitter = emitter;
    }
    init() {
        self$2 = this;
    }
    create() {
        self$2.created = true;
        self$2.popup = document.createElement('div');
        self$2.popup.classList.add(O_POPUP);
        self$2.popup.id = O_POPUP;
        const bar = UIBar(null, false);
        self$2.popup.innerHTML = bar;
        document.body.appendChild(self$2.popup);
        self$2.setListeners();
    }
    destroy() {
        self$2.created = false;
        self$2.removeListeners();
        const popup = document.getElementById(O_POPUP);
        if (popup)
            popup.remove();
    }
    update(data, loading) {
        self$2.removeListeners();
        const bar = UIBar(data, loading);
        self$2.popup.innerHTML = bar;
        self$2.setListeners();
    }
    setLoader() {
        this.update(null, true);
    }
    removeLoader() {
        this.update(null, false);
    }
    disable() {
        const hints = document.querySelector(`#${O_POPUP}`);
        if (hints) {
            hints.classList.add(O_POPUP_DISABLED);
        }
    }
    enable() {
        const hints = document.querySelector(`#${O_POPUP}`);
        if (hints) {
            hints.classList.remove(O_POPUP_DISABLED);
        }
    }
    setListeners() {
        const minicards = document.querySelectorAll(`.${O_POPUP_ITEM}`);
        minicards.forEach((mc) => mc.addEventListener('click', self$2.onClickByHint));
        minicards.forEach((mc) => mc.addEventListener('mouseover', self$2.onFocusWord));
        minicards.forEach((mc) => mc.addEventListener('mouseout', self$2.onRemoveFocusWord));
        const replacements = document.querySelectorAll(`.${O_POPUP_WORD_TO_REPLACE}`);
        replacements.forEach((rp) => rp.addEventListener('click', self$2.onReplaceWord));
        self$2.reloader = document.getElementById('reloader');
        if (self$2.reloader) {
            self$2.reloader.addEventListener('click', self$2.onRun);
        }
        self$2.runner = document.getElementById('runner');
        if (self$2.runner) {
            self$2.runner.addEventListener('click', self$2.onRun);
        }
        self$2.sizer = document.getElementById('sizer');
        if (self$2.sizer) {
            self$2.sizer.addEventListener('click', self$2.onResize);
        }
        self$2.closer = document.getElementById('closer');
        if (self$2.closer) {
            self$2.closer.addEventListener('click', self$2.onClose);
        }
        self$2.mover = document.querySelector(`.${O_POPUP_CONTROLS}`);
        if (self$2.mover) {
            self$2.mover.addEventListener('mousedown', self$2.moverIsDown);
        }
        document.addEventListener('mouseup', self$2.onMouseUp);
        document.addEventListener('mousemove', self$2.onMouseMove);
    }
    removeListeners() {
        const minicards = document.querySelectorAll(`.${O_POPUP_ITEM}`);
        minicards.forEach((mc) => mc.removeEventListener('click', self$2.onClickByHint));
        minicards.forEach((mc) => mc.removeEventListener('mouseover', self$2.onFocusWord));
        minicards.forEach((mc) => mc.removeEventListener('mouseout', self$2.onRemoveFocusWord));
        const replacements = document.querySelectorAll(`.${O_POPUP_WORD_TO_REPLACE}`);
        replacements.forEach((rp) => rp.removeEventListener('click', self$2.onReplaceWord));
        if (self$2.reloader)
            self$2.reloader.removeEventListener('click', self$2.onRun);
        if (self$2.runner)
            self$2.runner.removeEventListener('click', self$2.onRun);
        if (self$2.sizer)
            self$2.sizer.removeEventListener('click', self$2.onResize);
        if (self$2.closer)
            self$2.closer.removeEventListener('click', self$2.onClose);
        if (self$2.mover)
            self$2.mover.removeEventListener('mousedown', self$2.moverIsDown);
        document.removeEventListener('mouseup', self$2.onMouseUp);
        document.removeEventListener('mousemove', self$2.onMouseMove);
    }
    onClickByHint(e) {
        const opened = document.querySelectorAll(`.${O_POPUP_ITEM_OPENED}`);
        opened.forEach((o) => o.classList.remove(O_POPUP_ITEM_OPENED));
        if (e.currentTarget.classList.contains(O_POPUP_ITEM_OPENED)) {
            e.currentTarget.classList.remove(O_POPUP_ITEM_OPENED);
        }
        else {
            e.currentTarget.classList.add(O_POPUP_ITEM_OPENED);
        }
        const begin = e.currentTarget.dataset.begin;
        if (begin) {
            self$2.scrollToWord(begin);
        }
    }
    moverIsDown(e) {
        self$2.moverSelected = true;
        self$2.popupOffset = [
            self$2.popup.offsetLeft - e.clientX,
            self$2.popup.offsetTop - e.clientY
        ];
    }
    onMouseUp() {
        self$2.moverSelected = false;
    }
    onMouseMove(e) {
        e.preventDefault();
        if (self$2.moverSelected) {
            const mousePosition = {
                x: e.clientX,
                y: e.clientY
            };
            self$2.popup.style.left = `${mousePosition.x + self$2.popupOffset[0]}px`;
            self$2.popup.style.top = `${mousePosition.y + self$2.popupOffset[1]}px`;
        }
    }
    onResize() {
        if (self$2.popup.className.contains(O_POPUP_RESIZED)) {
            self$2.popup.classList.remove(O_POPUP_RESIZED);
        }
        else {
            self$2.popup.classList.add(O_POPUP_RESIZED);
        }
    }
    onClose() {
        self$2.emitter.trigger('orthography:close');
    }
    onFocusWord(e) {
        const begin = e.currentTarget.dataset.begin;
        const word = document.querySelector(`.begin-${begin}`);
        if (word) {
            word.classList.add(O_HIGHLIGHT_FOCUSED);
        }
    }
    onRemoveFocusWord() {
        const words = document.querySelectorAll(`.${O_HIGHLIGHT_FOCUSED}`);
        words.forEach((w) => w.classList.remove(O_HIGHLIGHT_FOCUSED));
    }
    onRun() {
        self$2.emitter.trigger('orthography:run');
    }
    onReplaceWord(event) {
        self$2.emitter.trigger('orthography:replace', event);
        const { index } = event.currentTarget.dataset;
        const selectedItem = document.getElementById(`${O_POPUP_ITEM}-${index}`);
        if (selectedItem)
            selectedItem.remove();
        if (!document.querySelectorAll(`.${O_POPUP_ITEM}`).length) {
            self$2.removeLoader();
        }
    }
    onOpenCard(event) {
        const { value: begin } = event.currentTarget.attributes.begin;
        const popup = document.querySelector(`.${O_POPUP}`);
        const opened = document.querySelectorAll(`.${O_POPUP_ITEM_OPENED}`);
        opened.forEach((o) => o.classList.remove(O_POPUP_ITEM_OPENED));
        const selected = document.querySelector(`[data-begin="${begin}"]`);
        selected.classList.add(O_POPUP_ITEM_OPENED);
        popup.scrollTop = selected.offsetTop;
    }
    scrollToWord(begin) {
        const activeEditor = self$2.getEditor();
        if (activeEditor) {
            activeEditor.scrollTo(0, +begin - 300);
        }
        else {
            self$2.onClose();
            new obsidian.Notice(O_NOT_OPEN_FILE);
        }
    }
    getEditor() {
        const activeLeaf = this.app.workspace.activeLeaf;
        const sourceMode = activeLeaf.view.sourceMode;
        if (!sourceMode)
            return null;
        return activeLeaf.view.sourceMode.cmEditor;
    }
}

let self$1;
class OrthographyToggler {
    constructor(app, settings, emitter) {
        this.app = app;
        this.settings = settings;
        this.emitter = emitter;
    }
    init() {
        self$1 = this;
        this.createButton(O_RUNNER_ICON);
    }
    destroy() {
        this.removeLoading();
        this.toggler.removeEventListener('click', this.toggle);
        this.removeButton();
    }
    toggle() {
        const activeEditor = self$1.getEditor();
        if (!activeEditor) {
            if (self$1.showed) {
                self$1.setButtonWithRunner();
                self$1.showed = false;
            }
            else {
                new obsidian.Notice(O_NOT_OPEN_FILE);
            }
            return;
        }
        self$1.showed = !self$1.showed;
        if (self$1.showed) {
            self$1.setButtonWithClear();
        }
        else {
            self$1.setButtonWithRunner();
        }
    }
    hide() {
        const runner = document.querySelector('.' + O_RUNNER);
        runner.classList.add(O_RUNNER_HIDDEN);
    }
    setLoading() {
        this.toggler.classList.add(O_RUNNER_LOADING);
    }
    removeLoading() {
        this.toggler.classList.remove(O_RUNNER_LOADING);
    }
    reset() {
        this.showed = false;
        this.removeLoading();
        this.updateButtonText(O_RUNNER_ICON);
    }
    createButton(text) {
        this.toggler = document.createElement('button');
        const icon = document.createElement('span');
        icon.innerText = text;
        this.toggler.classList.add(O_RUNNER);
        this.toggler.appendChild(icon);
        document.body.appendChild(this.toggler);
        this.toggler.addEventListener('click', this.toggle);
    }
    updateButtonText(text) {
        const toggler = document.querySelector(`.${O_RUNNER} span`);
        if (toggler)
            toggler.innerText = text;
    }
    removeButton() {
        const toggler = document.querySelector(`.${O_RUNNER}`);
        if (toggler)
            toggler.remove();
    }
    setButtonWithClear() {
        self$1.updateButtonText(O_RUNNER_ICON_CLEAR);
        self$1.emitter.trigger('orthography:open');
    }
    setButtonWithRunner() {
        self$1.updateButtonText(O_RUNNER_ICON);
        self$1.removeLoading();
        self$1.emitter.trigger('orthography:close');
    }
    getEditor() {
        const activeLeaf = this.app.workspace.activeLeaf;
        const sourceMode = activeLeaf.view.sourceMode;
        if (!sourceMode)
            return null;
        return activeLeaf.view.sourceMode.cmEditor;
    }
}

class OrthographyEditor {
    constructor(app, settings, editor) {
        this.app = app;
        this.settings = settings;
        this.editor = editor;
    }
    init() {
        // init
    }
    destroy() {
        this.clearHighlightWords();
    }
    highlightWords(alerts) {
        this.clearHighlightWords();
        if (!this.editor || !alerts || alerts.length === 0)
            return;
        alerts.forEach((alert) => {
            const textLength = alert.text.length || alert.highlightText.length;
            const originalWord = {
                begin: alert.begin,
                end: alert.end,
                len: textLength
            };
            this.highlightWord(originalWord);
        });
    }
    highlightWord(originalWord) {
        if (!this.editor || !originalWord)
            return;
        const colRow = this.getColRow(originalWord);
        if (!colRow)
            return;
        const { col, row } = colRow;
        this.editor.addHighlights([
            {
                from: {
                    line: row,
                    ch: col
                },
                to: {
                    line: row,
                    ch: col + originalWord.len
                }
            }
        ], `${O_HIGHLIGHT} begin-${originalWord.begin}`);
    }
    replaceWord(originalWord, newWord) {
        if (!this.editor || !originalWord || !newWord)
            return;
        const colRow = this.getColRow(originalWord);
        if (!colRow)
            return;
        const { col, row } = colRow;
        const doc = this.editor.getDoc();
        const from = {
            line: row,
            ch: col
        };
        const to = {
            line: row,
            ch: col + originalWord.len
        };
        doc.replaceRange(newWord, from, to);
    }
    getColRow(originalWord) {
        if (!this.editor || !originalWord)
            return;
        let ttl = 0;
        let row = 0;
        let result;
        const { begin } = originalWord;
        const lines = this.editor.lineCount();
        for (let i = 0; i < lines; i++) {
            const lineText = this.editor.getLine(i);
            const s = ttl === 0 ? ttl : ttl + 1;
            const lineTextLength = lineText.length;
            ttl += lineTextLength;
            if (row > 0) {
                ttl++;
            }
            if (begin >= s && begin <= ttl) {
                const diff = ttl - lineTextLength;
                const col = begin - diff;
                result = { col, row };
            }
            row++;
        }
        return result;
    }
    clearHighlightWords() {
        const highlightWords = document.querySelectorAll(`.${O_HIGHLIGHT}`);
        highlightWords.forEach((span) => {
            this.editor.removeHighlights(span.className);
        });
    }
}

const debounce = (callback, timeout) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            callback.apply(undefined, args);
        }, timeout);
    };
};

const sortAlerts = (alerts) => {
    return alerts.sort((a, b) => a.begin - b.begin);
};
const formatAlerts = (alerts) => {
    const withoutHidden = alerts.filter((alert) => alert.hidden !== true);
    const withoutDuplicate = withoutHidden.reduce((acc, current) => {
        const x = acc.find((item) => item.explanation === current.explanation);
        if (!x) {
            return acc.concat([current]);
        }
        else {
            return acc;
        }
    }, []);
    return withoutDuplicate;
};

const API_URL_GRAMMAR = 'https://obsidian-orthography-api-mz8l64tz3-denisoed.vercel.app/check';

// Use self in events callbacks
let self;
class OrthographyPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.debounceGetDataFunc = debounce(this.onChangeText.bind(this), 500);
        this.getDataFunc = debounce(this.onRunFromPopup.bind(this), 0);
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            // ------ Init -------- //
            self = this;
            this.emitter = new obsidian.Events();
            const settings = new OrthographySettings(this, this.emitter);
            yield settings.loadSettings();
            this.settings = settings;
            // this.addSettingTab(new OrthographySettingTab(this.app, settings, this));
            // ------- Events -------- //
            this.emitter.on('orthography:open', this.onPopupOpen);
            this.emitter.on('orthography:close', this.onPopupClose);
            this.emitter.on('orthography:run', this.getDataFunc);
            this.emitter.on('orthography:replace', this.onReplaceWord);
            // Listen to changes in the editor
            this.app.workspace.on('editor-change', this.debounceGetDataFunc);
            setTimeout(() => {
                this.activeEditor = this.getEditor();
                this.initOrthographyToggler();
                this.initOrthographyPopup();
                this.initOrthographyEditor();
            }, 1000);
        });
    }
    onunload() {
        this.emitter.off('orthography:open', this.onPopupOpen);
        this.emitter.off('orthography:close', this.onPopupClose);
        this.emitter.off('orthography:run', this.onRunFromPopup);
        this.emitter.off('orthography:replace', this.onReplaceWord);
        this.app.workspace.off('editor-change', this.debounceGetDataFunc);
        this.toggler.destroy();
        this.popup.destroy();
        this.editor.destroy();
        this.hints = null;
        this.activeEditor = null;
    }
    initOrthographyToggler() {
        const { app, settings, emitter } = this;
        this.toggler = new OrthographyToggler(app, settings, emitter);
        this.toggler.init();
    }
    initOrthographyPopup() {
        const { app, settings, emitter } = this;
        this.popup = new OrthographyPopup(app, settings, emitter);
        this.popup.init();
    }
    initOrthographyEditor() {
        const { app, settings } = this;
        this.editor = new OrthographyEditor(app, settings, this.activeEditor);
        this.editor.init();
    }
    getEditor() {
        var _a;
        const activeLeaf = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        return (_a = activeLeaf === null || activeLeaf === void 0 ? void 0 : activeLeaf.sourceMode) === null || _a === void 0 ? void 0 : _a.cmEditor;
    }
    onChangeText() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.popup.created)
                return;
            this.runChecker();
        });
    }
    onRunFromPopup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.popup.created)
                return;
            this.editor.destroy();
            this.popup.setLoader();
            this.activeEditor = this.getEditor();
            if (this.activeEditor) {
                this.runChecker();
            }
            else {
                new obsidian.Notice(O_NOT_OPEN_FILE);
                this.onPopupClose();
            }
        });
    }
    runChecker() {
        return __awaiter(this, void 0, void 0, function* () {
            this.toggler.setLoading();
            if (!this.activeEditor)
                return;
            const text = this.activeEditor.getValue();
            this.hints = yield this.fetchData(text);
            if (this.hints instanceof TypeError) {
                this.popup.removeLoader();
                this.toggler.removeLoading();
                new obsidian.Notice(O_SERVER_ERROR);
                return;
            }
            if (this.hints && this.hints.alerts && this.hints.alerts.length) {
                const alerts = formatAlerts(this.hints.alerts);
                this.editor.highlightWords(alerts);
                this.popup.update({
                    alerts: sortAlerts(alerts)
                });
            }
            else {
                new obsidian.Notice(O_NO_ERROR);
                this.popup.removeLoader();
            }
            this.toggler.removeLoading();
        });
    }
    onPopupOpen() {
        self.popup.create();
    }
    onPopupClose() {
        self.editor.destroy();
        self.popup.destroy();
        self.toggler.reset();
        if (self.aborter) {
            self.aborter.abort();
            self.aborter = null;
        }
    }
    onReplaceWord(event) {
        const origWordLen = event.currentTarget.dataset.text.length;
        const newWord = event.currentTarget.dataset.toreplace;
        const begin = event.currentTarget.dataset.begin;
        const end = begin + origWordLen;
        self.editor.replaceWord({
            begin: +begin,
            end: +end,
            len: +origWordLen
        }, newWord);
    }
    fetchData(text) {
        return __awaiter(this, void 0, void 0, function* () {
            if (self.aborter)
                self.aborter.abort();
            self.popup.disable();
            self.aborter = new AbortController();
            const { signal } = self.aborter;
            const url = new URL(API_URL_GRAMMAR);
            const params = { text };
            Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
            try {
                const response = yield fetch(url, {
                    method: 'GET',
                    signal
                });
                self.aborter = null;
                return yield response.json();
            }
            catch (error) {
                return error;
            }
            finally {
                self.popup.enable();
            }
        });
    }
}

module.exports = OrthographyPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNyYy9zZXR0aW5ncy9vcnRob2dyYXBoeVNldHRpbmdzLnRzIiwic3JjL2Nzc0NsYXNzZXMudHMiLCJzcmMvY29uc3RhbnRzLnRzIiwic3JjL29ydGhvZ3JhcGh5L1VJRWxlbWVudHMvVUlDb250cm9scy50cyIsInNyYy9vcnRob2dyYXBoeS9VSUVsZW1lbnRzL1VJSGludHMudHMiLCJzcmMvb3J0aG9ncmFwaHkvVUlFbGVtZW50cy9VSUhpbnRzRmFsbGJhY2sudHMiLCJzcmMvb3J0aG9ncmFwaHkvVUlFbGVtZW50cy9VSUxvYWRlci50cyIsInNyYy9vcnRob2dyYXBoeS9VSUVsZW1lbnRzL1VJQmFyLnRzIiwic3JjL29ydGhvZ3JhcGh5L29ydGhvZ3JhcGh5UG9wdXAudHMiLCJzcmMvb3J0aG9ncmFwaHkvb3J0aG9ncmFwaHlUb2dnbGVyLnRzIiwic3JjL29ydGhvZ3JhcGh5L29ydGhvZ3JhcGh5RWRpdG9yLnRzIiwic3JjL29ydGhvZ3JhcGh5L2hlbHBlcnMvZGVib3VuY2UudHMiLCJzcmMvb3J0aG9ncmFwaHkvaGVscGVycy9mb3JtYXR0ZXJzLnRzIiwic3JjL2NvbmZpZy50cyIsInNyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSwgU3VwcHJlc3NlZEVycm9yLCBTeW1ib2wgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXNEZWNvcmF0ZShjdG9yLCBkZXNjcmlwdG9ySW4sIGRlY29yYXRvcnMsIGNvbnRleHRJbiwgaW5pdGlhbGl6ZXJzLCBleHRyYUluaXRpYWxpemVycykge1xyXG4gICAgZnVuY3Rpb24gYWNjZXB0KGYpIHsgaWYgKGYgIT09IHZvaWQgMCAmJiB0eXBlb2YgZiAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRnVuY3Rpb24gZXhwZWN0ZWRcIik7IHJldHVybiBmOyB9XHJcbiAgICB2YXIga2luZCA9IGNvbnRleHRJbi5raW5kLCBrZXkgPSBraW5kID09PSBcImdldHRlclwiID8gXCJnZXRcIiA6IGtpbmQgPT09IFwic2V0dGVyXCIgPyBcInNldFwiIDogXCJ2YWx1ZVwiO1xyXG4gICAgdmFyIHRhcmdldCA9ICFkZXNjcmlwdG9ySW4gJiYgY3RvciA/IGNvbnRleHRJbltcInN0YXRpY1wiXSA/IGN0b3IgOiBjdG9yLnByb3RvdHlwZSA6IG51bGw7XHJcbiAgICB2YXIgZGVzY3JpcHRvciA9IGRlc2NyaXB0b3JJbiB8fCAodGFyZ2V0ID8gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGNvbnRleHRJbi5uYW1lKSA6IHt9KTtcclxuICAgIHZhciBfLCBkb25lID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0ge307XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4pIGNvbnRleHRbcF0gPSBwID09PSBcImFjY2Vzc1wiID8ge30gOiBjb250ZXh0SW5bcF07XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4uYWNjZXNzKSBjb250ZXh0LmFjY2Vzc1twXSA9IGNvbnRleHRJbi5hY2Nlc3NbcF07XHJcbiAgICAgICAgY29udGV4dC5hZGRJbml0aWFsaXplciA9IGZ1bmN0aW9uIChmKSB7IGlmIChkb25lKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGFkZCBpbml0aWFsaXplcnMgYWZ0ZXIgZGVjb3JhdGlvbiBoYXMgY29tcGxldGVkXCIpOyBleHRyYUluaXRpYWxpemVycy5wdXNoKGFjY2VwdChmIHx8IG51bGwpKTsgfTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gKDAsIGRlY29yYXRvcnNbaV0pKGtpbmQgPT09IFwiYWNjZXNzb3JcIiA/IHsgZ2V0OiBkZXNjcmlwdG9yLmdldCwgc2V0OiBkZXNjcmlwdG9yLnNldCB9IDogZGVzY3JpcHRvcltrZXldLCBjb250ZXh0KTtcclxuICAgICAgICBpZiAoa2luZCA9PT0gXCJhY2Nlc3NvclwiKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHZvaWQgMCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgdHlwZW9mIHJlc3VsdCAhPT0gXCJvYmplY3RcIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBleHBlY3RlZFwiKTtcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmdldCkpIGRlc2NyaXB0b3IuZ2V0ID0gXztcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LnNldCkpIGRlc2NyaXB0b3Iuc2V0ID0gXztcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmluaXQpKSBpbml0aWFsaXplcnMudW5zaGlmdChfKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoXyA9IGFjY2VwdChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgIGlmIChraW5kID09PSBcImZpZWxkXCIpIGluaXRpYWxpemVycy51bnNoaWZ0KF8pO1xyXG4gICAgICAgICAgICBlbHNlIGRlc2NyaXB0b3Jba2V5XSA9IF87XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRhcmdldCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29udGV4dEluLm5hbWUsIGRlc2NyaXB0b3IpO1xyXG4gICAgZG9uZSA9IHRydWU7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19ydW5Jbml0aWFsaXplcnModGhpc0FyZywgaW5pdGlhbGl6ZXJzLCB2YWx1ZSkge1xyXG4gICAgdmFyIHVzZVZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluaXRpYWxpemVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhbHVlID0gdXNlVmFsdWUgPyBpbml0aWFsaXplcnNbaV0uY2FsbCh0aGlzQXJnLCB2YWx1ZSkgOiBpbml0aWFsaXplcnNbaV0uY2FsbCh0aGlzQXJnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1c2VWYWx1ZSA/IHZhbHVlIDogdm9pZCAwO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcHJvcEtleSh4KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHggPT09IFwic3ltYm9sXCIgPyB4IDogXCJcIi5jb25jYXQoeCk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zZXRGdW5jdGlvbk5hbWUoZiwgbmFtZSwgcHJlZml4KSB7XHJcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwic3ltYm9sXCIpIG5hbWUgPSBuYW1lLmRlc2NyaXB0aW9uID8gXCJbXCIuY29uY2F0KG5hbWUuZGVzY3JpcHRpb24sIFwiXVwiKSA6IFwiXCI7XHJcbiAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KGYsIFwibmFtZVwiLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IHByZWZpeCA/IFwiXCIuY29uY2F0KHByZWZpeCwgXCIgXCIsIG5hbWUpIDogbmFtZSB9KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XHJcbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19jcmVhdGVCaW5kaW5nID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihtLCBrKTtcclxuICAgIGlmICghZGVzYyB8fCAoXCJnZXRcIiBpbiBkZXNjID8gIW0uX19lc01vZHVsZSA6IGRlc2Mud3JpdGFibGUgfHwgZGVzYy5jb25maWd1cmFibGUpKSB7XHJcbiAgICAgICAgZGVzYyA9IHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfTtcclxuICAgIH1cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCBrMiwgZGVzYyk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IGZhbHNlIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgdikge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG59KSA6IGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIG9bXCJkZWZhdWx0XCJdID0gdjtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydFN0YXIobW9kKSB7XHJcbiAgICBpZiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSByZXR1cm4gbW9kO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG4gICAgaWYgKG1vZCAhPSBudWxsKSBmb3IgKHZhciBrIGluIG1vZCkgaWYgKGsgIT09IFwiZGVmYXVsdFwiICYmIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtb2QsIGspKSBfX2NyZWF0ZUJpbmRpbmcocmVzdWx0LCBtb2QsIGspO1xyXG4gICAgX19zZXRNb2R1bGVEZWZhdWx0KHJlc3VsdCwgbW9kKTtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2ltcG9ydERlZmF1bHQobW9kKSB7XHJcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IGRlZmF1bHQ6IG1vZCB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEdldChyZWNlaXZlciwgc3RhdGUsIGtpbmQsIGYpIHtcclxuICAgIGlmIChraW5kID09PSBcImFcIiAmJiAhZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlByaXZhdGUgYWNjZXNzb3Igd2FzIGRlZmluZWQgd2l0aG91dCBhIGdldHRlclwiKTtcclxuICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyICE9PSBzdGF0ZSB8fCAhZiA6ICFzdGF0ZS5oYXMocmVjZWl2ZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHJlYWQgcHJpdmF0ZSBtZW1iZXIgZnJvbSBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIGtpbmQgPT09IFwibVwiID8gZiA6IGtpbmQgPT09IFwiYVwiID8gZi5jYWxsKHJlY2VpdmVyKSA6IGYgPyBmLnZhbHVlIDogc3RhdGUuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHN0YXRlLCB2YWx1ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwibVwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBtZXRob2QgaXMgbm90IHdyaXRhYmxlXCIpO1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgc2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3Qgd3JpdGUgcHJpdmF0ZSBtZW1iZXIgdG8gYW4gb2JqZWN0IHdob3NlIGNsYXNzIGRpZCBub3QgZGVjbGFyZSBpdFwiKTtcclxuICAgIHJldHVybiAoa2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIsIHZhbHVlKSA6IGYgPyBmLnZhbHVlID0gdmFsdWUgOiBzdGF0ZS5zZXQocmVjZWl2ZXIsIHZhbHVlKSksIHZhbHVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZEluKHN0YXRlLCByZWNlaXZlcikge1xyXG4gICAgaWYgKHJlY2VpdmVyID09PSBudWxsIHx8ICh0eXBlb2YgcmVjZWl2ZXIgIT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHJlY2VpdmVyICE9PSBcImZ1bmN0aW9uXCIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHVzZSAnaW4nIG9wZXJhdG9yIG9uIG5vbi1vYmplY3RcIik7XHJcbiAgICByZXR1cm4gdHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciA9PT0gc3RhdGUgOiBzdGF0ZS5oYXMocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hZGREaXNwb3NhYmxlUmVzb3VyY2UoZW52LCB2YWx1ZSwgYXN5bmMpIHtcclxuICAgIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUgIT09IFwiZnVuY3Rpb25cIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBleHBlY3RlZC5cIik7XHJcbiAgICAgICAgdmFyIGRpc3Bvc2U7XHJcbiAgICAgICAgaWYgKGFzeW5jKSB7XHJcbiAgICAgICAgICAgIGlmICghU3ltYm9sLmFzeW5jRGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0Rpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgICAgICBkaXNwb3NlID0gdmFsdWVbU3ltYm9sLmFzeW5jRGlzcG9zZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkaXNwb3NlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgaWYgKCFTeW1ib2wuZGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5kaXNwb3NlIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgICAgICAgICAgZGlzcG9zZSA9IHZhbHVlW1N5bWJvbC5kaXNwb3NlXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBkaXNwb3NlICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJPYmplY3Qgbm90IGRpc3Bvc2FibGUuXCIpO1xyXG4gICAgICAgIGVudi5zdGFjay5wdXNoKHsgdmFsdWU6IHZhbHVlLCBkaXNwb3NlOiBkaXNwb3NlLCBhc3luYzogYXN5bmMgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChhc3luYykge1xyXG4gICAgICAgIGVudi5zdGFjay5wdXNoKHsgYXN5bmM6IHRydWUgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbnZhciBfU3VwcHJlc3NlZEVycm9yID0gdHlwZW9mIFN1cHByZXNzZWRFcnJvciA9PT0gXCJmdW5jdGlvblwiID8gU3VwcHJlc3NlZEVycm9yIDogZnVuY3Rpb24gKGVycm9yLCBzdXBwcmVzc2VkLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgZSA9IG5ldyBFcnJvcihtZXNzYWdlKTtcclxuICAgIHJldHVybiBlLm5hbWUgPSBcIlN1cHByZXNzZWRFcnJvclwiLCBlLmVycm9yID0gZXJyb3IsIGUuc3VwcHJlc3NlZCA9IHN1cHByZXNzZWQsIGU7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kaXNwb3NlUmVzb3VyY2VzKGVudikge1xyXG4gICAgZnVuY3Rpb24gZmFpbChlKSB7XHJcbiAgICAgICAgZW52LmVycm9yID0gZW52Lmhhc0Vycm9yID8gbmV3IF9TdXBwcmVzc2VkRXJyb3IoZSwgZW52LmVycm9yLCBcIkFuIGVycm9yIHdhcyBzdXBwcmVzc2VkIGR1cmluZyBkaXNwb3NhbC5cIikgOiBlO1xyXG4gICAgICAgIGVudi5oYXNFcnJvciA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgICAgIHdoaWxlIChlbnYuc3RhY2subGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciByZWMgPSBlbnYuc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmVjLmRpc3Bvc2UgJiYgcmVjLmRpc3Bvc2UuY2FsbChyZWMudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlYy5hc3luYykgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpLnRoZW4obmV4dCwgZnVuY3Rpb24oZSkgeyBmYWlsKGUpOyByZXR1cm4gbmV4dCgpOyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgZmFpbChlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZW52Lmhhc0Vycm9yKSB0aHJvdyBlbnYuZXJyb3I7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV4dCgpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBfX2V4dGVuZHM6IF9fZXh0ZW5kcyxcclxuICAgIF9fYXNzaWduOiBfX2Fzc2lnbixcclxuICAgIF9fcmVzdDogX19yZXN0LFxyXG4gICAgX19kZWNvcmF0ZTogX19kZWNvcmF0ZSxcclxuICAgIF9fcGFyYW06IF9fcGFyYW0sXHJcbiAgICBfX21ldGFkYXRhOiBfX21ldGFkYXRhLFxyXG4gICAgX19hd2FpdGVyOiBfX2F3YWl0ZXIsXHJcbiAgICBfX2dlbmVyYXRvcjogX19nZW5lcmF0b3IsXHJcbiAgICBfX2NyZWF0ZUJpbmRpbmc6IF9fY3JlYXRlQmluZGluZyxcclxuICAgIF9fZXhwb3J0U3RhcjogX19leHBvcnRTdGFyLFxyXG4gICAgX192YWx1ZXM6IF9fdmFsdWVzLFxyXG4gICAgX19yZWFkOiBfX3JlYWQsXHJcbiAgICBfX3NwcmVhZDogX19zcHJlYWQsXHJcbiAgICBfX3NwcmVhZEFycmF5czogX19zcHJlYWRBcnJheXMsXHJcbiAgICBfX3NwcmVhZEFycmF5OiBfX3NwcmVhZEFycmF5LFxyXG4gICAgX19hd2FpdDogX19hd2FpdCxcclxuICAgIF9fYXN5bmNHZW5lcmF0b3I6IF9fYXN5bmNHZW5lcmF0b3IsXHJcbiAgICBfX2FzeW5jRGVsZWdhdG9yOiBfX2FzeW5jRGVsZWdhdG9yLFxyXG4gICAgX19hc3luY1ZhbHVlczogX19hc3luY1ZhbHVlcyxcclxuICAgIF9fbWFrZVRlbXBsYXRlT2JqZWN0OiBfX21ha2VUZW1wbGF0ZU9iamVjdCxcclxuICAgIF9faW1wb3J0U3RhcjogX19pbXBvcnRTdGFyLFxyXG4gICAgX19pbXBvcnREZWZhdWx0OiBfX2ltcG9ydERlZmF1bHQsXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0OiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0LFxyXG4gICAgX19jbGFzc1ByaXZhdGVGaWVsZFNldDogX19jbGFzc1ByaXZhdGVGaWVsZFNldCxcclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRJbjogX19jbGFzc1ByaXZhdGVGaWVsZEluLFxyXG4gICAgX19hZGREaXNwb3NhYmxlUmVzb3VyY2U6IF9fYWRkRGlzcG9zYWJsZVJlc291cmNlLFxyXG4gICAgX19kaXNwb3NlUmVzb3VyY2VzOiBfX2Rpc3Bvc2VSZXNvdXJjZXMsXHJcbn07XHJcbiIsImltcG9ydCB0eXBlIHsgRXZlbnRzIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHR5cGUgT3J0aG9ncmFwaHlQbHVnaW4gZnJvbSAnLi4vbWFpbic7XG5cbmludGVyZmFjZSBTZXR0aW5nc0RhdGEge1xuICBkaXNwbGF5UnVubmVyOiBib29sZWFuO1xuICB1c2VHcmFtbWFyOiBib29sZWFuO1xuICBsYW5ndWFnZTogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiBnZXREZWZhdWx0RGF0YSgpOiBTZXR0aW5nc0RhdGEge1xuICByZXR1cm4ge1xuICAgIGRpc3BsYXlSdW5uZXI6IHRydWUsXG4gICAgdXNlR3JhbW1hcjogZmFsc2UsXG4gICAgbGFuZ3VhZ2U6ICdlbiwgcnUsIHVrJ1xuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgT3J0aG9ncmFwaHlTZXR0aW5ncyB7XG4gIHByaXZhdGUgZGF0YTogU2V0dGluZ3NEYXRhO1xuICBwcml2YXRlIGVtaXR0ZXI6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBsdWdpbjogT3J0aG9ncmFwaHlQbHVnaW4sIGVtaXR0ZXI6IEV2ZW50cykge1xuICAgIHRoaXMuZGF0YSA9IGdldERlZmF1bHREYXRhKCk7XG4gICAgdGhpcy5lbWl0dGVyID0gZW1pdHRlcjtcbiAgfVxuXG4gIGdldCBkaXNwbGF5UnVubmVyKCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcztcbiAgICByZXR1cm4gZGF0YS5kaXNwbGF5UnVubmVyO1xuICB9XG5cbiAgc2V0IGRpc3BsYXlSdW5uZXIodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXM7XG4gICAgZGF0YS5kaXNwbGF5UnVubmVyID0gdmFsdWU7XG4gICAgdGhpcy5lbWl0dGVyLnRyaWdnZXIoJ29uVXBkYXRlU2V0dGluZ3MnLCB0aGlzLmRhdGEpO1xuICB9XG5cbiAgZ2V0IHVzZUdyYW1tYXIoKTogYm9vbGVhbiB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzO1xuICAgIHJldHVybiBkYXRhLnVzZUdyYW1tYXI7XG4gIH1cblxuICBzZXQgdXNlR3JhbW1hcih2YWx1ZTogYm9vbGVhbikge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcztcbiAgICBkYXRhLnVzZUdyYW1tYXIgPSB2YWx1ZTtcbiAgICB0aGlzLmVtaXR0ZXIudHJpZ2dlcignb25VcGRhdGVTZXR0aW5ncycsIHRoaXMuZGF0YSk7XG4gIH1cblxuICBnZXQgbGFuZ3VhZ2UoKTogc3RyaW5nIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXM7XG4gICAgcmV0dXJuIGRhdGEubGFuZ3VhZ2U7XG4gIH1cblxuICBzZXQgbGFuZ3VhZ2UodmFsdWU6IHN0cmluZykge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcztcbiAgICBkYXRhLmxhbmd1YWdlID0gdmFsdWU7XG4gICAgdGhpcy5lbWl0dGVyLnRyaWdnZXIoJ29uVXBkYXRlU2V0dGluZ3MnLCB0aGlzLmRhdGEpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgcGx1Z2luIH0gPSB0aGlzO1xuICAgIHRoaXMuZGF0YSA9IE9iamVjdC5hc3NpZ24oZ2V0RGVmYXVsdERhdGEoKSwgYXdhaXQgcGx1Z2luLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgcGx1Z2luLCBkYXRhIH0gPSB0aGlzO1xuICAgIGlmIChwbHVnaW4gJiYgZGF0YSkge1xuICAgICAgYXdhaXQgcGx1Z2luLnNhdmVEYXRhKGRhdGEpO1xuICAgIH1cbiAgfVxufVxuIiwiLy8gR3JhbW1lciBwb3B1cFxuZXhwb3J0IGNvbnN0IE9fUE9QVVAgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAnO1xuZXhwb3J0IGNvbnN0IE9fUE9QVVBfRElTQUJMRUQgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtLWRpc2FibGVkJztcbmV4cG9ydCBjb25zdCBPX1BPUFVQX0NPTlRST0xTID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWNvbnRyb2xzJztcbmV4cG9ydCBjb25zdCBPX1BPUFVQX0lURU0gPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtaXRlbSc7XG5leHBvcnQgY29uc3QgT19QT1BVUF9SRVNJWkVEID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLS1yZXNpemVkJztcbmV4cG9ydCBjb25zdCBPX1BPUFVQX0lURU1fT1BFTkVEID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWl0ZW0tLW9wZW5lZCc7XG5leHBvcnQgY29uc3QgT19QT1BVUF9XT1JEX1RPX1JFUExBQ0UgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktd29yZC10by1yZXBsYWNlJztcblxuLy8gUnVubmVyXG5leHBvcnQgY29uc3QgT19SVU5ORVIgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcnVubmVyJztcbmV4cG9ydCBjb25zdCBPX1JVTk5FUl9BQ1RJVkUgPSAnb2JzaWRpYW4tb3J0aG9ncmFwaHktcnVubmVyLS1hY3RpdmUnO1xuZXhwb3J0IGNvbnN0IE9fUlVOTkVSX0NMRUFSID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXJ1bm5lci0tY2xlYXInO1xuZXhwb3J0IGNvbnN0IE9fUlVOTkVSX0hJRERFTiA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1ydW5uZXItLWhpZGRlbic7XG5leHBvcnQgY29uc3QgT19SVU5ORVJfTE9BRElORyA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1ydW5uZXItLWxvYWRpbmcnO1xuXG4vLyBUb29sdGlwXG5leHBvcnQgY29uc3QgT19UT09MVElQID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXRvb2x0aXAnO1xuZXhwb3J0IGNvbnN0IE9fVE9PTFRJUF9WSVNJQkxFID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXRvb2x0aXAtLXZpc2libGUnO1xuZXhwb3J0IGNvbnN0IE9fVE9PTFRJUF9ISU5UID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LXRvb2x0aXAtaGludCc7XG5cbi8vIEhpZ2hsaWdodFxuZXhwb3J0IGNvbnN0IE9fSElHSExJR0hUID0gJ29ic2lkaWFuLW9ydGhvZ3JhcGh5LWhpZ2hsaWdodCc7XG5leHBvcnQgY29uc3QgT19ISUdITElHSFRfRk9DVVNFRCA9ICdvYnNpZGlhbi1vcnRob2dyYXBoeS1oaWdobGlnaHQtLWZvY3VzZWQnO1xuIiwiZXhwb3J0IGNvbnN0IE9fUlVOTkVSX0lDT04gPSAn4oyYJztcbmV4cG9ydCBjb25zdCBPX1JVTk5FUl9JQ09OX0NMRUFSID0gJ+KclSc7XG5leHBvcnQgY29uc3QgT19OT1RfT1BFTl9GSUxFID0gJ1BsZWFzZSBvcGVuIGEgZmlsZSBmaXJzdC4nO1xuZXhwb3J0IGNvbnN0IE9fU0VSVkVSX0VSUk9SID1cbiAgJ1RoZSBzZXJ2ZXIgaXMgbm90IHJlc3BvbmRpbmcuIFBsZWFzZSBjaGVjayB5b3VyIEludGVybmV0IGNvbm5lY3Rpb24uJztcbmV4cG9ydCBjb25zdCBPX05PX0VSUk9SID0gJ1NwZWxsaW5nIGVycm9ycyBub3QgZm91bmQhJztcbiIsImNvbnN0IFVJQ29udHJvbHMgPSAoaGFzRGF0YTogYm9vbGVhbik6IHN0cmluZyA9PiB7XG4gIHJldHVybiBgXG4gICAgICA8ZGl2IGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtY29udHJvbHNcIj5cbiAgICAgICAgJHtcbiAgICAgICAgICBoYXNEYXRhXG4gICAgICAgICAgICA/ICc8YnV0dG9uIGlkPVwicmVsb2FkZXJcIiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLXJlbG9hZFwiIHRpdGxlPVwiUmVzdGFydCB0aGUgb3J0aG9ncmFwaHkgY2hlY2tlclwiPlJlbG9hZDwvYnV0dG9uPidcbiAgICAgICAgICAgIDogJydcbiAgICAgICAgfVxuICAgICAgICA8ZGl2IGlkPVwiY2xvc2VyXCIgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1jbG9zZVwiIHRpdGxlPVwiQ2xvc2UgcG9wdXBcIj7inJU8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVSUNvbnRyb2xzO1xuIiwiaW1wb3J0IHsgSURhdGEgfSBmcm9tICcuLi8uLi9pbnRlcmZhY2VzJztcblxuY29uc3QgSk9JTl9CWSA9ICc8c3BhbiBzdHlsZT1cIm9wYWNpdHk6IDAuNTtcIj5vcjwvc3Bhbj4mbmJzcDsnO1xuXG5jb25zdCByZW5kZXJIaW50cyA9IChjYXJkOiBJRGF0YSwgaW5kZXg6IG51bWJlcik6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHsgcmVwbGFjZW1lbnRzLCB0ZXh0LCBiZWdpbiwgaGlnaGxpZ2h0VGV4dCB9ID0gY2FyZDtcbiAgaWYgKGNhcmQuY2F0ZWdvcnkgPT09ICdEZXRlcm1pbmVycycpIHtcbiAgICByZXR1cm4gcmVwbGFjZW1lbnRzXG4gICAgICAubWFwKChpdGVtOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgZGF0YS10b3JlcGxhY2U9XCIke2l0ZW19XCJcbiAgICAgICAgICAgIGRhdGEtaW5kZXg9XCIke2luZGV4fVwiXG4gICAgICAgICAgICBkYXRhLWJlZ2luPVwiJHtiZWdpbn1cIlxuICAgICAgICAgICAgZGF0YS10ZXh0PVwiJHt0ZXh0fVwiXG4gICAgICAgICAgICBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXdvcmQtdG8tcmVwbGFjZSBvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1yZXBsYWNlbWVudFwiXG4gICAgICAgICAgICB0aXRsZT1cIkNsaWNrIHRvIGNvcnJlY3QgeW91ciBzcGVsbGluZ1wiPlxuICAgICAgICAgICAgICA8Yj4ke2l0ZW19PC9iPiZuYnNwJHtoaWdobGlnaHRUZXh0fVxuICAgICAgICAgIDwvc3Bhbj5gO1xuICAgICAgfSlcbiAgICAgIC5qb2luKEpPSU5fQlkpO1xuICB9XG4gIC8vIC0tLS0tLS0tLS0tIEZPUiBSRU1PVkUgSElOVFMgLS0tLS0tLS0tLS0gLy9cbiAgaWYgKFxuICAgIGNhcmQuY2F0ZWdvcnkgPT09ICdGb3JtYXR0aW5nJyB8fFxuICAgIGNhcmQuY2F0ZWdvcnkgPT09ICdCYXNpY1B1bmN0JyB8fFxuICAgIGNhcmQuY2F0ZWdvcnkgPT09ICdXb3JkaW5lc3MnIHx8XG4gICAgY2FyZC5jYXRlZ29yeSA9PT0gJ0Nvbmp1bmN0aW9ucydcbiAgKSB7XG4gICAgcmV0dXJuIGBcbiAgICAgIDxzcGFuXG4gICAgICAgIGRhdGEtYmVnaW49XCIke2JlZ2lufVwiXG4gICAgICAgIGRhdGEtdGV4dD1cIiR7dGV4dH1cIlxuICAgICAgICBkYXRhLXRvcmVwbGFjZT1cIiR7cmVwbGFjZW1lbnRzWzBdfVwiXG4gICAgICAgIGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktd29yZC10by1yZXBsYWNlIG9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWhpZ2h0bGlnaC0tcmVkXCI+JHtcbiAgICAgICAgICBoaWdobGlnaHRUZXh0IHx8ICcnXG4gICAgICAgIH1cbiAgICAgIDwvc3Bhbj5cbiAgICBgO1xuICB9XG4gIGlmIChjYXJkLmNhdGVnb3J5ID09PSAnUHJlcG9zaXRpb25zJykge1xuICAgIHJldHVybiByZXBsYWNlbWVudHNcbiAgICAgIC5tYXAoKGl0ZW06IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICA8c3BhblxuICAgICAgICAgIGRhdGEtdG9yZXBsYWNlPVwiJHtpdGVtfVwiXG4gICAgICAgICAgZGF0YS1pbmRleD1cIiR7aW5kZXh9XCJcbiAgICAgICAgICBkYXRhLWJlZ2luPVwiJHtiZWdpbn1cIlxuICAgICAgICAgIGRhdGEtdGV4dD1cIiR7aGlnaGxpZ2h0VGV4dH1cIlxuICAgICAgICAgIGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktd29yZC10by1yZXBsYWNlIG9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLXJlcGxhY2VtZW50XCJcbiAgICAgICAgICB0aXRsZT1cIkNsaWNrIHRvIGNvcnJlY3QgeW91ciBzcGVsbGluZ1wiXG4gICAgICAgID5cbiAgICAgICAgICA8Yj4ke2l0ZW19PC9iPiZuYnNwJHtoaWdobGlnaHRUZXh0fVxuICAgICAgICA8L3NwYW4+YDtcbiAgICAgIH0pXG4gICAgICAuam9pbihKT0lOX0JZKTtcbiAgfVxuICByZXR1cm4gcmVwbGFjZW1lbnRzXG4gICAgLm1hcCgoaXRlbTogc3RyaW5nKSA9PiB7XG4gICAgICByZXR1cm4gYFxuICAgICAgICA8c3BhbiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWNhcmQtLWxpbmUtdGhyb3VnaFwiPiR7aGlnaGxpZ2h0VGV4dH08L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgZGF0YS10b3JlcGxhY2U9XCIke2l0ZW19XCJcbiAgICAgICAgICBkYXRhLWluZGV4PVwiJHtpbmRleH1cIlxuICAgICAgICAgIGRhdGEtYmVnaW49XCIke2JlZ2lufVwiXG4gICAgICAgICAgZGF0YS10ZXh0PVwiJHt0ZXh0fVwiXG4gICAgICAgICAgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS13b3JkLXRvLXJlcGxhY2Ugb2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtcmVwbGFjZW1lbnRcIlxuICAgICAgICAgIHRpdGxlPVwiQ2xpY2sgdG8gY29ycmVjdCB5b3VyIHNwZWxsaW5nXCJcbiAgICAgICAgPlxuICAgICAgICAgICR7aXRlbX1cbiAgICAgICAgPC9zcGFuPmA7XG4gICAgfSlcbiAgICAuam9pbihKT0lOX0JZKTtcbn07XG5cbmNvbnN0IFVJSGludHMgPSAoYWxlcnRzOiBJRGF0YVtdKTogc3RyaW5nID0+IHtcbiAgaWYgKCFhbGVydHMgfHwgIWFsZXJ0cy5sZW5ndGgpIHJldHVybiAnJztcbiAgcmV0dXJuIGFsZXJ0c1xuICAgIC5tYXAoKGNhcmQ6IElEYXRhLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICBjb25zdCB7XG4gICAgICAgIGltcGFjdCxcbiAgICAgICAgaGlnaGxpZ2h0VGV4dCxcbiAgICAgICAgbWluaWNhcmRUaXRsZSxcbiAgICAgICAgZXhwbGFuYXRpb24sXG4gICAgICAgIGNhcmRMYXlvdXQsXG4gICAgICAgIGJlZ2luXG4gICAgICB9ID0gY2FyZDtcbiAgICAgIHJldHVybiBgXG4gICAgICAgICAgPGRpdiBkYXRhLWJlZ2luPVwiJHtiZWdpbn1cIiBpZD1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWl0ZW0tJHtpbmRleH1cIiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWl0ZW0gJHtpbXBhY3R9XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktcG9wdXAtbWluaWNhcmRcIj5cbiAgICAgICAgICAgICAgPGRpdj4ke2hpZ2hsaWdodFRleHQgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgICAgICR7XG4gICAgICAgICAgICAgICAgbWluaWNhcmRUaXRsZVxuICAgICAgICAgICAgICAgICAgPyBgPGRpdiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWl0ZW0tc3VnZ1wiPiR7bWluaWNhcmRUaXRsZX08L2Rpdj5gXG4gICAgICAgICAgICAgICAgICA6ICcnXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWFycm93c1wiPlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxMFwiIHZpZXdCb3g9XCIwIDAgMTAgMTBcIj48cGF0aCBkPVwiTTUgNC4zTC44NS4xNGMtLjItLjItLjUtLjItLjcgMC0uMi4yLS4yLjUgMCAuN0w1IDUuNyA5Ljg1Ljg3Yy4yLS4yLjItLjUgMC0uNy0uMi0uMi0uNS0uMi0uNyAwTDUgNC4yOHpcIiBzdHJva2U9XCJub25lXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDAgMykgcm90YXRlKDApXCI+PC9wYXRoPjwvc3ZnPlxuICAgICAgICAgICAgICAgIDxzdmcgd2lkdGg9XCIxMFwiIHZpZXdCb3g9XCIwIDAgMTAgMTBcIj48cGF0aCBkPVwiTTUgNC4zTC44NS4xNGMtLjItLjItLjUtLjItLjcgMC0uMi4yLS4yLjUgMCAuN0w1IDUuNyA5Ljg1Ljg3Yy4yLS4yLjItLjUgMC0uNy0uMi0uMi0uNS0uMi0uNyAwTDUgNC4yOHpcIiBzdHJva2U9XCJub25lXCIgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDAgMykgcm90YXRlKDApXCI+PC9wYXRoPjwvc3ZnPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9ic2lkaWFuLW9ydGhvZ3JhcGh5LXBvcHVwLWNhcmRcIj5cbiAgICAgICAgICAgICAgPGRpdj4ke2NhcmRMYXlvdXQuZ3JvdXAgfHwgJyd9PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS1wb3B1cC1jYXJkLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAke3JlbmRlckhpbnRzKGNhcmQsIGluZGV4KX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+JHtleHBsYW5hdGlvbiB8fCAnJ308L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0pXG4gICAgLmpvaW4oJycpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgVUlIaW50cztcbiIsImNvbnN0IFVJSGludHNGYWxsYmFjayA9ICgpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBoaW50c0ZhbGxiYWNrID0gYFxuICAgIDxkaXYgY2xhc3M9XCJvYnNpZGlhbi1vcnRob2dyYXBoeS1oaW50cy1mYWxsYmFja1wiPlxuICAgICAgPGJ1dHRvbiBpZD1cInJ1bm5lclwiPlxuICAgICAgICBSdW4gb3J0aG9ncmFwaHkgY2hlY2tcbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHA+QWxwaGEgdmVyc2lvbjwvcD5cbiAgICA8L2Rpdj5cbiAgYDtcblxuICByZXR1cm4gaGludHNGYWxsYmFjaztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFVJSGludHNGYWxsYmFjaztcbiIsImNvbnN0IFVJTG9hZGVyID0gKCk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IGxvYWRlciA9IGBcbiAgICA8ZGl2IGNsYXNzPVwib2JzaWRpYW4tb3J0aG9ncmFwaHktbG9hZGVyXCI+XG4gICAgICBDaGVja2luZy4uLlxuICAgIDwvZGl2PlxuICBgO1xuXG4gIHJldHVybiBsb2FkZXI7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVSUxvYWRlcjtcbiIsImltcG9ydCBVSUNvbnRyb2xzIGZyb20gJy4vVUlDb250cm9scyc7XG5pbXBvcnQgVUlIaW50cyBmcm9tICcuL1VJSGludHMnO1xuaW1wb3J0IHsgSUFsZXJ0IH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlcyc7XG5pbXBvcnQgVUlIaW50c0ZhbGxiYWNrIGZyb20gJy4vVUlIaW50c0ZhbGxiYWNrJztcbmltcG9ydCBVSUxvYWRlciBmcm9tICcuL1VJTG9hZGVyJztcblxuY29uc3QgVUlCYXIgPSAoZGF0YTogSUFsZXJ0LCBsb2FkaW5nOiBib29sZWFuKTogc3RyaW5nID0+IHtcbiAgY29uc3QgaGFzRGF0YSA9IGRhdGEgJiYgZGF0YS5hbGVydHMgJiYgZGF0YS5hbGVydHMubGVuZ3RoO1xuICBjb25zdCBjb250cm9sczogc3RyaW5nID0gVUlDb250cm9scyghIWhhc0RhdGEpO1xuICBjb25zdCBmYWxsYmFjayA9IGxvYWRpbmcgPyBVSUxvYWRlcigpIDogVUlIaW50c0ZhbGxiYWNrKCk7XG4gIGNvbnN0IGNhcmRzID0gaGFzRGF0YSA/IFVJSGludHMoZGF0YS5hbGVydHMpIDogZmFsbGJhY2s7XG4gIHJldHVybiBgJHtjb250cm9sc30ke2NhcmRzfWA7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBVSUJhcjtcbiIsImltcG9ydCB7IEFwcCwgRXZlbnRzLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBPcnRob2dyYXBoeVNldHRpbmdzIH0gZnJvbSAnc3JjL3NldHRpbmdzJztcbmltcG9ydCB7XG4gIE9fUE9QVVAsXG4gIE9fUE9QVVBfRElTQUJMRUQsXG4gIE9fUE9QVVBfQ09OVFJPTFMsXG4gIE9fUE9QVVBfSVRFTSxcbiAgT19QT1BVUF9SRVNJWkVELFxuICBPX1BPUFVQX0lURU1fT1BFTkVELFxuICBPX1BPUFVQX1dPUkRfVE9fUkVQTEFDRSxcbiAgT19ISUdITElHSFRfRk9DVVNFRFxufSBmcm9tICcuLi9jc3NDbGFzc2VzJztcbmltcG9ydCB7IE9fTk9UX09QRU5fRklMRSB9IGZyb20gJy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBJQWxlcnQgfSBmcm9tICcuLi9pbnRlcmZhY2VzJztcblxuaW1wb3J0IFVJQmFyIGZyb20gJy4vVUlFbGVtZW50cy9VSUJhcic7XG5cbmxldCBzZWxmOiBhbnk7XG5cbmV4cG9ydCBjbGFzcyBPcnRob2dyYXBoeVBvcHVwIHtcbiAgcHJpdmF0ZSBhcHA6IEFwcDtcbiAgcHJpdmF0ZSBzZXR0aW5nczogT3J0aG9ncmFwaHlTZXR0aW5ncztcbiAgcHJpdmF0ZSBlbWl0dGVyOiBhbnk7XG4gIHByaXZhdGUgc2l6ZXI6IGFueTtcbiAgcHJpdmF0ZSBtb3ZlcjogYW55O1xuICBwcml2YXRlIGNsb3NlcjogYW55O1xuICBwcml2YXRlIHJlbG9hZGVyOiBhbnk7XG4gIHByaXZhdGUgcnVubmVyOiBhbnk7XG4gIHByaXZhdGUgcG9wdXBPZmZzZXQ6IG51bWJlcltdID0gWzAsIDBdO1xuICBwcml2YXRlIG1vdmVyU2VsZWN0ZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBjcmVhdGVkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBPcnRob2dyYXBoeVNldHRpbmdzLCBlbWl0dGVyOiBFdmVudHMpIHtcbiAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgdGhpcy5lbWl0dGVyID0gZW1pdHRlcjtcbiAgfVxuXG4gIHB1YmxpYyBpbml0KCk6IHZvaWQge1xuICAgIHNlbGYgPSB0aGlzO1xuICB9XG5cbiAgcHVibGljIGNyZWF0ZSgpOiB2b2lkIHtcbiAgICBzZWxmLmNyZWF0ZWQgPSB0cnVlO1xuICAgIHNlbGYucG9wdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBzZWxmLnBvcHVwLmNsYXNzTGlzdC5hZGQoT19QT1BVUCk7XG4gICAgc2VsZi5wb3B1cC5pZCA9IE9fUE9QVVA7XG4gICAgY29uc3QgYmFyID0gVUlCYXIobnVsbCwgZmFsc2UpO1xuICAgIHNlbGYucG9wdXAuaW5uZXJIVE1MID0gYmFyO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2VsZi5wb3B1cCk7XG4gICAgc2VsZi5zZXRMaXN0ZW5lcnMoKTtcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgIHNlbGYuY3JlYXRlZCA9IGZhbHNlO1xuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgY29uc3QgcG9wdXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChPX1BPUFVQKTtcbiAgICBpZiAocG9wdXApIHBvcHVwLnJlbW92ZSgpO1xuICB9XG5cbiAgcHVibGljIHVwZGF0ZShkYXRhOiBJQWxlcnQsIGxvYWRpbmc/OiBib29sZWFuKTogdm9pZCB7XG4gICAgc2VsZi5yZW1vdmVMaXN0ZW5lcnMoKTtcbiAgICBjb25zdCBiYXIgPSBVSUJhcihkYXRhLCBsb2FkaW5nKTtcbiAgICBzZWxmLnBvcHVwLmlubmVySFRNTCA9IGJhcjtcbiAgICBzZWxmLnNldExpc3RlbmVycygpO1xuICB9XG5cbiAgcHVibGljIHNldExvYWRlcigpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZShudWxsLCB0cnVlKTtcbiAgfVxuXG4gIHB1YmxpYyByZW1vdmVMb2FkZXIoKTogdm9pZCB7XG4gICAgdGhpcy51cGRhdGUobnVsbCwgZmFsc2UpO1xuICB9XG5cbiAgcHVibGljIGRpc2FibGUoKTogdm9pZCB7XG4gICAgY29uc3QgaGludHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjJHtPX1BPUFVQfWApO1xuICAgIGlmIChoaW50cykge1xuICAgICAgaGludHMuY2xhc3NMaXN0LmFkZChPX1BPUFVQX0RJU0FCTEVEKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZW5hYmxlKCk6IHZvaWQge1xuICAgIGNvbnN0IGhpbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgIyR7T19QT1BVUH1gKTtcbiAgICBpZiAoaGludHMpIHtcbiAgICAgIGhpbnRzLmNsYXNzTGlzdC5yZW1vdmUoT19QT1BVUF9ESVNBQkxFRCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXRMaXN0ZW5lcnMoKSB7XG4gICAgY29uc3QgbWluaWNhcmRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7T19QT1BVUF9JVEVNfWApO1xuICAgIG1pbmljYXJkcy5mb3JFYWNoKChtYykgPT4gbWMuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLm9uQ2xpY2tCeUhpbnQpKTtcbiAgICBtaW5pY2FyZHMuZm9yRWFjaCgobWMpID0+XG4gICAgICBtYy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBzZWxmLm9uRm9jdXNXb3JkKVxuICAgICk7XG4gICAgbWluaWNhcmRzLmZvckVhY2goKG1jKSA9PlxuICAgICAgbWMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBzZWxmLm9uUmVtb3ZlRm9jdXNXb3JkKVxuICAgICk7XG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgIGAuJHtPX1BPUFVQX1dPUkRfVE9fUkVQTEFDRX1gXG4gICAgKTtcbiAgICByZXBsYWNlbWVudHMuZm9yRWFjaCgocnApID0+XG4gICAgICBycC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25SZXBsYWNlV29yZClcbiAgICApO1xuICAgIHNlbGYucmVsb2FkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVsb2FkZXInKTtcbiAgICBpZiAoc2VsZi5yZWxvYWRlcikge1xuICAgICAgc2VsZi5yZWxvYWRlci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25SdW4pO1xuICAgIH1cbiAgICBzZWxmLnJ1bm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdydW5uZXInKTtcbiAgICBpZiAoc2VsZi5ydW5uZXIpIHtcbiAgICAgIHNlbGYucnVubmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJ1bik7XG4gICAgfVxuICAgIHNlbGYuc2l6ZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2l6ZXInKTtcbiAgICBpZiAoc2VsZi5zaXplcikge1xuICAgICAgc2VsZi5zaXplci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25SZXNpemUpO1xuICAgIH1cbiAgICBzZWxmLmNsb3NlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjbG9zZXInKTtcbiAgICBpZiAoc2VsZi5jbG9zZXIpIHtcbiAgICAgIHNlbGYuY2xvc2VyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vbkNsb3NlKTtcbiAgICB9XG4gICAgc2VsZi5tb3ZlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke09fUE9QVVBfQ09OVFJPTFN9YCk7XG4gICAgaWYgKHNlbGYubW92ZXIpIHtcbiAgICAgIHNlbGYubW92ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgc2VsZi5tb3ZlcklzRG93bik7XG4gICAgfVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBzZWxmLm9uTW91c2VVcCk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgc2VsZi5vbk1vdXNlTW92ZSk7XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZUxpc3RlbmVycygpIHtcbiAgICBjb25zdCBtaW5pY2FyZHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAuJHtPX1BPUFVQX0lURU19YCk7XG4gICAgbWluaWNhcmRzLmZvckVhY2goKG1jKSA9PlxuICAgICAgbWMucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZWxmLm9uQ2xpY2tCeUhpbnQpXG4gICAgKTtcbiAgICBtaW5pY2FyZHMuZm9yRWFjaCgobWMpID0+XG4gICAgICBtYy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBzZWxmLm9uRm9jdXNXb3JkKVxuICAgICk7XG4gICAgbWluaWNhcmRzLmZvckVhY2goKG1jKSA9PlxuICAgICAgbWMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBzZWxmLm9uUmVtb3ZlRm9jdXNXb3JkKVxuICAgICk7XG4gICAgY29uc3QgcmVwbGFjZW1lbnRzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgIGAuJHtPX1BPUFVQX1dPUkRfVE9fUkVQTEFDRX1gXG4gICAgKTtcbiAgICByZXBsYWNlbWVudHMuZm9yRWFjaCgocnApID0+XG4gICAgICBycC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25SZXBsYWNlV29yZClcbiAgICApO1xuICAgIGlmIChzZWxmLnJlbG9hZGVyKSBzZWxmLnJlbG9hZGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJ1bik7XG4gICAgaWYgKHNlbGYucnVubmVyKSBzZWxmLnJ1bm5lci5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25SdW4pO1xuICAgIGlmIChzZWxmLnNpemVyKSBzZWxmLnNpemVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VsZi5vblJlc2l6ZSk7XG4gICAgaWYgKHNlbGYuY2xvc2VyKSBzZWxmLmNsb3Nlci5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGYub25DbG9zZSk7XG4gICAgaWYgKHNlbGYubW92ZXIpXG4gICAgICBzZWxmLm1vdmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHNlbGYubW92ZXJJc0Rvd24pO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBzZWxmLm9uTW91c2VVcCk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgc2VsZi5vbk1vdXNlTW92ZSk7XG4gIH1cblxuICBwcml2YXRlIG9uQ2xpY2tCeUhpbnQoZTogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3BlbmVkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgLiR7T19QT1BVUF9JVEVNX09QRU5FRH1gKTtcbiAgICBvcGVuZWQuZm9yRWFjaCgobykgPT4gby5jbGFzc0xpc3QucmVtb3ZlKE9fUE9QVVBfSVRFTV9PUEVORUQpKTtcbiAgICBpZiAoZS5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucyhPX1BPUFVQX0lURU1fT1BFTkVEKSkge1xuICAgICAgZS5jdXJyZW50VGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoT19QT1BVUF9JVEVNX09QRU5FRCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGUuY3VycmVudFRhcmdldC5jbGFzc0xpc3QuYWRkKE9fUE9QVVBfSVRFTV9PUEVORUQpO1xuICAgIH1cblxuICAgIGNvbnN0IGJlZ2luID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYmVnaW47XG4gICAgaWYgKGJlZ2luKSB7XG4gICAgICBzZWxmLnNjcm9sbFRvV29yZChiZWdpbik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtb3ZlcklzRG93bihlOiBhbnkpIHtcbiAgICBzZWxmLm1vdmVyU2VsZWN0ZWQgPSB0cnVlO1xuICAgIHNlbGYucG9wdXBPZmZzZXQgPSBbXG4gICAgICBzZWxmLnBvcHVwLm9mZnNldExlZnQgLSBlLmNsaWVudFgsXG4gICAgICBzZWxmLnBvcHVwLm9mZnNldFRvcCAtIGUuY2xpZW50WVxuICAgIF07XG4gIH1cblxuICBwcml2YXRlIG9uTW91c2VVcCgpIHtcbiAgICBzZWxmLm1vdmVyU2VsZWN0ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgb25Nb3VzZU1vdmUoZTogYW55KSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChzZWxmLm1vdmVyU2VsZWN0ZWQpIHtcbiAgICAgIGNvbnN0IG1vdXNlUG9zaXRpb24gPSB7XG4gICAgICAgIHg6IGUuY2xpZW50WCxcbiAgICAgICAgeTogZS5jbGllbnRZXG4gICAgICB9O1xuICAgICAgc2VsZi5wb3B1cC5zdHlsZS5sZWZ0ID0gYCR7bW91c2VQb3NpdGlvbi54ICsgc2VsZi5wb3B1cE9mZnNldFswXX1weGA7XG4gICAgICBzZWxmLnBvcHVwLnN0eWxlLnRvcCA9IGAke21vdXNlUG9zaXRpb24ueSArIHNlbGYucG9wdXBPZmZzZXRbMV19cHhgO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25SZXNpemUoKSB7XG4gICAgaWYgKHNlbGYucG9wdXAuY2xhc3NOYW1lLmNvbnRhaW5zKE9fUE9QVVBfUkVTSVpFRCkpIHtcbiAgICAgIHNlbGYucG9wdXAuY2xhc3NMaXN0LnJlbW92ZShPX1BPUFVQX1JFU0laRUQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLnBvcHVwLmNsYXNzTGlzdC5hZGQoT19QT1BVUF9SRVNJWkVEKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ2xvc2UoKSB7XG4gICAgc2VsZi5lbWl0dGVyLnRyaWdnZXIoJ29ydGhvZ3JhcGh5OmNsb3NlJyk7XG4gIH1cblxuICBwcml2YXRlIG9uRm9jdXNXb3JkKGU6IGFueSkge1xuICAgIGNvbnN0IGJlZ2luID0gZS5jdXJyZW50VGFyZ2V0LmRhdGFzZXQuYmVnaW47XG4gICAgY29uc3Qgd29yZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5iZWdpbi0ke2JlZ2lufWApO1xuICAgIGlmICh3b3JkKSB7XG4gICAgICB3b3JkLmNsYXNzTGlzdC5hZGQoT19ISUdITElHSFRfRk9DVVNFRCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvblJlbW92ZUZvY3VzV29yZCgpIHtcbiAgICBjb25zdCB3b3JkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke09fSElHSExJR0hUX0ZPQ1VTRUR9YCk7XG4gICAgd29yZHMuZm9yRWFjaCgodykgPT4gdy5jbGFzc0xpc3QucmVtb3ZlKE9fSElHSExJR0hUX0ZPQ1VTRUQpKTtcbiAgfVxuXG4gIHByaXZhdGUgb25SdW4oKSB7XG4gICAgc2VsZi5lbWl0dGVyLnRyaWdnZXIoJ29ydGhvZ3JhcGh5OnJ1bicpO1xuICB9XG5cbiAgcHJpdmF0ZSBvblJlcGxhY2VXb3JkKGV2ZW50OiBhbnkpIHtcbiAgICBzZWxmLmVtaXR0ZXIudHJpZ2dlcignb3J0aG9ncmFwaHk6cmVwbGFjZScsIGV2ZW50KTtcbiAgICBjb25zdCB7IGluZGV4IH0gPSBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQ7XG4gICAgY29uc3Qgc2VsZWN0ZWRJdGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYCR7T19QT1BVUF9JVEVNfS0ke2luZGV4fWApO1xuICAgIGlmIChzZWxlY3RlZEl0ZW0pIHNlbGVjdGVkSXRlbS5yZW1vdmUoKTtcbiAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke09fUE9QVVBfSVRFTX1gKS5sZW5ndGgpIHtcbiAgICAgIHNlbGYucmVtb3ZlTG9hZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbk9wZW5DYXJkKGV2ZW50OiBhbnkpIHtcbiAgICBjb25zdCB7IHZhbHVlOiBiZWdpbiB9ID0gZXZlbnQuY3VycmVudFRhcmdldC5hdHRyaWJ1dGVzLmJlZ2luO1xuICAgIGNvbnN0IHBvcHVwOiBhbnkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtPX1BPUFVQfWApO1xuICAgIGNvbnN0IG9wZW5lZCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke09fUE9QVVBfSVRFTV9PUEVORUR9YCk7XG4gICAgb3BlbmVkLmZvckVhY2goKG8pID0+IG8uY2xhc3NMaXN0LnJlbW92ZShPX1BPUFVQX0lURU1fT1BFTkVEKSk7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWJlZ2luPVwiJHtiZWdpbn1cIl1gKTtcbiAgICBzZWxlY3RlZC5jbGFzc0xpc3QuYWRkKE9fUE9QVVBfSVRFTV9PUEVORUQpO1xuICAgIHBvcHVwLnNjcm9sbFRvcCA9IHNlbGVjdGVkLm9mZnNldFRvcDtcbiAgfVxuXG4gIHByaXZhdGUgc2Nyb2xsVG9Xb3JkKGJlZ2luOiBudW1iZXIpIHtcbiAgICBjb25zdCBhY3RpdmVFZGl0b3IgPSBzZWxmLmdldEVkaXRvcigpO1xuICAgIGlmIChhY3RpdmVFZGl0b3IpIHtcbiAgICAgIGFjdGl2ZUVkaXRvci5zY3JvbGxUbygwLCArYmVnaW4gLSAzMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLm9uQ2xvc2UoKTtcbiAgICAgIG5ldyBOb3RpY2UoT19OT1RfT1BFTl9GSUxFKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldEVkaXRvcigpIHtcbiAgICBjb25zdCBhY3RpdmVMZWFmOiBhbnkgPSB0aGlzLmFwcC53b3Jrc3BhY2UuYWN0aXZlTGVhZjtcbiAgICBjb25zdCBzb3VyY2VNb2RlID0gYWN0aXZlTGVhZi52aWV3LnNvdXJjZU1vZGU7XG4gICAgaWYgKCFzb3VyY2VNb2RlKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gYWN0aXZlTGVhZi52aWV3LnNvdXJjZU1vZGUuY21FZGl0b3I7XG4gIH1cbn1cbiIsImltcG9ydCB7IEV2ZW50cywgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHR5cGUgeyBBcHAgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgeyBPcnRob2dyYXBoeVNldHRpbmdzIH0gZnJvbSAnLi4vc2V0dGluZ3MnO1xuaW1wb3J0IHtcbiAgT19SVU5ORVJfSUNPTixcbiAgT19SVU5ORVJfSUNPTl9DTEVBUixcbiAgT19OT1RfT1BFTl9GSUxFXG59IGZyb20gJy4uL2NvbnN0YW50cyc7XG5pbXBvcnQgeyBPX1JVTk5FUiwgT19SVU5ORVJfSElEREVOLCBPX1JVTk5FUl9MT0FESU5HIH0gZnJvbSAnLi4vY3NzQ2xhc3Nlcyc7XG5cbmludGVyZmFjZSBJT3J0aG9ncmFwaHlUb2dnbGVyIHtcbiAgaW5pdCgpOiB2b2lkO1xufVxuXG5sZXQgc2VsZjogYW55O1xuXG5leHBvcnQgY2xhc3MgT3J0aG9ncmFwaHlUb2dnbGVyIGltcGxlbWVudHMgSU9ydGhvZ3JhcGh5VG9nZ2xlciB7XG4gIHByaXZhdGUgYXBwOiBBcHA7XG4gIHByaXZhdGUgc2V0dGluZ3M6IE9ydGhvZ3JhcGh5U2V0dGluZ3M7XG4gIHByaXZhdGUgZW1pdHRlcjogYW55O1xuICBwcml2YXRlIHRvZ2dsZXI6IGFueTtcbiAgcHJpdmF0ZSBzaG93ZWQ6IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBzZXR0aW5nczogT3J0aG9ncmFwaHlTZXR0aW5ncywgZW1pdHRlcjogRXZlbnRzKSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xuICAgIHRoaXMuZW1pdHRlciA9IGVtaXR0ZXI7XG4gIH1cblxuICBwdWJsaWMgaW5pdCgpOiB2b2lkIHtcbiAgICBzZWxmID0gdGhpcztcbiAgICB0aGlzLmNyZWF0ZUJ1dHRvbihPX1JVTk5FUl9JQ09OKTtcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMucmVtb3ZlTG9hZGluZygpO1xuICAgIHRoaXMudG9nZ2xlci5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlKTtcbiAgICB0aGlzLnJlbW92ZUJ1dHRvbigpO1xuICB9XG5cbiAgcHVibGljIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICBjb25zdCBhY3RpdmVFZGl0b3IgPSBzZWxmLmdldEVkaXRvcigpO1xuICAgIGlmICghYWN0aXZlRWRpdG9yKSB7XG4gICAgICBpZiAoc2VsZi5zaG93ZWQpIHtcbiAgICAgICAgc2VsZi5zZXRCdXR0b25XaXRoUnVubmVyKCk7XG4gICAgICAgIHNlbGYuc2hvd2VkID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXcgTm90aWNlKE9fTk9UX09QRU5fRklMRSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHNlbGYuc2hvd2VkID0gIXNlbGYuc2hvd2VkO1xuICAgIGlmIChzZWxmLnNob3dlZCkge1xuICAgICAgc2VsZi5zZXRCdXR0b25XaXRoQ2xlYXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5zZXRCdXR0b25XaXRoUnVubmVyKCk7XG4gICAgfVxuICB9XG5cbiAgcHVibGljIGhpZGUoKTogdm9pZCB7XG4gICAgY29uc3QgcnVubmVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLicgKyBPX1JVTk5FUik7XG4gICAgcnVubmVyLmNsYXNzTGlzdC5hZGQoT19SVU5ORVJfSElEREVOKTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRMb2FkaW5nKCk6IHZvaWQge1xuICAgIHRoaXMudG9nZ2xlci5jbGFzc0xpc3QuYWRkKE9fUlVOTkVSX0xPQURJTkcpO1xuICB9XG5cbiAgcHVibGljIHJlbW92ZUxvYWRpbmcoKTogdm9pZCB7XG4gICAgdGhpcy50b2dnbGVyLmNsYXNzTGlzdC5yZW1vdmUoT19SVU5ORVJfTE9BRElORyk7XG4gIH1cblxuICBwdWJsaWMgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy5zaG93ZWQgPSBmYWxzZTtcbiAgICB0aGlzLnJlbW92ZUxvYWRpbmcoKTtcbiAgICB0aGlzLnVwZGF0ZUJ1dHRvblRleHQoT19SVU5ORVJfSUNPTik7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUJ1dHRvbih0ZXh0OiBzdHJpbmcpIHtcbiAgICB0aGlzLnRvZ2dsZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGljb24uaW5uZXJUZXh0ID0gdGV4dDtcbiAgICB0aGlzLnRvZ2dsZXIuY2xhc3NMaXN0LmFkZChPX1JVTk5FUik7XG4gICAgdGhpcy50b2dnbGVyLmFwcGVuZENoaWxkKGljb24pO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy50b2dnbGVyKTtcbiAgICB0aGlzLnRvZ2dsZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZSk7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZUJ1dHRvblRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgY29uc3QgdG9nZ2xlcjogSFRNTEVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtPX1JVTk5FUn0gc3BhbmApO1xuICAgIGlmICh0b2dnbGVyKSB0b2dnbGVyLmlubmVyVGV4dCA9IHRleHQ7XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZUJ1dHRvbigpIHtcbiAgICBjb25zdCB0b2dnbGVyOiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke09fUlVOTkVSfWApO1xuICAgIGlmICh0b2dnbGVyKSB0b2dnbGVyLnJlbW92ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRCdXR0b25XaXRoQ2xlYXIoKSB7XG4gICAgc2VsZi51cGRhdGVCdXR0b25UZXh0KE9fUlVOTkVSX0lDT05fQ0xFQVIpO1xuICAgIHNlbGYuZW1pdHRlci50cmlnZ2VyKCdvcnRob2dyYXBoeTpvcGVuJyk7XG4gIH1cblxuICBwcml2YXRlIHNldEJ1dHRvbldpdGhSdW5uZXIoKSB7XG4gICAgc2VsZi51cGRhdGVCdXR0b25UZXh0KE9fUlVOTkVSX0lDT04pO1xuICAgIHNlbGYucmVtb3ZlTG9hZGluZygpO1xuICAgIHNlbGYuZW1pdHRlci50cmlnZ2VyKCdvcnRob2dyYXBoeTpjbG9zZScpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3IoKSB7XG4gICAgY29uc3QgYWN0aXZlTGVhZjogYW55ID0gdGhpcy5hcHAud29ya3NwYWNlLmFjdGl2ZUxlYWY7XG4gICAgY29uc3Qgc291cmNlTW9kZSA9IGFjdGl2ZUxlYWYudmlldy5zb3VyY2VNb2RlO1xuICAgIGlmICghc291cmNlTW9kZSkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIGFjdGl2ZUxlYWYudmlldy5zb3VyY2VNb2RlLmNtRWRpdG9yO1xuICB9XG59XG4iLCJpbXBvcnQgeyBPcnRob2dyYXBoeVNldHRpbmdzIH0gZnJvbSAnLi4vc2V0dGluZ3MnO1xuaW1wb3J0IHR5cGUgeyBBcHAsIEVkaXRvciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IE9fSElHSExJR0hUIH0gZnJvbSAnLi4vY3NzQ2xhc3Nlcyc7XG5pbXBvcnQgeyBJT3JpZ2luYWxXb3JkLCBJRGF0YSB9IGZyb20gJ3NyYy9pbnRlcmZhY2VzJztcblxuaW50ZXJmYWNlIElPcnRob2dyYXBoeUVkaXRvciB7XG4gIGluaXQoKTogdm9pZDtcbn1cblxuaW50ZXJmYWNlIElHZXRDb2xSb3dSZXN1bHQge1xuICBjb2w6IG51bWJlcjtcbiAgcm93OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBPcnRob2dyYXBoeUVkaXRvciBpbXBsZW1lbnRzIElPcnRob2dyYXBoeUVkaXRvciB7XG4gIHByaXZhdGUgYXBwOiBBcHA7XG4gIHByaXZhdGUgc2V0dGluZ3M6IE9ydGhvZ3JhcGh5U2V0dGluZ3M7XG4gIHByaXZhdGUgZWRpdG9yOiBFZGl0b3I7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBPcnRob2dyYXBoeVNldHRpbmdzLCBlZGl0b3I6IEVkaXRvcikge1xuICAgIHRoaXMuYXBwID0gYXBwO1xuICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICB0aGlzLmVkaXRvciA9IGVkaXRvcjtcbiAgfVxuXG4gIHB1YmxpYyBpbml0KCk6IHZvaWQge1xuICAgIC8vIGluaXRcbiAgfVxuXG4gIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJIaWdobGlnaHRXb3JkcygpO1xuICB9XG5cbiAgcHVibGljIGhpZ2hsaWdodFdvcmRzKGFsZXJ0czogSURhdGFbXSk6IHZvaWQge1xuICAgIHRoaXMuY2xlYXJIaWdobGlnaHRXb3JkcygpO1xuXG4gICAgaWYgKCF0aGlzLmVkaXRvciB8fCAhYWxlcnRzIHx8IGFsZXJ0cy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGFsZXJ0cy5mb3JFYWNoKChhbGVydDogYW55KSA9PiB7XG4gICAgICBjb25zdCB0ZXh0TGVuZ3RoID0gYWxlcnQudGV4dC5sZW5ndGggfHwgYWxlcnQuaGlnaGxpZ2h0VGV4dC5sZW5ndGg7XG4gICAgICBjb25zdCBvcmlnaW5hbFdvcmQgPSB7XG4gICAgICAgIGJlZ2luOiBhbGVydC5iZWdpbixcbiAgICAgICAgZW5kOiBhbGVydC5lbmQsXG4gICAgICAgIGxlbjogdGV4dExlbmd0aFxuICAgICAgfTtcbiAgICAgIHRoaXMuaGlnaGxpZ2h0V29yZChvcmlnaW5hbFdvcmQpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBoaWdobGlnaHRXb3JkKG9yaWdpbmFsV29yZDoge1xuICAgIGJlZ2luOiBudW1iZXI7XG4gICAgZW5kOiBudW1iZXI7XG4gICAgbGVuOiBudW1iZXI7XG4gIH0pOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZWRpdG9yIHx8ICFvcmlnaW5hbFdvcmQpIHJldHVybjtcbiAgICBjb25zdCBjb2xSb3cgPSB0aGlzLmdldENvbFJvdyhvcmlnaW5hbFdvcmQpO1xuXG4gICAgaWYgKCFjb2xSb3cpIHJldHVybjtcbiAgICBjb25zdCB7IGNvbCwgcm93IH0gPSBjb2xSb3c7XG5cbiAgICB0aGlzLmVkaXRvci5hZGRIaWdobGlnaHRzKFxuICAgICAgW1xuICAgICAgICB7XG4gICAgICAgICAgZnJvbToge1xuICAgICAgICAgICAgbGluZTogcm93LFxuICAgICAgICAgICAgY2g6IGNvbFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdG86IHtcbiAgICAgICAgICAgIGxpbmU6IHJvdyxcbiAgICAgICAgICAgIGNoOiBjb2wgKyBvcmlnaW5hbFdvcmQubGVuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgYCR7T19ISUdITElHSFR9IGJlZ2luLSR7b3JpZ2luYWxXb3JkLmJlZ2lufWBcbiAgICApO1xuICB9XG5cbiAgcHVibGljIHJlcGxhY2VXb3JkKG9yaWdpbmFsV29yZDogSU9yaWdpbmFsV29yZCwgbmV3V29yZDogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmVkaXRvciB8fCAhb3JpZ2luYWxXb3JkIHx8ICFuZXdXb3JkKSByZXR1cm47XG4gICAgY29uc3QgY29sUm93ID0gdGhpcy5nZXRDb2xSb3cob3JpZ2luYWxXb3JkKTtcbiAgICBpZiAoIWNvbFJvdykgcmV0dXJuO1xuICAgIGNvbnN0IHsgY29sLCByb3cgfSA9IGNvbFJvdztcblxuICAgIGNvbnN0IGRvYyA9IHRoaXMuZWRpdG9yLmdldERvYygpO1xuXG4gICAgY29uc3QgZnJvbSA9IHtcbiAgICAgIGxpbmU6IHJvdyxcbiAgICAgIGNoOiBjb2xcbiAgICB9O1xuICAgIGNvbnN0IHRvID0ge1xuICAgICAgbGluZTogcm93LFxuICAgICAgY2g6IGNvbCArIG9yaWdpbmFsV29yZC5sZW5cbiAgICB9O1xuXG4gICAgZG9jLnJlcGxhY2VSYW5nZShuZXdXb3JkLCBmcm9tLCB0byk7XG4gIH1cblxuICBnZXRDb2xSb3cob3JpZ2luYWxXb3JkOiBJT3JpZ2luYWxXb3JkKTogSUdldENvbFJvd1Jlc3VsdCB7XG4gICAgaWYgKCF0aGlzLmVkaXRvciB8fCAhb3JpZ2luYWxXb3JkKSByZXR1cm47XG5cbiAgICBsZXQgdHRsID0gMDtcbiAgICBsZXQgcm93ID0gMDtcbiAgICBsZXQgcmVzdWx0O1xuICAgIGNvbnN0IHsgYmVnaW4gfSA9IG9yaWdpbmFsV29yZDtcblxuICAgIGNvbnN0IGxpbmVzID0gdGhpcy5lZGl0b3IubGluZUNvdW50KCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzOyBpKyspIHtcbiAgICAgIGNvbnN0IGxpbmVUZXh0ID0gdGhpcy5lZGl0b3IuZ2V0TGluZShpKTtcbiAgICAgIGNvbnN0IHMgPSB0dGwgPT09IDAgPyB0dGwgOiB0dGwgKyAxO1xuICAgICAgY29uc3QgbGluZVRleHRMZW5ndGggPSBsaW5lVGV4dC5sZW5ndGg7XG4gICAgICB0dGwgKz0gbGluZVRleHRMZW5ndGg7XG5cbiAgICAgIGlmIChyb3cgPiAwKSB7XG4gICAgICAgIHR0bCsrO1xuICAgICAgfVxuICAgICAgaWYgKGJlZ2luID49IHMgJiYgYmVnaW4gPD0gdHRsKSB7XG4gICAgICAgIGNvbnN0IGRpZmYgPSB0dGwgLSBsaW5lVGV4dExlbmd0aDtcbiAgICAgICAgY29uc3QgY29sID0gYmVnaW4gLSBkaWZmO1xuICAgICAgICByZXN1bHQgPSB7IGNvbCwgcm93IH07XG4gICAgICB9XG4gICAgICByb3crKztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJIaWdobGlnaHRXb3JkcygpOiB2b2lkIHtcbiAgICBjb25zdCBoaWdobGlnaHRXb3JkcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke09fSElHSExJR0hUfWApO1xuICAgIGhpZ2hsaWdodFdvcmRzLmZvckVhY2goKHNwYW4pID0+IHtcbiAgICAgIHRoaXMuZWRpdG9yLnJlbW92ZUhpZ2hsaWdodHMoc3Bhbi5jbGFzc05hbWUpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbnRlcmZhY2UgRGVib3VuY2VDYWxsYmFjayB7XG4gIGFwcGx5OiAoY3R4OiBhbnksIGFyZ3M6IGFueSkgPT4gdm9pZDtcbn1cblxuY29uc3QgZGVib3VuY2UgPSAoY2FsbGJhY2s6IERlYm91bmNlQ2FsbGJhY2ssIHRpbWVvdXQ6IG51bWJlcik6IGFueSA9PiB7XG4gIGxldCB0aW1lcjogYW55O1xuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgfSwgdGltZW91dCk7XG4gIH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWJvdW5jZTtcbiIsImltcG9ydCB7IElEYXRhIH0gZnJvbSAnc3JjL2ludGVyZmFjZXMnO1xuXG5leHBvcnQgY29uc3Qgc29ydEFsZXJ0cyA9IChhbGVydHM6IElEYXRhW10pOiBhbnkgPT4ge1xuICByZXR1cm4gYWxlcnRzLnNvcnQoKGE6IGFueSwgYjogYW55KSA9PiBhLmJlZ2luIC0gYi5iZWdpbik7XG59O1xuXG5leHBvcnQgY29uc3QgZm9ybWF0QWxlcnRzID0gKGFsZXJ0czogSURhdGFbXSk6IGFueSA9PiB7XG4gIGNvbnN0IHdpdGhvdXRIaWRkZW4gPSBhbGVydHMuZmlsdGVyKChhbGVydDogYW55KSA9PiBhbGVydC5oaWRkZW4gIT09IHRydWUpO1xuICBjb25zdCB3aXRob3V0RHVwbGljYXRlID0gd2l0aG91dEhpZGRlbi5yZWR1Y2UoKGFjYywgY3VycmVudCkgPT4ge1xuICAgIGNvbnN0IHggPSBhY2MuZmluZCgoaXRlbTogYW55KSA9PiBpdGVtLmV4cGxhbmF0aW9uID09PSBjdXJyZW50LmV4cGxhbmF0aW9uKTtcbiAgICBpZiAoIXgpIHtcbiAgICAgIHJldHVybiBhY2MuY29uY2F0KFtjdXJyZW50XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfVxuICB9LCBbXSk7XG4gIHJldHVybiB3aXRob3V0RHVwbGljYXRlO1xufTtcbiIsImV4cG9ydCBjb25zdCBBUElfVVJMX1NQRUxMRVIgPVxuICAnaHR0cHM6Ly9zcGVsbGVyLnlhbmRleC5uZXQvc2VydmljZXMvc3BlbGxzZXJ2aWNlLmpzb24vY2hlY2tUZXh0JztcbmV4cG9ydCBjb25zdCBBUElfVVJMX0dSQU1NQVIgPVxuICAnaHR0cHM6Ly9vYnNpZGlhbi1vcnRob2dyYXBoeS1hcGktbXo4bDY0dHozLWRlbmlzb2VkLnZlcmNlbC5hcHAvY2hlY2snO1xuIiwiaW1wb3J0IHsgUGx1Z2luLCBFdmVudHMsIE5vdGljZSwgTWFya2Rvd25WaWV3LCB0eXBlIEVkaXRvciB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IE9ydGhvZ3JhcGh5U2V0dGluZ3MgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7XG4gIE9ydGhvZ3JhcGh5RWRpdG9yLFxuICBPcnRob2dyYXBoeVBvcHVwLFxuICBPcnRob2dyYXBoeVRvZ2dsZXJcbn0gZnJvbSAnLi9vcnRob2dyYXBoeSc7XG5pbXBvcnQgZGVib3VuY2UgZnJvbSAnLi9vcnRob2dyYXBoeS9oZWxwZXJzL2RlYm91bmNlJztcbmltcG9ydCB7IHNvcnRBbGVydHMsIGZvcm1hdEFsZXJ0cyB9IGZyb20gJy4vb3J0aG9ncmFwaHkvaGVscGVycy9mb3JtYXR0ZXJzJztcbmltcG9ydCB7IEFQSV9VUkxfR1JBTU1BUiB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7IE9fTk9UX09QRU5fRklMRSwgT19TRVJWRVJfRVJST1IsIE9fTk9fRVJST1IgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbi8vIFVzZSBzZWxmIGluIGV2ZW50cyBjYWxsYmFja3NcbmxldCBzZWxmOiBhbnk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9ydGhvZ3JhcGh5UGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgcHJpdmF0ZSBzZXR0aW5nczogT3J0aG9ncmFwaHlTZXR0aW5ncztcbiAgcHJpdmF0ZSBwb3B1cDogYW55O1xuICBwcml2YXRlIHRvZ2dsZXI6IGFueTtcbiAgcHJpdmF0ZSBlZGl0b3I6IGFueTtcbiAgcHJpdmF0ZSBlbWl0dGVyOiBhbnk7XG4gIHByaXZhdGUgYWN0aXZlRWRpdG9yOiBFZGl0b3I7XG4gIHByaXZhdGUgYWJvcnRlcjogYW55O1xuICBwcml2YXRlIGhpbnRzOiBhbnk7XG4gIHByaXZhdGUgZGVib3VuY2VHZXREYXRhRnVuYyA9IGRlYm91bmNlKHRoaXMub25DaGFuZ2VUZXh0LmJpbmQodGhpcyksIDUwMCk7XG4gIHByaXZhdGUgZ2V0RGF0YUZ1bmMgPSBkZWJvdW5jZSh0aGlzLm9uUnVuRnJvbVBvcHVwLmJpbmQodGhpcyksIDApO1xuXG4gIGFzeW5jIG9ubG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyAtLS0tLS0gSW5pdCAtLS0tLS0tLSAvL1xuICAgIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFdmVudHMoKTtcblxuICAgIGNvbnN0IHNldHRpbmdzID0gbmV3IE9ydGhvZ3JhcGh5U2V0dGluZ3ModGhpcywgdGhpcy5lbWl0dGVyKTtcbiAgICBhd2FpdCBzZXR0aW5ncy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG5cbiAgICAvLyB0aGlzLmFkZFNldHRpbmdUYWIobmV3IE9ydGhvZ3JhcGh5U2V0dGluZ1RhYih0aGlzLmFwcCwgc2V0dGluZ3MsIHRoaXMpKTtcblxuICAgIC8vIC0tLS0tLS0gRXZlbnRzIC0tLS0tLS0tIC8vXG4gICAgdGhpcy5lbWl0dGVyLm9uKCdvcnRob2dyYXBoeTpvcGVuJywgdGhpcy5vblBvcHVwT3Blbik7XG4gICAgdGhpcy5lbWl0dGVyLm9uKCdvcnRob2dyYXBoeTpjbG9zZScsIHRoaXMub25Qb3B1cENsb3NlKTtcbiAgICB0aGlzLmVtaXR0ZXIub24oJ29ydGhvZ3JhcGh5OnJ1bicsIHRoaXMuZ2V0RGF0YUZ1bmMpO1xuICAgIHRoaXMuZW1pdHRlci5vbignb3J0aG9ncmFwaHk6cmVwbGFjZScsIHRoaXMub25SZXBsYWNlV29yZCk7XG4gICAgLy8gTGlzdGVuIHRvIGNoYW5nZXMgaW4gdGhlIGVkaXRvclxuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbignZWRpdG9yLWNoYW5nZScsIHRoaXMuZGVib3VuY2VHZXREYXRhRnVuYyk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gdGhpcy5nZXRFZGl0b3IoKTtcbiAgICAgIHRoaXMuaW5pdE9ydGhvZ3JhcGh5VG9nZ2xlcigpO1xuICAgICAgdGhpcy5pbml0T3J0aG9ncmFwaHlQb3B1cCgpO1xuICAgICAgdGhpcy5pbml0T3J0aG9ncmFwaHlFZGl0b3IoKTtcbiAgICB9LCAxMDAwKTtcbiAgfVxuXG4gIG9udW5sb2FkKCk6IHZvaWQge1xuICAgIHRoaXMuZW1pdHRlci5vZmYoJ29ydGhvZ3JhcGh5Om9wZW4nLCB0aGlzLm9uUG9wdXBPcGVuKTtcbiAgICB0aGlzLmVtaXR0ZXIub2ZmKCdvcnRob2dyYXBoeTpjbG9zZScsIHRoaXMub25Qb3B1cENsb3NlKTtcbiAgICB0aGlzLmVtaXR0ZXIub2ZmKCdvcnRob2dyYXBoeTpydW4nLCB0aGlzLm9uUnVuRnJvbVBvcHVwKTtcbiAgICB0aGlzLmVtaXR0ZXIub2ZmKCdvcnRob2dyYXBoeTpyZXBsYWNlJywgdGhpcy5vblJlcGxhY2VXb3JkKTtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub2ZmKCdlZGl0b3ItY2hhbmdlJywgdGhpcy5kZWJvdW5jZUdldERhdGFGdW5jKTtcbiAgICB0aGlzLnRvZ2dsZXIuZGVzdHJveSgpO1xuICAgIHRoaXMucG9wdXAuZGVzdHJveSgpO1xuICAgIHRoaXMuZWRpdG9yLmRlc3Ryb3koKTtcbiAgICB0aGlzLmhpbnRzID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGluaXRPcnRob2dyYXBoeVRvZ2dsZXIoKTogdm9pZCB7XG4gICAgY29uc3QgeyBhcHAsIHNldHRpbmdzLCBlbWl0dGVyIH0gPSB0aGlzO1xuICAgIHRoaXMudG9nZ2xlciA9IG5ldyBPcnRob2dyYXBoeVRvZ2dsZXIoYXBwLCBzZXR0aW5ncywgZW1pdHRlcik7XG4gICAgdGhpcy50b2dnbGVyLmluaXQoKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdE9ydGhvZ3JhcGh5UG9wdXAoKTogdm9pZCB7XG4gICAgY29uc3QgeyBhcHAsIHNldHRpbmdzLCBlbWl0dGVyIH0gPSB0aGlzO1xuICAgIHRoaXMucG9wdXAgPSBuZXcgT3J0aG9ncmFwaHlQb3B1cChhcHAsIHNldHRpbmdzLCBlbWl0dGVyKTtcbiAgICB0aGlzLnBvcHVwLmluaXQoKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5pdE9ydGhvZ3JhcGh5RWRpdG9yKCk6IHZvaWQge1xuICAgIGNvbnN0IHsgYXBwLCBzZXR0aW5ncyB9ID0gdGhpcztcbiAgICB0aGlzLmVkaXRvciA9IG5ldyBPcnRob2dyYXBoeUVkaXRvcihhcHAsIHNldHRpbmdzLCB0aGlzLmFjdGl2ZUVkaXRvcik7XG4gICAgdGhpcy5lZGl0b3IuaW5pdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRFZGl0b3IoKSB7XG4gICAgY29uc3QgYWN0aXZlTGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgcmV0dXJuIGFjdGl2ZUxlYWY/LnNvdXJjZU1vZGU/LmNtRWRpdG9yO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBvbkNoYW5nZVRleHQoKSB7XG4gICAgaWYgKCF0aGlzLnBvcHVwLmNyZWF0ZWQpIHJldHVybjtcbiAgICB0aGlzLnJ1bkNoZWNrZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgb25SdW5Gcm9tUG9wdXAoKSB7XG4gICAgaWYgKCF0aGlzLnBvcHVwLmNyZWF0ZWQpIHJldHVybjtcbiAgICB0aGlzLmVkaXRvci5kZXN0cm95KCk7XG4gICAgdGhpcy5wb3B1cC5zZXRMb2FkZXIoKTtcbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IHRoaXMuZ2V0RWRpdG9yKCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICB0aGlzLnJ1bkNoZWNrZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3IE5vdGljZShPX05PVF9PUEVOX0ZJTEUpO1xuICAgICAgdGhpcy5vblBvcHVwQ2xvc2UoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1bkNoZWNrZXIoKSB7XG4gICAgdGhpcy50b2dnbGVyLnNldExvYWRpbmcoKTtcbiAgICBpZiAoIXRoaXMuYWN0aXZlRWRpdG9yKSByZXR1cm47XG4gICAgY29uc3QgdGV4dCA9IHRoaXMuYWN0aXZlRWRpdG9yLmdldFZhbHVlKCk7XG4gICAgdGhpcy5oaW50cyA9IGF3YWl0IHRoaXMuZmV0Y2hEYXRhKHRleHQpO1xuICAgIGlmICh0aGlzLmhpbnRzIGluc3RhbmNlb2YgVHlwZUVycm9yKSB7XG4gICAgICB0aGlzLnBvcHVwLnJlbW92ZUxvYWRlcigpO1xuICAgICAgdGhpcy50b2dnbGVyLnJlbW92ZUxvYWRpbmcoKTtcbiAgICAgIG5ldyBOb3RpY2UoT19TRVJWRVJfRVJST1IpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5oaW50cyAmJiB0aGlzLmhpbnRzLmFsZXJ0cyAmJiB0aGlzLmhpbnRzLmFsZXJ0cy5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGFsZXJ0cyA9IGZvcm1hdEFsZXJ0cyh0aGlzLmhpbnRzLmFsZXJ0cyk7XG4gICAgICB0aGlzLmVkaXRvci5oaWdobGlnaHRXb3JkcyhhbGVydHMpO1xuICAgICAgdGhpcy5wb3B1cC51cGRhdGUoe1xuICAgICAgICBhbGVydHM6IHNvcnRBbGVydHMoYWxlcnRzKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ldyBOb3RpY2UoT19OT19FUlJPUik7XG4gICAgICB0aGlzLnBvcHVwLnJlbW92ZUxvYWRlcigpO1xuICAgIH1cbiAgICB0aGlzLnRvZ2dsZXIucmVtb3ZlTG9hZGluZygpO1xuICB9XG5cbiAgcHJpdmF0ZSBvblBvcHVwT3BlbigpIHtcbiAgICBzZWxmLnBvcHVwLmNyZWF0ZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBvblBvcHVwQ2xvc2UoKSB7XG4gICAgc2VsZi5lZGl0b3IuZGVzdHJveSgpO1xuICAgIHNlbGYucG9wdXAuZGVzdHJveSgpO1xuICAgIHNlbGYudG9nZ2xlci5yZXNldCgpO1xuICAgIGlmIChzZWxmLmFib3J0ZXIpIHtcbiAgICAgIHNlbGYuYWJvcnRlci5hYm9ydCgpO1xuICAgICAgc2VsZi5hYm9ydGVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uUmVwbGFjZVdvcmQoZXZlbnQ6IGFueSkge1xuICAgIGNvbnN0IG9yaWdXb3JkTGVuID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LnRleHQubGVuZ3RoO1xuICAgIGNvbnN0IG5ld1dvcmQgPSBldmVudC5jdXJyZW50VGFyZ2V0LmRhdGFzZXQudG9yZXBsYWNlO1xuICAgIGNvbnN0IGJlZ2luID0gZXZlbnQuY3VycmVudFRhcmdldC5kYXRhc2V0LmJlZ2luO1xuICAgIGNvbnN0IGVuZCA9IGJlZ2luICsgb3JpZ1dvcmRMZW47XG4gICAgc2VsZi5lZGl0b3IucmVwbGFjZVdvcmQoXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiArYmVnaW4sXG4gICAgICAgIGVuZDogK2VuZCxcbiAgICAgICAgbGVuOiArb3JpZ1dvcmRMZW5cbiAgICAgIH0sXG4gICAgICBuZXdXb3JkXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2hEYXRhKHRleHQ6IHN0cmluZyk6IFByb21pc2U8SlNPTj4ge1xuICAgIGlmIChzZWxmLmFib3J0ZXIpIHNlbGYuYWJvcnRlci5hYm9ydCgpO1xuICAgIHNlbGYucG9wdXAuZGlzYWJsZSgpO1xuXG4gICAgc2VsZi5hYm9ydGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHsgc2lnbmFsIH0gPSBzZWxmLmFib3J0ZXI7XG5cbiAgICBjb25zdCB1cmw6IGFueSA9IG5ldyBVUkwoQVBJX1VSTF9HUkFNTUFSKTtcbiAgICBjb25zdCBwYXJhbXM6IGFueSA9IHsgdGV4dCB9O1xuICAgIE9iamVjdC5rZXlzKHBhcmFtcykuZm9yRWFjaCgoa2V5KSA9PlxuICAgICAgdXJsLnNlYXJjaFBhcmFtcy5hcHBlbmQoa2V5LCBwYXJhbXNba2V5XSlcbiAgICApO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBzaWduYWxcbiAgICAgIH0pO1xuICAgICAgc2VsZi5hYm9ydGVyID0gbnVsbDtcbiAgICAgIHJldHVybiBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2VsZi5wb3B1cC5lbmFibGUoKTtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJzZWxmIiwiTm90aWNlIiwidGhpcyIsIlBsdWdpbiIsIkV2ZW50cyIsIk1hcmtkb3duVmlldyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFvR0E7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FB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
