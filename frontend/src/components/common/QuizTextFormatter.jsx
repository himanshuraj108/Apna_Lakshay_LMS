import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Set of common English sentence words to distinguish equations from prose
const PROSE_WORDS = new Set([
    'the', 'and', 'with', 'from', 'that', 'this', 'what', 'which', 'when', 'where',
    'then', 'than', 'into', 'over', 'both', 'each', 'does', 'have', 'been', 'will',
    'would', 'could', 'should', 'is', 'are', 'was', 'were', 'for', 'surface', 'radius',
    'disk', 'charge', 'point', 'located', 'axis', 'center', 'distance', 'electric',
    'potential', 'uniformly', 'density', 'find', 'calculate', 'determine', 'consider',
    'suppose', 'given', 'yields', 'integrating', 'concentric', 'contributions', 'between',
    'among', 'above', 'below', 'under', 'through', 'about', 'after', 'before', 'increases',
    'decreases', 'remains', 'constant', 'depends', 'independent', 'maximum', 'minimum',
    'velocity', 'acceleration', 'force', 'mass', 'energy', 'momentum', 'magnetic', 'field'
]);

function normalizeLatex(raw) {
    if (!raw) return '';
    let str = String(raw);
    // Normalize double-escaped backslashes before LaTeX commands (e.g. \\frac -> \frac)
    str = str.replace(/\\\\([a-zA-Z]+)/g, (_, cmd) => '\\' + cmd);
    return str;
}

function isEntirelyMath(str) {
    const t = str.trim();
    if (!t) return false;
    // Explicit delimiters
    if (
        (t.startsWith('$$') && t.endsWith('$$')) ||
        (t.startsWith('$') && t.endsWith('$')) ||
        (t.startsWith('\\[') && t.endsWith('\\]')) ||
        (t.startsWith('\\(') && t.endsWith('\\)'))
    ) {
        return true;
    }
    // If it contains backslash commands like \frac, \sqrt, \pi, \sigma, etc.
    if (/\\[a-zA-Z]+/.test(t)) {
        // Strip out LaTeX commands and check remaining words
        const stripped = t.replace(/\\[a-zA-Z]+(?:{[^{}]*})*/g, '');
        const words = stripped.match(/[a-zA-Z]{3,}/g) || [];
        const hasProse = words.some(w => PROSE_WORDS.has(w.toLowerCase()));
        if (!hasProse) return true;
    }
    return false;
}

function autoDelimitLatex(text) {
    const protectedMath = [];
    function protect(m) {
        protectedMath.push(m);
        return '@@MATH_' + (protectedMath.length - 1) + '@@';
    }

    // 1. Protect already delimited math ($..., $$..., \(...\), \[...\])
    let s = text.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g, m => protect(m));

    // 2. Auto-wrap equation patterns containing backslash commands: e.g. V = \frac{k\pi\sigma R^2}{\sqrt{R^2+z^2}}
    s = s.replace(/\b([A-Za-z]\s*=\s*(?:\\(?:[a-zA-Z]+)(?:{[^{}]*}|[a-zA-Z0-9_^*+-/()^_{}\\])+|[a-zA-Z0-9_^*+-/()^_{}\\]*\\(?:[a-zA-Z]+)(?:{[^{}]*}|[a-zA-Z0-9_^*+-/()^_{}\\])*)+)([.?,;!]?)/g, (_, m, punct) => {
        return protect('$' + m.trim() + '$') + (punct || '');
    });

    // 3. Auto-wrap commands with curly brace arguments: \frac{...}{...}, \sqrt{...}, \vec{...}
    s = s.replace(/(\\(?:frac|sqrt|vec|hat|bar|dot|ddot|tilde|mathbf|mathrm|text)\b(?:{[^{}]*})+)/g, (_, m) => protect('$' + m.trim() + '$'));

    // 4. Auto-wrap Greek letters and math symbols: \sigma, \pi, \alpha, \theta, \times, etc.
    s = s.replace(/(\\(?:alpha|beta|gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|Theta|iota|kappa|lambda|Lambda|mu|nu|xi|Xi|pi|Pi|rho|sigma|Sigma|tau|upsilon|phi|Phi|chi|psi|Psi|omega|Omega|times|div|pm|mp|cdot|circ|approx|equiv|sim|propto|neq|le|ge|leq|geq|infty|partial|nabla|int|oint|sum|prod|lim)\b)/g, (_, m) => protect('$' + m.trim() + '$'));

    // 5. Restore protected math
    s = s.replace(/@@MATH_(\d+)@@/g, (_, i) => protectedMath[i]);
    return s;
}

// Parses superscripts like R^2, z^2, and subscripts like x_1 in plain text tokens
function parseSubSup(str) {
    const parts = [];
    const regex = /([A-Za-z0-9)\]])(?:\^([A-Za-z0-9]+|\{[^}]+\})|_([A-Za-z0-9]+|\{[^}]+\}))/g;
    let lastIdx = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIdx) {
            parts.push({ type: 'text', value: str.slice(lastIdx, match.index) });
        }
        const base = match[1];
        if (match[2]) {
            const exp = match[2].startsWith('{') ? match[2].slice(1, -1) : match[2];
            parts.push({ type: 'sup', base, exp });
        } else if (match[3]) {
            const sub = match[3].startsWith('{') ? match[3].slice(1, -1) : match[3];
            parts.push({ type: 'sub', base, sub });
        }
        lastIdx = regex.lastIndex;
    }
    if (lastIdx < str.length) {
        parts.push({ type: 'text', value: str.slice(lastIdx) });
    }
    return parts;
}

/**
 * FormattedQuizText
 * Renders quiz text with LaTeX math formulas (KaTeX), markdown formatting,
 * superscripts/subscripts, and clean typography.
 */
export const FormattedQuizText = ({ text, className = '' }) => {
    if (!text) return null;
    const raw = normalizeLatex(text);

    // Case 1: The entire string is a math formula/equation
    if (isEntirelyMath(raw)) {
        let formula = raw.trim();
        const isBlock = formula.startsWith('$$') || formula.startsWith('\\[');
        if (formula.startsWith('$$') && formula.endsWith('$$')) formula = formula.slice(2, -2);
        else if (formula.startsWith('$') && formula.endsWith('$')) formula = formula.slice(1, -1);
        else if (formula.startsWith('\\[') && formula.endsWith('\\]')) formula = formula.slice(2, -2);
        else if (formula.startsWith('\\(') && formula.endsWith('\\)')) formula = formula.slice(2, -2);

        try {
            const html = katex.renderToString(formula.trim(), {
                displayMode: isBlock,
                throwOnError: false,
                strict: false,
            });
            return (
                <span
                    className={`quiz-formatted-math inline-block align-middle ${className}`}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        } catch {
            // Fall back to token parsing if full string rendering fails
        }
    }

    // Case 2: Mixed text — auto-delimit any raw LaTeX commands in the prose
    const delimited = autoDelimitLatex(raw);
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
    const parts = delimited.split(mathRegex);

    return (
        <span className={`quiz-formatted-text ${className}`}>
            {parts.map((part, idx) => {
                if (!part) return null;

                // Check if this part is a LaTeX formula
                if (
                    (part.startsWith('$$') && part.endsWith('$$')) ||
                    (part.startsWith('$') && part.endsWith('$')) ||
                    (part.startsWith('\\[') && part.endsWith('\\]')) ||
                    (part.startsWith('\\(') && part.endsWith('\\)'))
                ) {
                    const isBlock = part.startsWith('$$') || part.startsWith('\\[');
                    let formula = part;
                    if (isBlock) {
                        formula = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
                    } else {
                        formula = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
                    }
                    try {
                        const html = katex.renderToString(formula.trim(), {
                            displayMode: isBlock,
                            throwOnError: false,
                            strict: false,
                        });
                        return (
                            <span
                                key={idx}
                                className="inline-block align-middle mx-0.5"
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        );
                    } catch {
                        return <span key={idx} className="font-mono text-xs">{formula}</span>;
                    }
                }

                // Not math: parse markdown tokens and scripts
                const mdTokens = part.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);
                return (
                    <span key={idx}>
                        {mdTokens.map((token, tIdx) => {
                            if (!token) return null;
                            if (token.startsWith('**') && token.endsWith('**')) {
                                return (
                                    <strong key={tIdx} className="font-black text-inherit">
                                        {token.slice(2, -2)}
                                    </strong>
                                );
                            }
                            if (token.startsWith('*') && token.endsWith('*')) {
                                return (
                                    <em key={tIdx} className="italic text-inherit">
                                        {token.slice(1, -1)}
                                    </em>
                                );
                            }
                            if (token.startsWith('`') && token.endsWith('`')) {
                                return (
                                    <code key={tIdx} className="px-1.5 py-0.5 bg-stone-100 text-stone-800 rounded font-mono text-[11px]">
                                        {token.slice(1, -1)}
                                    </code>
                                );
                            }

                            // Parse superscripts and subscripts in plain text
                            const subSupParts = parseSubSup(token);
                            return subSupParts.map((item, sIdx) => {
                                if (item.type === 'sup') {
                                    return (
                                        <React.Fragment key={`${tIdx}-${sIdx}`}>
                                            {item.base}<sup>{item.exp}</sup>
                                        </React.Fragment>
                                    );
                                }
                                if (item.type === 'sub') {
                                    return (
                                        <React.Fragment key={`${tIdx}-${sIdx}`}>
                                            {item.base}<sub>{item.sub}</sub>
                                        </React.Fragment>
                                    );
                                }
                                return item.value.split('\n').map((line, lIdx, arr) => (
                                    <React.Fragment key={`${tIdx}-${sIdx}-${lIdx}`}>
                                        {line}
                                        {lIdx < arr.length - 1 && <br />}
                                    </React.Fragment>
                                ));
                            });
                        })}
                    </span>
                );
            })}
        </span>
    );
};

export default FormattedQuizText;
