import React from "react";
import { IMAGES } from "@/assets/images";

export const LoginBackground: React.FC = () => {
  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(180deg,
              rgba(245,245,220,1) 0%,
              rgba(255,223,186,0.8) 25%,
              rgba(255,182,193,0.6) 50%,
              rgba(147,112,219,0.7) 75%,
              rgba(72,61,139,0.9) 100%
            ),
            radial-gradient(circle at 30% 20%, rgba(255,255,224,0.4) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, rgba(72,61,139,0.6) 0%, transparent 70%),
            radial-gradient(circle at 50% 60%, rgba(147,112,219,0.3) 0%, transparent 60%)
          `,
        }}
      />
      <div className="hidden lg:block absolute inset-0 z-0 opacity-20">
        <img
          src={IMAGES.AI_TECH_8}
          alt="Violet ERP AI Background"
          className="w-full h-full object-cover"
        />
      </div>
    </>
  );
};
