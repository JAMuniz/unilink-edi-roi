
import { useMemo, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MainContent from "./components/MainContent";

import type {
  DocTypeKey,
  MinutesPerDoc,
  Tier,
  TradingPartner,
} from "./utils";
import {
  DEFAULT_DOC_TYPES,
  computeTotals,
  currency,
  genId,
  isValidDocKey,
} from "./utils";

const defaultPartners: TradingPartner[] = [
  {
    id: genId(),
    name: "Trading Partner 1",
    docs: { "850_PO": 0, "810_INV": 0, "855_ACK": 0, "856_ASN": 0 },
  },
];

const defaultMinutesPerDoc: MinutesPerDoc = {
  "850_PO": 0,
  "810_INV": 0,
  "855_ACK": 0,
  "856_ASN": 0,
};

const defaultTiers: Tier[] = [
  { id: genId(), label: "Tier 1", min: 1,     max: 150,     monthlyCost: 0 },
  { id: genId(), label: "Tier 2", min: 151,   max: 1000,    monthlyCost: 0 },
  { id: genId(), label: "Tier 3", min: 1001,  max: 5000,    monthlyCost: 0 },
  { id: genId(), label: "Tier 4", min: 5001,  max: 8000,    monthlyCost: 0 },
  { id: genId(), label: "Tier 5", min: 8001,  max: 12000,   monthlyCost: 0 },
  { id: genId(), label: "Tier 6", min: 12001, max: 15000,   monthlyCost: 0 },
  { id: genId(), label: "Tier 7", min: 15001, max: 50000,   monthlyCost: 0 },
  { id: genId(), label: "Tier 8", min: 50001, max: 100000,  monthlyCost: 0 },
];

export default function App() {
  const [docTypes, setDocTypes] = useState<DocTypeKey[]>(DEFAULT_DOC_TYPES);
  const [partners, setPartners] = useState<TradingPartner[]>(defaultPartners);
  const [minutesPerDoc, setMinutesPerDoc] = useState<MinutesPerDoc>(defaultMinutesPerDoc);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [applyErrorBuffer, setApplyErrorBuffer] = useState(true);
  const [errorPct, setErrorPct] = useState(0.015); // fraction (1.5%)
  const [baseMonthlyFee, setBaseMonthlyFee] = useState(0);
  const [hostedEDI, setHostedEDI] = useState(0);
  const [portalFee, setPortalFee] = useState(0);
  const [finalCostPerTrans, setFinalCostPerTrans] = useState(0);

  const [tiers, setTiers] = useState<Tier[]>(defaultTiers);

  const addPartner = () => {
    setPartners(prev => [
      ...prev,
      {
        id: genId(),
        name: `Trading Partner ${prev.length + 1}`,
        docs: docTypes.reduce<Record<DocTypeKey, number>>((acc, k) => {
          acc[k] = 0;
          return acc;
        }, {}),
      },
    ]);
  };

  const removePartner = (id: string) => {
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const updatePartner = (id: string, updater: (old: TradingPartner) => TradingPartner) => {
    setPartners(prev => prev.map(p => (p.id === id ? updater(p) : p)));
  };

  // const addTier = () => {
  //   setTiers(prev => [
  //     ...prev,
  //     { id: genId(), label: `Tier ${prev.length + 1}`, min: 0, max: 0, monthlyCost: 0 },
  //   ]);
  // };

  // const removeTier = (id: string) => {
  //   setTiers(prev => prev.filter(t => t.id !== id));
  // };

  const addDocType = (key: DocTypeKey) => {
    const k = key.toUpperCase();
    if (!isValidDocKey(k)) return; // safety
    setDocTypes(prev => (prev.includes(k) ? prev : [...prev, k]));
    setMinutesPerDoc(prev => ({ ...prev, [k]: prev[k] ?? 0 }));
    setPartners(prev =>
      prev.map(p => ({
        ...p,
        docs: { ...p.docs, [k]: p.docs[k] ?? 0 },
      })),
    );
  };

  const removeDocType = (key: DocTypeKey) => {
    const k = key.toUpperCase();
    setDocTypes(prev => prev.filter(dt => dt !== k));

    setMinutesPerDoc(prev => {
      const next = { ...prev } as Record<string, number>;
      delete next[k];
      return next as any;
    });

    setPartners(prev =>
      prev.map(p => {
        const nextDocs = { ...p.docs } as Record<string, number>;
        delete nextDocs[k];
        return { ...p, docs: nextDocs as any };
      })
    );
  };


  const totals = useMemo(
    () =>
      computeTotals(
        partners,
        minutesPerDoc,
        hourlyRate,
        // applyErrorBuffer,
        errorPct,
        // baseMonthlyFee,
        // hostedEDI,
        // portalFee,
        // finalCostPerTrans,
        // tiers,
      ),
    [
      partners,
      minutesPerDoc,
      hourlyRate,
      applyErrorBuffer,
      errorPct,
      baseMonthlyFee,
      hostedEDI,
      portalFee,
      finalCostPerTrans,
      tiers,
    ],
  );

  return (
    <div>
      <Header />

      <MainContent
        docTypes={docTypes}
        partners={partners}
        minutesPerDoc={minutesPerDoc}
        hourlyRate={hourlyRate}
        applyErrorBuffer={applyErrorBuffer}
        errorPct={errorPct}
        baseMonthlyFee={baseMonthlyFee}
        hostedEDI={hostedEDI}
        portalFee={portalFee}
        finalCostPerTrans={finalCostPerTrans}
        tiers={tiers}
        totals={totals}
        currency={currency}
        addDocType={addDocType}
        removeDocType={removeDocType}
        setMinutesPerDoc={setMinutesPerDoc}
        setHourlyRate={setHourlyRate}
        setApplyErrorBuffer={setApplyErrorBuffer}
        setErrorPct={setErrorPct}
        setBaseMonthlyFee={setBaseMonthlyFee}
        setHostedEDI={setHostedEDI}
        setPortalFee={setPortalFee}
        setFinalCostPerTrans={setFinalCostPerTrans}
        setTiers={setTiers}
        // addTier={addTier}
        // removeTier={removeTier}
        addPartner={addPartner}
        updatePartner={updatePartner}
        removePartner={removePartner}
      />

      <Footer />
    </div>
  );
}
