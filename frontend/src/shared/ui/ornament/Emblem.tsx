import { Kupavka } from "./Kupavka";
import { Ear, Rowan, Snowflake } from "./Motifs";

/** Kinds of storage places (docs/04-data-model.md, `storage_locations.kind`). */
export type PlaceKind = "fridge" | "freezer" | "pantry" | "cellar" | "balcony" | "other";

/**
 * The flower of a place: kupavka for the fridge and any other place, snowflower for the freezer,
 * ear of grain for the cupboard, rowan for the balcony (docs/10-design.md §5).
 */
export function Emblem({
  kind,
  className = "size-[34px]",
}: {
  kind: PlaceKind;
  className?: string;
}) {
  switch (kind) {
    case "freezer":
      return <Snowflake className={className} />;
    case "pantry":
      return <Ear className={className} />;
    case "balcony":
      return <Rowan className={className} />;
    default:
      return <Kupavka className={className} />;
  }
}
