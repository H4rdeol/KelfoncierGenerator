/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** FileManager.tsx
*/

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, UploadCloud } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { listen } from "@tauri-apps/api/event";

interface FileItem {
  id: string;
  name: string;
  file: File;
}

interface FileManagerProps {
  directory: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ directory }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  function fetchFiles(): Promise<FileItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const filenames: string[] = await invoke("get_files", { dirName: directory });
        const items = filenames.map((name) => ({
          id: crypto.randomUUID(),
          name: name,
          file: null as unknown as File
        }));
        resolve(items);
      } catch (e) {
        console.error("Erreur récupération fichiers :", e);
        reject(e);
      }
    });
  }

  useEffect(() => {
    const setupListener = async () => {
      const files = await fetchFiles();
      setFiles(files);
      const unlisten = await listen("files_saved", async () => {
        const files = await fetchFiles();
        setFiles(files);
      });

      return () => {
        unlisten();
      };
    };

    setupListener();
  }, []);

  const handleAddFile = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: true,
        title: "Sélectionner fichier(s)"
      });

      if (selected) {
        invoke("print_files", { files: selected, name: directory });
      }
    } catch (error) {
      console.error("Erreur lors de la sélection du dossier:", error);
    }
  };

  const handleRemoveFile = (id: string) => {
    const filename = files.find((file) => file.id === id)?.name;
    if (!filename) return;
    invoke("remove_file", { filename: filename, dirName: directory }).catch(console.error);
  };

  const handleClearAll = () => {
    invoke("remove_all_files", { dirName: directory })
      .then(() => {
        setFiles([]);
      });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="space-y-4 drop-zone" data-directory-id={directory} >
      <div className="flex items-center gap-2">
        <Button type="submit" onClick={ handleAddFile }>Ajouter un fichier</Button>
        <Button
          variant="destructive"
          onClick={handleClearAll}
          disabled={files.length === 0}
        >
          Supprimer tout
        </Button>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          flex flex-col items-center justify-center
          border-2 border-dashed transition-colors
          p-10 rounded-md cursor-pointer
          ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white"}
        `}
      >
        <UploadCloud className="h-8 w-8 mb-2 text-gray-400" />
        <p className="text-gray-600 text-center">
          {isDragging
            ? "Relâchez pour ajouter vos fichiers"
            : "Glissez-déposez vos fichiers ici ou cliquez ci-dessus pour ajouter"}
        </p>
      </div>

      {/* liste des fichiers */}
      {files.length > 0 ? (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-3">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded"
            >
              <span>{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFile(file.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center">Aucun fichier ajouté.</p>
      )}
    </div>
  );
};
