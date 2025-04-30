/*
** EPITECH PROJECT, 2024
** SPVE_App
** File description:
** Title.tsx
*/

import React from "react";
import { Separator } from "@/components/ui/separator";

interface TitleProps {
    title: string;
    bgColor?: string;
}

export const Title: React.FC<TitleProps> = ({ title, bgColor }) => {
    return (
        <div style={{ backgroundColor: bgColor || "#1E1E2F" }}>
            <h1 className="text-2xl font-bold text-white"> { title } </h1>
            <Separator orientation="horizontal" className="my-2 h-1 bg-gray-800"/>
        </div>
    )
}
