
"use client";

import { CheckCircle } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect, useRef } from 'react';

export function LeftPanel() {
    // This component contained logic for video playback which was complex and better suited for the main page component.
    // It's simplified here to only display static content. The video logic will be handled in the parent page.tsx
    return (
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center space-y-6 pr-12 p-8">
            <h1 className="text-5xl font-bold text-gray-800 leading-tight title">
                Tu Futuro Profesional Comienza Hoy
            </h1>
            <p className="text-xl text-gray-600">
                Accede a todos nuestros cursos obtén las habilidades que el mercado laboral demanda.
            </p>
            <ul className="space-y-3 text-xl">
                <li className="flex items-center gap-3">
                    <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-gray-700">Profesores expertos 24/7</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-gray-700">Clases en vivo todas las semanas</span>
                </li>
                <li className="flex items-center gap-3">
                    <CheckCircle className="text-blue-500 flex-shrink-0" size={24} />
                    <span className="text-gray-700">Certificación con validez en USA</span>
                </li>
            </ul>
            <div className="w-full flex justify-start items-start transition-all duration-500 relative min-h-[300px]">
                <Image
                    className="img transition-all duration-1000 opacity-100 w-full max-w-2xl aspect-video rounded-xl shadow-lg relative z-0"
                    src="/plataforma.webp"
                    alt="Plataforma Studyx"
                    width={800}
                    height={450}
                    style={{ minHeight: 300, background: '#fff', transformOrigin: 'left top' }}
                />
            </div>
        </div>
    );
}
