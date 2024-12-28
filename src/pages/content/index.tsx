import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";

// MutationObserver approach to handle document.body
const waitForBody = () => {
  return new Promise<void>((resolve) => {
    if (document.body) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.body) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
};

// Main initialization function
const initializeApp = async () => {
  try {
    await waitForBody();

    const div = document.createElement("div");
    div.id = "__root";
    document.body.appendChild(div);

    const rootContainer = document.querySelector("#__root");
    if (!rootContainer) throw new Error("Can't find Content root element");

    const root = createRoot(rootContainer);
    rootContainer.className = "tailwind";
    root.render(<App />);
  } catch (e) {
    console.error("PBS initialization error:", e);
  }
};

// Start initialization
initializeApp();
