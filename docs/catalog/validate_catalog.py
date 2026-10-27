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
THRESHOLDS = ("critical_below", "low_below", "plenty_from", "excess_from")
DAYS = ("shelf_life_days", "shelf_life_opened_days", "shelf_life_frozen_days")
PRODUCT_COLUMNS = [
    "slug", "name_ru", "aliases", "category", "unit", "tracking_mode", "default_location_kind",
    *THRESHOLDS, *DAYS, "keep_in_stock",
]
MEASURE_COLUMNS = ["slug", "one", "few", "many", "gen", "halves", "sort_order"]
# product_name, measure_name and unit only help a person read the file in Excel; they must match
# products.csv and measures.csv and are not loaded into the database.
PRODUCT_MEASURE_COLUMNS = [
    "product", "product_name", "role", "measure", "measure_name", "amount", "unit", "sort_order",
]
# Household measures per product (05-domain-rules §1.1): how it is bought and how it is taken.
ROLE_LIMITS = {"buy": 1, "use": 2}
UNIT_NAMES = {"g": "г", "ml": "мл", "pcs": "шт"}


def norm(text: str) -> str:
    return text.lower().replace("ё", "е")


def dec(value: str) -> Decimal | None:
    if value == "":
        return None
    return Decimal(value)


def read(path: Path, columns: list[str], errors: list[str]) -> list[dict[str, str]] | None:
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != columns:
            errors.append(f"{path.name}: header must be {columns}, got {reader.fieldnames}")
            return None
        return list(reader)


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

    products = read(catalog_dir / "products.csv", PRODUCT_COLUMNS, errors)
    if products is None:
        return errors

    slugs: set[str] = set()
    units: dict[str, str] = {}
    product_names: dict[str, str] = {}
    names: dict[str, str] = {}
    for i, p in enumerate(products, start=2):
        where = f"products.csv:{i} ({p['slug']})"
        if not SLUG_RE.match(p["slug"]):
            errors.append(f"{where}: bad slug")
        if p["slug"] in slugs:
            errors.append(f"{where}: duplicate slug")
        slugs.add(p["slug"])
        units[p["slug"]] = p["unit"]
        product_names[p["slug"]] = p["name_ru"]

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
            th = [dec(p[k]) for k in THRESHOLDS]
            days = [dec(p[k]) for k in DAYS]
        except InvalidOperation:
            errors.append(f"{where}: non-numeric value in numeric column")
            continue

        if th[0] is not None and th[0] <= 0:
            errors.append(f"{where}: critical_below must be > 0")
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
        if p["keep_in_stock"] == "true" and th[1] is None:
            errors.append(f"{where}: keep_in_stock (норма дома) needs low_below")

    if len(products) < 250:
        errors.append(f"products.csv: expected ~300 items, got {len(products)}")

    errors += validate_measures(catalog_dir, units, product_names)
    return errors


def validate_measures(catalog_dir: Path, units: dict[str, str], product_names: dict[str, str]) -> list[str]:
    errors: list[str] = []
    measures = read(catalog_dir / "measures.csv", MEASURE_COLUMNS, errors)
    product_measures = read(catalog_dir / "product_measures.csv", PRODUCT_MEASURE_COLUMNS, errors)
    if measures is None or product_measures is None:
        return errors

    measure_names: dict[str, str] = {}
    for i, m in enumerate(measures, start=2):
        where = f"measures.csv:{i} ({m['slug']})"
        if not SLUG_RE.match(m["slug"]):
            errors.append(f"{where}: bad slug")
        if m["slug"] in measure_names:
            errors.append(f"{where}: duplicate slug")
        measure_names[m["slug"]] = m["one"]
        for k in ("one", "few", "many", "gen"):
            if not m[k].strip():
                errors.append(f"{where}: empty {k}")
        if m["halves"] not in ("true", "false"):
            errors.append(f"{where}: halves must be true/false")

    seen: set[tuple[str, str, str]] = set()
    per_role: dict[tuple[str, str], int] = {}
    for i, pm in enumerate(product_measures, start=2):
        where = f"product_measures.csv:{i} ({pm['product']}, {pm['measure']})"
        if pm["product"] not in units:
            errors.append(f"{where}: unknown product")
            continue
        if pm["product_name"] != product_names[pm["product"]]:
            errors.append(f"{where}: product_name must be {product_names[pm['product']]!r} as in products.csv")
        if pm["unit"] != UNIT_NAMES[units[pm["product"]]]:
            errors.append(f"{where}: unit must be {UNIT_NAMES[units[pm['product']]]!r} (unit of the product)")
        if pm["measure"] not in measure_names:
            errors.append(f"{where}: unknown measure")
        elif pm["measure_name"] != measure_names[pm["measure"]]:
            errors.append(f"{where}: measure_name must be {measure_names[pm['measure']]!r} as in measures.csv")
        if pm["role"] not in ROLE_LIMITS:
            errors.append(f"{where}: role must be one of {sorted(ROLE_LIMITS)}")
            continue
        key = (pm["product"], pm["role"], pm["measure"])
        if key in seen:
            errors.append(f"{where}: duplicate measure for this role")
        seen.add(key)
        count_key = (pm["product"], pm["role"])
        per_role[count_key] = per_role.get(count_key, 0) + 1
        if per_role[count_key] > ROLE_LIMITS[pm["role"]]:
            errors.append(f"{where}: at most {ROLE_LIMITS[pm['role']]} '{pm['role']}' measure(s) per product")
        try:
            amount = Decimal(pm["amount"])
        except InvalidOperation:
            errors.append(f"{where}: amount must be a number")
            continue
        if amount <= 0:
            errors.append(f"{where}: amount must be > 0")
        if units[pm["product"]] == "pcs" and amount != amount.to_integral_value():
            errors.append(f"{where}: amount in pcs must be integer")
    return errors


def base_text(q: Decimal, unit: str) -> str:
    """Quantity in base units for people (05-domain-rules §1): 1500 g -> «1,5 кг»."""
    big = {"g": "кг", "ml": "л"}
    if unit in big and q >= 1000:
        return f"{(q / 1000).normalize():f}".replace(".", ",") + " " + big[unit]
    return f"{q.normalize():f}".replace(".", ",") + " " + UNIT_NAMES[unit]


def plural(n: Decimal, m: dict[str, str]) -> str:
    if n != n.to_integral_value():
        return m["gen"]
    k = int(n)
    if k % 10 == 1 and k % 100 != 11:
        return m["one"]
    if 2 <= k % 10 <= 4 and not 12 <= k % 100 <= 14:
        return m["few"]
    return m["many"]


def norm_text(low_below: Decimal, unit: str, buy: dict[str, str] | None, measure: dict[str, str] | None) -> str:
    """Home norm as the UI shows it (05-domain-rules §3.7): in the buy measure when it is a whole
    or half number of them, otherwise in base units."""
    if buy and measure:
        n = low_below / Decimal(buy["amount"])
        step = Decimal("0.5") if measure["halves"] == "true" else Decimal(1)
        if n >= step and n % step == 0:
            count = f"{n.normalize():f}".replace(".", ",").replace("0,5", "½").replace(",5", "½")
            return f"{count} {plural(n, measure)}"
    return base_text(low_below, unit)


def print_norms(catalog_dir: Path) -> None:
    """Readable list of products with a home norm: python validate_catalog.py --norms"""
    with open(catalog_dir / "products.csv", encoding="utf-8", newline="") as f:
        products = list(csv.DictReader(f))
    with open(catalog_dir / "measures.csv", encoding="utf-8", newline="") as f:
        measures = {m["slug"]: m for m in csv.DictReader(f)}
    with open(catalog_dir / "product_measures.csv", encoding="utf-8", newline="") as f:
        buys = {pm["product"]: pm for pm in csv.DictReader(f) if pm["role"] == "buy"}
    print("Норма дома (keep_in_stock = true): «не меньше …»; ниже нормы — «Мало», ниже critical_below — «Почти нет»")
    for p in products:
        if p["keep_in_stock"] != "true":
            continue
        buy = buys.get(p["slug"])
        measure = measures[buy["measure"]] if buy else None
        norm = norm_text(Decimal(p["low_below"]), p["unit"], buy, measure)
        critical = "< " + base_text(Decimal(p["critical_below"]), p["unit"]) if p["critical_below"] else "—"
        bought = f"{buy['measure_name']} {base_text(Decimal(buy['amount']), p['unit'])}" if buy else "—"
        print(f"{p['name_ru']:<24} не меньше {norm:<14} почти нет: {critical:<11} покупают: {bought}")


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    catalog_dir = Path(args[0]) if args else Path(__file__).parent
    errors = validate(catalog_dir)
    for e in errors:
        print(e)
    if errors:
        print(f"FAILED: {len(errors)} error(s)")
        return 1
    with open(catalog_dir / "products.csv", encoding="utf-8") as f:
        n = sum(1 for _ in f) - 1
    with open(catalog_dir / "product_measures.csv", encoding="utf-8") as f:
        m = sum(1 for _ in f) - 1
    print(f"OK: {n} products, {m} product measures")
    if "--norms" in sys.argv:
        print_norms(catalog_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
