#!/usr/bin/env python3
"""Validate docs/catalog/*.csv against the rules in docs/05-domain-rules.md and docs/db/schema_design.sql.

Stdlib only. Usage:  python3 docs/catalog/validate_catalog.py [catalog_dir]
Exit code 0 = OK, 1 = errors found. Run after every manual edit of the catalog
(also wired into CI once the backend exists — task T-020).
"""
from __future__ import annotations

import csv
import re
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

SLUG_RE = re.compile(r"^[a-z][a-z0-9_]*$")
UNITS = {"g", "ml", "pcs"}
MODES = {"exact", "level"}
LOCATION_KINDS = {"fridge", "freezer", "pantry", "cellar", "balcony", "other"}
THRESHOLDS = ("portion", "low_below", "plenty_from", "excess_from")
DAYS = ("shelf_life_days", "shelf_life_opened_days", "shelf_life_frozen_days")
PRODUCT_COLUMNS = [
    "slug", "name_ru", "aliases", "category", "unit", "tracking_mode", "default_location_kind",
    "package_size", *THRESHOLDS, *DAYS, "keep_in_stock",
]


def norm(text: str) -> str:
    return text.lower().replace("ё", "е")


def dec(value: str) -> Decimal | None:
    if value == "":
        return None
    return Decimal(value)


def validate(catalog_dir: Path) -> list[str]:
    errors: list[str] = []

    with open(catalog_dir / "categories.csv", encoding="utf-8", newline="") as f:
        categories = list(csv.DictReader(f))
    cat_slugs = set()
    for i, c in enumerate(categories, start=2):
        if not SLUG_RE.match(c["slug"]):
            errors.append(f"categories.csv:{i}: bad slug {c['slug']!r}")
        if c["slug"] in cat_slugs:
            errors.append(f"categories.csv:{i}: duplicate slug {c['slug']!r}")
        cat_slugs.add(c["slug"])
        if not c["name_ru"].strip():
            errors.append(f"categories.csv:{i}: empty name_ru")

    with open(catalog_dir / "products.csv", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != PRODUCT_COLUMNS:
            errors.append(f"products.csv: header must be {PRODUCT_COLUMNS}, got {reader.fieldnames}")
            return errors
        products = list(reader)

    slugs: set[str] = set()
    names: dict[str, str] = {}
    for i, p in enumerate(products, start=2):
        where = f"products.csv:{i} ({p['slug']})"
        if not SLUG_RE.match(p["slug"]):
            errors.append(f"{where}: bad slug")
        if p["slug"] in slugs:
            errors.append(f"{where}: duplicate slug")
        slugs.add(p["slug"])

        name = p["name_ru"].strip()
        if not name or len(name) > 80:
            errors.append(f"{where}: name_ru must be 1..80 chars")
        if norm(name) in names:
            errors.append(f"{where}: duplicate name (normalized) with {names[norm(name)]}")
        names[norm(name)] = p["slug"]

        if p["category"] not in cat_slugs:
            errors.append(f"{where}: unknown category {p['category']!r}")
        if p["unit"] not in UNITS:
            errors.append(f"{where}: unit must be one of {sorted(UNITS)}")
        if p["tracking_mode"] not in MODES:
            errors.append(f"{where}: tracking_mode must be one of {sorted(MODES)}")
        if p["default_location_kind"] not in LOCATION_KINDS:
            errors.append(f"{where}: default_location_kind must be one of {sorted(LOCATION_KINDS)}")
        if p["keep_in_stock"] not in ("true", "false"):
            errors.append(f"{where}: keep_in_stock must be true/false")
        if "," in p["aliases"]:
            errors.append(f"{where}: aliases are separated by '|', not ','")

        try:
            pkg = dec(p["package_size"])
            th = [dec(p[k]) for k in THRESHOLDS]
            days = [dec(p[k]) for k in DAYS]
        except InvalidOperation:
            errors.append(f"{where}: non-numeric value in numeric column")
            continue

        if pkg is not None and pkg <= 0:
            errors.append(f"{where}: package_size must be > 0")
        if th[0] is not None and th[0] <= 0:
            errors.append(f"{where}: portion must be > 0")
        for k, v in zip(THRESHOLDS[1:], th[1:]):
            if v is not None and v < 0:
                errors.append(f"{where}: {k} must be >= 0")
        present = [(k, v) for k, v in zip(THRESHOLDS, th) if v is not None]
        for (k1, v1), (k2, v2) in zip(present, present[1:]):
            if v1 > v2:
                errors.append(f"{where}: thresholds out of order: {k1}={v1} > {k2}={v2}")
        for k, v in zip(DAYS, days):
            if v is not None and (v <= 0 or v != v.to_integral_value()):
                errors.append(f"{where}: {k} must be a positive integer")
        if p["default_location_kind"] == "freezer" and days[2] is None:
            errors.append(f"{where}: freezer products need shelf_life_frozen_days")
        if p["unit"] == "pcs" and pkg is not None and pkg != pkg.to_integral_value():
            errors.append(f"{where}: package_size in pcs must be integer")

    if len(products) < 250:
        errors.append(f"products.csv: expected ~300 items, got {len(products)}")
    return errors


def main() -> int:
    catalog_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent
    errors = validate(catalog_dir)
    for e in errors:
        print(e)
    if errors:
        print(f"FAILED: {len(errors)} error(s)")
        return 1
    with open(catalog_dir / "products.csv", encoding="utf-8") as f:
        n = sum(1 for _ in f) - 1
    print(f"OK: {n} products")
    return 0


if __name__ == "__main__":
    sys.exit(main())
