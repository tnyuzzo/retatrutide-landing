"use client";

import { useState, useEffect } from "react";
import { Syringe, FlaskConical, Droplet, Info, AlertTriangle, Settings, ArrowLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CalculatorStructuredData } from "@/components/seo/CalculatorStructuredData";

export default function CalculatorPage() {
    const t = useTranslations("Index");
    const locale = useLocale();

    const [peptideAmountMg, setPeptideAmountMg] = useState("10");
    const [waterAmountMl, setWaterAmountMl] = useState("2");
    const [desiredDoseMcg, setDesiredDoseMcg] = useState("250");
    const [syringeSize, setSyringeSize] = useState(0.5);

    const [unitsToDraw, setUnitsToDraw] = useState(0);
    const [volumeToDrawMl, setVolumeToDrawMl] = useState(0);
    const [concentration, setConcentration] = useState(0);

    useEffect(() => {
        const peptide = parseFloat(peptideAmountMg) || 0;
        const water = parseFloat(waterAmountMl) || 0;
        const dose = parseFloat(desiredDoseMcg) || 0;
        const totalPeptideMcg = peptide * 1000;
        const conc = water > 0 ? totalPeptideMcg / water : 0;
        setConcentration(conc);
        const volMl = conc > 0 ? dose / conc : 0;
        setVolumeToDrawMl(volMl);
        setUnitsToDraw(volMl * 100);
    }, [peptideAmountMg, waterAmountMl, desiredDoseMcg]);

    const maxUnits = syringeSize * 100;
    const fillPercent = Math.min((unitsToDraw / maxUnits) * 100, 100);
    const isOverFlow = unitsToDraw > maxUnits;
    const totalTicks = Math.floor(maxUnits / 5) + 1;

    return (
        <main className="min-h-screen bg-brand-void text-white font-sans flex flex-col items-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Nav */}
            <div className="w-full max-w-2xl flex justify-between items-center mb-3 md:mb-6 z-10">
                <Link href={`/${locale}`} className="flex items-center gap-2 text-white/50 hover:text-brand-gold transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> {t("nav_home")}
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="z-10 max-w-2xl w-full flex flex-col gap-3 md:gap-6">
                {/* Header */}
                <div className="flex items-center gap-3 md:flex-col md:text-center md:gap-0">
                    <div className="w-9 h-9 md:w-14 md:h-14 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0 md:mx-auto md:mb-4">
                        <Syringe className="w-4 h-4 md:w-6 md:h-6 text-brand-gold" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-4xl font-light">{t("calc_title")}</h1>
                        <p className="text-white/50 text-xs md:text-sm md:mt-2 hidden md:block">{t("calc_subtitle")}</p>
                    </div>
                </div>

                {/* Section 1+2: Inputs combinati */}
                <div className="glass-panel p-4 md:p-8 rounded-2xl border border-white/10">
                    {/* Row: Ricostituzione */}
                    <h2 className="flex items-center gap-2 text-xs md:text-sm font-medium uppercase tracking-widest text-brand-gold mb-3 md:mb-6">
                        <FlaskConical className="w-3 h-3 md:w-4 md:h-4" />
                        {t("calc_section_mix")}
                    </h2>

                    <div className="grid grid-cols-2 gap-3 md:gap-6">
                        <div>
                            <label className="block text-[10px] md:text-xs text-white/50 mb-1.5 md:mb-2">{t("calc_peptide_amount")}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={peptideAmountMg}
                                    onChange={(e) => setPeptideAmountMg(e.target.value)}
                                    min="0"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-base md:text-lg font-light text-white focus:border-brand-gold focus:outline-none pr-10 md:pr-14"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs md:text-sm font-medium">mg</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] md:text-xs text-white/50 mb-1.5 md:mb-2">{t("calc_water_amount")}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={waterAmountMl}
                                    onChange={(e) => setWaterAmountMl(e.target.value)}
                                    min="0"
                                    step="0.1"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-base md:text-lg font-light text-white focus:border-brand-gold focus:outline-none pr-10 md:pr-14"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs md:text-sm font-medium">ml</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-white/40 bg-white/5 p-2.5 rounded-lg">
                        <Info className="w-3 h-3 shrink-0" />
                        <span>{t("calc_concentration")}: <strong className="text-brand-gold">{concentration.toLocaleString()} mcg/ml</strong></span>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-white/10 my-3 md:my-6"></div>

                    {/* Dosaggio */}
                    <h2 className="flex items-center gap-2 text-xs md:text-sm font-medium uppercase tracking-widest text-brand-gold mb-3 md:mb-6">
                        <Droplet className="w-3 h-3 md:w-4 md:h-4" />
                        {t("calc_section_dose")}
                    </h2>

                    <div>
                        <label className="block text-[10px] md:text-xs text-white/50 mb-1.5 md:mb-2">{t("calc_desired_dose")}</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={desiredDoseMcg}
                                onChange={(e) => setDesiredDoseMcg(e.target.value)}
                                min="0"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-base md:text-lg font-light text-white focus:border-brand-gold focus:outline-none pr-14"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs md:text-sm font-medium">mcg</span>
                        </div>
                    </div>

                    {/* Quick buttons */}
                    <div className="grid grid-cols-4 gap-1.5 md:gap-2 mt-3">
                        {[250, 500, 750, 1000, 1250, 1500, 1750, 2000].map((val) => (
                            <button
                                key={val}
                                onClick={() => setDesiredDoseMcg(String(val))}
                                className={`px-1 py-2.5 min-h-[44px] text-[10px] md:text-xs font-medium rounded-lg border transition-all ${parseFloat(desiredDoseMcg) === val
                                        ? "bg-brand-gold/20 border-brand-gold text-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                                        : "bg-black/20 border-white/10 text-white/50 hover:border-brand-gold/50 hover:text-white"
                                    }`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 3: Result */}
                <div className="glass-panel p-4 md:p-8 rounded-2xl border border-brand-gold/20">
                    {/* Syringe size selector */}
                    <div className="flex justify-between items-center gap-3 mb-3 md:mb-6">
                        <h2 className="flex items-center gap-2 text-xs md:text-sm font-medium uppercase tracking-widest text-brand-gold">
                            <Settings className="w-3 h-3 md:w-4 md:h-4" />
                            {t("calc_result")}
                        </h2>
                        <div className="flex gap-1.5 md:gap-2">
                            {[
                                { val: 0.3, label: "0.3ml" },
                                { val: 0.5, label: "0.5ml" },
                                { val: 1.0, label: "1.0ml" },
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => setSyringeSize(opt.val)}
                                    className={`px-2.5 py-2 min-h-[40px] text-[10px] md:text-xs font-medium rounded-lg border transition-all ${syringeSize === opt.val
                                            ? "bg-brand-gold/20 border-brand-gold text-brand-gold"
                                            : "bg-black/20 border-white/10 text-white/40 hover:border-brand-gold/50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Syringe visual */}
                    <div className="relative w-full max-w-md mx-auto mb-3 md:mb-4 select-none">
                        <div className="relative">
                            <div className="h-10 md:h-16 border-2 border-white/30 rounded-r-lg rounded-l-md bg-black/50 relative flex items-center overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ease-out ${isOverFlow ? "bg-red-500/50" : "bg-brand-gold/30"}`}
                                    style={{ width: `${fillPercent}%` }}
                                ></div>
                                <div
                                    className="absolute h-full w-1 bg-white/70 transition-all duration-500 ease-out"
                                    style={{ left: `${fillPercent}%` }}
                                ></div>
                            </div>
                            <div className="relative w-full h-7 md:h-9 mt-0.5">
                                {[...Array(totalTicks)].map((_, i) => {
                                    const unit = i * 5;
                                    const isMajor = unit % 10 === 0;
                                    const pos = (unit / maxUnits) * 100;
                                    return (
                                        <div key={i} className="absolute flex flex-col items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
                                            <div className={`${isMajor ? "h-2.5 md:h-3.5 w-0.5 bg-white/70" : "h-1.5 md:h-2.5 w-px bg-white/40"}`}></div>
                                            <span className={`font-mono mt-0.5 ${isMajor ? "text-[9px] md:text-[11px] text-white/70 font-medium" : "hidden md:block text-[9px] text-white/40"}`}>{unit}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="text-center mt-2 text-xs md:text-sm">
                            {isOverFlow ? (
                                <span className="text-red-400 flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" /> {t("calc_overflow")}
                                </span>
                            ) : (
                                <span className="text-white/60">
                                    {t("calc_draw_to")} <span className="text-brand-gold text-base md:text-lg font-medium">{unitsToDraw.toFixed(1)}</span> {t("calc_units")}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Results grid */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="bg-brand-gold/10 p-4 md:p-5 rounded-xl text-center">
                            <div className="text-3xl md:text-4xl font-light text-brand-gold">{unitsToDraw.toFixed(1)}</div>
                            <div className="text-[10px] md:text-xs font-medium text-brand-gold/60 uppercase tracking-widest mt-1">{t("calc_units")} (IU)</div>
                            {isOverFlow && <div className="text-red-400 text-xs mt-2 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("calc_overflow")}</div>}
                        </div>
                        <div className="bg-white/5 p-4 md:p-5 rounded-xl text-center">
                            <div className="text-3xl md:text-4xl font-light text-white">{volumeToDrawMl.toFixed(3)}</div>
                            <div className="text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-widest mt-1">{t("calc_milliliters")} (ml)</div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="text-center text-[10px] text-white/25 leading-relaxed pb-8">
                    {t("calc_disclaimer")}
                </div>
            </div>

            {/* SEO: Structured Data */}
            <CalculatorStructuredData />
        </main>
    );
}
