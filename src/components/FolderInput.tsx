/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** FolderInput.tsx
*/

import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { InputWithButton } from './InputWithButton';

interface DirectorySelectorProps {
  onDirectorySelected: (directory: string) => void;
}

export const DirectorySelector: React.FC<DirectorySelectorProps> = ({ onDirectorySelected }) => {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);

  const handleSelectDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Sélectionner un dossier"
      });

      if (selected) {
        setSelectedDir(selected as string);
        onDirectorySelected(selected as string);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du dossier:", error);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <InputWithButton
        placeholder={selectedDir || "Sélectionner un dossier"}
        type="text"
        buttonText="Parcourir"
        onClick={handleSelectDir}
        label="Sélectionner le dossier de sortie:"
      />
    </div>
  );
}
