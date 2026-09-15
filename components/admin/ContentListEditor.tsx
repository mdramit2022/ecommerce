import type { SiteContentKind } from "@prisma/client";
import { ConfirmSubmitButton, SubmitButton } from "@/components/admin/FormButtons";
import { ContentIcon } from "@/components/layout/ContentIcon";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import {
  CONTENT_ICON_KEYS,
  CONTENT_ICON_LABELS,
  SITE_CONTENT_KIND_META,
  SOCIAL_NETWORK_KEYS,
  SOCIAL_NETWORK_LABELS,
  type ContentField,
} from "@/lib/content/kinds";
import type { SiteContentItemData } from "@/types/content";

export type ContentListEditorProps = {
  kind: SiteContentKind;
  items: SiteContentItemData[];
  /** Server Actions taking FormData: save (hidden `id` empty = create), toggle and delete. */
  saveAction: (formData: FormData) => Promise<void>;
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  returnTo: string;
};

const FIELD_WIDTH: Record<ContentField, string> = {
  icon: "w-40",
  group: "w-40",
  title: "min-w-[12rem] flex-1",
  subtitle: "min-w-[10rem] flex-1",
  href: "min-w-[14rem] flex-1",
};

/**
 * Server Component: one row per item, each row its own form posting to `saveAction`, plus a
 * blank row at the end for adding. Progressive enhancement: works without client JavaScript.
 * Validation errors come back as a flash message (see the actions) rather than inline.
 */
export function ContentListEditor({
  kind,
  items,
  saveAction,
  toggleAction,
  deleteAction,
  returnTo,
}: ContentListEditorProps) {
  const meta = SITE_CONTENT_KIND_META[kind];
  const iconKeys = kind === "SOCIAL_LINK" ? SOCIAL_NETWORK_KEYS : CONTENT_ICON_KEYS;
  const iconLabel = (key: string) =>
    kind === "SOCIAL_LINK"
      ? SOCIAL_NETWORK_LABELS[key as (typeof SOCIAL_NETWORK_KEYS)[number]]
      : CONTENT_ICON_LABELS[key as (typeof CONTENT_ICON_KEYS)[number]];

  const field = (name: ContentField, item: SiteContentItemData | null, rowId: string) => {
    const id = `${rowId}-${name}`;
    const label = meta.labels[name] ?? name;
    if (name === "icon") {
      return (
        <label
          key={name}
          className={`flex flex-col gap-1 text-xs text-neutral-500 ${FIELD_WIDTH[name]}`}
        >
          {label}
          <Select id={id} name="icon" defaultValue={item?.icon ?? ""} className="h-9 py-0 text-sm">
            <option value="">Choose...</option>
            {iconKeys.map((key) => (
              <option key={key} value={key}>
                {iconLabel(key)}
              </option>
            ))}
          </Select>
        </label>
      );
    }
    const value =
      name === "group"
        ? item?.group
        : name === "title"
          ? item?.title
          : name === "subtitle"
            ? item?.subtitle
            : item?.href;
    return (
      <label
        key={name}
        className={`flex flex-col gap-1 text-xs text-neutral-500 ${FIELD_WIDTH[name]}`}
      >
        {label}
        <Input
          id={id}
          name={name}
          defaultValue={value ?? ""}
          className="h-9 py-0 text-sm"
          placeholder={name === "href" ? "/shop or https://..." : undefined}
        />
      </label>
    );
  };

  const row = (item: SiteContentItemData | null, index: number) => {
    const rowId = item ? `item-${item.id}` : `new-${kind}`;
    return (
      <li
        key={rowId}
        className={`flex flex-wrap items-end gap-3 px-4 py-3 ${item ? "" : "bg-neutral-50"} ${item && !item.isActive ? "opacity-60" : ""}`}
      >
        {item?.icon && kind !== "FOOTER_LINK" && (
          <span
            className="mb-2 hidden h-5 w-5 shrink-0 text-neutral-500 sm:block"
            aria-hidden="true"
          >
            <ContentIcon icon={item.icon} className="h-5 w-5" />
          </span>
        )}

        <form action={saveAction} className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <input type="hidden" name="returnTo" value={returnTo} />
          {meta.fields.map((name) => field(name, item, rowId))}
          <label className="flex w-20 flex-col gap-1 text-xs text-neutral-500">
            Order
            <Input
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              defaultValue={item?.sortOrder ?? index}
              className="h-9 py-0 text-sm"
            />
          </label>
          <label className="mb-2 flex items-center gap-2 text-xs text-neutral-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={item?.isActive ?? true}
              className="h-4 w-4 rounded border-neutral-300"
            />
            Active
          </label>
          <SubmitButton size="sm" variant={item ? "secondary" : "primary"}>
            {item ? "Save" : "Add"}
          </SubmitButton>
        </form>

        {item && (
          <div className="flex items-center gap-1">
            <form action={toggleAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <SubmitButton variant="ghost" size="sm">
                {item.isActive ? "Hide" : "Show"}
              </SubmitButton>
            </form>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <ConfirmSubmitButton
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50"
                confirmMessage={`Delete this ${meta.label.toLowerCase()}? This cannot be undone.`}
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </li>
    );
  };

  return (
    <Card className="p-0" id={`content-${kind.toLowerCase()}`}>
      <div className="border-b border-neutral-200 px-4 py-4">
        <h2 className="font-semibold text-neutral-900">
          {meta.plural} <span className="font-normal text-neutral-500">({items.length})</span>
        </h2>
        <p className="mt-0.5 text-sm text-neutral-500">{meta.hint}</p>
      </div>
      <ul className="divide-y divide-neutral-100">
        {items.map((item, index) => row(item, index))}
        {row(null, items.length)}
      </ul>
    </Card>
  );
}
