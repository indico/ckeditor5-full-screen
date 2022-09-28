import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Maximize from '../theme/icons/maximize.svg';
import {CLOSE_ON_ESCAPE, CLOSE_ON_CLICK} from './config';

import '../theme/fullscreen.css';

let closeOnEscape, closeOnClick, button;
let isFullScreen = false;

// Close on escape
const onKeyDown = e => {
  if (closeOnEscape && e.key === 'Escape' && button && isFullScreen) {
    // If the full screen mode is active, prevent triggering any other event handler.
    e.stopPropagation();
    e.stopImmediatePropagation();
    button.fire('execute');
  }
};
// Attach the event handler as soon as possible in case the editor
// is rendered in a modal which can be closed with an escape
// (or anything else listening for keydown events that we don't want to accidentally trigger).
// This makes it possible to stop event propagation, which keeps the modal open.
document.addEventListener('keydown', onKeyDown, {capture: true});

export default class FullScreen extends Plugin {
  static get pluginName() {
    return 'FullScreen';
  }

  constructor(editor) {
    super(editor);
    this.set('isFullScreen', false);
    this.styles = {};
  }

  init() {
    const editor = this.editor;
    const t = editor.t;
    const rootElement = editor.editing.view.document.getRoot();

    // Set the default configuration
    editor.config.define(CLOSE_ON_ESCAPE, true);
    editor.config.define(CLOSE_ON_CLICK, true);
    closeOnEscape = editor.config.get(CLOSE_ON_ESCAPE);
    closeOnClick = editor.config.get(CLOSE_ON_CLICK);

    const maximize = () => {
      const wrapperElement = editor.ui.view.element;
      // Apply styles
      wrapperElement.classList.add('ck-plugin-full-screen');
      this.styles = {
        'height': rootElement.getStyle('height'),
        'overflow-y': rootElement.getStyle('overflow-y'),
      };
      // Dynamic style changes of the ckeditor root element should be done with a writer
      editor.editing.view.change(writer => {
        writer.setStyle({'height': '100%', 'overflow-y': 'scroll'}, rootElement);
      });
    };

    const minimize = () => {
      const wrapperElement = editor.ui.view.element;
      wrapperElement.classList.remove('ck-plugin-full-screen');
      editor.editing.view.change(writer => {
        this._restoreStyles(writer, rootElement);
      });
    };

    button = new ButtonView();
    button.set({
      label: t('Full screen'),
      icon: Maximize,
      tooltip: true,
    });

    // Make the toolbar button appear clicked when full screen is active
    button.bind('isOn').to(this, 'isFullScreen');

    // Close on background click
    const onClick = e => {
      if (e.target === e.currentTarget && this.isFullScreen) {
        e.stopPropagation();
        button.fire('execute');
      }
    };

    editor.ui.componentFactory.add('fullscreen', () => {
      const wrapperElement = editor.ui.view.element;

      button.on('execute', () => {
        if (!this.isFullScreen) {
          closeOnClick && wrapperElement.addEventListener('click', onClick);
          maximize();
        } else {
          closeOnClick && wrapperElement.removeEventListener('click', onClick);
          minimize();
        }
        this.isFullScreen = !this.isFullScreen;
        isFullScreen = this.isFullScreen;
        editor.editing.view.focus();
      });

      return button;
    });
  }

  _restoreStyle(writer, name, value, element) {
    value !== undefined ? writer.setStyle(name, value, element) : writer.removeStyle(name, element);
  }

  _restoreStyles(writer, element) {
    this._restoreStyle(writer, 'height', this.styles.height, element);
    this._restoreStyle(writer, 'overflow-y', this.styles['overflow-y'], element);
  }
}
