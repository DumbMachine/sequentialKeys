import React from "react";
import { imgSrc } from "@pages/popup/constantines";
import {
  useStorage,
  GlobalSettings,
  WebsiteSettings,
} from "../content/Settings";

import Toggle from "./Toggle";

const lazyClassnames = (...classNames: string[]) => classNames.join(" ");

const getCurrentHost = async () => {
  return new Promise<{ href: string; host: string }>((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        resolve({ href: url.href, host: url.host });
      } else {
        reject(new Error("No active tab found"));
      }
    });
  });
};

// function SettingsPanel({ host, href }: { host: string; href: string }) {
//   const [globalSettings, setGlobalSettings] = useStorage<GlobalSettings>();
//   const [websiteSettings, setWebsiteSettings] =
//     useStorage<WebsiteSettings>(host);
//   const restrictedHosts = ["chrome://", "about:", "file://"];

//   const isRestrictedPage = restrictedHosts.some((h) => href.startsWith(h));

//   const handleGlobalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, checked } = e.target;
//     setGlobalSettings({ ...globalSettings, [name]: checked } as GlobalSettings);
//   };

//   const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, checked } = e.target;
//     setWebsiteSettings({
//       ...websiteSettings,
//       [name]: checked,
//     } as WebsiteSettings);
//   };

//   return (
//     <div
//       className={`tailwind absolute top-0 left-0 right-0 bottom-0 text-center h-full bg-gray-800 text-white`}
//     >
//       <section id="header" className="flex flex-row w-full justify-center mb-4">
//         <img className="h-[64px]" src={`data:image/png;base64,${imgSrc}`} />
//       </section>

//       <div className="flex flex-col px-6 space-y-6 justify-center">
//         <div
//           id="settings-base"
//           className="space-y-1 border-b-2 border-yellow-200 pb-4 text-white"
//         >
//           <h2 className="text-xl text-yellow-300 mb-0">Settings</h2>
//           <div className="border-2 border-yellow-200">
//             <label className="block">
//               Debug Mode:
//               <input
//                 type="checkbox"
//                 name="DebugMode"
//                 checked={globalSettings?.DebugMode || false}
//                 onChange={handleGlobalChange}
//                 className="ml-2"
//               />
//             </label>
//             <label className="block">
//               Enabled:
//               <input
//                 type="checkbox"
//                 name="Enabled"
//                 checked={globalSettings?.Enabled || false}
//                 onChange={handleGlobalChange}
//                 className="ml-2"
//               />
//             </label>
//           </div>
//         </div>

//         <div
//           id="settings-website"
//           className="space-y-1 border-b-2 border-yellow-200 pb-4 text-white"
//         >
//           <h2 className="text-xl text-yellow-300 mb-0">
//             {!isRestrictedPage ? host : href.split(":").find(Boolean) + ":*"}
//           </h2>
//           <div
//             className={lazyClassnames(
//               "border-2 border-yellow-200",
//               isRestrictedPage ? "opacity-50" : "opacity-100"
//             )}
//           >
//             <label className="block">
//               Enabled:
//               <input
//                 type="checkbox"
//                 name="Enabled"
//                 disabled={isRestrictedPage}
//                 checked={websiteSettings?.Enabled || false}
//                 onChange={handleWebsiteChange}
//                 className="ml-2"
//               />
//             </label>
//             <label className="block">
//               Propagate All:
//               <input
//                 type="checkbox"
//                 name="PropagateAll"
//                 disabled={isRestrictedPage}
//                 checked={websiteSettings?.PropagateAll || false}
//                 onChange={handleWebsiteChange}
//                 className="ml-2"
//               />
//             </label>
//             <label className="block">
//               Propagate All Except Hints:
//               <input
//                 type="checkbox"
//                 name="PropagateAllExceptHints"
//                 disabled={isRestrictedPage}
//                 checked={websiteSettings?.PropagateAllExceptHints || false}
//                 onChange={handleWebsiteChange}
//                 className="ml-2"
//               />
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function Popup() {
//   const [hostInfo, setHostInfo] = React.useState<{
//     host: string;
//     href: string;
//   } | null>(null);
//   const [isLoading, setIsLoading] = React.useState(true);

//   React.useEffect(() => {
//     const initializeHost = async () => {
//       try {
//         const { host, href } = await getCurrentHost();
//         setHostInfo({ host, href });
//       } catch (error) {
//         console.error("Failed to get current host:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     initializeHost();
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="tailwind absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-300"></div>
//       </div>
//     );
//   }

//   if (!hostInfo) {
//     return (
//       <div className="tailwind absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-red-500">
//         Failed to load host information
//       </div>
//     );
//   }

//   return <SettingsPanel host={hostInfo.host} href={hostInfo.href} />;
// }

function SettingsPanel({ host, href }: { host: string; href: string }) {
  const [globalSettings, setGlobalSettings] = useStorage<GlobalSettings>();
  const [websiteSettings, setWebsiteSettings] =
    useStorage<WebsiteSettings>(host);
  const restrictedHosts = ["chrome://", "about:", "file://"];

  const isRestrictedPage = restrictedHosts.some((h) => href.startsWith(h));

  const handleGlobalChange = (name: string, checked: boolean) => {
    setGlobalSettings({ ...globalSettings, [name]: checked } as GlobalSettings);
  };

  const handleWebsiteChange = (name: string, checked: boolean) => {
    setWebsiteSettings({
      ...websiteSettings,
      [name]: checked,
    } as WebsiteSettings);
  };

  return (
    <div className="tailwind bg-gray-900 text-gray-100 p-6 min-w-[300px] max-w-md mx-auto">
      <header className="flex items-center justify-center mb-6">
        <img
          // className="h-16 w-16"
          className="h-[64px]"
          src={`data:image/png;base64,${imgSrc}`}
          alt="Extension logo"
        />
      </header>

      <section className="mb-8 px-6">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            className="size-6 text-white stroke-white"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
          </svg>
          <h2 className="text-xl font-semibold text-yellow-300 truncate">
            Settings
          </h2>
        </div>
        <div className="space-y-2">
          <Toggle
            label="Debug Mode"
            name="DebugMode"
            checked={globalSettings?.DebugMode || false}
            onChange={handleGlobalChange}
          />
          <Toggle
            label="Enabled"
            name="Enabled"
            checked={globalSettings?.Enabled || false}
            onChange={handleGlobalChange}
          />
        </div>
      </section>

      <section className="px-6">
        <div className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            className="size-6 text-white stroke-white"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
          <h2 className="text-xl font-semibold text-yellow-300 truncate">
            {!isRestrictedPage ? host : href.split(":").find(Boolean) + ":*"}
          </h2>
        </div>

        <div className={`space-y-2 ${isRestrictedPage ? "opacity-50" : ""}`}>
          <Toggle
            label="Enabled"
            name="Enabled"
            checked={websiteSettings?.Enabled || false}
            onChange={handleWebsiteChange}
            disabled={isRestrictedPage}
          />
          {/* <Toggle
            label="Propagate All"
            name="PropagateAll"
            checked={websiteSettings?.PropagateAll || false}
            onChange={handleWebsiteChange}
            disabled={isRestrictedPage}
          />
          <Toggle
            label="Propagate All Except Hints"
            name="PropagateAllExceptHints"
            checked={websiteSettings?.PropagateAllExceptHints || false}
            onChange={handleWebsiteChange}
            disabled={isRestrictedPage}
          /> */}
        </div>
      </section>
    </div>
  );
}

export default function Popup() {
  const [hostInfo, setHostInfo] = React.useState<{
    host: string;
    href: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const initializeHost = async () => {
      try {
        const { host, href } = await getCurrentHost();
        setHostInfo({ host, href });
      } catch (error) {
        console.error("Failed to get current host:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeHost();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-300"></div>
      </div>
    );
  }

  if (!hostInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">
        Failed to load host information
      </div>
    );
  }

  return <SettingsPanel host={hostInfo.host} href={hostInfo.href} />;
}
