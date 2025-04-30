/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** App.tsx
*/

import "./App.css";
import { ResizableHandle, ResizablePanelGroup } from "./components/ui/resizable";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";

interface DropInterface {
  paths: string[];
  position: {
    x: number;
    y: number;
  };
}

function App() {
  useEffect(() => {
    let unlisten: () => void;

    listen<string[]>("tauri://drag-drop", (event) => {
      const payload: DropInterface = event.payload as any;

      const element = document.elementFromPoint(payload.position.x, payload.position.y);

      let current = element;
      while (current && !current.hasAttribute('data-directory-id')) {
        current = current.parentElement;
      }
      if (current) {
        const directoryId = current.getAttribute('data-directory-id')
        invoke("print_files", { files: payload.paths, name: directoryId });
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return (
    <main className="w-screen h-screen">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <LeftPanel/>
        <ResizableHandle withHandle className="bg-gray-600"/>
        <RightPanel/>
      </ResizablePanelGroup>
    </main>
  );
}

export default App;
