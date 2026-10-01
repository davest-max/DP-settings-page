import * as React from "react";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn, Overlay, Container, Tooltip } from "../lyra-ui/src";
import apps_row from "./assets/iterations/01-apps-row.png";
import breadcrumb_tabs from "./assets/iterations/02-breadcrumb-tabs.png";
import top_level_sidebar from "./assets/iterations/03-top-level-sidebar.png";
import stacked_tabs_flagged from "./assets/iterations/04-stacked-tabs-flagged.png";

/** Dated screen grabs of how the Agent Settings Page tab has been laid
 * out across this build. Shown in an in-page modal rather than linking
 * out — Dave wants a demo viewer to stay on this same deployed URL the
 * whole time, not get handed off to an external link.
 *
 * One idea at a time, large, rather than a scrolling stack of thumbnails
 * — Dave wants each screenshot seen in full, and the image itself is the
 * primary "next" control (plus arrow buttons/keys for anyone who doesn't
 * think to click it). */
interface IdeaEntry {
  date: string;
  title: string;
  caption: React.ReactNode;
  image: string;
  alt: string;
}

const IDEAS: IdeaEntry[] = [
  {
    date: "Sep 23 · 3:19 PM",
    title: "Agent Settings Page as a row inside Apps",
    caption: (
      <>
        Reached from a row pinned at the top of the <code>Apps</code> list
        ("3 sections"), back when every Apps row still carried its own
        drag handle and up/down reorder arrows.
      </>
    ),
    image: apps_row,
    alt: "Settings tab with Agent Settings Page listed as a row inside the Apps section, each app row showing a drag handle and up/down arrows.",
  },
  {
    date: "Sep 29 · 4:36 PM",
    title: "Breadcrumb into its own tab row",
    caption: (
      <>
        Opened via a <code>Settings / Agent Settings Page</code> breadcrumb,
        with its own horizontal tab row underneath for the four areas —
        Login &amp; Voice Preferences, A/V Notifications, Display &amp;
        Keyboard, Report an Issue.
      </>
    ),
    image: breadcrumb_tabs,
    alt: "Agent Settings Page reached via a breadcrumb, showing a horizontal tab row for its four areas with A/V Notifications active.",
  },
  {
    date: "Sep 29 · 5:08 PM",
    title: "A second tab row, flagged",
    caption: (
      <>
        Promoted to a top-level tab next to <code>General</code> and{" "}
        <code>Assigned Teams</code> — but its four areas still switched via
        a second horizontal tab row sitting directly underneath, two
        stacked levels of tabs called out for a redesign.
      </>
    ),
    image: top_level_sidebar,
    alt: "Agent Settings Page as a top-level tab, with a second horizontal tab row for its four areas directly below it.",
  },
  {
    date: "Sep 30 · 1:44 PM",
    title: "Vertical sidebar instead of a second tab row",
    caption: (
      <>
        Same top-level tab, with the four areas switched from a vertical
        sidebar running down the left instead — perpendicular to the top
        tab row rather than stacked under it.
      </>
    ),
    image: stacked_tabs_flagged,
    alt: "Agent Settings Page as a top-level tab with a vertical sidebar listing its four areas, Login and Voice Preferences selected.",
  },
];

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip content="Close" placement="bottom" asLabel>
      <button
        aria-label="Close"
        onClick={onClick}
        className="flex h-8 w-8 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </Tooltip>
  );
}

function NavArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Previous idea" : "Next idea";
  return (
    <Tooltip content={label} placement="top" asLabel>
      <button
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={cn(
          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-lyra-border-subtle bg-lyra-bg-surface-base text-lyra-fg-secondary shadow-sm transition-colors hover:bg-lyra-state-hover hover:text-lyra-fg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </Tooltip>
  );
}

export function AdditionalIdeasPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);

  // Always start from the first idea when the panel is (re)opened.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const count = IDEAS.length;
  const idea = IDEAS[index];
  const goNext = () => setIndex((i) => (i + 1) % count);
  const goPrev = () => setIndex((i) => (i - 1 + count) % count);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, count]);

  return (
    <Overlay open={open} onClose={onClose} closeOnBackdropClick>
      <Container
        variant="modal"
        headerTitle="Additional Ideas"
        headerSubhead={`${String(index + 1).padStart(2, "0")} of ${String(count).padStart(2, "0")} · ${idea.date}`}
        headerActions={<CloseButton onClick={onClose} />}
        className="flex h-[calc(100vh-4rem)] w-[min(1040px,calc(100vw-2rem))] flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 pt-2">
          <div className="flex min-h-0 flex-1 items-center gap-3">
            <NavArrow direction="prev" onClick={goPrev} />

            {/* The image itself is the primary "click to advance"
             * control — cursor and a subtle hover ring say so without
             * needing instructional copy. */}
            <button
              type="button"
              onClick={goNext}
              aria-label="Next idea"
              className="group flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-container-subtle p-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
            >
              <img
                src={idea.image}
                alt={idea.alt}
                className="max-h-full max-w-full rounded-lyra-xs object-contain shadow-sm transition-transform group-hover:scale-[1.005]"
              />
            </button>

            <NavArrow direction="next" onClick={goNext} />
          </div>

          <div className="flex flex-shrink-0 flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5">
              {IDEAS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to idea ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index
                      ? "w-5 bg-lyra-bg-active-strong"
                      : "w-1.5 bg-lyra-border-default hover:bg-lyra-fg-disabled"
                  )}
                />
              ))}
            </div>
            <div className="text-center">
              <p className="lyra-heading-sm text-lyra-fg-default">{idea.title}</p>
              <p className="lyra-body-lg mx-auto mt-1.5 max-w-[62ch] text-lyra-fg-secondary [&_code]:rounded [&_code]:bg-lyra-bg-surface-container-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]">
                {idea.caption}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Overlay>
  );
}
