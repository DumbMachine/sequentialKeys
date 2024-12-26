// Helper function to generate numbered shortcuts
const getNumberedShortcut = (
  base: string,
  shortcuts: Map<string, number>
): string => {
  if (!shortcuts.has(base)) {
    shortcuts.set(base, 0);
    return base;
  }

  let counter = 0;
  let shortcut: string;
  do {
    shortcut = `${base}${counter}`;
    counter++;
  } while (shortcuts.has(shortcut));

  return shortcut;
};

interface ShortcutRule {
  pattern: RegExp | ((element: HTMLElement) => boolean);
  generate: (element: HTMLElement, context: ShortcutContext) => string | null;
}

interface ShortcutContext {
  shortcuts: Map<string, number>;
  postIds: Map<string, string>; // Maps post IDs to their shortcuts
}

export const generateHNShortcuts = (elements: HTMLElement[]): string[] => {
  const shortcuts = new Map<string, number>();
  const postIds = new Map<string, string>();
  const result = new Array<string>(elements.length);

  // Context object passed to rules
  const context: ShortcutContext = {
    shortcuts,
    postIds,
  };

  // Define site-specific shortcut rules
  const rules: ShortcutRule[] = [
    // Skip rules
    {
      pattern: (el) => el.textContent?.includes("hours ago") || false,
      generate: () => null,
    },
    {
      pattern: (el) => el.textContent?.trim() === "reply" || false,
      generate: () => null,
    },

    // Post ID related shortcuts
    {
      pattern: /^(?:up|down)_(\d+)$/,
      generate: (el, ctx) => {
        const match = el.id.match(/^(?:up|down)_(\d+)$/);
        if (!match) return null;
        const postId = match[1];

        // Generate base shortcut if not exists
        if (!ctx.postIds.has(postId)) {
          const base = "p";
          const shortcut = getNumberedShortcut(base, ctx.shortcuts);
          ctx.postIds.set(postId, shortcut);
        }

        // Return the stored shortcut
        return ctx.postIds.get(postId) || null;
      },
    },

    // Update/Toggle buttons (like [–] buttons)
    {
      pattern: (el) => el.classList.contains("togg"),
      generate: (el, ctx) => {
        const parentId = el.closest(".comtr")?.id;
        if (!parentId) return null;

        if (!ctx.postIds.has(parentId)) {
          const base = "u";
          const shortcut = getNumberedShortcut(base, ctx.shortcuts);
          ctx.postIds.set(parentId, shortcut);
        }

        return ctx.postIds.get(parentId);
      },
    },

    // Navigation links (prev/next)
    {
      pattern: (el) => ["prev", "next"].includes(el.textContent?.trim() || ""),
      generate: (el) => {
        const text = el.textContent?.trim().toLowerCase() || "";
        return text.charAt(0);
      },
    },

    // Default text-based shortcut
    {
      pattern: () => true, // Catch-all
      generate: (el, ctx) => {
        const text = el.textContent?.trim();
        if (!text) return null;

        const words = text.toLowerCase().split(/[\s-]+/);
        const base = words[0].charAt(0);

        return getNumberedShortcut(base, ctx.shortcuts);
      },
    },
  ];

  // Apply rules to generate shortcuts
  elements.forEach((element, index) => {
    // Skip if already processed
    if (result[index]) return;

    // Find first matching rule
    for (const rule of rules) {
      if (
        (typeof rule.pattern === "function" && rule.pattern(element)) ||
        (rule.pattern instanceof RegExp && element.id.match(rule.pattern))
      ) {
        const shortcut = rule.generate(element, context);
        if (shortcut) {
          shortcuts.set(shortcut, index);
          result[index] = shortcut;
          break;
        }
      }
    }
  });

  return result;
};
