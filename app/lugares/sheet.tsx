"use client";

import { useEffect, useRef, useState } from "react";
import {
  addSheetCol,
  addSheetRow,
  removeSheetCol,
  removeSheetRow,
  saveCell,
} from "@/app/actions";
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
const WRITE_DELAY = 500;

type Spot = { row: number; col: number };
type Status = "idle" | "saving" | "ok" | "error";

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
  const [spot, setSpot] = useState<Spot | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  // State drives the render; the ref mirrors it so a change and its save can
  // happen in the same event instead of waiting for a re-render.
  const cellsRef = useRef(initial);
  const savedRef = useRef(new Map<string, string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // A delete rewrites the whole sheet server side, so the grid follows the
  // server whenever it really changed. Equal data is left alone: it would only
  // undo an edit the browser has and the server is about to receive.
  useEffect(() => {
    if (JSON.stringify(initial) === JSON.stringify(cellsRef.current)) return;
    cellsRef.current = initial;
    setCells(initial);
  }, [initial]);

  useEffect(() => {
    const running = timers.current;
    return () => {
      for (const timer of running.values()) clearTimeout(timer);
    };
  }, []);

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

  async function save(row: number, col: number) {
    const key = `${row}:${col}`;
    const timer = timers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(key);
    }

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

    setStatus("saving");
    const result = await saveCell(input);
    savedRef.current.delete(key);
    setStatus(result?.ok ? "ok" : "error");
  }

  // Typing and colour picking both write once the hand stops, so nothing has to
  // depend on a control losing focus.
  function later(row: number, col: number) {
    const key = `${row}:${col}`;
    const timer = timers.current.get(key);
    if (timer) clearTimeout(timer);
    timers.current.set(
      key,
      setTimeout(() => void save(row, col), WRITE_DELAY),
    );
  }

  function format(patch: Partial<PlaceCell>) {
    if (!spot) return;
    apply(spot.row, spot.col, patch);
    void save(spot.row, spot.col);
  }

  const current = spot
    ? (cells.find(
        (cell) =>
          cell.row_index === spot.row && cell.col_index === spot.col,
      ) ?? blank(spot.row, spot.col))
    : null;

  const byKey = new Map(
    cells.map((cell) => [`${cell.row_index}:${cell.col_index}`, cell]),
  );

  const rows = Math.max(
    SHEET_ROWS,
    ...cells.map((cell) => cell.row_index + 1),
  );
  const cols = Math.max(
    SHEET_COLS,
    ...cells.map((cell) => cell.col_index + 1),
  );

  const spotLabel = spot ? `Celda ${letter(spot.col)}${spot.row + 1}` : "Elegí una celda";

  return (
    <>
      <div className="sheet-toolbar">
        <label className="field">
          Fuente
          <select
            value={current?.font_family ?? ""}
            disabled={!spot}
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
            value={current?.font_size ?? SHEET_SIZES[1]}
            disabled={!spot}
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
            value={current?.color ?? INK}
            disabled={!spot}
            onChange={(event) => {
              if (!spot) return;
              apply(spot.row, spot.col, { color: event.target.value });
              later(spot.row, spot.col);
            }}
          />
        </label>

        <label className="field">
          Fondo
          <input
            type="color"
            value={current?.background ?? PAPER}
            disabled={!spot}
            onChange={(event) => {
              if (!spot) return;
              apply(spot.row, spot.col, { background: event.target.value });
              later(spot.row, spot.col);
            }}
          />
        </label>

        <button
          type="button"
          className="mini"
          disabled={!spot}
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
          {spotLabel}
          {status === "saving" ? " · guardando" : null}
          {status === "ok" ? " · guardado" : null}
          {status === "error" ? " · no se pudo guardar" : null}
        </span>

        <div className="sheet-actions">
          <button
            type="button"
            className="mini"
            onClick={() => void addSheetRow()}
          >
            Agregar fila
          </button>
          <button
            type="button"
            className="mini"
            onClick={() => void addSheetCol()}
          >
            Agregar columna
          </button>
          <button
            type="button"
            className="mini"
            disabled={!spot}
            onClick={() => {
              if (!spot) return;
              const row = spot.row;
              setSpot(null);
              void removeSheetRow(row);
            }}
          >
            Quitar fila
          </button>
          <button
            type="button"
            className="mini"
            disabled={!spot}
            onClick={() => {
              if (!spot) return;
              const col = spot.col;
              setSpot(null);
              void removeSheetCol(col);
            }}
          >
            Quitar columna
          </button>
        </div>
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
                  const active = spot?.row === row && spot.col === col;

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
                        onFocus={() => setSpot({ row, col })}
                        onChange={(event) => {
                          apply(row, col, { value: event.target.value });
                          later(row, col);
                        }}
                        onBlur={() => void save(row, col)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
