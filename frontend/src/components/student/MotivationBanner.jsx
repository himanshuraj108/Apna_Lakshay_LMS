import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparklesOutline, IoCloseOutline } from 'react-icons/io5';

const FALLBACK_QUOTES = [
    { content: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { content: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { content: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
    { content: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { content: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
    { content: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { content: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { content: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { content: "Strive for progress, not perfection.", author: "Unknown" },
    { content: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { content: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
    { content: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { content: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
    { content: "A year from now you may wish you had started today.", author: "Karen Lamb" }
];

const MotivationBanner = () => {
    const [quote, setQuote] = useState(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                // Try to fetch an education/wisdom quote
                // timeout after 3s to fallback quickly
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch('https://api.quotable.io/quotes/random?tags=education|wisdom|success', {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setQuote({ content: data[0].content, author: data[0].author });
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (error) {
                console.warn("Failed to fetch quote from API, using fallback.");
            }

            // Fallback if API fails, times out, or returns bad data
            const randomFallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            setQuote(randomFallback);
            setIsLoading(false);
        };

        fetchQuote();
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, filter: "blur(5px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(10px)" }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full group py-2"
                >

                    <div className="relative flex gap-4 items-start sm:items-center">
                        {/* Icon */}
                        <div className="shrink-0 p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-500 shadow-sm">
                            <IoSparklesOutline size={20} className="animate-pulse" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-6">
                            {isLoading ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                    <div className="h-3 bg-white/5 rounded w-1/4"></div>
                                </div>
                            ) : quote && (
                                <motion.div
                                    initial={{ opacity: 0, filter: "blur(5px)" }}
                                    animate={{ opacity: 1, filter: "blur(0px)" }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <p className="text-gray-700 text-sm sm:text-base italic leading-relaxed font-medium">
                                        "{quote.content}"
                                    </p>
                                    <p className="text-orange-500 text-xs sm:text-sm font-semibold mt-1.5 tracking-wide uppercase">
                                        — {quote.author}
                                    </p>
                                </motion.div>
                            )}
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MotivationBanner;
