import { Plus, Trash2, Calculator, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "../css/MainContent.css";

import type {
  DocTypeKey,
  MinutesPerDoc,
  Tier,
  Totals,
  TradingPartner,
} from "../utils";
import {
  getFriendlyLabelFromKey,
  isValidDocKey,
  normalizeDocKey,
  getReachedTiers,
  getTierPrices,
  EDI_NAME_BY_CODE,
} from "../utils";

type Props = {
  docTypes: DocTypeKey[];
  partners: TradingPartner[];
  minutesPerDoc: MinutesPerDoc;
  hourlyRate: number;
  applyErrorBuffer: boolean;
  errorPct: number;
  baseMonthlyFee: number;
  hostedEDI: number;
  portalFee: number;
  finalCostPerTrans: number;
  tiers: Tier[];
  totals: Totals;
  currency: (n: number) => string;
  addDocType: (key: DocTypeKey) => void;
  removeDocType: (key: DocTypeKey) => void; 
  setMinutesPerDoc: React.Dispatch<React.SetStateAction<MinutesPerDoc>>;
  setHourlyRate: (n: number) => void;
  setApplyErrorBuffer: (b: boolean) => void;
  setErrorPct: (n: number) => void; 
  setBaseMonthlyFee: (n: number) => void;
  setHostedEDI: (n: number) => void;
  setPortalFee: (n: number) => void;
  setFinalCostPerTrans: (n: number) => void;
  setTiers: React.Dispatch<React.SetStateAction<Tier[]>>;
  // addTier: () => void;
  // removeTier: (id: string) => void;
  addPartner: () => void;
  updatePartner: (id: string, updater: (old: TradingPartner) => TradingPartner) => void;
  removePartner: (id: string) => void;
};

export default function MainContent({
  docTypes,
  partners,
  updatePartner,
  removePartner,
  addPartner,
  minutesPerDoc,
  setMinutesPerDoc,
  hourlyRate,
  setHourlyRate,
  applyErrorBuffer,
  setApplyErrorBuffer,
  errorPct,
  setErrorPct,
  // baseMonthlyFee,
  // setBaseMonthlyFee,
  // hostedEDI,
  // setHostedEDI,
  // portalFee,
  // setPortalFee,
  // finalCostPerTrans,
  // setFinalCostPerTrans,
  tiers,
  // setTiers,
  // addTier,
  // removeTier,
  totals,
  currency,
  addDocType,
  removeDocType,
}: Props) {
  const [showNewDocInput, setShowNewDocInput] = useState(false);
  const [newDocType, setNewDocType] = useState({ key: "" });
  const [editingDocIdx, setEditingDocIdx] = useState<number | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [showEDITable, setShowEDITable] = useState(false);
  const openError = (msg: string) => setErrorPopup(msg);
  const closeError = () => setErrorPopup(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeError(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const manualRows = useMemo(
    () => docTypes.map((k) => [k, getFriendlyLabelFromKey(k)] as [DocTypeKey, string]),
    [docTypes],
  );

  const handleSelectDocFromTable = (code: string) => {
    if (docTypes.includes(code)) {
      openError("That document type already exists.");
      return;
    }
    addDocType(code);
    setShowEDITable(false);
    setShowNewDocInput(false);
    setNewDocType({ key: "" });
  };

  const handleAddDocType = () => {
    const key = newDocType.key.trim();
    if (!key) {
      openError("Document name cannot be empty.");
      return;
    }
    if (!isValidDocKey(key)) {
      openError("Document name must exist in the EDI reference table.");
      return;
    }
    const normalizedKey = normalizeDocKey(key);
    if (docTypes.includes(normalizedKey)) {
      openError("That document type already exists.");
      return;
    }

    addDocType(normalizedKey);
    setNewDocType({ key: "" });
    setShowNewDocInput(false);
  };

  return (
    <main className="main-content-bg main">
      <section className="section section-grid">
        {/* Document types and trading partners table */}
        <div className="col-span-2">
          <h2 className="heading heading-light">Monthly Document Volumes</h2>

          <div className="table-scroll">
            <table className="modern-table text-sm">
              <thead>
                <tr className="thead-row">
                  <th className="th align-middle doc-col">
                    <div className="col-flex">
                      <span>Document Type</span>
                    </div>
                  </th>

                  {partners.map((p, idx) => (
                    <th key={p.id} className="th align-middle partner-col">
                      <div className="col-flex">
                        <span className="tp-title">
                          {`Trading Partner ${idx + 1}`}
                          <button
                            onClick={() => removePartner(p.id)}
                            className="btn-icon"
                            aria-label={`Remove Trading Partner ${idx + 1}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Add Trading Partner */}
                  <th className="th align-middle partner-col">
                    <button onClick={addPartner} className="btn btn-emerald btn-sm">
                      <Plus size={16} /> <span>TP</span>
                    </button>
                  </th>
                  <th className="th"></th>
                </tr>
              </thead>

              <tbody>
                {docTypes.map((key, i) => (
                  <tr key={key} className="tr">
                    <td className="td doc-col">
                      <div className="doc-key">
                        {editingDocIdx === i ? (
                          <input
                            className="input input-xs input-center w-32"
                            value={key}
                            autoFocus
                            onBlur={() => setEditingDocIdx(null)}
                            onKeyDown={e => {
                              if (e.key === "Enter" || e.key === "Escape") setEditingDocIdx(null);
                            }}
                          />
                        ) : (
                          <>
                            <span>{key}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {partners.map((p) => (
                      <td key={p.id} className="td partner-col">
                        <input
                          type="number"
                          min={0}
                          className="input input-xs input-center w-20"
                          value={p.docs[key] ?? ""}
                          onChange={e => {
                            const val = e.target.value;
                            const numVal = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                            updatePartner(p.id, (old) => ({
                              ...old,
                              docs: { ...old.docs, [key]: numVal },
                            }))
                          }}
                          onBlur={e => {
                            const val = e.target.value;
                            const numVal = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                            e.target.value = numVal.toString();
                            updatePartner(p.id, (old) => ({
                              ...old,
                              docs: { ...old.docs, [key]: numVal },
                            }))
                          }}
                        />
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="td text-center">
                      <button
                        className="btn-icon"
                        aria-label={`Remove ${key}`}
                        onClick={() => {removeDocType(key);}}                
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Doc Row */}
                <tr className="add-doc-type-row">
                  <td className="td doc-col add-doc-type-cell">
                    {showNewDocInput ? (
                      <div className="new-doc-controls">
                        <div>
                          <input
                            className="input input-xs new-doc-input"
                            placeholder="Document code or name (e.g. 850, Invoice, Purchase Order)"
                            value={newDocType.key}
                            autoFocus
                            onChange={e => setNewDocType({ key: e.target.value })}
                            onKeyDown={e => { if (e.key === "Enter") handleAddDocType(); }}
                          />
                          <button
                            className="btn-icon"
                            aria-label="View EDI document reference"
                            onClick={() => setShowEDITable(true)}
                            title="View EDI document reference table"
                          >
                            <Info size={16} />
                          </button>
                        </div>
                        <div className="new-doc-actions">
                          <button className="btn btn-emerald btn-sm" onClick={handleAddDocType}>
                            + Add
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setShowNewDocInput(false);
                              setNewDocType({ key: "" });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn btn-emerald btn-sm"
                        onClick={() => setShowNewDocInput(true)}
                      >
                        + Doc Type
                      </button>
                    )}
                  </td>

                  {partners.map((_, idx) => (
                    <td key={idx} className="td partner-col"></td>
                  ))}
                  <td className="td"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Process & Labor */}
        <div>
          <h2 className="heading heading-light">Manual Time per Doc/Trans</h2>
          <div className="card manual-labor-form">
            {manualRows.map(([k, label]) => (
              <label key={k} className="label-block">
                <span className="label-title">Minutes per {label}</span>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={minutesPerDoc[k] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                    setMinutesPerDoc(old => ({ ...old, [k]: numVal }))
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    const numVal = val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0);
                    e.target.value = numVal.toString();
                    setMinutesPerDoc(old => ({ ...old, [k]: numVal }))
                  }}
                />
              </label>
            ))}

            <label className="label-block">
              <span className="label-title">Fully-loaded Hourly Rate ($/hr)</span>
              <input
                type="number"
                min={0}
                className="input"
                value={hourlyRate || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const numVal = val === "" ? 0 : Math.max(0, parseFloat(val) || 0);
                  setHourlyRate(numVal);
                }}
                onBlur={(e) => {
                  const val = e.target.value;
                  const numVal = val === "" ? 0 : Math.max(0, parseFloat(val) || 0);
                  e.target.value = numVal.toString();
                  setHourlyRate(numVal);
                }}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={applyErrorBuffer}
                onChange={(e) => setApplyErrorBuffer(e.target.checked)}
              />
              <span>Include error/rework buffer</span>
            </label>

            {applyErrorBuffer && (
              <label className="label-block">
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={100}
                  className="input"
                  value={Number(((errorPct ?? 0) * 100).toFixed(1))}
                  onChange={(e) => {
                    const pct = e.target.value === "" ? 0 : Number(e.target.value);
                    const frac = Number((pct / 100).toFixed(6));
                    setErrorPct(isNaN(frac) ? 0 : frac);
                  }}
                />
                <span className="label-title">%</span>
              </label>
            )}
          </div>
        </div>
      </section>

      {/* EDI Cost model */}
      <section className="section section-grid">
        <div className="col-span-2">
          <h2 className="heading heading-light">EDI Pricing Model</h2>
          <div className="card manual-labor-form">
            {/* <label className="label-block">
              <span className="label-title">Base Monthly Fee</span>
              <input
                type="number"
                min={0}
                className="input"
                value={baseMonthlyFee}
                onChange={(e) => setBaseMonthlyFee(Number(e.target.value || 0))}
              />
            </label>

            <label className="label-block">
              <span className="label-title">Hosted EDI / Platform</span>
              <input
                type="number"
                min={0}
                className="input"
                value={hostedEDI}
                onChange={(e) => setHostedEDI(Number(e.target.value || 0))}
              />
            </label>

            <label className="label-block">
              <span className="label-title">Portal / Seats</span>
              <input
                type="number"
                min={0}
                className="input"
                value={portalFee}
                onChange={(e) => setPortalFee(Number(e.target.value || 0))}
              />
            </label>

            <label className="label-block">
              <span className="label-title">Per-Transaction Charge (optional)</span>
              <input
                type="number"
                min={0}
                className="input"
                value={finalCostPerTrans}
                onChange={(e) => setFinalCostPerTrans(Number(e.target.value || 0))}
              />
            </label> */}

          {/* Tiers block */}
          <div className="tiers">
            <div className="tiers-header">
              <h3 className="tiers-title">Tiered Flat Costs (included when threshold reached)</h3>
            </div>

            <div className="tiers-body">
              {(() => {
                const reached = getReachedTiers(tiers, totals.monthlyTransactions);
                let displayTiers = reached;
                if (tiers.length > 0 && (!reached.length || reached[0].id !== tiers[0].id)) {
                  // Always show Tier 1 card first if not present
                  displayTiers = [tiers[0], ...reached.filter(t => t.id !== tiers[0].id)];
                }
                const tierPrices = getTierPrices(totals.monthlyTransactions);
                return displayTiers.map((t, idx) => {
                  const range =
                    t.min != null && t.max != null
                      ? `${t.min.toLocaleString()} - ${t.max.toLocaleString()}`
                      : "";
                  // Tier 1 always $185, others use calculated price
                  let price = idx === 0 ? 185 : tierPrices[idx] ?? t.monthlyCost;
                  return (
                    <div key={t.id} className="tier-card manual-labor-form">
                      <label className="label-block">
                        <span className="label-title">{`Tier ${idx + 1}`}</span>
                      </label>
                      <label className="label-block">
                        <span className="label-title">Transactions Per Tier</span>
                        <input
                          className="input input-sm tier-range-input"
                          value={range}
                          readOnly
                        />
                      </label>
                      <label className="label-block">
                        <span className="label-title">Monthly Cost</span>
                        <input
                          type="text"
                          className="input input-sm"
                          value={currency(price)}
                          readOnly
                        />
                      </label>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          </div>
        </div>

        {/* Snapshot */}
        <div className="snapshot">
          <h2 className="heading heading-light">Snapshot</h2>
          <div className="card">
            <div className="totals-header">
              <Calculator size={18} /> <span className="totals-title totals-title-lg">Totals</span>
            </div>
            <div className="totals-list">
              <div className="row">
                <span>Monthly Transactions:</span>
                <b className="totals-value">{totals.monthlyTransactions.toLocaleString()}</b>
              </div>
              <div className="row">
                <span>Monthly Labor Minutes:</span>
                <b className="totals-value">{totals.monthlyLaborMinutes.toLocaleString()}</b>
              </div>
              {/* <div className="row">
                <span>Monthly Manual Cost:</span>
                <b className="totals-value">{currency(totals.monthlyManualCost)}</b>
              </div> */}
              <div className="row">
                <span>Monthly EDI Cost:</span>
                <b className="totals-value">{currency(getTierPrices(totals.monthlyTransactions).reduce((a, b) => a + b, 0))}</b>
              </div>
              <hr className="divider" />
              <div className="row">
                <span>Annual Manual Cost:</span>
                <b className="totals-value">{currency(totals.annualManualCost)}</b>
              </div>
              <div className="row">
                <span>Annual EDI Cost:</span>
                <b className="totals-value">{currency(totals.annualEDICost)}</b>
              </div>
              <div className="row">
                <span>Net Annual Savings:</span>
                <b className={`totals-value ${totals.netAnnualSavings >= 0 ? "txt-emerald" : "txt-rose"}`}>
                  {currency(totals.netAnnualSavings)}
                </b>
              </div>
              <hr className="divider" />
              <div className="row">
                <span>Final EDI cost per Trans*:</span>
                {/* <b className="totals-value">{currency(Math.max(0, totals.breakEvenPerTrans))}</b> */}
              </div>
              <div className="row">
                <span>Monthly Hours Saved:</span>
                <b className="totals-value">{totals.monthlyHoursSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results table */}
      <section className="section">
        <h2 className="heading heading-light">Results & Details</h2>
        <div className="table-scroll">
          <table className="results-table centralized-results">
            <thead>
              <tr className="thead-row">
                <th className="th">Type (EDI code)</th>
                <th className="th">Monthly Volume</th>
                {/* <th className="th">Minutes / doc</th> */}
                <th className="th">Labor Minutes / mo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(totals.totalByType).map(([k, count]) => (
                <tr key={k} className="tr">
                  <td className="td">{getFriendlyLabelFromKey(k)}</td>
                  <td className="td">{(count as number).toLocaleString()}</td>
                  {/* <td className="td">{minutesPerDoc[k] ?? 0}</td> */}
                  <td className="td">{((count as number) * (minutesPerDoc[k] ?? 0)).toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td className="td strong">TOTAL</td>
                <td className="td strong">{totals.monthlyTransactions.toLocaleString()}</td>
                {/* <td className="td"></td> */}
                <td className="td strong">{totals.monthlyLaborMinutes.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {errorPopup && (
        <div className="modal-backdrop error-modal-backdrop" onClick={closeError}>
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="modal-title" className="modal-title">Invalid document type</h3>
            <p className="modal-message">{errorPopup}</p>
            <div className="modal-actions">
              <button className="btn btn-emerald btn-sm" onClick={closeError}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showEDITable && (
        <div className="modal-backdrop" onClick={() => setShowEDITable(false)}>
          <div
            className="modal modal-edi-table"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edi-table-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edi-table-title" className="modal-title">EDI Document Reference</h3>
            <div className="edi-table-scroll">
              <table className="edi-reference-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Document Name</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(EDI_NAME_BY_CODE).map(([code, name]) => (
                    <tr 
                      key={code} 
                      onClick={() => handleSelectDocFromTable(code)}
                      className="clickable-row"
                    >
                      <td className="code-cell">{code}</td>
                      <td>{name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEDITable(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
