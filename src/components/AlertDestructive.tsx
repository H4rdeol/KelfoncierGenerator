/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** AlertDestructive.tsx
*/

import { AlertCircle } from "lucide-react"
import {
    Alert,
    AlertDescription,
    AlertTitle,
  } from "@/components/ui/alert"

interface AlertDestructiveProps {
    text: string
}

export const AlertDestructive: React.FC<AlertDestructiveProps> = ({ text }) => {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur pendant la génération</AlertTitle>
        <AlertDescription>
          { text }
        </AlertDescription>
      </Alert>
    )
}
