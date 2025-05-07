/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** RightPanel.tsx
*/

import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import { Title } from "@/components/Title";
import { FileManager } from "./FileManager";
import { InputWithLabel } from "./InputWithLabel";
import { DirectorySelector } from "./FolderInput";
import { Button } from "./ui/button";
import { useState } from "react";
import { invoke } from '@tauri-apps/api/core';
import { AlertDestructive } from "./AlertDestructive";
import { LucideLoader } from 'lucide-react';

function LeftPanel() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formErrors, setFormErrors] = useState({
        dep: false,
        filename: false,
        power: false
      });
    const [formData, setFormData] = useState({
        dep: "",
        filename: "",
        directory: "",
        power: "36"
    })

    const isValidDep = (value: string) => /^\s*(\d{2,3}|2A|2B)(\s*,?\s*(\d{2,3}|2A|2B))*\s*$/.test(value);
    const isNum = (value: string) => /^\d/.test(value)

    const handleClick = async () => {
        setLoading(true);
        setError("");
        try {
          await invoke('generate', { formData });
        } catch (err: any) {
          setError(err.toString());
        } finally {
          setLoading(false);
        }
    };

    return (
        <ResizablePanel defaultSize={800}>
            <Title title="Recherche" bgColor="#1E1E2F"/>
            <div className="container">
                <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel>
                        <div className="flex flex-col p-2">
                            <FileManager directory="kelfoncier"/>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle className="bg-gray-600" withHandle/>
                    <ResizablePanel>
                        <div className="py-5">
                            <InputWithLabel
                                label="Département de la recherche:"
                                id="department"
                                placeholder="Département de la recherche"
                                onSubmit={(value) => {
                                    setFormData({ ...formData, dep: value });
                                    setFormErrors({ ...formErrors, dep: !isValidDep(value) });
                                }}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, dep: value });
                                    setFormErrors({ ...formErrors, dep: !isValidDep(value) });
                                }}
                                isError={formErrors.dep}
                            />
                            <InputWithLabel
                                label="Puissance minimale en MWh (par défaut 36MWh):"
                                id="researchPower"
                                placeholder="36"
                                onSubmit={(value) => {
                                    setFormData({ ...formData, power: value});
                                    setFormErrors({ ...formErrors, power: !isNum(value)})
                                }}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, power: value });
                                    setFormErrors({ ...formErrors, power: !isNum(value)})
                                }}
                                isError={formErrors.power}
                            />
                        </div>
                        <InputWithLabel
                            label="Nom du fichier de sortie:"
                            id="researchName"
                            placeholder="Nom du fichier de sortie"
                            onSubmit={(value) => setFormData({ ...formData, filename: value })}
                            onValueChange={(value) => setFormData({ ...formData, filename: value })}
                        />
                        <div className="py-5 px-2">
                            <DirectorySelector onDirectorySelected={(value) => setFormData({ ...formData, directory: value})}/>
                        </div>
                        <Button onClick={ handleClick } disabled={ loading }>Générer</Button>
                        <div className="py-5 px-3 text-left">
                            { loading &&
                                <LucideLoader
                                    className="h-8 w-8 animate-[spin_2s_linear_infinite] text-primary mx-auto"
                                />
                            }
                            { error !== "" && <AlertDestructive text={ error }/>}
                        </div>
                    </ ResizablePanel>
                </ ResizablePanelGroup>
            </div>
        </ResizablePanel>
    )
}

export default LeftPanel;
