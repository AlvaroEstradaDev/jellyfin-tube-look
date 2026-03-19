(function() {
    'use strict';
    
    let tubeLookConfig = {
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
    let hideControlsTimeout = null;
    let configLoaded = false;
    
    async function loadConfig() {
        try {
            const response = await fetch('/TubeLook/config', {
                credentials: 'include'
            });
            if (response.ok) {
                tubeLookConfig = await response.json();
            }
        } catch (error) {
            console.warn('TubeLook: Using default config', error);
        }
        configLoaded = true;
        applyConfig();
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
        injectStyles();
        loadConfig();
        setupVideoPlayerObserver();
    }
    
    function injectStyles() {
        if (!document.querySelector('link[href^="/TubeLook/css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = '/TubeLook/css?v=' + Date.now();
            document.head.appendChild(link);
        }
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
        
        if (container.querySelector('.centerControls')) {
            return;
        }
        
        const video = container.querySelector('video');
        if (!video) {
            return;
        }
        
        const centerControls = document.createElement('div');
        centerControls.className = 'centerControls';
        
        const prevBtn = container.querySelector('.videoControls .btnPreviousTrack');
        const playBtn = container.querySelector('.videoControls .btnPlayPause');
        const nextBtn = container.querySelector('.videoControls .btnNextTrack');
        const rewindBtn = container.querySelector('.videoControls .btnRewind');
        const forwardBtn = container.querySelector('.videoControls .btnFastForward');
        
        if (prevBtn) centerControls.appendChild(prevBtn.cloneNode(true));
        if (playBtn) centerControls.appendChild(playBtn.cloneNode(true));
        if (nextBtn) centerControls.appendChild(nextBtn.cloneNode(true));
        if (rewindBtn) centerControls.appendChild(rewindBtn.cloneNode(true));
        if (forwardBtn) centerControls.appendChild(forwardBtn.cloneNode(true));
        
        container.appendChild(centerControls);
        
        updateCenterButtons(container);
        setupAutoHide(container);
        
        if (tubeLookConfig.EnableDoubleTap) {
            setupDoubleTapWithAccumulation(container);
        } else {
            setupTapToggle(container);
        }
        
        if (tubeLookConfig.EnableGestures) {
            setupGestures(container);
        }
    }

    function isMobileDevice() {
        const ua = navigator.userAgent.toLowerCase();
        const isAndroid = ua.includes('android');
        const isIOS = /iphone|ipad|ipod/.test(ua);
        const isJellyfinApp = ua.includes('jellyfin') || 
                              window.location.href.includes('native') ||
                              document.querySelector('meta[name="jellyfin-native"]');
        const isSmallScreen = window.innerWidth <= 1024;
        const hasTouchScreen = ('ontouchstart' in window) || 
                               (navigator.maxTouchPoints > 0) ||
                               (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        
        return isAndroid || isIOS || isJellyfinApp || (isSmallScreen && hasTouchScreen);
    }

    function updateCenterButtons(container) {
        const video = container.querySelector('video');
        const rewindBtn = container.querySelector('.centerControls .btnRewind');
        const forwardBtn = container.querySelector('.centerControls .btnFastForward');
        
        const prevBtn = container.querySelector('.centerControls .btnPreviousTrack');
        const nextBtn = container.querySelector('.centerControls .btnNextTrack');
        const origPrevBtn = container.querySelector('.videoControls .btnPreviousTrack');
        const origNextBtn = container.querySelector('.videoControls .btnNextTrack');
        
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

        if (prevBtn && origPrevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                origPrevBtn.click();
                showControls(container);
            });
        }

        if (nextBtn && origNextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                origNextBtn.click();
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

    function setupDoubleTapWithAccumulation(container) {
        const video = container.querySelector('video');
        if (!video) return;
        
        let lastTapTime = 0;
        let tapTimeout = null;
        let tapCount = 0;
        let lastTapSide = null;
        let accumulatedSeconds = 0;
        let indicatorElement = null;
        
        function handleTap(e) {
            if (!e.target.closest('.videoPlayerContainer')) return;
            if (e.target.closest('button') || e.target.closest('.videoControls')) return;
            
            const now = Date.now();
            const tapDelay = now - lastTapTime;
            
            const rect = video.getBoundingClientRect();
            if (rect.width === 0) return;
            
            const clientX = e.clientX || (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX);
            if (clientX === undefined) return;
            
            const tapX = clientX - rect.left;
            const videoMiddle = rect.width / 2;
            const currentSide = tapX < videoMiddle ? 'left' : 'right';
            
            if (tapDelay < 400 && tapDelay > 0 && currentSide === lastTapSide) {
                tapCount++;
                
                if (tapTimeout) clearTimeout(tapTimeout);
                
                const skipAmount = currentSide === 'left' 
                    ? tubeLookConfig.RewindSeconds 
                    : tubeLookConfig.ForwardSeconds;
                accumulatedSeconds += skipAmount;
                
                updateSkipIndicator(container, currentSide, accumulatedSeconds, currentSide === 'left');
                
                tapTimeout = setTimeout(() => {
                    if (currentSide === 'left') {
                        video.currentTime = Math.max(0, video.currentTime - accumulatedSeconds);
                    } else {
                        video.currentTime = Math.min(video.duration || 0, video.currentTime + accumulatedSeconds);
                    }
                    
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
                tapCount = 1;
                lastTapSide = currentSide;
                accumulatedSeconds = 0;
                
                if (tapTimeout) clearTimeout(tapTimeout);
                
                tapTimeout = setTimeout(() => {
                    if (tapCount === 1) {
                        const controlsHidden = container.classList.contains('controls-hidden');
                        if (controlsHidden) {
                            showControls(container);
                        } else {
                            if (video) {
                                if (video.paused) {
                                    video.play();
                                } else {
                                    video.pause();
                                }
                            }
                            showControls(container);
                        }
                    }
                    tapCount = 0;
                    lastTapSide = null;
                }, 300);
            }
            
            lastTapTime = now;
        }
        
        container.addEventListener('touchend', handleTap, { passive: true });
        container.addEventListener('click', handleTap);
        
        function updateSkipIndicator(container, side, seconds, isRewind) {
            if (!indicatorElement) {
                indicatorElement = document.createElement('div');
                indicatorElement.className = `tubelook-skip-indicator ${side}`;
                container.appendChild(indicatorElement);
            }
            
            const prefix = isRewind ? '-' : '+';
            indicatorElement.className = `tubelook-skip-indicator ${side}`;
            
            if (isRewind) {
                indicatorElement.innerHTML = `
                    <div class="tubelook-skip-arrow">‹</div>
                    <div class="tubelook-skip-text">${prefix}${seconds}</div>
                `;
            } else {
                indicatorElement.innerHTML = `
                    <div class="tubelook-skip-text">${prefix}${seconds}</div>
                    <div class="tubelook-skip-arrow">›</div>
                `;
            }
        }
    }

    function setupGestures(container) {
        const video = container.querySelector('video');
        if (!video) return;
        
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        let isSeeking = false;
        
        container.addEventListener('touchstart', (e) => {
            if (!e.target.closest('video')) return;
            
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = video.currentTime;
            isSeeking = false;
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (!isSeeking && e.touches.length === 0) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = currentY - startY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
                isSeeking = true;
                e.preventDefault();
                
                const seekAmount = (diffX / 100) * 10;
                const newTime = Math.max(0, 
                    Math.min(video.duration || 0, startTime + seekAmount));
                
                showSeekPreview(container, newTime);
            }
        }, { passive: false });
        
        container.addEventListener('touchend', (e) => {
            if (isSeeking && e.changedTouches.length > 0) {
                const currentX = e.changedTouches[0].clientX;
                const diffX = currentX - startX;
                const seekAmount = (diffX / 100) * 10;
                
                video.currentTime = Math.max(0, 
                    Math.min(video.duration || 0, startTime + seekAmount));
                
                hideSeekPreview(container);
            }
            isSeeking = false;
        }, { passive: true });
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
                zIndex: '15'
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
