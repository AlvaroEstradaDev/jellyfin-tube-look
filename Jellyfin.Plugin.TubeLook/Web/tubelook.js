(function() {
    'use strict';
    
    let tubeLookConfig = null;
    let hideControlsTimeout = null;
    
    // Load configuration from server
    async function loadConfig() {
        try {
            const response = await fetch('/TubeLook/config', {
                credentials: 'include'
            });
            tubeLookConfig = await response.json();
            applyConfig();
        } catch (error) {
            console.error('TubeLook: Failed to load config', error);
            // Use defaults
            tubeLookConfig = {
                PlayButtonSize: 90,
                SkipButtonSize: 60,
                RewindSeconds: 10,
                ForwardSeconds: 30,
                AutoHideDelay: 3000,
                EnableDoubleTap: true,
                EnableGestures: true,
                ShowVisibleSkipButtons: false,
                ButtonOpacity: 0.7
            };
            applyConfig();
        }
    }
    
    // Apply configuration to CSS variables and body classes
    function applyConfig() {
        const root = document.documentElement;
        root.style.setProperty('--tubelook-play-size', 
            `${tubeLookConfig.PlayButtonSize}px`);
        root.style.setProperty('--tubelook-skip-size', 
            `${tubeLookConfig.SkipButtonSize}px`);
        root.style.setProperty('--tubelook-opacity', 
            tubeLookConfig.ButtonOpacity);
        
        // Toggle visible skip buttons class on body
        if (tubeLookConfig.ShowVisibleSkipButtons) {
            document.body.classList.add('tubelook-visible-skip-buttons');
        } else {
            document.body.classList.remove('tubelook-visible-skip-buttons');
        }
        
        // Update skip button labels
        updateSkipLabels();
    }
    
    // Update skip button data attributes
    function updateSkipLabels() {
        const rewindBtn = document.querySelector('.btnRewind');
        const forwardBtn = document.querySelector('.btnFastForward');
        
        if (rewindBtn) {
            rewindBtn.setAttribute('data-skip-seconds', 
                tubeLookConfig.RewindSeconds);
        }
        if (forwardBtn) {
            forwardBtn.setAttribute('data-skip-seconds', 
                tubeLookConfig.ForwardSeconds);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        loadConfig();
        setupVideoPlayerObserver();
    }
    
    // Watch for video player elements
    function setupVideoPlayerObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.classList && 
                        node.classList.contains('videoPlayerContainer')) {
                        enhanceVideoPlayer(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function enhanceVideoPlayer(container) {
        if (!isMobileDevice()) {
            return;
        }
        
        // Create center controls container
        const centerControls = document.createElement('div');
        centerControls.className = 'centerControls';
        
        // Move buttons to center
        const playBtn = container.querySelector('.btnPlayPause');
        const rewindBtn = container.querySelector('.btnRewind');
        const forwardBtn = container.querySelector('.btnFastForward');
        
        if (playBtn) centerControls.appendChild(playBtn.cloneNode(true));
        if (rewindBtn) centerControls.appendChild(rewindBtn.cloneNode(true));
        if (forwardBtn) centerControls.appendChild(forwardBtn.cloneNode(true));
        
        container.appendChild(centerControls);
        
        // Update skip button functionality
        updateSkipButtons(container);
        
        // Setup auto-hide
        setupAutoHide(container);
        
        // Setup double-tap (owns single-tap logic when enabled)
        if (tubeLookConfig.EnableDoubleTap) {
            setupDoubleTapWithAccumulation(container);
        } else {
            // Only use the standalone tap toggle when double-tap is disabled,
            // to avoid conflicting handlers on the same container.
            setupTapToggle(container);
        }
        
        // Setup gestures
        if (tubeLookConfig.EnableGestures) {
            setupGestures(container);
        }
    }

    function isMobileDevice() {
        return (window.innerWidth <= 768) || 
               ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0);
    }

    function updateSkipButtons(container) {
        const video = container.querySelector('video');
        const rewindBtn = container.querySelector('.centerControls .btnRewind');
        const forwardBtn = container.querySelector('.centerControls .btnFastForward');
        
        if (rewindBtn && video) {
            rewindBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.currentTime -= tubeLookConfig.RewindSeconds;
                showControls(container);
            });
        }
        
        if (forwardBtn && video) {
            forwardBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.currentTime += tubeLookConfig.ForwardSeconds;
                showControls(container);
            });
        }
    }

    function setupAutoHide(container) {
        container.addEventListener('mousemove', () => showControls(container));
        container.addEventListener('touchstart', () => showControls(container));
        
        showControls(container);
    }

    function showControls(container) {
        container.classList.remove('controls-hidden');
        
        if (hideControlsTimeout) {
            clearTimeout(hideControlsTimeout);
        }
        
        hideControlsTimeout = setTimeout(() => {
            const video = container.querySelector('video');
            if (video && !video.paused) {
                hideControls(container);
            }
        }, tubeLookConfig.AutoHideDelay);
    }

    function hideControls(container) {
        container.classList.add('controls-hidden');
    }

    function setupTapToggle(container) {
        container.addEventListener('click', (e) => {
            // Ignore clicks on control buttons, bottom bar, and any popup/menu overlays
            // (subtitle menus, audio track pickers, settings panels, dialogs, etc.)
            if (e.target.closest('button')) return;
            if (e.target.closest('.videoControls')) return;
            if (e.target.closest('.actionSheet') || e.target.closest('.dialog') ||
                e.target.closest('.popupMenu') || e.target.closest('[data-role="panel"]')) return;
            
            const controlsHidden = container.classList.contains('controls-hidden');
            
            if (controlsHidden) {
                // First tap: only reveal controls — do NOT pause (YouTube behavior)
                showControls(container);
            } else {
                // Controls already visible: toggle play/pause
                const video = container.querySelector('video');
                if (video) {
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                }
                showControls(container); // reset the auto-hide timer
            }
        });
    }

    // Enhanced version with cumulative skips
    function setupDoubleTapWithAccumulation(container) {
        const video = container.querySelector('video');
        let lastTapTime = 0;
        let tapTimeout = null;
        let tapCount = 0;
        let lastTapSide = null;
        let accumulatedSeconds = 0;
        let indicatorElement = null;
        
        container.addEventListener('touchend', handleTap);
        container.addEventListener('click', handleTap);
        
        function handleTap(e) {
            // Handle taps anywhere inside the player, but not on control buttons or bottom bar
            if (!e.target.closest('.videoPlayerContainer')) return;
            if (e.target.closest('button') || e.target.closest('.videoControls')) return;
            
            const now = Date.now();
            const tapDelay = now - lastTapTime;
            
            const rect = video.getBoundingClientRect();
            const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
            const tapX = clientX - rect.left;
            const videoMiddle = rect.width / 2;
            const currentSide = tapX < videoMiddle ? 'left' : 'right';
            
            if (tapDelay < 400 && tapDelay > 0 && currentSide === lastTapSide) {
                // Continuing to tap on same side
                tapCount++;
                
                if (tapTimeout) clearTimeout(tapTimeout);
                
                // Update accumulated skip amount
                const skipAmount = currentSide === 'left' 
                    ? tubeLookConfig.RewindSeconds 
                    : tubeLookConfig.ForwardSeconds;
                accumulatedSeconds += skipAmount;
                
                // Update or create indicator
                updateSkipIndicator(container, currentSide, accumulatedSeconds, currentSide === 'left');
                
                // Wait for taps to stop
                tapTimeout = setTimeout(() => {
                    // Apply the accumulated skip
                    if (currentSide === 'left') {
                        video.currentTime -= accumulatedSeconds;
                    } else {
                        video.currentTime += accumulatedSeconds;
                    }
                    
                    // Reset after a short delay to let animation finish
                    setTimeout(() => {
                        if (indicatorElement) {
                            indicatorElement.remove();
                            indicatorElement = null;
                        }
                    }, 400);
                    
                    tapCount = 0;
                    lastTapSide = null;
                    accumulatedSeconds = 0;
                }, 500);
            } else {
                // Different side or first tap — treat as a single tap
                tapCount = 1;
                lastTapSide = currentSide;
                accumulatedSeconds = 0;
                
                if (tapTimeout) clearTimeout(tapTimeout);
                
                tapTimeout = setTimeout(() => {
                    if (tapCount === 1) {
                        const controlsHidden = container.classList.contains('controls-hidden');
                        if (controlsHidden) {
                            // First tap when controls hidden: only show controls, don't pause
                            showControls(container);
                        } else {
                            // Controls visible: toggle play/pause (YouTube mobile behavior)
                            const video = container.querySelector('video');
                            if (video) {
                                if (video.paused) {
                                    video.play();
                                } else {
                                    video.pause();
                                }
                            }
                            showControls(container); // reset auto-hide timer
                        }
                    }
                    tapCount = 0;
                    lastTapSide = null;
                }, 300);
            }
            
            lastTapTime = now;
        }
        
        function updateSkipIndicator(container, side, seconds, isRewind) {
            if (!indicatorElement) {
                indicatorElement = document.createElement('div');
                indicatorElement.className = `tubelook-skip-indicator ${side}`;
                container.appendChild(indicatorElement);
            }
            
            const prefix = isRewind ? '-' : '+';
            indicatorElement.className = `tubelook-skip-indicator ${side}`;
            indicatorElement.innerHTML = `
                <div class="tubelook-skip-text">${prefix}${seconds}</div>
                <svg class="tubelook-skip-arrow" viewBox="0 0 24 24">
                    ${isRewind 
                        ? '<path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>'
                        : '<path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>'
                    }
                </svg>
            `;
        }
    }

    function setupGestures(container) {
        const video = container.querySelector('video');
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let isSeeking = false;
        
        container.addEventListener('touchstart', (e) => {
            if (e.target.tagName !== 'VIDEO') return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = video.currentTime;
            isSeeking = false;
        });
        
        container.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'VIDEO') return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            // Horizontal swipe - seeking
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isSeeking = true;
                e.preventDefault();
                
                // Calculate seek amount (10 seconds per 100px)
                const seekAmount = (diffX / 100) * 10;
                const newTime = Math.max(0, 
                    Math.min(video.duration || 0, startTime + seekAmount));
                
                showSeekPreview(container, newTime);
            }
            
            // Vertical swipe - volume/brightness
            else {
                // Left side - brightness
                // Right side - volume
                // (Implementation depends on preferences)
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (isSeeking) {
                // Apply seek
                const currentX = e.changedTouches[0].clientX;
                const diffX = currentX - startX;
                const seekAmount = (diffX / 100) * 10;
                
                video.currentTime = Math.max(0, 
                    Math.min(video.duration || 0, startTime + seekAmount));
                
                hideSeekPreview(container);
            }
        });
    }

    function showSeekPreview(container, time) {
        let preview = container.querySelector('.tubelook-seek-preview');
        
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'tubelook-seek-preview';
            
            Object.assign(preview.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '15px 25px',
                borderRadius: '8px',
                fontSize: '28px',
                fontWeight: 'bold',
                zIndex: '1002'
            });
            
            container.appendChild(preview);
        }
        
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        preview.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function hideSeekPreview(container) {
        const preview = container.querySelector('.tubelook-seek-preview');
        if (preview) {
            preview.remove();
        }
    }
})();
