/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** RightPanel.tsx
*/

import { ResizablePanel } from "@/components/ui/resizable";
import { Title } from "./Title";
import { FileManager } from "./FileManager";

function RightPanel() {
    return (
        <ResizablePanel className="h-full" defaultSize={500}>
            <Title title="Téléphones" bgColor="#1E1E2F"/>
            <div className="p-4">
                <FileManager directory="phones"/>
            </div>
        </ResizablePanel>
    )
}

export default RightPanel;
