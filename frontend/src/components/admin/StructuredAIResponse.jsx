import React from 'react';
import {
    IoCalendarOutline, IoBedOutline, IoCashOutline, IoPersonOutline,
    IoDocumentTextOutline, IoArrowForward, IoTimeOutline, IoGridOutline,
    IoLayersOutline, IoCheckmarkCircleOutline, IoPulseOutline
} from 'react-icons/io5';

/**
 * Helper to parse inline markdown such as **bold**, *italic*, and `code`
 */
export const parseInlineFormatting = (text) => {
    if (!text) return '';

    // Split on bold **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            return (
                <strong key={index} className="font-bold text-slate-900">
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return part;
    });
};

/**
 * Maps section titles to professional enterprise icons (No star/sparkle icons)
 */
const getSectionIcon = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('attend') || t.includes('presence') || t.includes('check')) return IoCalendarOutline;
    if (t.includes('seat') || t.includes('utiliz') || t.includes('desk') || t.includes('capac')) return IoBedOutline;
    if (t.includes('finan') || t.includes('fee') || t.includes('collect') || t.includes('due') || t.includes('money') || t.includes('revenue')) return IoCashOutline;
    if (t.includes('student') || t.includes('shift') || t.includes('roster')) return IoTimeOutline;
    if (t.includes('activ') || t.includes('log') || t.includes('audit') || t.includes('recent')) return IoDocumentTextOutline;
    if (t.includes('recommen') || t.includes('action') || t.includes('next') || t.includes('suggest')) return IoArrowForward;
    return IoLayersOutline;
};

/**
 * Structured Enterprise AI Response Renderer
 */
const StructuredAIResponse = ({ content, isDark = false }) => {
    if (!content) return null;

    const lines = content.split('\n');
    const sections = [];
    let currentSection = { type: 'general', title: '', items: [] };
    let mainTitle = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Clean out markdown dividers
        if (line === '---' || line === '***' || line === '___') {
            if (currentSection.items.length > 0) {
                sections.push(currentSection);
                currentSection = { type: 'general', title: '', items: [] };
            }
            continue;
        }

        // Top Main Header (e.g. **Campus Status – Today** or # Title)
        if (!mainTitle && (line.startsWith('# ') || (line.startsWith('**') && line.endsWith('**') && !line.includes(':')))) {
            mainTitle = line.replace(/^#+\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
            continue;
        }

        // Subheaders (### Section Name or ## Section Name)
        if (line.startsWith('### ') || line.startsWith('## ')) {
            if (currentSection.items.length > 0 || currentSection.title) {
                sections.push(currentSection);
            }

            const headerText = line.replace(/^#+\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
            const isRec = headerText.toLowerCase().includes('recommen') || headerText.toLowerCase().includes('action');

            currentSection = {
                type: isRec ? 'recommendation' : 'category',
                title: headerText,
                items: []
            };
            continue;
        }

        // Bullet Items (- **Key:** Value or 1. **Key:** Value or - Item)
        const isBullet = line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line);
        if (isBullet) {
            const rawItem = line.replace(/^[-*]\s+|\d+\.\s+/, '').trim();

            // Check for key-value pair pattern: **Key:** Value or Key: Value
            const kvMatch = rawItem.match(/^(\*\*.*?\*\*|[^:]+):\s*(.*)$/);
            if (kvMatch && kvMatch[1] && kvMatch[2]) {
                const rawKey = kvMatch[1].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
                const rawVal = kvMatch[2].replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

                currentSection.items.push({
                    type: 'kv',
                    key: rawKey,
                    value: rawVal
                });
            } else {
                currentSection.items.push({
                    type: 'bullet',
                    text: rawItem
                });
            }
            continue;
        }

        // Normal paragraph text
        currentSection.items.push({
            type: 'text',
            text: line
        });
    }

    if (currentSection.items.length > 0 || currentSection.title) {
        sections.push(currentSection);
    }

    return (
        <div className={`space-y-3.5 text-xs select-text ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {/* Top Report Header Banner */}
            {mainTitle && (
                <div className="pb-2.5 mb-3 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                        <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
                            {mainTitle}
                        </h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Operational Intelligence
                    </span>
                </div>
            )}

            {/* Structured Sections */}
            <div className="space-y-3">
                {sections.map((sec, sIdx) => {
                    const IconComp = getSectionIcon(sec.title);

                    // Recommendation / Next Steps Callout Card
                    if (sec.type === 'recommendation') {
                        return (
                            <div
                                key={sIdx}
                                className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-orange-300/80 shadow-2xs mt-3"
                            >
                                <div className="flex items-center gap-2 text-xs font-bold text-orange-950 mb-1.5">
                                    <div className="p-1 rounded-lg bg-orange-500 text-white shadow-2xs">
                                        <IoArrowForward size={13} />
                                    </div>
                                    <span className="uppercase tracking-wider text-[11px] font-extrabold text-orange-900">
                                        {sec.title || 'Executive Recommendation'}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-slate-800 text-xs leading-relaxed font-medium pl-1">
                                    {sec.items.map((item, itIdx) => (
                                        <p key={itIdx}>
                                            {parseInlineFormatting(item.text || `${item.key}: ${item.value}`)}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        );
                    }

                    // Standard Category Section
                    return (
                        <div
                            key={sIdx}
                            className="rounded-xl border border-slate-200/90 bg-slate-50/50 overflow-hidden shadow-2xs"
                        >
                            {sec.title && (
                                <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <IconComp size={14} className="text-orange-600 shrink-0" />
                                        <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800">
                                            {sec.title}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Live Data</span>
                                </div>
                            )}

                            <div className="p-2.5 space-y-1.5 bg-white">
                                {sec.items.map((item, itIdx) => {
                                    if (item.type === 'kv') {
                                        return (
                                            <div
                                                key={itIdx}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors gap-1"
                                            >
                                                <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                                    {parseInlineFormatting(item.key)}
                                                </span>
                                                <span className="text-xs font-extrabold text-slate-900 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0 self-start sm:self-auto shadow-2xs font-mono">
                                                    {parseInlineFormatting(item.value)}
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (item.type === 'bullet') {
                                        return (
                                            <div
                                                key={itIdx}
                                                className="flex items-start gap-2 py-1 px-2.5 text-xs text-slate-700"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                                                <span className="leading-relaxed">
                                                    {parseInlineFormatting(item.text)}
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <p
                                            key={itIdx}
                                            className="text-xs text-slate-700 leading-relaxed px-2 py-1"
                                        >
                                            {parseInlineFormatting(item.text)}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StructuredAIResponse;
