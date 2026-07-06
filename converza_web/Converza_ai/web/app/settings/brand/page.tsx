"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Plus, Save, Trash2, X } from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import {
  ApiError,
  fetchBrandPassportByOrg,
  parseBrandPassportPdf,
  upsertBrandPassport,
  type BrandFaqItem,
  type BrandObjectionItem,
  type BrandPassport,
  type BrandPricingItem,
} from "@/lib/converza-api";

const BRAND_NAME_STORAGE_KEY = "converza.brandName";

type PricingRow = { name: string; price: string; description: string };
type FaqRow = BrandFaqItem;
type ObjectionRow = BrandObjectionItem;

function parseMarkets(location?: string): string[] {
  if (!location?.trim()) return [];
  return location
    .split(/[,;|/]/)
    .map((m) => m.trim())
    .filter(Boolean);
}

function normalizePricing(item: BrandPricingItem): PricingRow {
  const features = Array.isArray(item.features) ? item.features.join(", ") : "";
  return {
    name: item.name || item.tier || "",
    price: item.price || "",
    description: item.description || features,
  };
}

function competitorStrings(raw: BrandPassport["competitors"]): string[] {
  if (!raw?.length) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      return String(entry.name || entry.brand || "").trim();
    })
    .filter(Boolean);
}

function passportToForm(passport: BrandPassport | null) {
  return {
    brandName: passport?.brand_name || "",
    industry: passport?.industry || "",
    voice: passport?.tone || passport?.brand_voice || "",
    audience: passport?.target_audience || "",
    promise: passport?.core_offer || "",
    markets: parseMarkets(passport?.target_location),
    rawNotes: passport?.raw_notes || "",
    pricing: (passport?.pricing || []).map(normalizePricing),
    faq: passport?.faq?.length
      ? passport.faq.map((f) => ({ question: f.question || "", answer: f.answer || "" }))
      : [],
    objections: passport?.objections?.length
      ? passport.objections.map((o) => ({
          objection: o.objection || "",
          response: o.response || "",
        }))
      : [],
    competitors: competitorStrings(passport?.competitors),
  };
}

export default function BrandPage() {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [voice, setVoice] = useState("");
  const [audience, setAudience] = useState("");
  const [promise, setPromise] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [newMarket, setNewMarket] = useState("");
  const [pricing, setPricing] = useState<PricingRow[]>([]);
  const [faq, setFaq] = useState<FaqRow[]>([]);
  const [objections, setObjections] = useState<ObjectionRow[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const applyForm = useCallback(
    (form: ReturnType<typeof passportToForm>) => {
      setBrandName(form.brandName);
      setIndustry(form.industry);
      setVoice(form.voice);
      setAudience(form.audience);
      setPromise(form.promise);
      setRawNotes(form.rawNotes);
      setMarkets(form.markets.length ? form.markets : ["Uzbekistan"]);
      setPricing(form.pricing);
      setFaq(form.faq);
      setObjections(form.objections);
      setCompetitors(form.competitors);
    },
    [],
  );

  const syncBrandNameStorage = useCallback((name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    window.localStorage.setItem(BRAND_NAME_STORAGE_KEY, normalized);
    window.dispatchEvent(new Event("converza:brand-name-updated"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = getStoredAuth();
      if (!auth?.orgId) {
        if (!cancelled) {
          setError("Sign in via Telegram to load your brand passport.");
          setLoading(false);
        }
        return;
      }
      try {
        const passport = await fetchBrandPassportByOrg(auth.orgId);
        if (cancelled) return;
        const form = passportToForm(passport);
        applyForm(form);
        if (form.brandName) syncBrandNameStorage(form.brandName);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Failed to load brand passport");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyForm, syncBrandNameStorage]);

  function buildPayload(orgId: string) {
    return {
      org_id: orgId,
      brand_name: brandName.trim(),
      industry: industry.trim(),
      target_audience: audience.trim(),
      core_offer: promise.trim(),
      tone: voice.trim() || "Friendly, confident, and concise",
      brand_voice: voice.trim(),
      target_location: markets.join(", ") || "Uzbekistan",
      raw_notes: rawNotes.trim(),
      pricing: pricing
        .filter((p) => p.name.trim() || p.price.trim())
        .map((p) => ({
          name: p.name.trim(),
          price: p.price.trim(),
          description: p.description.trim(),
        })),
      faq: faq.filter((f) => f.question.trim() || f.answer.trim()),
      objections: objections.filter((o) => o.objection.trim() || o.response.trim()),
      competitors: competitors.filter(Boolean),
    };
  }

  async function save() {
    const auth = getStoredAuth();
    if (!auth?.orgId) {
      setError("Sign in via Telegram first.");
      return;
    }
    const normalizedName = brandName.trim();
    const normalizedAudience = audience.trim();
    const normalizedPromise = promise.trim();
    if (!normalizedName || !normalizedAudience || !normalizedPromise) {
      setError("Brand name, audience, and core promise are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await upsertBrandPassport(buildPayload(auth.orgId));
      syncBrandNameStorage(normalizedName);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function addMarket() {
    const v = newMarket.trim();
    if (!v) return;
    setMarkets((m) => [...m, v]);
    setNewMarket("");
  }

  function addCompetitor() {
    const v = newCompetitor.trim();
    if (!v || competitors.includes(v)) return;
    setCompetitors((c) => [...c, v]);
    setNewCompetitor("");
  }

  function addPdfFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf"),
    );
    setPdfFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        const exists = next.some((f) => f.name === file.name && f.size === file.size);
        if (!exists) next.push(file);
      }
      return next;
    });
  }

  async function parsePdfs() {
    if (!pdfFiles.length) return;
    setPdfParsing(true);
    setPdfMessage(null);
    setError(null);
    try {
      const result = await parseBrandPassportPdf(pdfFiles);
      applyForm(passportToForm(result.passport));
      setPdfMessage(
        `Parsed ${result.files_processed} file${result.files_processed === 1 ? "" : "s"} — review and save.`,
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "PDF parse failed");
    } finally {
      setPdfParsing(false);
    }
  }

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-[28px] font-medium tracking-[-0.025em] text-text-primary">
          Brand passport
        </h2>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-secondary">
          The single source of truth the swarm reads before generating anything. Synced from Supabase via the Converza API.
        </p>
      </header>

      {error && (
        <p className="rounded-lg border border-error/20 bg-error-dim px-3 py-2 text-[13px] text-error">
          {error}
        </p>
      )}
      {loading && <p className="text-[13px] text-text-muted">Loading brand passport…</p>}

      <section className="rounded-2xl border border-dashed border-border bg-bg-elevated/40 p-5">
        <div className="mb-3 flex items-center gap-2 text-[14px] font-medium text-text-primary">
          <FileUp size={15} />
          Import from PDF
        </div>
        <p className="mb-4 text-[12.5px] text-text-muted">
          Drop brand decks or one-pagers — we extract pricing, FAQ, and objections for you to edit before saving.
        </p>
        <div
          onClick={() => pdfInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addPdfFiles(e.dataTransfer.files);
          }}
          className="cursor-pointer rounded-xl border border-dashed border-border bg-bg-secondary px-4 py-8 text-center text-[13px] text-text-muted hover:border-text-primary/30"
        >
          Drop PDFs here or click to select
        </div>
        <input
          ref={pdfInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addPdfFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {pdfFiles.length > 0 && (
          <ul className="mt-3 space-y-1 text-[12px] text-text-secondary">
            {pdfFiles.map((f) => (
              <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPdfFiles((files) => files.filter((x) => x !== f))
                  }
                  className="text-text-muted hover:text-error"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={parsePdfs}
            disabled={pdfParsing || pdfFiles.length === 0}
            className="rounded-full bg-text-primary px-4 py-2 text-[12px] font-medium text-bg-elevated disabled:opacity-50"
          >
            {pdfParsing ? "Parsing…" : "Parse & preview"}
          </button>
          {pdfFiles.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPdfFiles([]);
                setPdfMessage(null);
              }}
              className="rounded-full border border-border px-4 py-2 text-[12px]"
            >
              Clear files
            </button>
          )}
        </div>
        {pdfMessage && (
          <p className="mt-3 text-[12px] text-success">{pdfMessage}</p>
        )}
      </section>

      <Field label="Brand name" hint="Shown in the sidebar and used as the workspace identity.">
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Industry" hint="Sector or vertical — helps Milo benchmark competitors.">
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          disabled={loading}
          placeholder="e.g. EdTech, D2C skincare"
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Voice & tone" hint="Three to five adjectives. The way the brand sounds in writing.">
        <textarea
          rows={2}
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Audience" hint="The buyer in one sentence — who they are, what they want.">
        <textarea
          rows={2}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Core promise" hint="What the brand actually delivers — the line on the box.">
        <input
          value={promise}
          onChange={(e) => setPromise(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <Field label="Markets" hint="Where the ads should run. Each market gets its own copy register.">
        <div className="flex flex-wrap items-center gap-2">
          {markets.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-text-primary"
            >
              {m}
              <button
                onClick={() => setMarkets((arr) => arr.filter((x) => x !== m))}
                className="text-text-muted hover:text-error"
                aria-label={`Remove ${m}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            placeholder="Add market…"
            value={newMarket}
            onChange={(e) => setNewMarket(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMarket()}
            disabled={loading}
            className="rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary outline-none placeholder-text-muted/70 focus:border-text-primary disabled:opacity-60"
          />
        </div>
      </Field>

      <RepeatSection
        label="Pricing"
        hint="Plans or SKUs Sleyz can quote in Telegram DMs."
        onAdd={() => setPricing((rows) => [...rows, { name: "", price: "", description: "" }])}
      >
        {pricing.map((row, i) => (
          <RepeatRow key={i} onRemove={() => setPricing((rows) => rows.filter((_, j) => j !== i))}>
            <input
              placeholder="Name / tier"
              value={row.name}
              onChange={(e) =>
                setPricing((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)),
                )
              }
              className={inputClass}
            />
            <input
              placeholder="Price"
              value={row.price}
              onChange={(e) =>
                setPricing((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, price: e.target.value } : r)),
                )
              }
              className={inputClass}
            />
            <input
              placeholder="Description"
              value={row.description}
              onChange={(e) =>
                setPricing((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r)),
                )
              }
              className={inputClass}
            />
          </RepeatRow>
        ))}
      </RepeatSection>

      <RepeatSection
        label="FAQ"
        hint="Common questions the closer should answer instantly."
        onAdd={() => setFaq((rows) => [...rows, { question: "", answer: "" }])}
      >
        {faq.map((row, i) => (
          <RepeatRow key={i} onRemove={() => setFaq((rows) => rows.filter((_, j) => j !== i))}>
            <input
              placeholder="Question"
              value={row.question}
              onChange={(e) =>
                setFaq((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, question: e.target.value } : r)),
                )
              }
              className={inputClass}
            />
            <textarea
              placeholder="Answer"
              rows={2}
              value={row.answer}
              onChange={(e) =>
                setFaq((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, answer: e.target.value } : r)),
                )
              }
              className={`${inputClass} resize-none`}
            />
          </RepeatRow>
        ))}
      </RepeatSection>

      <RepeatSection
        label="Objections"
        hint="Pushback Sleyz hears often — with your approved responses."
        onAdd={() => setObjections((rows) => [...rows, { objection: "", response: "" }])}
      >
        {objections.map((row, i) => (
          <RepeatRow
            key={i}
            onRemove={() => setObjections((rows) => rows.filter((_, j) => j !== i))}
          >
            <input
              placeholder="Objection"
              value={row.objection}
              onChange={(e) =>
                setObjections((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, objection: e.target.value } : r)),
                )
              }
              className={inputClass}
            />
            <textarea
              placeholder="Response"
              rows={2}
              value={row.response}
              onChange={(e) =>
                setObjections((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, response: e.target.value } : r)),
                )
              }
              className={`${inputClass} resize-none`}
            />
          </RepeatRow>
        ))}
      </RepeatSection>

      <Field label="Competitors" hint="Brands Milo tracks on your Competitor Radar.">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {competitors.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-[12px] text-text-primary"
              >
                {c}
                <button
                  type="button"
                  onClick={() => setCompetitors((list) => list.filter((x) => x !== c))}
                  className="text-text-muted hover:text-error"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Add competitor…"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
              disabled={loading}
              className="flex-1 rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] outline-none focus:border-text-primary disabled:opacity-60"
            />
            <button
              type="button"
              onClick={addCompetitor}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 text-[12px]"
            >
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
      </Field>

      <Field label="Notes" hint="Extra context not captured above — positioning, taboos, founder story.">
        <textarea
          rows={3}
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          disabled={loading}
          className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3.5 py-2.5 text-[14px] leading-relaxed text-text-primary outline-none transition-all focus:border-text-primary focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] disabled:opacity-60"
        />
      </Field>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
          {savedAt ? `Saved at ${savedAt}` : "Saved to Supabase brand_passports"}
        </span>
        <button
          type="button"
          onClick={save}
          disabled={loading || saving}
          className="group inline-flex items-center gap-2 rounded-full bg-text-primary px-5 py-2.5 text-[13.5px] font-medium text-bg-elevated transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60"
        >
          <Save size={13} strokeWidth={2.2} />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-primary";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.6fr] md:gap-10">
      <div>
        <div className="text-[14px] font-medium text-text-primary">{label}</div>
        {hint && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function RepeatSection({
  label,
  hint,
  onAdd,
  children,
}: {
  label: string;
  hint?: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1.6fr] md:gap-10">
      <div>
        <div className="text-[14px] font-medium text-text-primary">{label}</div>
        {hint && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-text-muted">{hint}</div>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:text-text-primary"
        >
          <Plus size={11} /> Add row
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function RepeatRow({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div className="relative space-y-2 rounded-xl border border-border bg-bg-elevated/50 p-3 pr-10">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 text-text-muted hover:text-error"
        aria-label="Remove row"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
