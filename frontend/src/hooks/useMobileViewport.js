import { useEffect } from 'react';

const useMobileViewport = () => {
    useEffect(() => {
        // Find existing viewport tag
        let viewport = document.querySelector('meta[name="viewport"]');

        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = "viewport";
            document.head.appendChild(viewport);
        }

        // Store original content to restore later (defaulting to the hardcoded index.html value)
        const originalContent = viewport.getAttribute('content') || 'width=1024, user-scalable=yes';

        // Set to mobile responsive
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        // Cleanup: Restore original (Desktop) viewport on unmount
        return () => {
            viewport.setAttribute('content', originalContent);
        };
    }, []);
};

export default useMobileViewport;
