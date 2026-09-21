import * as React from "react";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, EyeOff, GripVertical, X } from "lucide-react";
import { cn, Button, Chip, Tooltip } from "../lyra-ui/src";

/**
 * AW-61857 — "set the order of Quick Bar / App Space pages, and whether
 * agents can edit that order themselves." The order/edit-permission
 * split lives across two controls: this file builds the drag-to-reorder
 * list + the modal that hosts it; the "Agent Editable" `ToggleChip` for
 * the edit-permission half stays inline on the settings row itself (see
 * `create-desktop-profile-page.tsx`, the row this modal opens from).
 *
 * This list is meant to read as "every page that could exist" (Dave's
 * call, working from a real Agent Workspace nav screenshot), not just
 * the 9 apps this one profile's Apps table happens to toggle — so it
 * carries a few pages (Directory, Internal Chat, Settings, Help) that
 * have no Apps-table switch anywhere else in this prototype.
 *
 * Two bands hold every page in the list, freely: Shown in navigation (up
 * to `RAIL_CAPACITY` — 8 — pages) and More ellipsis (everything else,
 * whether it landed there by explicit drag or by overflowing the cap).
 * Dave's call: an admin can deliberately move a page into More even with
 * room to spare in Shown — it's not just automatic overflow. `band`
 * tracks that pin; dropping into Shown clears it (see `partitionItems`).
 *
 * Hidden is different: per Dave's call, only pages that are ALSO real
 * toggles in the Apps table above (Custom Workspace, WEM, etc. — see
 * `APPS_TABLE_PAGE_KEYS` in the parent) can ever be hidden, and only by
 * that Apps-table Switch, never by dragging here. Desk and the 4
 * reference-only pages (Directory, Internal Chat, Settings, Help) have
 * no Apps-table entry, so they can never be hidden — they always sit in
 * Shown or More, nothing else. The Hidden section is read-only here: it
 * just shows which Apps-table pages are currently off, with no grip and
 * no drop target, so there's nothing to drag into or out of it from this
 * modal.
 *
 * Not (yet) part of lyra-ui — same call as `toggle-chip.tsx` next to it:
 * nothing in the design system does drag-to-reorder today, and this is
 * one consumer. Worth promoting if a second surface needs page ordering.
 */

export interface PageOrderItem {
  key: string;
  label: string;
  /** Whether this page is off entirely. Always caller-computed from the
   * Apps table above for the pages that have a real switch there; always
   * false for everything else (Desk + the 4 reference-only pages) —
   * never settable from inside this modal. */
  hidden?: boolean;
  /** Explicit pin to the More section — set by dragging a page there.
   * Undefined means "no preference," which is what lets `partitionItems`
   * auto-fill Shown up to `RAIL_CAPACITY` in list order and overflow the
   * rest into More on its own. Dropping a page into Shown clears this,
   * even if it means bumping whichever page was last in Shown out to
   * make room. */
  band?: "more";
}

/** How many pages Agent Workspace's left rail can show before the rest
 * fall into the "···" overflow menu. */
export const RAIL_CAPACITY = 8;

/** Splits the flat, ordered list into the three rendered bands. Shared
 * between rendering and `dropInto` (which needs to know, before/after a
 * drop, which band a given key currently lands in) so the two can never
 * disagree. */
function partitionItems(items: PageOrderItem[]) {
  const hidden: PageOrderItem[] = [];
  const visible: PageOrderItem[] = [];
  for (const item of items) (item.hidden ? hidden : visible).push(item);

  const shown: PageOrderItem[] = [];
  const more: PageOrderItem[] = [];
  for (const item of visible) {
    if (item.band === "more" || shown.length >= RAIL_CAPACITY) {
      more.push(item);
    } else {
      shown.push(item);
    }
  }
  return { shown, more, hidden };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="lyra-label px-1 pb-1.5 pt-3 uppercase tracking-wide text-lyra-fg-disabled first:pt-0">
      {children}
    </div>
  );
}

/** Keyboard-reachable alternative to dragging: moves a row one step up or
 * down without needing a mouse. Sits at opacity-0 at rest and reveals on
 * hover/focus (`group-hover`/`group-focus-within` on the row, plus its own
 * `focus-visible` so Tab always shows it even with the mouse elsewhere) —
 * kept out of the way at rest, but never mouse-only: a disabled end (top of
 * Shown, bottom of the last section) still renders, just grayed out, so the
 * boundary is visible rather than the control disappearing. */
function RowMoveButton({
  direction,
  disabled,
  onMove,
}: {
  direction: "up" | "down";
  disabled: boolean;
  onMove: () => void;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const label = direction === "up" ? "Move up" : "Move down";
  return (
    <Tooltip content={label} placement="top" asLabel disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          onMove();
        }}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lyra-xs border transition-colors",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
          disabled
            ? "cursor-not-allowed border-lyra-border-subtle text-lyra-fg-disabled"
            : "border-lyra-border-subtle text-lyra-fg-secondary hover:bg-lyra-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

function PageOrderRow({
  item,
  isDragging,
  isDragOver,
  isHome,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}: {
  item: PageOrderItem;
  isDragging: boolean;
  isDragOver: boolean;
  /** True for whichever row currently sits first in Shown — that's the
   * page agents land on at login. Derived from live order, not stored,
   * so it always follows the top row through a drag (see `PageOrderList`). */
  isHome?: boolean;
  /** False only for the very first row overall (top of Shown) / very last
   * row overall (bottom of More, or bottom of Shown if More is empty) —
   * everything else can move one step further. */
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "group flex items-center gap-3 border-b border-lyra-border-subtle bg-lyra-bg-surface-overlay px-4 py-2.5 last:border-b-0",
        isDragging && "opacity-40",
        isDragOver && !isDragging && "bg-lyra-bg-active-subtle"
      )}
    >
      <GripVertical
        className="h-4 w-4 shrink-0 cursor-grab text-lyra-fg-disabled active:cursor-grabbing"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <span className="flex-1 text-[14px] text-lyra-fg-default">{item.label}</span>
      {isHome && (
        <Chip
          color="blue"
          variant="subtle"
          className="px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide"
        >
          Home
        </Chip>
      )}
      <div className="flex items-center gap-1">
        <RowMoveButton direction="up" disabled={!canMoveUp} onMove={onMoveUp} />
        <RowMoveButton direction="down" disabled={!canMoveDown} onMove={onMoveDown} />
      </div>
    </div>
  );
}

/** A hidden app — always Apps-table-backed (see file doc-comment). No
 * grip, not draggable: this modal doesn't control its visibility, just
 * reflects that Switch, so there's nothing to drag it into or out of
 * here. */
function LockedHiddenRow({ item }: { item: PageOrderItem }) {
  return (
    <div className="flex items-center gap-3 border-b border-lyra-border-subtle bg-lyra-bg-surface-container-subtle px-4 py-2.5 last:border-b-0">
      <EyeOff className="h-4 w-4 shrink-0 text-lyra-fg-disabled" strokeWidth={1.5} aria-hidden="true" />
      <span className="flex-1 text-[14px] text-lyra-fg-secondary">{item.label}</span>
      <Chip
        color="slate"
        variant="subtle"
        className="px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide"
      >
        Hidden
      </Chip>
    </div>
  );
}

/** The reorderable list on its own, in case a future surface wants it
 * without the modal chrome (e.g. inlined into a page instead of a dialog). */
export function PageOrderList({
  items,
  onItemsChange,
}: {
  items: PageOrderItem[];
  onItemsChange: (items: PageOrderItem[]) => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const { shown, more, hidden } = partitionItems(items);
  const renderOrder = [...shown, ...more];
  const firstKey = renderOrder[0]?.key;
  const lastKey = renderOrder[renderOrder.length - 1]?.key;

  /** Keyboard equivalent of dragging a row one slot up/down. Always a
   * straight swap with whatever currently sits in the adjacent slot —
   * each side simply takes over the other's section (and therefore
   * band), so a swap across the Shown/More boundary trades exactly one
   * item for one item and the 8-item cap never needs a separate bump
   * (unlike `dropInto`, which inserts rather than swaps and does need one). */
  function moveItem(key: string, direction: "up" | "down") {
    const idx = renderOrder.findIndex((i) => i.key === key);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= renderOrder.length) return;

    const sectionOfSlot = (i: number): "shown" | "more" =>
      i < shown.length ? "shown" : "more";

    const next = [...renderOrder];
    const dragged = next[idx];
    const target = next[targetIdx];
    next[idx] = { ...target, band: sectionOfSlot(idx) === "more" ? "more" : undefined };
    next[targetIdx] = { ...dragged, band: sectionOfSlot(targetIdx) === "more" ? "more" : undefined };

    onItemsChange([...next, ...hidden]);
  }

  function dropInto(section: "shown" | "more") {
    if (!dragKey) return;
    const draggedOriginal = items.find((i) => i.key === dragKey);
    if (!draggedOriginal) return;

    const rest = items.filter((i) => i.key !== dragKey);
    const restPartition = partitionItems(rest);

    const updated: PageOrderItem = { ...draggedOriginal, band: section === "more" ? "more" : undefined };

    const sectionList = restPartition[section];
    const hoverIdxInRest = overKey ? rest.findIndex((i) => i.key === overKey) : -1;
    const hoverInSection = hoverIdxInRest !== -1 && sectionList.some((i) => i.key === overKey);
    const insertAt = hoverInSection ? hoverIdxInRest : rest.length;

    const next = [...rest];
    next.splice(insertAt, 0, updated);

    // Shown is capped at RAIL_CAPACITY — if it was already full (before
    // this drop), bump whichever page was last there out to More rather
    // than let the rail overflow.
    let final = next;
    if (section === "shown" && restPartition.shown.length >= RAIL_CAPACITY) {
      const bumpKey = restPartition.shown[restPartition.shown.length - 1].key;
      final = next.map((i) => (i.key === bumpKey ? { ...i, band: "more" } : i));
    }

    onItemsChange(final);
    setDragKey(null);
    setOverKey(null);
  }

  function rowProps(item: PageOrderItem) {
    return {
      item,
      isDragging: dragKey === item.key,
      isDragOver: overKey === item.key,
      canMoveUp: item.key !== firstKey,
      canMoveDown: item.key !== lastKey,
      onDragStart: () => setDragKey(item.key),
      onDragEnter: () => setOverKey(item.key),
      onDragEnd: () => {
        setDragKey(null);
        setOverKey(null);
      },
      onMoveUp: () => moveItem(item.key, "up"),
      onMoveDown: () => moveItem(item.key, "down"),
    };
  }

  return (
    <div className="flex flex-col">
      <SectionLabel>
        Shown in navigation ({shown.length} of {RAIL_CAPACITY} max)
      </SectionLabel>
      <div
        className="flex min-h-[44px] flex-col rounded-lyra-sm border border-lyra-border-subtle"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          dropInto("shown");
        }}
      >
        {shown.map((item, index) => (
          <PageOrderRow key={item.key} {...rowProps(item)} isHome={index === 0} />
        ))}
        {shown.length === 0 && (
          <div className="px-4 py-3 text-center lyra-body-sm text-lyra-fg-disabled">
            Drag a page here to show it in the rail.
          </div>
        )}
      </div>

      <SectionLabel>More ellipsis</SectionLabel>
      <div
        className="flex min-h-[44px] flex-col rounded-lyra-sm border border-lyra-border-subtle"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          dropInto("more");
        }}
      >
        {more.map((item) => (
          <PageOrderRow key={item.key} {...rowProps(item)} />
        ))}
        {more.length === 0 && (
          <div className="px-4 py-3 text-center lyra-body-sm text-lyra-fg-disabled">
            Drag a page here to move it into the "···" menu, even with room
            to spare in the rail above.
          </div>
        )}
      </div>

      {hidden.length > 0 && (
        <>
          <SectionLabel>Hidden (turn back on in Apps above)</SectionLabel>
          <div className="flex flex-col rounded-lyra-sm border border-lyra-border-subtle">
            {hidden.map((item) => (
              <LockedHiddenRow key={item.key} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Modal shell mirrors `AddTeamModal` in create-desktop-profile-page.tsx
 * on purpose (same fixed-backdrop + centered-panel structure, same
 * header/body/footer chrome) so this reads as the same product's modal
 * pattern rather than a one-off. Edits happen on a local draft; Cancel
 * (or the backdrop/X) discards it, Save commits it back to the parent. ── */
export function PageOrderEditorModal({
  open,
  items,
  onCancel,
  onSave,
}: {
  open: boolean;
  items: PageOrderItem[];
  onCancel: () => void;
  onSave: (items: PageOrderItem[]) => void;
}) {
  const [draft, setDraft] = useState<PageOrderItem[]>(items);

  useEffect(() => {
    if (open) setDraft(items);
  }, [open, items]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[85vh] w-[420px] flex-col rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-lyra-border-subtle px-5 py-4">
          <span className="text-[16px] font-bold leading-6 text-lyra-fg-default">Page Order</span>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-lyra-xs text-lyra-fg-secondary hover:text-lyra-fg-default"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 lyra-body-sm text-lyra-fg-secondary">
            Drag a page between Shown and More to reorder it. Hidden pages come
            from the Apps table above and can't be changed here. The "Agent
            Editable" chip on the settings row decides whether agents can
            change this order themselves.
          </p>
          <PageOrderList items={draft} onItemsChange={setDraft} />
        </div>
        <div className="flex justify-end gap-2 border-t border-lyra-border-subtle px-5 py-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </div>
      </div>
    </div>
  );
}
