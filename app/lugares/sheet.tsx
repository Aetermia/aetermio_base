"use client";

import { useRef, useState } from "react";
import { saveCell } from "@/app/actions";
import {
  CELL_MAX,
  SHEET_COLS,
  SHEET_FONTS,
  SHEET_ROWS,
  SHEET_SIZES,
  type CellInput,
  type PlaceCell,
} from "@/lib/types";

const INK = "#030303";
const PAPER = "#ffffff";

function blank(row: number, col: number): PlaceCell {
  return {
    row_index: row,
    col_index: col,
    value: "",
    font_family: null,
    font_size: null,
    color: null,
    background: null,
  };
}

function letter(index: number) {
  return String.fromCharCode(65 + index);
}

export function Sheet({ cells: initial }: { cells: PlaceCell[] }) {
  const [cells, setCells] = useState(initial);
  const [sel, setSel] = useState({ row: 0, col: 0 });
  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);

  // State drives the render; the ref mirrors it so a format change and its save
  // can happen in the same event instead of waiting for a re-render.
  const cellsRef = useRef(initial);
  const savedRef = useRef(new Map<string, string>());
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  function apply(row: number, col: number, patch: Partial<PlaceCell>) {
    const index = cellsRef.current.findIndex(
      (cell) => cell.row_index === row && cell.col_index === col,
    );
    const next =
      index === -1
        ? { ...blank(row, col), ...patch }
        : { ...cellsRef.current[index], ...patch };

    cellsRef.current =
      index === -1
        ? [...cellsRef.current, next]
        : cellsRef.current.map((cell, at) => (at === index ? next : cell));

    setCells(cellsRef.current);
  }

  // Only the cell that changed is written, and only when it differs from the
  // last thing saved: blur fires on every focus move.
  function save(row: number, col: number) {
    const key = `${row}:${col}`;
    const cell = cellsRef.current.find(
      (item) => item.row_index === row && item.col_index === col,
    );

    if (!cell) return;

    const input: CellInput = {
      row,
      col,
      value: cell.value,
      font_family: cell.font_family,
      font_size: cell.font_size,
      color: cell.color,
      background: cell.background,
    };
    const snapshot = JSON.stringify(input);

    if (savedRef.current.get(key) === snapshot) return;
    savedRef.current.set(key, snapshot);
    void saveCell(input);
  }

  function format(patch: Partial<PlaceCell>) {
    apply(sel.row, sel.col, patch);
    save(sel.row, sel.col);
  }

  // A colour picker fires on every movement and closing it does not always blur
  // the input, so local first, then one write once the picking stops.
  function formatLater(patch: Partial<PlaceCell>) {
    apply(sel.row, sel.col, patch);
    if (pending.current) clearTimeout(pending.current);
    const { row, col } = sel;
    pending.current = setTimeout(() => save(row, col), 500);
  }

  const current =
    cells.find(
      (cell) => cell.row_index === sel.row && cell.col_index === sel.col,
    ) ?? blank(sel.row, sel.col);

  const byKey = new Map(
    cells.map((cell) => [`${cell.row_index}:${cell.col_index}`, cell]),
  );

  const rows =
    Math.max(
      SHEET_ROWS,
      ...cells.map((cell) => cell.row_index + 1),
    ) + extraRows;
  const cols =
    Math.max(
      SHEET_COLS,
      ...cells.map((cell) => cell.col_index + 1),
    ) + extraCols;

  return (
    <>
      <div className="sheet-toolbar">
        <label className="field">
          Fuente
          <select
            value={current.font_family ?? ""}
            onChange={(event) =>
              format({ font_family: event.target.value || null })
            }
          >
            {SHEET_FONTS.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Tamaño
          <select
            value={current.font_size ?? SHEET_SIZES[1]}
            onChange={(event) =>
              format({ font_size: Number(event.target.value) })
            }
          >
            {SHEET_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Letra
          <input
            type="color"
            value={current.color ?? INK}
            onChange={(event) => formatLater({ color: event.target.value })}
            onBlur={() => save(sel.row, sel.col)}
          />
        </label>

        <label className="field">
          Fondo
          <input
            type="color"
            value={current.background ?? PAPER}
            onChange={(event) => formatLater({ background: event.target.value })}
            onBlur={() => save(sel.row, sel.col)}
          />
        </label>

        <button
          type="button"
          className="mini"
          onClick={() =>
            format({
              font_family: null,
              font_size: null,
              color: null,
              background: null,
            })
          }
        >
          Quitar formato
        </button>

        <span className="sheet-pos">
          Celda {letter(sel.col)}
          {sel.row + 1}
        </span>
      </div>

      <div className="sheet-scroll">
        <table className="sheet">
          <thead>
            <tr>
              <th className="corner" />
              {Array.from({ length: cols }, (_, col) => (
                <th key={col} scope="col">
                  {letter(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                <th scope="row">{row + 1}</th>
                {Array.from({ length: cols }, (_, col) => {
                  const cell = byKey.get(`${row}:${col}`);
                  const active = sel.row === row && sel.col === col;

                  return (
                    <td key={col} className={active ? "on" : undefined}>
                      <input
                        className="cell"
                        value={cell?.value ?? ""}
                        maxLength={CELL_MAX}
                        aria-label={`${letter(col)}${row + 1}`}
                        style={{
                          fontFamily: cell?.font_family ?? undefined,
                          fontSize: cell?.font_size ?? undefined,
                          color: cell?.color ?? undefined,
                          backgroundColor: cell?.background ?? undefined,
                        }}
                        onFocus={() => setSel({ row, col })}
                        onChange={(event) =>
                          apply(row, col, { value: event.target.value })
                        }
                        onBlur={() => save(row, col)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sheet-actions">
        <button
          type="button"
          className="mini"
          onClick={() => setExtraRows((count) => count + 1)}
        >
          Agregar fila
        </button>
        <button
          type="button"
          className="mini"
          onClick={() => setExtraCols((count) => count + 1)}
        >
          Agregar columna
        </button>
      </div>
    </>
  );
}
