import type React from "react";
/* Іконки для "Every site includes" і дрібні стрілки */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const featureIcons: Record<string, React.ReactElement> = {
  fast: (<svg viewBox="0 0 24 24" {...S}><path d="M4.5 16.5a8.5 8.5 0 1 1 15 0" /><path d="M12 13.5l4-4.5" /><circle cx="12" cy="13.5" r="1.3" fill="currentColor" /></svg>),
  devices: (<svg viewBox="0 0 24 24" {...S}><rect x="2.5" y="4" width="14" height="10" rx="1.5" /><path d="M6 18h7" /><rect x="17" y="9" width="5" height="10" rx="1.2" /></svg>),
  edit: (<svg viewBox="0 0 24 24" {...S}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></svg>),
  inbox: (<svg viewBox="0 0 24 24" {...S}><path d="M3 13l2.5-7h13L21 13v5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" /><path d="M3 13h5l1.5 2.5h5L16 13h5" /></svg>),
  chart: (<svg viewBox="0 0 24 24" {...S}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>),
  globe: (<svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></svg>),
};

export const ArrowUpRight = () => (
  <svg className="i-arrow" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 12 12 2M12 2H4.5M12 2v7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export const CheckCircle = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#5e6cff" /><path d="M4.8 8.2 7 10.3l4.2-4.6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/* Перетворює "рядок 1\nрядок 2" у текст з <br> */
export function Lines({ text }: { text?: string | null }) {
  const parts = (text || "").split("\n");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

/* Іконки етапів для Project line */
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const stepIcons: Record<string, React.ReactElement> = {
  users: (<svg viewBox="0 0 24 24" {...P}><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5M16 5.5a2.6 2.6 0 0 1 0 5M18 14c1.6.6 2.6 2.2 3 4.5" /></svg>),
  chart: (<svg viewBox="0 0 24 24" {...P}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>),
  sitemap: (<svg viewBox="0 0 24 24" {...P}><rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="15" width="6" height="5" rx="1" /><rect x="15" y="15" width="6" height="5" rx="1" /><path d="M12 8v3M6 15v-4h12v4" /></svg>),
  palette: (<svg viewBox="0 0 24 24" {...P}><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.9-1.7H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></svg>),
  code: (<svg viewBox="0 0 24 24" {...P}><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" /></svg>),
  rocket: (<svg viewBox="0 0 24 24" {...P}><path d="M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2M9 13l2 2M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5z" /><circle cx="15" cy="9" r="1.5" /></svg>),
  headset: (<svg viewBox="0 0 24 24" {...P}><path d="M4 13a8 8 0 0 1 16 0M4 13v3a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2M20 13v3a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2M17 18c0 2-2 3-5 3" /></svg>),
};

export const HandIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11V5a1.5 1.5 0 0 1 3 0v5l3.5.6a2 2 0 0 1 1.6 2.3l-.8 4.6A2.5 2.5 0 0 1 13.8 20H11a3 3 0 0 1-2.4-1.2L5.5 14.5a1.4 1.4 0 0 1 2-2L9 14" /></svg>
);

/* Відгуки: play і звук */
export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.3-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z" fill="currentColor" /></svg>
);
export const SoundOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" /></svg>
);
export const SoundOnIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9a4.2 4.2 0 0 1 0 6M18.6 6.5a7.8 7.8 0 0 1 0 11" /></svg>
);

/* Соцмережі / контакти (футер і форма) */
export const socialIcons: Record<string, React.ReactElement> = {
  instagram: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" /></svg>),
  telegram: (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.2 2.9 11.4c-.9.4-.9 1.6.1 1.9l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.3l2.6-2.7 4.9 3.6c.6.4 1.4.1 1.6-.6l3.2-15.6c.2-.9-.7-1.6-1.9-1.2zM9.6 14.3l8.2-6.8-6.6 8z" fill="currentColor" /></svg>),
  linkedin: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V17M8 7.3v.1M11.5 17v-3.8c0-1.6 1-2.7 2.4-2.7s2.1 1 2.1 2.6V17" /></svg>),
  email: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></svg>),
  whatsapp: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.5a9.4 9.4 0 0 0-8 14.3L2.8 21.5l4.8-1.2A9.4 9.4 0 1 0 12 2.5z" /><path d="M9 8.2c.3 2.6 2.4 5 5.2 5.8l1-1.2 1.9.9c-.2 1.2-1.1 1.9-2.2 1.9-3.4 0-6.9-3.4-6.9-6.9 0-1.1.7-2 1.9-2.2l.9 1.9z" /></svg>),
};

export const CloseIcon = () => (<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2 2 12" /></svg>);
export const RightArrow = () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5" /></svg>);
export const TickIcon = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" /></svg>);

/* "текст з **жирним**" → <b> */
export function Rich({ text }: { text?: string | null }) {
  const parts = (text || "").split("**");
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : <span key={i}>{p}</span>))}</>;
}
