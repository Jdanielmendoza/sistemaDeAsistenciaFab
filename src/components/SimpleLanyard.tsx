"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface SimpleLanyardProps {
  cardData?: {
    name?: string;
    cardNumber?: string;
    logo?: string;
  };
  className?: string;
}

export default function SimpleLanyard({ 
  cardData = {}, 
  className = "" 
}: SimpleLanyardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateY = (e.clientX - centerX) / 10;
    const rotateX = (centerY - e.clientY) / 10;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
      {/* Lanyard String */}
      <div className="relative">
        <svg
          width="4"
          height="200"
          viewBox="0 0 4 200"
          className="animate-pulse"
        >
          <defs>
            <linearGradient id="lanyardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--secondary))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          <path
            d="M2 0 Q1 50 2 100 Q3 150 2 200"
            stroke="url(#lanyardGradient)"
            strokeWidth="3"
            fill="none"
            className="animate-swing"
          />
        </svg>
      </div>

      {/* Card */}
      <div
        className={`
          relative w-80 h-48 cursor-grab transition-transform duration-200 ease-out
          ${isDragging ? "cursor-grabbing scale-105" : "hover:scale-102"}
        `}
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary rounded-xl shadow-2xl">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-xl animate-shine" />
          
          {/* Card Content */}
          <div className="relative h-full p-6 flex flex-col justify-between text-white">
            {/* Logo */}
            <div className="flex justify-end">
              <div className="w-16 h-8 bg-white/20 rounded flex items-center justify-center">
                <Image 
                  src="/logoFablab.png" 
                  alt="FabLab Logo" 
                  width={50} 
                  height={25}
                  className="object-contain"
                />
              </div>
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <div className="text-xs opacity-70 tracking-widest">
                NÚMERO DE TARJETA
              </div>
              <div className="text-xl font-mono tracking-wider">
                {cardData.cardNumber || "•••• •••• •••• ••••"}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <div className="text-xs opacity-70 tracking-widest">
                VOLUNTARIO
              </div>
              <div className="text-base font-medium">
                {cardData.name || "NOMBRE DEL VOLUNTARIO"}
              </div>
            </div>
          </div>

          {/* Holographic Effect */}
          <div className="absolute inset-0 bg-gradient-conic from-transparent via-white/5 to-transparent rounded-xl opacity-50 animate-spin-slow" />
        </div>

        {/* Card Shadow */}
        <div className="absolute inset-0 bg-black/20 rounded-xl blur-md transform translate-y-4 -z-10" />
      </div>
    </div>
  );
} 