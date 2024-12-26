import { createRoot } from "react-dom/client";
import * as utils from "../utils/utils";


// Constants for better performance and configurability
const VIEWPORT_MARGIN = 50; // px margin for viewport checks
const CACHE_DURATION = 1000; // ms to cache element positions
const MIN_ELEMENT_SIZE = 20; // minimum pixel size to show hint


interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface HintPosition {
  element: HTMLElement;
  rect: Rect;
  preferredPosition: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
}

class HintPositionManager {
  private positions: HintPosition[] = [];
  private HINT_WIDTH = 24;  // Approximate width of hint
  private HINT_HEIGHT = 16; // Approximate height of hint
  private SPACING = 2;      // Minimum spacing between hints

  calculatePosition(elementRect: Rect): { left: number; top: number } {
    const positions: Array<{ left: number; top: number; score: number }> = [
      // Try top-left
      {
        left: elementRect.left,
        top: elementRect.top - this.HINT_HEIGHT - this.SPACING,
        score: 0
      },
      // Try top-right
      {
        left: elementRect.right - this.HINT_WIDTH,
        top: elementRect.top - this.HINT_HEIGHT - this.SPACING,
        score: 0
      },
      // Try bottom-left
      {
        left: elementRect.left,
        top: elementRect.bottom + this.SPACING,
        score: 0
      },
      // Try bottom-right
      {
        left: elementRect.right - this.HINT_WIDTH,
        top: elementRect.bottom + this.SPACING,
        score: 0
      }
    ];

    // Score each position based on overlaps
    positions.forEach(pos => {
      const hintRect = {
        left: pos.left,
        top: pos.top,
        right: pos.left + this.HINT_WIDTH,
        bottom: pos.top + this.HINT_HEIGHT,
        width: this.HINT_WIDTH,
        height: this.HINT_HEIGHT
      };

      // Check for overlaps with existing hints
      this.positions.forEach(existing => {
        if (this.doRectsOverlap(hintRect, existing.rect)) {
          pos.score -= 1;
        }
      });

      // Prefer positions that are fully visible in viewport
      if (pos.left < 0 || pos.top < 0) pos.score -= 2;
      if (pos.left + this.HINT_WIDTH > window.innerWidth) pos.score -= 2;
      if (pos.top + this.HINT_HEIGHT > window.innerHeight) pos.score -= 2;
    });

    // Get the position with highest score
    const bestPosition = positions.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // If all positions have overlaps, adjust the position
    if (bestPosition.score < 0) {
      // Find a free spot by moving diagonally
      let adjustedLeft = bestPosition.left;
      let adjustedTop = bestPosition.top;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const adjusted = {
          left: adjustedLeft,
          top: adjustedTop,
          right: adjustedLeft + this.HINT_WIDTH,
          bottom: adjustedTop + this.HINT_HEIGHT,
          width: this.HINT_WIDTH,
          height: this.HINT_HEIGHT
        };

        if (!this.positions.some(existing => this.doRectsOverlap(adjusted, existing.rect))) {
          bestPosition.left = adjustedLeft;
          bestPosition.top = adjustedTop;
          break;
        }

        adjustedLeft += this.SPACING;
        adjustedTop += this.SPACING;
        attempts++;
      }
    }

    // Add the new position to our tracked positions
    this.positions.push({
      element: document.createElement('div'), // placeholder
      rect: {
        left: bestPosition.left,
        top: bestPosition.top,
        right: bestPosition.left + this.HINT_WIDTH,
        bottom: bestPosition.top + this.HINT_HEIGHT,
        width: this.HINT_WIDTH,
        height: this.HINT_HEIGHT
      },
      preferredPosition: 'topLeft'
    });

    return {
      left: bestPosition.left,
      top: bestPosition.top
    };
  }

  private doRectsOverlap(rect1: Rect, rect2: Rect): boolean {
    return !(rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom);
  }

  reset() {
    this.positions = [];
  }
}

// Modified hint generation code
export const generateHints = (containerElement: HTMLElement = document.body) => {
  const positionManager = new HintPositionManager();
  const fragment = document.createDocumentFragment();
  const bodyRect = containerElement.getBoundingClientRect();
  const elements = utils.getClickableElements("*") as HTMLElement[];

  const validElements = elements
    .filter(element => {
      if (isInViewport(element)) return true;
      const text = getElementText(element);
      console.log({ text });
      if (text.includes("pricing")) console.log("pricing: ", { element, text });
      return false;
    })
    .map(element => ({
      element,
      text: getElementText(element),
      rect: element.getBoundingClientRect()
    }));

  const shortcuts = generateHNShortcuts(validElements.map(e => e.element));

  validElements.forEach((item, index) => {
    const hintContainer = document.createElement('div');
    const root = createRoot(hintContainer);
    hintContainer.id = 'hint';
    hintContainer.setAttribute('class', 'tailwind');

    const position = positionManager.calculatePosition(item.rect);

    root.render(
      <div
        style={{
          position: 'absolute',
          left: position.left + "px",
          top: position.top + "px",
          zIndex: 2147483647,
          pointerEvents: 'none',
        }}
      >
        <KeyboardShorty text={shortcuts[index]} />
      </div>
    );
    containerElement.appendChild(hintContainer);
  });

  containerElement.appendChild(fragment);

  return {
    shortcuts,
    elements: validElements.map(v => v.element),
    cleanup: () => {
      const hints = document.querySelectorAll('#hint');
      hints.forEach(hint => {
        const root = createRoot(hint);
        root.unmount();
        hint.remove();
      });
      elementPositionCache = new WeakMap<Element, DOMRect>();
      positionManager.reset();
    }
  };
};