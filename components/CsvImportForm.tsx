"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Papa, { ParseError } from "papaparse";
import * as XLSX from "xlsx";

type CsvRow = {
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  benefits?: string;
  reference_dose_low?: string;
  reference_dose_typical?: string;
  reference_dose_high?: string;
  frequency_reference?: string;
  references?: string;
  disclaimer?: string;
  image_url?: string;
  published?: string | boolean;
  featured?: string | boolean;
  featured_order?: string | number;
  default_vial_mg?: string | number;
  default_mixing_volume_ml?: string | number;
  default_sample_size_mcg?: string | number;
  typical_research_protocol?: string;
  duration?: string;
  general_administration_rules?: string;
  common_sides_regulatory?: string;
  most_popular_stacks?: string;
};

type PreviewRow = {
  rowNumber: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  benefits: string;
  reference_dose_low: string;
  reference_dose_typical: string;
  reference_dose_high: string;
  frequency_reference: string;
  references: string;
  disclaimer: string;
  image_url: string;
  published: boolean;
  featured: boolean;
  featured_order: number | null;
  default_vial_mg: number | null;
  default_mixing_volume_ml: number | null;
  default_sample_size_mcg: number | null;
  errors: string[];
  importType: "New" | "Update" | "Invalid";
};

const REQUIRED_COLUMNS = ["name", "slug", "category"];

const OPTIONAL_COLUMNS = [
  "description",
  "benefits",
  "reference_dose_low",
  "reference_dose_typical",
  "reference_dose_high",
  "frequency_reference",
  "references",
  "disclaimer",
  "image_url",
  "published",
  "featured",
  "featured_order",
  "default_vial_mg",
  "default_mixing_volume_ml",
  "default_sample_size_mcg",
  "typical_research_protocol",
  "duration",
  "general_administration_rules",
  "common_sides_regulatory",
  "most_popular_stacks",
];

const ALLOWED_COLUMNS = new Set([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]);

const HEADER_ALIASES: Record<string, string> = {
  peptide: "name",
  peptide_name: "name",
  "peptide name": "name",
  url_slug: "slug",
  "url slug": "slug",
  type: "category",
  summary: "description",
  overview: "description",
  effects: "benefits",
  reported_effects: "benefits",
  "reported effects": "benefits",
  dose_low: "reference_dose_low",
  low_dose: "reference_dose_low",
  dose_typical: "reference_dose_typical",
  typical_dose: "reference_dose_typical",
  dose_high: "reference_dose_high",
  high_dose: "reference_dose_high",
  frequency: "frequency_reference",
  administration_frequency: "frequency_reference",
  sources: "references",
  source: "references",
  image: "image_url",
  imageurl: "image_url",
  "image url": "image_url",
  is_published: "published",
  published_q: "published",
  is_featured: "featured",
  homepage_featured: "featured",
  feature_order: "featured_order",
  homepage_order: "featured_order",
  vial_mg: "default_vial_mg",
  default_vial_amount_mg: "default_vial_mg",
  mixing_volume_ml: "default_mixing_volume_ml",
  default_mixing_ml: "default_mixing_volume_ml",
  sample_size_mcg: "default_sample_size_mcg",
  default_sample_mcg: "default_sample_size_mcg",
  protocol: "typical_research_protocol",
  admin_rules: "general_administration_rules",
  sides: "common_sides_regulatory",
  stacks: "most_popular_stacks",
};

function canonicalizeHeader(header: string) {
  const cleaned = header
    .trim()
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/\?/g, "_q")
    .replace(/\//g, " ")
    .replace(/-+/g, "_")
    .replace(/\s+/g, "_");

  return HEADER_ALIASES[cleaned] ?? cleaned;
}

function remapRowKeys(row: Record<string, unknown>) {
  const remapped: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(row)) {
    const canonicalKey = canonicalizeHeader(rawKey);
    remapped[canonicalKey] = value;
  }

  return remapped as CsvRow;
}

function parseBoolean(value: string | boolean | undefined) {
  return (
    String(value).trim().toLowerCase() === "true" ||
    String(value).trim() === "1" ||
    String(value).trim().toLowerCase() === "yes"
  );
}

function parseNumber(value: string | number | undefined) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRowKeys(rows: CsvRow[]) {
  const keys = new Set<string>();

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keys.add(canonicalizeHeader(key));
    }
  }

  return Array.from(keys);
}

function validateHeaders(rows: CsvRow[]) {
  if (!rows.length) {
    throw new Error("No data rows found in the uploaded file.");
  }

  const keys = getRowKeys(rows);

  const missingRequired = REQUIRED_COLUMNS.filter(
    (column) => !keys.includes(column)
  );

  if (missingRequired.length) {
    throw new Error(`Missing required columns: ${missingRequired.join(", ")}.`);
  }

  const unknownColumns = keys.filter((key) => !ALLOWED_COLUMNS.has(key));

  return { unknownColumns };
}

function normalizeRow(row: CsvRow, rowNumber: number): PreviewRow {
  const referenceDoseTypical =
    row.reference_dose_typical?.toString().trim() ||
    row.typical_research_protocol?.toString().trim() ||
    "";

  const frequencyReference =
    row.frequency_reference?.toString().trim() ||
    row.general_administration_rules?.toString().trim() ||
    row.duration?.toString().trim() ||
    "";

  return {
    rowNumber,
    name: row.name?.toString().trim() || "",
    slug: row.slug?.toString().trim() || "",
    category: row.category?.toString().trim() || "",
    description: row.description?.toString().trim() || "",
    benefits: row.benefits?.toString().trim() || "",
    reference_dose_low: row.reference_dose_low?.toString().trim() || "",
    reference_dose_typical: referenceDoseTypical,
    reference_dose_high: row.reference_dose_high?.toString().trim() || "",
    frequency_reference: frequencyReference,
    references: row.references?.toString().trim() || "",
    disclaimer:
      row.disclaimer?.toString().trim() ||
      "Data compiled from community sources for reference only. This information does not constitute medical advice, diagnosis, or treatment guidance and should not be used as a basis for any health-related decisions.",
    image_url: row.image_url?.toString().trim() || "",
    published: parseBoolean(row.published),
    featured: parseBoolean(row.featured),
    featured_order: parseNumber(row.featured_order),
    default_vial_mg: parseNumber(row.default_vial_mg),
    default_mixing_volume_ml: parseNumber(row.default_mixing_volume_ml),
    default_sample_size_mcg: parseNumber(row.default_sample_size_mcg),
    errors: [],
    importType: "New",
  };
}

function validateRows(rows: PreviewRow[]): PreviewRow[] {
  const slugCounts = new Map<string, number>();

  rows.forEach((row) => {
    if (row.slug) {
      slugCounts.set(row.slug, (slugCounts.get(row.slug) || 0) + 1);
    }
  });

  return rows.map((row): PreviewRow => {
    const errors: string[] = [];

    if (!row.name) errors.push("Missing name");
    if (!row.slug) errors.push("Missing slug");
    if (!row.category) errors.push("Missing category");

    if (row.slug && (slugCounts.get(row.slug) ?? 0) > 1) {
      errors.push("Duplicate slug in file");
    }

    if (row.featured && row.featured_order !== null && row.featured_order < 1) {
      errors.push("Featured order must be 1 or greater");
    }

    return {
      ...row,
      errors,
      importType: errors.length ? "Invalid" : "New",
    };
  });
}

async function applyImportTypes(rows: PreviewRow[]): Promise<PreviewRow[]> {
  const validSlugRows = rows.filter((row) => row.slug && row.errors.length === 0);
  const slugs = validSlugRows.map((row) => row.slug);

  if (!slugs.length) {
    return rows;
  }

  try {
    const response = await fetch("/api/admin/import/check-slugs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slugs }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not check existing slugs.");
    }

    const existingSlugSet = new Set<string>(data.existingSlugs ?? []);

    return rows.map((row): PreviewRow => {
      if (row.errors.length) {
        return {
          ...row,
          importType: "Invalid",
        };
      }

      return {
        ...row,
        importType: existingSlugSet.has(row.slug) ? "Update" : "New",
      };
    });
  } catch {
    return rows.map((row): PreviewRow => ({
      ...row,
      importType: row.errors.length ? "Invalid" : "New",
    }));
  }
}

async function parseCsvFile(file: File) {
  return new Promise<{
    rows: CsvRow[];
    delimiter: string;
  }>((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      delimitersToGuess: [",", ";", "\t", "|"],
      complete: (results) => {
        const fatal = results.errors?.find(
          (err: ParseError) => err.code !== "UndetectableDelimiter"
        );

        if (fatal) {
          reject(new Error(fatal.message));
          return;
        }

        const rows = (results.data ?? []) as unknown as CsvRow[];

        if (!rows.length) {
          reject(
            new Error(
              "CSV parsed successfully, but no rows were returned. Check header row formatting."
            )
          );
          return;
        }

        resolve({
          rows,
          delimiter: results.meta.delimiter || ",",
        });
      },
      error: (err: Error) => reject(err),
    });
  });
}

async function parseExcelFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (!workbook.SheetNames.length) {
    throw new Error("No worksheet found in the Excel file.");
  }

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: "",
    });

    if (rows.length > 0) {
      return {
        rows: rows as unknown as CsvRow[],
        sheetName,
      };
    }
  }

  throw new Error(
    "No data rows were found in the Excel file. Check that the workbook contains a populated sheet with a header row."
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "blue" | "red";
}) {
  const toneClasses =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "blue"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function CsvImportForm() {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [overwriteExisting, setOverwriteExisting] = useState(true);

  async function processRawRows(rows: CsvRow[], sourceLabel?: string) {
    const remappedRows = rows.map((row) =>
      remapRowKeys(row as Record<string, unknown>)
    );

    const { unknownColumns } = validateHeaders(remappedRows);

    const warnings: string[] = [];

    if (sourceLabel) warnings.push(sourceLabel);
    if (unknownColumns.length) {
      warnings.push(`Unknown columns will be ignored: ${unknownColumns.join(", ")}`);
    }

    setWarning(warnings.length ? warnings.join(" • ") : null);

    const normalized = remappedRows.map((row, index) =>
      normalizeRow(row, index + 2)
    );

    const validated = validateRows(normalized);
    const rowsWithTypes = await applyImportTypes(validated);

    setPreviewRows(rowsWithTypes);
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setMessage(null);
    setError(null);
    setWarning(null);
    setPreviewRows([]);
    setFileName(file.name);

    const lowerName = file.name.toLowerCase();

    try {
      if (lowerName.endsWith(".csv")) {
        const csvResult = await parseCsvFile(file);
        await processRawRows(
          csvResult.rows,
          `Parsed CSV using "${csvResult.delimiter}" delimiter`
        );
        return;
      }

      if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        const excelResult = await parseExcelFile(file);
        await processRawRows(
          excelResult.rows,
          `Imported from Excel sheet: ${excelResult.sheetName}`
        );
        return;
      }

      throw new Error("Please upload a .csv, .xlsx, or .xls file.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not read the selected file."
      );
    }
  }

  const validRows = useMemo(
    () => previewRows.filter((row) => row.errors.length === 0),
    [previewRows]
  );

  const invalidRows = useMemo(
    () => previewRows.filter((row) => row.errors.length > 0),
    [previewRows]
  );

  const newRows = useMemo(
    () => previewRows.filter((row) => row.importType === "New"),
    [previewRows]
  );

  const updateRows = useMemo(
    () => previewRows.filter((row) => row.importType === "Update"),
    [previewRows]
  );

  async function handleConfirmImport() {
    if (!validRows.length) {
      setError("No valid rows are available to import.");
      return;
    }

    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const rowsToImport = validRows.map(
        ({ rowNumber, errors, importType, ...row }: PreviewRow) => row
      );

      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: rowsToImport,
          overwriteExisting,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed.");
      }

      setMessage(data.message || "Import complete.");
      setPreviewRows([]);
      setFileName(null);
      setWarning(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="block flex-1">
          <span className="mb-2 block text-sm font-medium">
            Choose CSV or Excel file
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border px-4 py-3 text-sm"
          />
        </label>

        <Link
          href="/api/admin/import/template"
          className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)]"
        >
          Download template
        </Link>
      </div>

      <div className="mt-4 rounded-xl border bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
        <p className="font-medium text-[var(--color-text)]">Supported files</p>
        <p className="mt-2 leading-6">.csv, .xlsx, .xls</p>

        <p className="mt-4 font-medium text-[var(--color-text)]">
          Required columns
        </p>
        <p className="mt-2 leading-6">name, slug, category</p>

        <p className="mt-4 font-medium text-[var(--color-text)]">
          Optional columns
        </p>
        <p className="mt-2 leading-6">
          description, benefits, reference_dose_low, reference_dose_typical,
          reference_dose_high, frequency_reference, references, disclaimer,
          image_url, published, featured, featured_order, default_vial_mg,
          default_mixing_volume_ml, default_sample_size_mcg
        </p>

        <p className="mt-3 leading-6">
          Friendly header names are supported too, like “Typical Dose”,
          “Frequency”, “Image URL”, and “Default Vial Amount (mg)”.
        </p>

        <p className="mt-3 leading-6">
          Legacy compatibility columns still accepted: typical_research_protocol,
          duration, general_administration_rules
        </p>
      </div>

      {fileName ? (
        <div className="mt-4 rounded-xl border p-4 text-sm">
          <p>
            <span className="font-medium">File:</span> {fileName}
          </p>
          <p className="mt-1 text-[var(--color-muted)]">
            {previewRows.length} row(s) found • {validRows.length} valid •{" "}
            {invalidRows.length} invalid
          </p>
        </div>
      ) : null}

      {warning ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {warning}
        </p>
      ) : null}

      {previewRows.length ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Preview</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <SummaryCard label="New" value={String(newRows.length)} tone="green" />
            <SummaryCard label="Update" value={String(updateRows.length)} tone="blue" />
            <SummaryCard label="Invalid" value={String(invalidRows.length)} tone="red" />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={overwriteExisting}
              onChange={(e) => setOverwriteExisting(e.target.checked)}
            />
            Overwrite existing fields on matched peptides
          </label>

          <p className="mt-2 text-xs text-[var(--color-muted)]">
            When unchecked, existing peptides keep their current values and only blank fields are filled.
          </p>

          <div className="mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[var(--color-surface-muted)] text-left">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Published</th>
                  <th className="px-3 py-2 font-medium">Import Type</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`border-b last:border-b-0 ${
                      row.errors.length ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2">{row.name || "—"}</td>
                    <td className="px-3 py-2">{row.slug || "—"}</td>
                    <td className="px-3 py-2">{row.category || "—"}</td>
                    <td className="px-3 py-2">{row.published ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          row.importType === "New"
                            ? "bg-green-100 text-green-700"
                            : row.importType === "Update"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {row.importType}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {row.errors.length ? (
                        <ul className="list-disc pl-4 text-red-600">
                          {row.errors.map((err) => (
                            <li key={err}>{err}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-green-700">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invalidRows.length ? (
            <p className="mt-4 text-sm text-red-600">
              Invalid rows will not be imported. Fix them in the file and re-upload,
              or continue to import only the valid rows.
            </p>
          ) : (
            <p className="mt-4 text-sm text-green-700">
              All rows are valid and ready to import.
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!validRows.length || loading}
            className="mt-4 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Importing..." : `Confirm Import (${validRows.length})`}
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}