"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useState, useEffect, useRef, ReactNode } from "react";

function CardRotate({
  children,
  onSendToBack,
  sensitivity,
  disableDrag = false,
}: {
  children: ReactNode;
  onSendToBack: () => void;
  sensitivity: number;
  disableDrag?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [60, -60]);
  const rotateY = useTransform(x, [-100, 100], [-60, 60]);

  function handleDragEnd(
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number } }
  ) {
    if (
      Math.abs(info.offset.x) > sensitivity ||
      Math.abs(info.offset.y) > sensitivity
    ) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  if (disableDrag) {
    return (
      <motion.div className="absolute inset-0 cursor-pointer" style={{ x: 0, y: 0 }}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab"
      style={{ x, y, rotateX, rotateY }}
      drag
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      whileTap={{ cursor: "grabbing" }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

type StackProps = {
  randomRotation?: boolean;
  sensitivity?: number;
  cards?: ReactNode[];
  /** Indices for each card (e.g. prompt index). Passed to onCardClick. */
  cardIndices?: number[];
  animationConfig?: { stiffness: number; damping: number };
  sendToBackOnClick?: boolean;
  /** When false, drag and click-to-cycle are disabled. */
  interactive?: boolean;
  /** When set, tap calls this with card index instead of sending to back. */
  onCardClick?: (cardIndex: number) => void;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  mobileClickOnly?: boolean;
  mobileBreakpoint?: number;
  /** After this many ms, send the top card to the back once. Use with triggerAutoSend. */
  autoSendTopToBackAfterMs?: number;
  /** When true, schedule the one-shot auto send. Parent should set false in onAutoSendComplete. */
  triggerAutoSend?: boolean;
  onAutoSendComplete?: () => void;
};

export default function Stack({
  randomRotation = false,
  sensitivity = 200,
  cards = [],
  cardIndices,
  animationConfig = { stiffness: 260, damping: 20 },
  sendToBackOnClick = false,
  interactive = true,
  onCardClick,
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  mobileClickOnly = false,
  mobileBreakpoint = 768,
  autoSendTopToBackAfterMs,
  triggerAutoSend = false,
  onAutoSendComplete,
}: StackProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  const shouldDisableDrag = !interactive || (mobileClickOnly && isMobile);
  const shouldCycleOnClick = interactive && (sendToBackOnClick || (mobileClickOnly && isMobile)) && !onCardClick;
  const shouldOpenOnClick = interactive && onCardClick;
  const onAutoSendCompleteRef = useRef(onAutoSendComplete);
  onAutoSendCompleteRef.current = onAutoSendComplete;
  const skipTransitionRef = useRef(false);

  const [stack, setStack] = useState<{ id: number; content: ReactNode; promptIndex: number }[]>(() =>
    cards.length
      ? cards.map((content, index) => ({
          id: index + 1,
          content,
          promptIndex: cardIndices?.[index] ?? index,
        }))
      : []
  );

  useEffect(() => {
    if (cards.length) {
      setStack((prev) => {
        const next = cards.map((content, index) => ({
          id: index + 1,
          content,
          promptIndex: cardIndices?.[index] ?? index,
        }));
        if (next.length === prev.length && prev.length > 0) {
          skipTransitionRef.current = true;
        }
        return next;
      });
    }
  }, [cards, cardIndices]);

  useEffect(() => {
    if (skipTransitionRef.current) skipTransitionRef.current = false;
  }, [stack]);

  const sendToBack = (id: number) => {
    setStack((prev) => {
      const newStack = [...prev];
      const index = newStack.findIndex((card) => card.id === id);
      const [card] = newStack.splice(index, 1);
      newStack.unshift(card);
      return newStack;
    });
  };

  useEffect(() => {
    if (autoplay && stack.length > 1 && !isPaused) {
      const interval = setInterval(() => {
        const topCardId = stack[stack.length - 1].id;
        sendToBack(topCardId);
      }, autoplayDelay);
      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayDelay, stack, isPaused]);

  useEffect(() => {
    if (triggerAutoSend && autoSendTopToBackAfterMs != null && cards.length > 0) {
      const topId = cards.length;
      const t = setTimeout(() => {
        sendToBack(topId);
        onAutoSendCompleteRef.current?.();
      }, autoSendTopToBackAfterMs);
      return () => clearTimeout(t);
    }
  }, [triggerAutoSend, autoSendTopToBackAfterMs, cards.length]);

  if (!stack.length) return null;

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: 600 }}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      {stack.map((card, index) => {
        const randomRotate = randomRotation ? Math.random() * 10 - 5 : 0;
        return (
          <CardRotate
            key={card.id}
            onSendToBack={() => sendToBack(card.id)}
            sensitivity={sensitivity}
            disableDrag={shouldDisableDrag}
          >
            <motion.div
              className="rounded-2xl overflow-hidden w-full h-full shadow-xl bg-white"
              onClick={() => {
                if (shouldOpenOnClick) onCardClick?.(card.promptIndex);
                else if (shouldCycleOnClick) sendToBack(card.id);
              }}
              animate={{
                rotateZ: (stack.length - index - 1) * 4 + randomRotate,
                scale: 1 + (index - stack.length + 1) * 0.06,
                transformOrigin: "90% 90%",
              }}
              initial={false}
              transition={
                skipTransitionRef.current
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: animationConfig.stiffness,
                      damping: animationConfig.damping,
                    }
              }
            >
              {card.content}
            </motion.div>
          </CardRotate>
        );
      })}
    </div>
  );
}
