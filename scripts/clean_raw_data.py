#!/usr/bin/env python3
"""Convert and clean the Piano dei Conti sheet from data/raw_data.xlsx."""

from __future__ import annotations

import argparse
import csv
import re
import zipfile
from decimal import Decimal, InvalidOperation
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw_data.xlsx"
DEFAULT_OUTPUT = ROOT / "data" / "Piano_dei_Conti.csv"
SHEET_NAME = "Piano dei Conti"

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

INPUT_HEADERS = [
    "Codice",
    "Livello",
    "Descrizione",
    "Sezione CEE",
    "Natura",
    "D/A",
    "Saldo Dare",
    "Saldo Avere",
    "Note",
]

OUTPUT_HEADERS = [
    "codice",
    "livello",
    "descrizione",
    "sezione_cee",
    "natura",
    "d_a",
    "saldo_dare",
    "saldo_avere",
    "note",
]

FOOTER_DESCRIPTIONS = {
    "TOTALE GENERALE BILANCIO DI VERIFICA",
    "QUADRATURA (DARE - AVERE)",
}


def xml_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return "".join(element.itertext())


def column_index(cell_ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", cell_ref.upper())
    index = 0
    for letter in letters:
        index = index * 26 + ord(letter) - ord("A") + 1
    return index - 1


def read_shared_strings(workbook: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [xml_text(item) for item in root.findall("main:si", NS)]


def normalize_sheet_target(target: str) -> str:
    target = target.lstrip("/")
    if target.startswith("xl/"):
        return target
    return f"xl/{target}"


def find_sheet_path(workbook: zipfile.ZipFile, sheet_name: str) -> str:
    workbook_xml = ET.fromstring(workbook.read("xl/workbook.xml"))
    rels_xml = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    rel_targets = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels_xml.findall("pkgrel:Relationship", NS)
    }

    for sheet in workbook_xml.findall("main:sheets/main:sheet", NS):
        if sheet.attrib.get("name") != sheet_name:
            continue
        relationship_id = sheet.attrib[
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        ]
        return normalize_sheet_target(rel_targets[relationship_id])

    raise ValueError(f"Sheet not found: {sheet_name}")


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value = cell.find("main:v", NS)

    if cell_type == "s":
        if value is None or value.text is None:
            return ""
        return shared_strings[int(value.text)]
    if cell_type == "inlineStr":
        return xml_text(cell.find("main:is", NS))
    if cell_type == "b":
        return "TRUE" if value is not None and value.text == "1" else "FALSE"
    return value.text if value is not None and value.text is not None else ""


def read_sheet_rows(workbook_path: Path, sheet_name: str) -> list[list[str]]:
    with zipfile.ZipFile(workbook_path) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheet_path = find_sheet_path(workbook, sheet_name)
        sheet_xml = ET.fromstring(workbook.read(sheet_path))

    rows: list[list[str]] = []
    for row in sheet_xml.findall(".//main:sheetData/main:row", NS):
        values: list[str] = []
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            index = column_index(ref)
            while len(values) <= index:
                values.append("")
            values[index] = cell_value(cell, shared_strings)
        rows.append(values)
    return rows


def clean_text(value: str) -> str:
    return str(value).replace("\xa0", " ").strip()


def normalize_amount(value: str) -> str:
    value = clean_text(value)
    if not value:
        return "0"

    # Accept both Excel numeric strings and Italian-formatted values.
    if "," in value:
        value = value.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d{1,3}(\.\d{3})+", value):
        value = value.replace(".", "")

    try:
        number = Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"Invalid amount: {value!r}") from exc

    normalized = format(number.normalize(), "f")
    return "0" if normalized == "-0" else normalized


def is_footer_row(row: dict[str, str]) -> bool:
    description = clean_text(row["Descrizione"]).upper()
    return description in FOOTER_DESCRIPTIONS


def clean_rows(raw_rows: list[list[str]]) -> list[dict[str, str]]:
    if not raw_rows:
        raise ValueError("The source sheet is empty.")

    headers = [clean_text(value) for value in raw_rows[0]]
    if headers[: len(INPUT_HEADERS)] != INPUT_HEADERS:
        raise ValueError(f"Unexpected headers: {headers}")

    cleaned: list[dict[str, str]] = []
    for raw_row in raw_rows[1:]:
        padded = raw_row + [""] * (len(INPUT_HEADERS) - len(raw_row))
        row = dict(zip(INPUT_HEADERS, padded[: len(INPUT_HEADERS)]))
        row = {key: clean_text(value) for key, value in row.items()}

        if is_footer_row(row):
            continue
        if not any(row.values()):
            continue

        output_row = {
            "codice": row["Codice"],
            "livello": row["Livello"],
            "descrizione": row["Descrizione"],
            "sezione_cee": row["Sezione CEE"],
            "natura": row["Natura"],
            "d_a": row["D/A"],
            "saldo_dare": normalize_amount(row["Saldo Dare"]),
            "saldo_avere": normalize_amount(row["Saldo Avere"]),
            "note": row["Note"],
        }
        cleaned.append(output_row)

    return cleaned


def validate_rows(rows: list[dict[str, str]]) -> None:
    if len(rows) != 454:
        raise ValueError(f"Expected 454 cleaned rows, found {len(rows)}.")

    for index, row in enumerate(rows, start=2):
        for column in ("codice", "livello", "descrizione"):
            if not row[column]:
                raise ValueError(f"Missing {column} at cleaned row {index}.")
        for column in ("saldo_dare", "saldo_avere"):
            try:
                Decimal(row[column])
            except InvalidOperation as exc:
                raise ValueError(
                    f"Invalid numeric value in {column} at cleaned row {index}: {row[column]!r}"
                ) from exc


def write_csv(rows: list[dict[str, str]], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=OUTPUT_HEADERS)
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Clean data/raw_data.xlsx and generate data/Piano_dei_Conti.csv."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    raw_rows = read_sheet_rows(args.input, SHEET_NAME)
    cleaned_rows = clean_rows(raw_rows)
    validate_rows(cleaned_rows)
    write_csv(cleaned_rows, args.output)
    print(f"Wrote {len(cleaned_rows)} rows to {args.output}")


if __name__ == "__main__":
    main()
