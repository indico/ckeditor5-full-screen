import Plugin from "@ckeditor/ckeditor5-core/src/plugin";
import ButtonView from "@ckeditor/ckeditor5-ui/src/button/buttonview";

import Maximize from "../theme/icons/maximize.svg";
import { CLOSE_ON_ESCAPE, CLOSE_ON_CLICK } from "./config";

import "../theme/fullscreen.css";

export default class FullScreen extends Plugin {
  static get pluginName() {
    return "FullScreen";
  }

  constructor(editor) {
    super(editor);
    this.set("isFullScreen", false);
    this.styles = {};
  }

  init() {
    const editor = this.editor;
    const t = editor.t;
    const rootElement = editor.editing.view.document.getRoot();

    // Set the default configuration
    editor.config.define(CLOSE_ON_ESCAPE, true);
    editor.config.define(CLOSE_ON_CLICK, true);

    const maximize = () => {
      const wrapperElement = editor.ui.view.element;
      // Make the wrapping div focusable so it can capture key presses
      wrapperElement.setAttribute("tabindex", "0");
      // Apply styles
      wrapperElement.classList.add("ck-plugin-full-screen");
      this.styles = {
        height: rootElement.getStyle("height"),
        "overflow-y": rootElement.getStyle("overflow-y"),
      };
      // Dynamic style changes of the ckeditor root element should be done with a writer
      editor.editing.view.change((writer) => {
        writer.setStyle(
          { height: "100%", "overflow-y": "scroll" },
          rootElement
        );
      });
    };

    const minimize = () => {
      const wrapperElement = editor.ui.view.element;
      wrapperElement.removeAttribute("tabindex");
      wrapperElement.classList.remove("ck-plugin-full-screen");
      editor.editing.view.change((writer) => {
        this._restoreStyles(writer, rootElement);
      });
    };

    editor.ui.componentFactory.add("fullscreen", () => {
      const wrapperElement = editor.ui.view.element;
      const button = new ButtonView();
      button.set({
        label: t("Full screen"),
        icon: Maximize,
        tooltip: true,
      });

      // Make the toolbar button appear clicked when full screen is active
      button.bind("isOn").to(this, "isFullScreen");

      const closeOnEscape = editor.config.get(CLOSE_ON_ESCAPE);
      const closeOnClick = editor.config.get(CLOSE_ON_CLICK);

      // Close on escape
      const onKeyDown = (e) => {
        if (e.key === "Escape" && this.isFullScreen) {
          button.fire("execute");
          e.stopPropagation();
        }
      };

      // Close on background click
      const onClick = (e) => {
        if (e.target === e.currentTarget && this.isFullScreen) {
          button.fire("execute");
          e.stopPropagation();
        }
      };

      button.on("execute", () => {
        if (!this.isFullScreen) {
          closeOnEscape &&
            wrapperElement.addEventListener("keydown", onKeyDown);
          closeOnClick && wrapperElement.addEventListener("click", onClick);
          maximize();
        } else {
          closeOnEscape &&
            wrapperElement.removeEventListener("keydown", onKeyDown);
          closeOnClick && wrapperElement.removeEventListener("click", onClick);
          minimize();
        }
        this.isFullScreen = !this.isFullScreen;
        editor.editing.view.focus();
      });

      return button;
    });
  }

  _restoreStyle(writer, name, value, element) {
    value !== undefined
      ? writer.setStyle(name, value, element)
      : writer.removeStyle(name, element);
  }

  _restoreStyles(writer, element) {
    this._restoreStyle(writer, "height", this.styles.height, element);
    this._restoreStyle(
      writer,
      "overflow-y",
      this.styles["overflow-y"],
      element
    );
  }
}
