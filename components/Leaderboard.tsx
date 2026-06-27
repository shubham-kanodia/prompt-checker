"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useProgress } from "./useProgress";
import { totalScore, solvedCount } from "@/lib/progress";
import { UsernameForm } from "./UsernameForm";

type Row = {
  name: string | null;
  image: string | null;
  score: number;
  solved: number;
  community: number;
};

export function Leaderboard() {
  const { data: session, status } = useSession();
  const progress = useProgress();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : { rows: [] }))
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setRows([]));
  }, [status]);

  const myScore = totalScore(progress);
  const mySolved = solvedCount(progress);
  const myUsername = session?.user?.username ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-green glow-strong text-2xl tracking-widest">
          LEADERBOARD
        </h1>
        <p className="text-muted text-sm mt-1">
          top interns-wranglers by total points. log in with google to claim your spot.
        </p>
      </div>

      <div className="panel p-4 flex items-center justify-between text-sm">
        <span className="text-muted">your run on this device</span>
        <span>
          <span className="text-amber">{myScore}</span> pts ·{" "}
          <span className="text-green">{mySolved}</span>/16 cleared
        </span>
      </div>

      {status !== "authenticated" && (
        <div className="text-amber text-xs panel p-3">
          you are playing anonymously. your score is saved on this device only.
          log in to appear on the board below and sync across devices.
        </div>
      )}

      {status === "authenticated" && (
        <div className="panel p-4 flex flex-col gap-2">
          {editing ? (
            <UsernameForm
              initial={myUsername}
              onSaved={() => {
                setEditing(false);
                fetch("/api/leaderboard")
                  .then((r) => (r.ok ? r.json() : { rows: [] }))
                  .then((d) => setRows(d.rows ?? []))
                  .catch(() => {});
              }}
            />
          ) : (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                your handle:{" "}
                <span className="text-green">
                  {myUsername ?? "not set"}
                </span>
              </span>
              <button className="btn" onClick={() => setEditing(true)}>
                {myUsername ? "change" : "set username"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="panel p-0 overflow-hidden">
        <div className="grid grid-cols-[3rem_1fr_5rem_4rem] text-xs text-green-dim border-b border-[var(--green-faint)] px-4 py-2">
          <span>#</span>
          <span>agent</span>
          <span className="text-right">pts</span>
          <span className="text-right">days</span>
        </div>
        {rows == null ? (
          <div className="px-4 py-6 text-muted text-sm">loading board ...</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-muted text-sm">
            no ranked players yet. be the first.
          </div>
        ) : (
          rows.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[3rem_1fr_5rem_4rem] text-sm px-4 py-2 border-b border-[var(--green-faint)]/40 items-center"
            >
              <span className={i < 3 ? "text-amber" : "text-muted"}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-text truncate">
                {r.name ?? "anonymous agent"}
                {r.community > 0 && (
                  <span className="text-green-dim text-xs">
                    {" "}
                    · {r.community} community
                  </span>
                )}
              </span>
              <span className="text-right text-green">{r.score}</span>
              <span className="text-right text-muted">{r.solved}/16</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
