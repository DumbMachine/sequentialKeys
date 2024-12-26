import React, { useCallback } from "react";
import { Actions } from "./actions";
import { IShortcut, ShortcutType } from "./types";
// import { SUB_STRING_SIZE } from "./utils/utils.js";
import { generateHints, removeHints } from "./component/shortcuts";

import { useDebouncedCallback } from "use-debounce";
import { GlobalSettings, WebsiteSettings, useStorage } from "./Settings";

export const SUB_STRING_SIZE = 3;

export default function App() {
  const [globalSettings] = useStorage<GlobalSettings>();

  const [websiteSettings] = useStorage<WebsiteSettings>(
    window.location.host
  );

  const [debugMessages, setDebugMessages] = React.useState<string[]>([]);
  const debugTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Callback to update debug messages
  const updateDebugMessages = React.useCallback(
    (message: string, { append = true }: { append?: boolean } = {}) => {
      setDebugMessages((prev) => (append ? [...prev, message] : [message]));

      // // Clear any existing timeout
      // if (debugTimeoutRef.current) {
      //   clearTimeout(debugTimeoutRef.current);
      // }

      // Set a timer to clear messages after 5 seconds
      debugTimeoutRef.current = setTimeout(() => {
        // pop the first element
        setDebugMessages((prev) => prev.slice(1));
        // setDebugMessages([]);
      }, 1000);
    },
    []
  );

  // Function to instantly clear debug messages
  const clearDebugMessages = React.useCallback(() => {
    if (debugTimeoutRef.current) {
      clearTimeout(debugTimeoutRef.current);
    }
    setDebugMessages([]);
  }, []);

  const [state, setState] = React.useState<{
    show: boolean;
    options: string[];
    // actions: Map<string, () => void>;
    actions: {
      [key: string]: (element: HTMLElement) => Promise<void>;
    };
  }>({
    show: false,
    options: [],
    actions: {},
  });
  const [hints, setShowHints] = React.useState<boolean>(false);
  const [cheat, showCheat] = React.useState<boolean>(false);
  const [pallete, showPallete] = React.useState<boolean>(false);
  const [keys, setKeys] = React.useState<string>("");

  const hintsRef = React.useRef(hints);
  const keyRef = React.useRef(keys);
  const stateRef = React.useRef(state);

  const showRef = React.useRef({ cheat });

  keyRef.current = keys;
  stateRef.current = state;
  hintsRef.current = hints;

  // const regexShorty: {
  //   [key: string]: IShortcut;
  // } = {
  //   "t\\d+": {
  //     title: "Open tab",
  //     type: ShortcutType.shortcut,
  //     // @ts-ignore
  //     action: (input: string) => {
  //       const cleanInput = input.replaceAll("+", "").replace("t", "");
  //       console.log("swwitching to tab: ", cleanInput);
  //       if (cleanInput)
  //         chrome.runtime.sendMessage({
  //           type: IPC_EVENTS.SWITCH_TO_TAB,
  //           payload: { tabID: cleanInput },
  //         });
  //     },
  //   },
  // };

  const shorty: {
    [key: string]: IShortcut;
  } = {
    // "meta+/": {
    //   title: "Open pallete",
    //   type: ShortcutType.shortcut,
    //   action: (_) => {
    //     // setShowHints((prev) => !prev);
    //     // showCheat((prev) => !prev);
    //     showPallete(true);
    //   },
    // },
    "meta+.": {
      title: "See this cheatsheet",
      type: ShortcutType.shortcut,
      action: (_) => {
        // setShowHints((prev) => !prev);
        // showCheat((prev) => !prev);
        showCheat(true);
      },
    },
    j: {
      title: "Scroll down",
      type: ShortcutType.shortcut,
      action: Actions.scrollDownALittle,
    },
    k: {
      title: "Scroll up",
      type: ShortcutType.shortcut,
      action: Actions.scrollUpALittle,
    },
    "g+g": {
      title: "Scroll to up",
      type: ShortcutType.shortcut,
      action: Actions.scrollToTop,
    },
    // TODO: make this shift+g
    "shift+g": {
      title: "Scroll to bottom",
      type: ShortcutType.shortcut,
      action: Actions.scrollToBottom,
    },
    // x: {
    //   title: "Close Tab",
    //   type: ShortcutType.shortcut,
    //   action: Actions.closeTabWindow,
    // },
    // r: {
    //   title: "Refresh",
    //   type: ShortcutType.shortcut,
    //   action: Actions.documentReload,
    // },
    // NOTE: might as well just use the browser's default, <cmd>+[]
    // "[": {
    //   title: "Previous tab",
    //   action: Actions.goBackInHistory,
    // },
    // "]": {
    //   title: "Next tab",
    //   action: Actions.goForwardInHistory,
    // },
  };

  const logger = useCallback(
    (message: string, ...args: any[]) => {
      const prefix = "PBS: ";
      if (globalSettings?.DebugMode) {
        console.log(prefix, message, ...args);
      }
    },
    [globalSettings]
  );

  const highlightPotentialShortcuts = (prefix: string) => {
    const elements = document.querySelectorAll("#hint-key");
    elements.forEach((element) => {
      const span = element as HTMLSpanElement;
      const hintData = span.dataset.hintText;
      if (hintData?.startsWith(prefix)) {
        span.style.opacity = "1";
      } else {
        span.style.opacity = "0.1";
      }
    });
  };

  // TODO: ignore meta, ctrl, shift, alt keys
  const broadcastHints = (key: string) => {
    const undoStyleChange = (element: HTMLElement) => {
      // TODO: do this well
      element.style.backgroundColor = "";
      // element.style.backgroundColor = "#fbbf24";
    };

    if (!key) {
      // If no key, reset all styles
      document.querySelectorAll("[data-shortcut]").forEach((element) => {
        undoStyleChange(element as HTMLElement);
      });
      return;
    }

    if (!hintsRef.current) return;

    logger("broadcasting hints for key: ", key);
    // ignore if the key is a modifier key
    const keys = key
      .split("+")
      .filter((_) => !["meta", "ctrl", "shift", "alt"].includes(_));

    const activePrefix = keys.join("");
    // logger({ activePrefix });

    // Update the opacity
    return highlightPotentialShortcuts(activePrefix);

    // const elements = document.querySelectorAll("#hint-key");
    // elements.forEach((element) => {
    //   const span = element as HTMLSpanElement;
    //   const hintData = span.dataset.hintText;
    //   if (hintData?.startsWith(key)) {
    //     span.style.opacity = "1";
    //     // Find and highlight the original element
    //     const originalElement = document.querySelector(
    //       `[data-shortcut="${hintData}"]`
    //     );
    //     if (originalElement instanceof HTMLElement) {
    //       originalElement.style.backgroundColor = "#fbbf24";
    //     }
    //   } else {
    //     undoStyleChange(span);
    //     // Remove highlight from non-matching elements
    //     const originalElement = document.querySelector(
    //       `[data-shortcut="${hintData}"]`
    //     );
    //     if (originalElement instanceof HTMLElement) {
    //       undoStyleChange(originalElement);
    //     }
    //   }
    // });
  };

  // set keys state variable, then check all span with id=hint-key and up the opactiy of the one that matches the key prefixes
  const setKeysAndBroadast = React.useCallback(
    (key: string) => {
      setKeys(key);
      broadcastHints(keys + key);
    },
    [setKeys]
  );

  const concatShortcuts = (shortcuts: string[]) => {
    return shortcuts.filter((_) => _.length > 0).join("+");
  };

  const updateKeys = React.useCallback(
    (event: KeyboardEvent) => {
      const stopPropagation = () => {
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.preventDefault();
      };

      const isContentEditable = (element: EventTarget | null) => {
        if (element instanceof HTMLElement) {
          return element.isContentEditable;
        }
        return false;
      };

      const isFromForm =
        event.target instanceof HTMLFormElement ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;

      const isFromContentEditable = isContentEditable(event.target);

      if (isFromForm || isFromContentEditable) return;

      let key: string;
      // key = event.key.toLowerCase();
      if (event.shiftKey) {
        key = concatShortcuts(["shift", event.key.toLowerCase()]);
      } else if (event.ctrlKey) {
        key = "ctrl+" + event.key.toLowerCase();
      } else if (event.metaKey) {
        key = "meta+" + event.key.toLowerCase();
      } else {
        key = event.key.toLowerCase();
      }

      // logger("[key press]: ", key, event.target);
      updateDebugMessages(`[key press]: ${key}`, { append: true });

      const isHintsKeys = key === "f";

      // if (appCtx.WebSettings.PropagateNone) stopPropagation();

      // EVENT: ENABLE_HINTS
      if (isHintsKeys && !hintsRef.current) {
        // hints are not toggled, and this is the toggle event
        logger("enabling hints");
        updateDebugMessages("enabling hints", { append: false });
        setShowHints(true);
        stopPropagation();
        clearKeysNow();
        return;
      }

      // EVENT: DISABLE_HINTS
      if (
        hintsRef.current &&
        key === "escape" &&
        // AFAIK keyCode 229 means that user pressed some button, but input method is still processing that
        // ref: https://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
        event.keyCode !== 229
      ) {
        // hints are enabled, and this is the toggle event
        logger("removing hints");
        setShowHints(false);
        stopPropagation();
        return;
      }

      // EVENT: DISABLE_CHEATSHEET
      if (showRef.current.cheat && key === "escape" && event.keyCode !== 229) {
        logger("disabling cheatsheet");
        showCheat(false);
        stopPropagation();
        return;
      }

      const newCombo = concatShortcuts([keyRef.current, key]);
      // logger({ key, newCombo });

      // EVENT: IS_VALID_HINT
      if (
        hintsRef.current &&
        stateRef.current.options
          .map((_) => concatShortcuts(_.split("")))
          .includes(newCombo)
      ) {
        const action = stateRef.current.actions[newCombo.split("+").join("")];
        if (action) {
          action(document.body).then(() => {
            setShowHints(false);
            clearKeysNow();
          });
        }
        // appCtx.WebSettings.PropagateAllExceptHints && stopPropagation();
        return;
      }

      // EVENT: IS_SHOTY_SHORTCUT
      // If hints are not toggled, the keystroke/s can be part of the shoty shortcut
      // EVENT: IS_SHOTY_SHORTCUT_SINGLE
      if (!hintsRef.current && Object.keys(shorty).includes(key)) {
        const action = shorty[key];

        if (action) {
          logger("detected shortcut: ", {
            key,
            action: action.title,
          });

          shorty[key].action(document.body);
          stopPropagation();
          clearKeysNow();
          return;
        }
      }

      // EVENT: IS_SHOTY_SHORTCUT_COMBINATION
      if (!hintsRef.current && Object.keys(shorty).includes(newCombo)) {
        // logger("found valid shortcut for key combination: ", newCombo);

        const action = shorty[newCombo];
        if (action) {
          logger("detected combination-shortcut:", {
            newCombo,
            action: action.title,
          });

          shorty[newCombo].action(document.body);
          stopPropagation();
          clearKeysNow();
          return;
        }
      }

      // EVENT: SHORTCUT_BY_REGEX
      // const regexShortcuts = Object.keys(regexShorty).find((_) =>
      //   new RegExp(_).test(newCombo.replaceAll("+", ""))
      // );
      // if (!hintsRef.current && regexShortcuts) {
      //   logger("regex: ", newCombo);

      //   const action = regexShorty[regexShortcuts];
      //   if (action) {
      //     regexShorty[regexShortcuts].action(newCombo);
      //     stopPropagation();
      //     clearKeysNow();
      //     return;
      //   }
      // }

      // EVENT: SHORTCUT_KEY_OVERFLOW
      // +2 for indices on the shortcuts, i.e max 21 of the same shortcut keys
      if (newCombo.replace("+", "").length > SUB_STRING_SIZE + 2) {
        // max lenght reached, clear keys instantly
        logger("[overflow] clear keys");
        setKeysAndBroadast(key);
        // clearing keys
        return;
      }

      // there was not match for the event, stopPropagation if hints are enabled
      // so mid hint activation, no native browser shortcuts are triggered
      if (hintsRef.current) {
        stopPropagation();
      }

      // no valid hits, just store the key in memory
      setKeysAndBroadast(newCombo);
      clearKeys();

      return;
    },
    [state, keys]
  );

  const clearKeys = useDebouncedCallback(() => {
    setKeysAndBroadast("");
  }, 1000);

  const clearKeysNow = () => {
    setKeysAndBroadast("");
  };

  const setNewShortcut = (options: IShortcut[]) => {
    const newActions = options.reduce((acc, { key, action }) => {
      return {
        ...acc,
        [key]: action,
      };
    }, {});

    setState((old) => {
      return {
        ...old,
        actions: newActions,
        options: options.map((_) => _.key),
      };
    });
  };


  React.useEffect(() => {
    if (!globalSettings) {
      // if for some reason the settings haven't been loaded, then don't proceed with rendering
      return;
    }

    if (!hints) {
      removeHints();
      return;
    }

    const { shortcuts, elements } = generateHints(globalSettings);

    setNewShortcut(
      shortcuts.map(
        (key, index): IShortcut => ({
          key,
          title: key,
          type: ShortcutType.hint,
          action: async () => {
            const element = elements[index];
            if (element instanceof HTMLInputElement) {
              element.scrollIntoView();
              element.focus();
              element.select();
            } else if (element instanceof HTMLSelectElement) {
              element.dispatchEvent(new MouseEvent("mousedown"));
            } else {
              logger("clicking on shortcut", element);
              element.click();
            }
          },
          hover: async () => {
            const element = elements[index];
            const rect = element.getBoundingClientRect();
            element.dispatchEvent(
              new MouseEvent("mouseover", {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: rect.left,
                clientY: rect.top,
              })
            );
          },
        })
      )
    );
  }, [hints, globalSettings]);

  React.useEffect(() => {
    const isEnabled =
      globalSettings &&
      globalSettings.Enabled &&
      websiteSettings &&
      websiteSettings.Enabled;

    if (!isEnabled) {
      logger("PBS Disabled");
      return;
    }

    updateDebugMessages("PBS Initialized", { append: false });
    document.addEventListener("keydown", updateKeys, true);

    return () => {
      if (debugTimeoutRef.current) {
        clearTimeout(debugTimeoutRef.current);
      }

      document.removeEventListener("keydown", updateKeys, true);
    };
  }, [globalSettings, websiteSettings]);

  // dark
  return (
    <div
      id="pbs-extension"
      className="tailwind fixed top-5 right-5 max-w-xs w-full bg-gray-800 text-gray-100 rounded-lg shadow-md opacity-75 transition-opacity hover:opacity-100 z-999"
    >
      {globalSettings && globalSettings.DebugMode && debugMessages.length > 0 && (
        <div className="p-2 text-xs">
          {debugMessages.map((msg, index) => (
            <div key={index} className="py-1 border-b border-gray-600 last:border-b-0">
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // light
  return (
    <div
      id="pbs-extension"
      className="tailwind fixed top-5 right-5 max-w-xs w-full bg-gray-100 text-gray-700 rounded-lg shadow-md opacity-75 transition-opacity hover:opacity-100 z-999"
    >
      {/* <div className="space-y-1 max-h-40 overflow-y-auto text-xs"> */}
      {globalSettings && globalSettings.DebugMode && debugMessages.length > 0 && (
        <div className="p-2 text-xs">
          {debugMessages.map((msg, index) => (
            <div key={index} className="py-1 border-b border-gray-200 last:border-b-0">
              {msg}
            </div>
          ))}
        </div>
      )}
      {/* </div> */}
    </div>
  )


}
