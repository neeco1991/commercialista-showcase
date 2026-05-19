 # Data Cleaning Script For raw_data.xlsx

  ## Summary

  Create a self-contained Python script that extracts the Piano dei Conti sheet from data/raw_data.xlsx, cleans it, and writes data/Piano_dei_Conti.csv.

  ## Key Changes

  - Add a script, e.g. scripts/clean_raw_data.py, using only Python standard library modules because pandas and openpyxl are not installed.
  - Parse the XLSX directly via zipfile + xml.etree.ElementTree.
  - Select only the Piano dei Conti sheet.
  - Drop non-accounting footer rows:
      - TOTALE GENERALE BILANCIO DI VERIFICA
      - QUADRATURA (Dare - Avere)
  - Clean fields:
      - trim whitespace in all text cells
      - preserve account codes as strings, including leading zeroes
      - convert Saldo Dare and Saldo Avere to normalized decimal strings
      - keep blank optional fields blank
  - Write data/Piano_dei_Conti.csv with UTF-8 encoding and headers:
      - codice
      - livello
      - descrizione
      - sezione_cee
      - natura
      - d_a
      - saldo_dare

  ## Validation

  - Confirm the output CSV has 454 data rows after removing the 2 footer rows.
  - Confirm all rows have a non-empty codice, livello, and descrizione.
  - Confirm saldo_dare and saldo_avere are numeric for every output row.
  - Confirm the script can be rerun idempotently and overwrites only data/Piano_dei_Conti.csv.

  ## Assumptions

  - The exercise’s intended CSV fixture is the workbook sheet named Piano dei Conti.
  - The output should live next to the source workbook in data/.
  - No third-party dependency should be introduced just for this conversion.