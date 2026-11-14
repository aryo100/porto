"use client";

import { useRef, useState } from "react";
import { EmphasisHeading } from "./content-ui";
import type { SectionPost } from "@/lib/section-content";

export function JournalSection({
  heading,
  intro,
  posts,
}: {
  heading: string;
  intro: string;
  posts: SectionPost[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const post = active === null ? null : posts[active];
  return (
    <>
      <section
        className="section-wrap border-t border-[var(--line)] py-[clamp(70px,10vw,130px)]"
        id="journal"
        aria-labelledby="journal-title"
        hidden={!posts.length}
      >
        <div className="section-heading items-end max-[700px]:items-start">
          <div>
            <p className="eyebrow">(06) / THE JOURNAL</p>
            <h2 id="journal-title">
              <EmphasisHeading text={heading} />
            </h2>
          </div>
          <p className="max-w-[29ch] text-right text-xs leading-[1.7] text-[var(--muted)] max-[700px]:text-left">
            {intro}
          </p>
        </div>
        <div className="mt-[clamp(28px,4vw,56px)] border-t border-[var(--line)]">
          {posts.map((item, index) => (
            <article
              className="border-b border-[var(--line)]"
              key={`${item.slug || item.title}-${index}`}
            >
              <button
                className="group grid min-h-28 w-full cursor-pointer grid-cols-[55px_minmax(0,1fr)_130px_25px] items-center gap-5 border-0 bg-transparent p-0 text-left text-inherit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)] max-[700px]:min-h-25 max-[700px]:grid-cols-[32px_minmax(0,1fr)_20px] max-[700px]:gap-2.5"
                type="button"
                aria-haspopup="dialog"
                onClick={(event) => {
                  returnFocus.current = event.currentTarget;
                  setActive(index);
                  dialog.current?.showModal();
                  requestAnimationFrame(() => back.current?.focus());
                }}
              >
                <span className="font-mono text-[10px] text-[var(--muted)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="grid gap-2">
                  <strong className="font-[var(--display)] text-[clamp(22px,2.5vw,34px)] leading-[1.1] font-medium">
                    {item.title}
                  </strong>
                  <small className="font-[var(--body)] text-[11px] leading-[1.5] text-[var(--muted)]">
                    {item.description || ""}
                  </small>
                </span>
                <span className="font-mono text-[10px] text-[var(--muted)] max-[700px]:hidden">
                  {item.date || ""}
                </span>
                <span className="text-xl text-[var(--gold)] transition-transform duration-300 group-hover:translate-x-[3px] group-hover:-translate-y-[3px] group-focus-visible:translate-x-[3px] group-focus-visible:-translate-y-[3px]">
                  ↗
                </span>
              </button>
            </article>
          ))}
        </div>
      </section>
      <dialog
        className="journal-dialog fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain border-0 bg-[#101711] text-[var(--paper)]"
        id="journal-dialog"
        aria-labelledby="journal-dialog-title"
        ref={dialog}
        onClose={() => {
          setActive(null);
          returnFocus.current?.focus();
        }}
      >
        <div className="min-h-full bg-[radial-gradient(ellipse_at_90%_10%,#9371351b,transparent_48%)] px-[clamp(20px,5vw,70px)] pb-[8vh]">
          <div className="sticky top-0 z-10 mx-auto flex min-h-18 w-full max-w-[700px] items-center justify-between gap-6 border-b border-[var(--line)] bg-[#101711eb] px-[clamp(16px,2.5vw,28px)] backdrop-blur-[12px] max-[700px]:min-h-[66px]">
            <button
              ref={back}
              className="group inline-flex cursor-pointer items-center gap-2.5 border-0 bg-transparent py-2.5 font-mono text-[10px] tracking-[.07em] text-[var(--paper)] uppercase hover:text-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]"
              type="button"
              onClick={() => dialog.current?.close()}
            >
              <span
                className="font-[var(--display)] text-lg text-[var(--gold)] transition-transform duration-200 group-hover:-translate-x-[3px]"
                aria-hidden="true"
              >
                ←
              </span>{" "}
              Back to journal
            </button>
            <span className="font-mono text-[9px] tracking-[.1em] text-[var(--muted)] max-[700px]:text-right max-[700px]:text-[8px]">
              NOTES FROM EARTH / JOURNAL
            </span>
          </div>
          <article className="mx-auto mt-[clamp(36px,6vh,72px)] w-full max-w-[700px] max-[700px]:mt-12">
            <p className="eyebrow">
              JOURNAL / {String((active ?? 0) + 1).padStart(2, "0")}
            </p>
            <h2
              className="my-4 font-[var(--display)] text-[clamp(34px,4vw,56px)] leading-[1.05] font-medium tracking-[-.05em]"
              id="journal-dialog-title"
            >
              {post?.title || ""}
            </h2>
            <p className="max-w-[58ch] font-[var(--body)] text-[clamp(15px,1.5vw,18px)] leading-[1.55] text-[var(--paper)]">
              {post?.description || ""}
            </p>
            <p className="my-6 border-b border-[var(--line)] pb-4 font-mono text-[10px] tracking-[.08em] text-[var(--muted)]">
              {post?.date || ""}
            </p>
            <div className="max-w-[68ch] font-[var(--body)] text-[clamp(14px,1.2vw,16px)] leading-[1.8] text-[var(--muted)]">
              {(post?.content || []).map((paragraph, index) => (
                <p className="mb-[1.4em]" key={index}>
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </div>
      </dialog>
    </>
  );
}
