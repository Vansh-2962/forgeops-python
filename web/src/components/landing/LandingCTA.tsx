import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function LandingCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#141416] to-[#0c0c0d] px-6 py-16 text-center"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(120,119,198,0.18),transparent)]" />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Let ForgeOps handle your infrastructure tonight.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-400">
            Connect a repo and run your first agent task in under two minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button
                size="lg"
                className="group gap-2 bg-white text-black hover:bg-zinc-200"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="ghost"
                className="text-zinc-300 hover:text-white"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
