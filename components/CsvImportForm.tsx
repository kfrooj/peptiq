"use client";

import { useMemo, useState } from "react";
import Papa from "papaparse";

type CsvRow = {
  name?: string;
  slug?: string;
  category?: string;
  benefits?: string;
  typical_research_protocol?: string;
  duration?: string;
  common_sides_regulatory?: string;
  most_popular_stacks?: string;
  general_administration_rules?: string;
  references?: string;
  disclaimer?: string;
  published?: string | boolean;
};

type PreviewRow = {
  rowNumber: number;
  name: string;
  slug: string;
  category: string;
  benefits: string;
  typical_research_protocol: string;
  duration: string;
  common_sides_regulatory: string;
  most_popular_stacks: string;
  general_administration_rules: string;
  references: string;
  disclaimer: string;
  published: boolean;
  errors: string[];
  importType: "New" | "Update" | "Invalid";
};

export default function CsvImportForm() {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function normalizeRow(row: CsvRow, rowNumber: number): PreviewRow {
    return {
      rowNumber,
      name: row.name?.trim() || "",
      slug: row.slug?.trim() || "",
      category: row.category?.trim() || "",
      benefits: row.benefits?.trim() || "",
      typical_research_protocol: row.typical_research_protocol?.trim() || "",
      duration: row.duration?.trim() || "",
      common_sides_regulatory: row.common_sides_regulatory?.trim() || "",
      most_popular_stacks: row.most_popular_stacks?.trim() || "",
      general_administration_rules: row.general_administration_rules?.trim() || "",
      references: row.references?.trim() || "",
      disclaimer:
        row.disclaimer?.trim() ||
        "For research purposes only. Not medical advice. Not for human consumption.",
      published:
        String(row.published).toLowerCase() === "true" ||
        String(row.published) === "1",
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

      if (row.slug && slugCounts.get(row.slug)! > 1) {
        errors.push("Duplicate slug in CSV");
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
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;

    setMessage(null);
    setError(null);
    setPreviewRows([]);
    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const normalized = (results.data ?? []).map((row, index) =>
            normalizeRow(row, index + 2)
          );

          const validated = validateRows(normalized);
          const rowsWithTypes = await applyImportTypes(validated);

          setPreviewRows(rowsWithTypes);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not determine new/update rows."
          );
        }
      },
      error: (err) => {
        setError(err.message);
      },
    });
  }

  const validRows = useMemo(() => {
    return previewRows.filter((row) => row.errors.length === 0);
  }, [previewRows]);

  const invalidRows = useMemo(() => {
    return previewRows.filter((row) => row.errors.length > 0);
  }, [previewRows]);

  async function handleConfirmImport() {
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
        body: JSON.stringify({ rows: rowsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed.");
      }

      setMessage(data.message || "Import complete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <label className="block">
        <span className="mb-2 block text-sm font-medium">Choose CSV file</span>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border px-4 py-3 text-sm"
        />
      </label>

      <div className="mt-4 rounded-xl border bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-muted)]">
        <p className="font-medium text-[var(--color-text)]">Expected columns</p>
        <p className="mt-2">
          name, slug, category, benefits, typical_research_protocol, duration,
          common_sides_regulatory, most_popular_stacks,
          general_administration_rules, references, disclaimer, published
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

      {previewRows.length ? (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Preview</h2>

          <div className="mt-4 overflow-x-auto rounded-2xl border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-[var(--color-surface-muted)] text-left">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Slug</th>
                  <th className="px-3 py-2 font-medium">Category</th>
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
              Invalid rows will not be imported. Fix them in the CSV and re-upload,
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