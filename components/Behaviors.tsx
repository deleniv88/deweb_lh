"use client";
import { useEffect } from "react";
import { initBurger, initHeader, initCarousel, initServices, initFeatures, initLang, initProjectLine, initTestimonials, initFaq, initQuote, initSmoothScroll, initWorksCursor } from "../lib/behaviors";

/* Запускає весь інтерактив після рендеру.
   depsKey змінюється, коли в адмінці додають/видаляють кейси, послуги чи переваги —
   тоді анімації перезапускаються з новою кількістю елементів. */
export default function Behaviors({ depsKey = "", page = "home" }: { depsKey?: string; page?: "home" | "works" | "inner" }) {
  useEffect(() => {
    const cleanups = [initSmoothScroll(), initBurger(), initHeader(), initLang(), initQuote()];
    if (page === "home") cleanups.push(initCarousel(), initServices(), initFeatures(), initProjectLine(), initTestimonials(), initFaq());
    if (page === "works") cleanups.push(initWorksCursor());
    return () => cleanups.forEach((c) => c && c());
  }, [depsKey, page]);
  return null;
}
