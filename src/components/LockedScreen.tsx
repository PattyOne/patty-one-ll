import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LockedScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center text-center">
        <motion.div
          className="flex h-44 w-44 items-center justify-center rounded-full bg-primary/[0.08]"
          animate={{
            y: [-6, 6, -6],
            boxShadow: [
              "0 0 0 0 hsl(var(--primary) / 0.25)",
              "0 0 0 24px hsl(var(--primary) / 0)",
              "0 0 0 0 hsl(var(--primary) / 0)",
            ],
          }}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, boxShadow: { duration: 2.4, repeat: Infinity } }}
        >
          <motion.div animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Lock className="h-24 w-24 text-primary" strokeWidth={1.4} />
          </motion.div>
        </motion.div>
        <h1 className="mt-8 text-2xl font-semibold text-text-primary">Em breve liberaremos esta tela</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Estamos preparando este módulo com carinho. Enquanto isso, acompanhe seus números pelo Dashboard.
        </p>
        <span className="mt-4 rounded-full bg-accent/[0.18] px-3 py-1 text-xs font-medium text-text-primary">
          🚀 Em desenvolvimento
        </span>
        <Button asChild variant="outline" className="mt-6 rounded-xl">
          <Link to="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
