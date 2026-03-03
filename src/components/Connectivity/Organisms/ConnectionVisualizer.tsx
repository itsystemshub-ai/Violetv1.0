import React from "react";
import { Monitor, Server, Cloud } from "lucide-react";
import { motion } from "framer-motion";
import { ConnectionNode } from "../Atoms/ConnectionNode";

interface ConnectionVisualizerProps {
  status: {
    local: "online" | "checking" | "offline";
    master: "online" | "checking" | "offline";
    cloud: "online" | "checking" | "offline";
  };
}

export const ConnectionVisualizer: React.FC<ConnectionVisualizerProps> = ({
  status,
}) => {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-16 relative py-12">
      {/* Local Node */}
      <ConnectionNode
        icon={Monitor}
        label="Tu Equipo"
        status={status.local}
        size="md"
      />

      {/* Connection Line 1 */}
      <div className="flex-1 max-w-[120px] h-[2px] bg-muted/30 relative">
        <motion.div
          animate={{ x: [0, 120] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute top-0 left-0 h-full w-8 bg-linear-to-r from-transparent via-primary to-transparent"
        />
      </div>

      {/* Master Hub Node */}
      <ConnectionNode
        icon={Server}
        label="Maestro (Hub)"
        status={status.master}
        size="lg"
        className="text-indigo-500 shadow-2xl shadow-indigo-500/20"
      />

      {/* Connection Line 2 */}
      <div className="flex-1 max-w-[120px] h-[2px] bg-muted/30 relative">
        <motion.div
          animate={{ x: [0, 120] }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "linear",
            delay: 0.5,
          }}
          className="absolute top-0 left-0 h-full w-8 bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-50"
        />
      </div>

      {/* Cloud Node */}
      <ConnectionNode
        icon={Cloud}
        label="Nube (Cloud)"
        status={status.cloud}
        size="md"
      />
    </div>
  );
};
