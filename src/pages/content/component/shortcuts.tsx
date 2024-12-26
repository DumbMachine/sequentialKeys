import { createRoot } from "react-dom/client";
import { GlobalSettings } from "../Settings";
import * as utils from "../utils/utils";

// Constants for better performance and configurability
const VIEWPORT_MARGIN = 50; // px margin for viewport checks
const CACHE_DURATION = 1000; // ms to cache element positions
const MIN_ELEMENT_SIZE = 20; // minimum pixel size to show hint

// Cache viewport dimensions
let cachedViewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  timestamp: 0,
};

// Memoized element position checking
let elementPositionCache = new WeakMap<Element, DOMRect>();

// Optimized viewport check using cached values
const isInViewport = (element: Element): boolean => {
  const now = Date.now();

  // Update viewport cache if needed
  if (now - cachedViewport.timestamp > CACHE_DURATION) {
    cachedViewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      timestamp: now,
    };
  }

  // Use cached rect if available and recent
  let rect = elementPositionCache.get(element);
  if (!rect || now - (rect as any).timestamp > CACHE_DURATION) {
    rect = element.getBoundingClientRect();
    (rect as any).timestamp = now;
    elementPositionCache.set(element, rect);
  }

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
    (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );

  // console.log({
  //   text: getElementText(element as any),
  //   cachedViewport,
  //   rect,
  //   truth:
  //     rect.bottom >= -VIEWPORT_MARGIN &&
  //     rect.right >= -VIEWPORT_MARGIN &&
  //     rect.top <= cachedViewport.height + VIEWPORT_MARGIN &&
  //     rect.left <= cachedViewport.width + VIEWPORT_MARGIN &&
  //     rect.width >= MIN_ELEMENT_SIZE &&
  //     rect.height >= MIN_ELEMENT_SIZE,
  // });

  // return (
  //   rect.bottom >= -VIEWPORT_MARGIN &&
  //   rect.right >= -VIEWPORT_MARGIN &&
  //   rect.top <= cachedViewport.height + VIEWPORT_MARGIN &&
  //   rect.left <= cachedViewport.width + VIEWPORT_MARGIN &&
  //   rect.width >= MIN_ELEMENT_SIZE &&
  //   rect.height >= MIN_ELEMENT_SIZE
  // );
};

// Optimized text content extraction
const getElementText = (element: HTMLElement): string => {
  // Use a string array instead of concatenation for better performance
  const textParts: string[] = [];

  // Check most common cases first
  if (element.tagName === "INPUT") {
    const input = element as HTMLInputElement;
    textParts.push(input.placeholder || input.id || input.name || "");
  } else if (element.tagName === "BUTTON" || element.tagName === "DIV") {
    textParts.push(
      element.getAttribute("aria-label") ||
      element.title ||
      element.textContent?.trim() ||
      ""
    );
  } else {
    // textParts.push(element.textContent?.trim() || '');
    const getDirectTextContent = (
      element: Element,
      maxChildChecks: number = Infinity
    ): string => {
      let text = "";
      let childCount = 0;

      // Define common elements that usually contain text
      const textLikeTags = [
        "P",
        "SPAN",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "DIV",
      ];

      if (textLikeTags.includes(element.tagName)) {
        if (element.textContent) {
          return element.textContent;
        }
      }

      // Check for a title attribute on the element or its parent
      if (element.getAttribute("title")) {
        return element.getAttribute("title") || "";
      } else if (
        element.parentElement &&
        element.parentElement.getAttribute("title")
      ) {
        return element.parentElement.getAttribute("title") || "";
      }

      // // Check for the first child's title if present
      // const firstChildWithTitle = Array.from(element.children).find(child => child.getAttribute('title'));
      // if (firstChildWithTitle) {
      //   return firstChildWithTitle.getAttribute('title') || '';
      // }

      // Text not found in parent html, check children
      for (const node of element.childNodes) {
        if (childCount >= maxChildChecks) {
          break;
        }

        if (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent &&
          node.textContent.trim()
        ) {
          // text += node.textContent.trim();
          return node.textContent.trim();
        }

        // Check if the node is an element with a text-like tag
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          textLikeTags.includes((node as HTMLElement).tagName)
        ) {
          if (node.textContent) {
            return node.textContent;
          }
        }
        childCount++;
      }

      text = text.trim();

      // Return if we have direct text content
      if (text) {
        return text;
      }

      // If nothing is found, return an empty string
      return "";
    };

    // lazy tokenization of text content
    textParts.push(
      getDirectTextContent(element, 3)
        .trim()
        .replaceAll("-", " ")
        .replaceAll(":", " ")
        .replaceAll("_", " ")
    );
  }

  return textParts
    .join(" ")
    .replace(/[^a-zA-Z\s]+/g, "")
    .toLowerCase();
};

// Optimized shortcut generation
export const generateOptimizedShortcuts = (
  elements: string[],
  assignRandomForEmpty: boolean = true
): string[] => {
  const shortcuts = new Map<string, number>();
  const result = new Array<string>(elements.length);

  // Enhanced tokenization
  const getWords = (text: string): string[] =>
    text
      .toLowerCase()
      .split(/[\s\-_]+/)
      .filter((word) => word.length > 0);

  const isShortcutTaken = (shortcut: string): boolean =>
    shortcuts.has(shortcut);

  // Helper to get exactly 3 characters
  const normalizeToThree = (text: string): string => {
    if (!text) return "xxx";
    const base = text.toLowerCase();
    if (base.length >= 3) return base.slice(0, 3);
    return base.padEnd(3, base[base.length - 1]);
  };

  // Helper to get numbered version using 2 chars + digit
  const getNumberedShortcut = (baseWord: string): string => {
    const base = baseWord.slice(0, 2).toLowerCase();
    let digit = 1;
    let shortcut = "";

    do {
      shortcut = `${base}${digit}`;
      digit++;
      if (digit > 9) {
        // If we run out of single digits, start modifying the second character
        const firstChar = base[0];
        const secondChar = String.fromCharCode(
          "a".charCodeAt(0) + ((digit - 10) % 26)
        );
        shortcut = `${firstChar}${secondChar}${(digit % 9) + 1}`;
      }
    } while (isShortcutTaken(shortcut));

    return shortcut;
  };

  // Try to get a shortcut using different strategies
  const generateShortcut = (text: string, index: number) => {
    const words = getWords(text);

    // Handle empty or invalid text
    if (!text || words.length === 0) {
      if (assignRandomForEmpty) {
        const shortcut = getNumberedShortcut("xx");
        shortcuts.set(shortcut, index);
        result[index] = shortcut;
      }
      return;
    }

    const firstWord = words.slice(0, 2).join("");

    // Strategy 1: First three chars of first word
    const firstWordShortcut = normalizeToThree(firstWord);
    if (!isShortcutTaken(firstWordShortcut)) {
      shortcuts.set(firstWordShortcut, index);
      result[index] = firstWordShortcut;
      return;
    }

    // Strategy 2: Try initials if multiple words
    if (words.length > 1) {
      const initials = words
        .slice(0, 3)
        .map((word) => word[0])
        .join("");
      const normalizedInitials = normalizeToThree(initials);
      if (!isShortcutTaken(normalizedInitials)) {
        shortcuts.set(normalizedInitials, index);
        result[index] = normalizedInitials;
        return;
      }
    }

    // Fallback: Use 2 chars + digit
    const shortcut = getNumberedShortcut(firstWord);
    shortcuts.set(shortcut, index);
    result[index] = shortcut;
  };

  // Process all elements
  elements.forEach((text, index) => {
    generateShortcut(text, index);
  });

  return result;
};

export const setupHintsContainer = () => {
  const existingContainer = document.getElementById("pbs-hints");
  if (existingContainer) return existingContainer;

  const container = document.createElement("div");
  container.id = "pbs-hints";

  document.body.appendChild(container);
  return container;
};

// Main hint generation function
export const generateHints = (
  settings: GlobalSettings,
  containerElement: HTMLElement = document.body
) => {
  // Use a DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  const bodyRect = containerElement.getBoundingClientRect();

  const darkMode = isDarkMode();

  const st = Date.now();
  // const elements = utils.getClickableElements("*") as HTMLElement[];

  // Helper function to check if an element is actionable
  const isActionableElement = (element: Element): boolean => {
    const actionableTags = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];
    const role = element.getAttribute("role");

    return (
      actionableTags.includes(element.tagName) ||
      (role &&
        [
          "button",
          "link",
          "checkbox",
          "radio",
          "switch",
          "tab",
          "textbox",
        ].includes(role)) ||
      typeof (element as HTMLElement).onclick === "function"
      // || getComputedStyle(n).cursor === "pointer"
      // check if button is in className
      // || (element &&
      //   (element.className.includes("button") ||
      //     element.className.includes("btn")))
    );
  };

  console.time("shortcutElementFiltering");
  const elements = utils.getVisibleElements(function (
    e: HTMLElement,
    v: Array<HTMLElement>
  ) {
    // A hacky way to make sure, too many shortcuts aren't generated on the screen
    if ((v as any).length > 200) {
      return;
    }

    // Check if the element is actionable
    // if (utils.isElementClickable(e) || isActionableElement(e)) {
    if (isActionableElement(e)) {
      v.push(e);
    }
  }) as HTMLElement[];

  console.timeEnd("shortcutElementFiltering");

  // Filter and process elements
  const validElements = elements
    // .filter(isInViewport)
    .filter((element) => {
      const text = getElementText(element);
      if (element.textContent?.includes("motty")) {
        console.log({ text, element });
      }
      if (isInViewport(element)) return true;
      return false;
    })
    .map((element) => ({
      element,
      text: getElementText(element),
      rect: element.getBoundingClientRect(),
    }));

  // console.log({ before: elements.length, after: validElements.length });

  // Generate shortcuts
  const shortcuts = generateOptimizedShortcuts(
    validElements.map((e) => e.text)
  );

  // Create hints using React
  console.time("renderElements");
  validElements.forEach((item, index) => {
    const hintContainer = document.createElement("div");
    const root = createRoot(hintContainer);

    hintContainer.id = "hint";
    hintContainer.setAttribute("class", "tailwind");

    item.element.setAttribute("data-shortcut", shortcuts[index]);
    if (settings.DebugMode)
      item.element.setAttribute(
        "data-detected-data",
        getElementText(item.element)
      );

    const yOffset = 5;
    const xOffset = 5;

    root.render(
      <div
        style={{
          position: "absolute",
          left: item.rect.left + xOffset + "px",
          top: item.rect.top + yOffset + "px",
          width: item.rect.right - item.rect.left + "px",
          height: item.rect.bottom - item.rect.top + "px",
          zIndex: 2147483647,
          pointerEvents: "none",
        }}
      >
        <KeyboardShorty darkMode={darkMode} text={shortcuts[index]} />
      </div>
    );

    containerElement.appendChild(hintContainer);
  });
  console.timeEnd("renderElements");

  containerElement.appendChild(fragment);

  return {
    shortcuts,
    elements: validElements.map((v) => v.element),
    cleanup: () => {
      const hints = document.querySelectorAll("#hint");
      hints.forEach((hint) => {
        const root = createRoot(hint);
        root.unmount();
        hint.remove();
      });
      elementPositionCache = new WeakMap<Element, DOMRect>();
    },
  };
};

const lazyClassnames = (...classNames: string[]) => classNames.join(" ");

function isDarkMode() {
  // System preference
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Dark Reader detection
  const darkReaderActive =
    document.documentElement.getAttribute("data-darkreader-mode") === "dynamic";

  // Background color analysis
  const bgColor = window
    .getComputedStyle(document.body, null)
    .getPropertyValue("background-color");
  const rgb = bgColor.match(/\d+/g)?.map(Number);
  const isDarkBg =
    rgb && rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 128;

  // Common dark mode class/attribute checks
  const darkClasses =
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark" ||
    document.body.getAttribute("data-theme") === "dark" ||
    document.documentElement.dataset.theme === "dark" ||
    document.documentElement.getAttribute("color-scheme") === "dark";

  // Media query for color scheme
  const colorScheme = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme");
  const prefersColorSchemeDark = colorScheme.includes("dark");

  // console.debug({
  //   systemDark,
  //   darkReaderActive,
  //   isDarkBg,
  //   darkClasses,
  //   prefersColorSchemeDark
  // })

  return (
    systemDark ||
    darkReaderActive ||
    isDarkBg ||
    darkClasses ||
    prefersColorSchemeDark
  );
}

const KeyboardShorty = ({
  darkMode,
  text,
}: {
  darkMode: boolean;
  text: string;
}) => {
  return (
    <div className="fixed z-50 flex items-center pointer-events-none justify-center">
      <span
        id="hint-key"
        data-hint-text={text}
        className={lazyClassnames(
          "px-2 py-1 text-xs font-medium rounded-md shadow-sm transition-all duration-300 opacity-90 hover:opacity-100",
          darkMode
            ? "text-amber-100 bg-amber-900/60 hover:bg-amber-900/80"
            : "text-amber-900 bg-amber-100/60 hover:bg-amber-100/80"
        )}
      >
        {text}
      </span>
    </div>
  );

  return (
    <div className="fixed z-50 flex items-center justify-center pointer-events-none">
      <span
        id="hint-key"
        data-hint-text={text}
        // className={`px-1 text-xs text-gray-800 bg-yellow-300 rounded transition-opacity duration-500 opacity-100`}
        // className={`px-1 text-xs ${
        //   darkMode ? 'text-gray-100 bg-yellow-900' : 'text-gray-800 bg-yellow-300'
        // } rounded transition-opacity duration-500 opacity-100`}
        className={lazyClassnames(
          "px-1 text-xs rounded-md font-medium transition-all duration-300 opacity-80 hover:opacity-100",
          darkMode
            ? "text-gray-100 bg-yellow-800"
            : "text-gray-800 bg-yellow-300"
        )}
      >
        {text}
      </span>
    </div>
  );
};

export const removeHints = () => {
  const hints = document.querySelectorAll("#hint");
  hints.forEach((hint) => {
    const root = createRoot(hint);
    root.unmount();
    hint.remove();
  });
  elementPositionCache = new WeakMap<Element, DOMRect>();
};
