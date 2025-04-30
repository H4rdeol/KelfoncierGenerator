/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** InputWithButton.tsx
*/

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface InputWithLabelProps {
  type: string
  buttonText: string
  placeholder?: string
  onClick?: () => void
  label?: string
}

export const InputWithButton: React.FC<InputWithLabelProps> = ( props ) => {
    return (
      <div className="py-5">
        <Label className="text-lg px-1"> { props.label } </Label>
        <div className="directory-selector">
          <Input
            className="my-text-input no-caret"
            type={ props.type }
            placeholder={ props.placeholder }
            onClick={ props.onClick }
          />
          <Button className="with-border" type="submit" onClick={ props.onClick }> { props.buttonText } </Button>
        </div>
      </div>
    )
  }
