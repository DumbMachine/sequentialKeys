import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
const div = document.createElement("div");
div.id = "__root";
document.body.appendChild(div);

const rootContainer = document.querySelector("#__root");
if (!rootContainer) throw new Error("Can't find Content root element");
const root = createRoot(rootContainer);
rootContainer.className = "tailwind";
root.render(<App />);

try {
  // console.log('content script loaded');
} catch (e) {
  console.error("pbs: ", e);
}
