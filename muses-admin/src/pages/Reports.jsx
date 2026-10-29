import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { download, csv, Panel, Stats, Header } from "./shared";
export default function Reports() {
  const [period, setPeriod] = useState("Last 7 days");
  const values =
    period === "Last 7 days"
      ? [82, 114, 96, 137, 154, 182, 128]
      : [428, 612, 534, 780, 916, 842, 1034];
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <>
      <Header
        title="A bigger picture"
        description="Discover the rhythms of your museum. Demo analytics, clearly presented."
        action={
          <button
            className="primary"
            onClick={() =>
              download(
                "muses-report.csv",
                csv([
                  ["Period", "Bucket", "Online sessions", "Check-ins"],
                  ...values.map((v, i) => [
                    period,
                    i + 1,
                    v,
                    Math.round(v * 0.36),
                  ]),
                ]),
              )
            }
          >
            <Icon name="upload" />
            Export CSV
          </button>
        }
      />
      <Stats
        items={[
          [
            "Online sessions",
            total.toLocaleString(),
            "Across the selected period",
            "pink",
            "chart",
          ],
          [
            "Museum check-ins",
            Math.round(total * 0.36),
            "Moments of discovery",
            "green",
            "pin",
          ],
          [
            "Audio plays",
            Math.round(total * 1.4).toLocaleString(),
            "Stories being heard",
            "blue",
            "audio",
          ],
        ]}
      />
      <Panel
        title="Visitor rhythm"
        subtitle="Online sessions by reporting bucket"
        action={
          <select
            value={period}
            aria-label="Report period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        }
      >
        <div
          className="pg-bar-chart"
          role="img"
          aria-label={`${period}: ${values.join(", ")} sessions`}
        >
          {values.map((v, i) => (
            <div key={i}>
              <span>{v}</span>
              <i style={{ height: `${(v / Math.max(...values)) * 190}px` }} />
              <small>
                {period === "Last 7 days"
                  ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]
                  : `Period ${i + 1}`}
              </small>
            </div>
          ))}
        </div>
      </Panel>
      <div className="pg-two-col">
        <Panel title="Ways to discover" subtitle="Demo session sources">
          <div className="pg-progress-list">
            {[
              ["Collection browsing", 68],
              ["Exhibitions", 21],
              ["Plan a visit", 11],
            ].map(([name, n]) => (
              <div key={name}>
                <p>
                  {name}
                  <b>{n}%</b>
                </p>
                <progress max="100" value={n} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="The most listened-to"
          subtitle="Demo audio guide ranking"
          className="pg-blue-panel"
        >
          <div className="pg-ranked">
            {[
              ["Young Woman with Lilies", 215],
              ["Spring Garden", 167],
              ["Changing Seasons", 94],
            ].map(([name, n], i) => (
              <div key={name}>
                <span>0{i + 1}</span>
                <strong>{name}</strong>
                <b>{n}</b>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
