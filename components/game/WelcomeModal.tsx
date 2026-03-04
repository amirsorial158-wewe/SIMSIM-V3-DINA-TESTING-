"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Factory,
  DollarSign,
  Users,
  Megaphone,
  ArrowRight,
  ChevronRight,
  Trophy,
} from "lucide-react";

interface WelcomeModalProps {
  gameId: string;
  teamName: string;
  currentRound: number;
}

const STORAGE_KEY = (gameId: string) => `simsim-welcomed-${gameId}`;

export function WelcomeModal({ gameId, teamName, currentRound }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (currentRound !== 1) return;
    try {
      const key = STORAGE_KEY(gameId);
      if (!localStorage.getItem(key)) {
        setOpen(true);
      }
    } catch {
      // localStorage not available
    }
  }, [gameId, currentRound]);

  const handleDismiss = (navigateTo?: string) => {
    try {
      localStorage.setItem(STORAGE_KEY(gameId), "true");
    } catch {
      // localStorage not available
    }
    setOpen(false);
    if (navigateTo) {
      const basePath = gameId === "demo" ? "/demo" : `/game/${gameId}`;
      router.push(`${basePath}${navigateTo}`);
    }
  };

  if (!open) return null;

  const slides = [
    // Slide 1: CEO intro
    {
      content: (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Welcome, CEO of {teamName}!
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            You&apos;re running a phone company. Your goal: earn the most{" "}
            <span className="text-amber-400 font-medium">Achievement Points</span>{" "}
            by building great products, growing market share, and running a profitable operation.
          </p>
        </div>
      ),
    },
    // Slide 2: Decision chain
    {
      content: (
        <div className="space-y-5 py-2">
          <h2 className="text-lg font-bold text-white text-center">
            5 Connected Decisions Each Round
          </h2>
          <div className="space-y-2">
            {[
              { icon: Lightbulb, color: "text-purple-400", bg: "bg-purple-500/20", label: "Design a phone", detail: "R&D" },
              { icon: Factory, color: "text-orange-400", bg: "bg-orange-500/20", label: "Build the factory for it", detail: "Factory" },
              { icon: DollarSign, color: "text-green-400", bg: "bg-green-500/20", label: "Fund the operation", detail: "Finance" },
              { icon: Users, color: "text-blue-400", bg: "bg-blue-500/20", label: "Hire the staff to run it", detail: "HR" },
              { icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/20", label: "Market it to customers", detail: "Marketing" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${step.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <step.icon className={`w-4 h-4 ${step.color}`} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-white">{step.label}</span>
                  <span className="text-[11px] text-slate-500">{step.detail}</span>
                </div>
                {i < 4 && (
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center italic">
            Each decision creates requirements for the next. Look for the blue panels at the top of each page.
          </p>
        </div>
      ),
    },
    // Slide 3: CTA
    {
      content: (
        <div className="text-center space-y-5 py-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
            <Lightbulb className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Let&apos;s design your first product!
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Head to R&D to create your first phone. Start with a Budget phone (quality ~50) — it&apos;s the easiest to build and sell.
          </p>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-slate-400 text-sm">
            {slide + 1} of {slides.length}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {slides[slide].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center pt-2">
          {slide > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => setSlide((s) => s - 1)}
            >
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-300"
              onClick={() => handleDismiss("")}
            >
              Skip
            </Button>
          )}

          {slide < slides.length - 1 ? (
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setSlide((s) => s + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => handleDismiss("/rnd")}
            >
              Take me to R&D
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-1">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === slide ? "bg-purple-400" : "bg-slate-600"
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
