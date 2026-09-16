/* ============================================
   LOVE STORY — MAIN SCRIPT
   3D Animations, Password, Cinematic Intro
   ============================================ */

// ==========================================
// CONSTANTS
// ==========================================
const CORRECT_CODE = '2604';

// ==========================================
// PASSWORD SCREEN — PARTICLE BACKGROUND
// ==========================================
function initPasswordParticles() {
    const canvas = document.getElementById('password-canvas');
    const ctx = canvas.getContext('2d');

    let w, h;
    const particles = [];
    const heartParticles = [];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Regular floating particles
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.1,
            pulse: Math.random() * Math.PI * 2,
        });
    }

    // Heart-shaped particles
    for (let i = 0; i < 20; i++) {
        const t = (i / 20) * Math.PI * 2;
        // Heart parametric equation
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        heartParticles.push({
            baseX: w / 2 + hx * 4,
            baseY: h / 2 + hy * 4 - 60,
            x: Math.random() * w,
            y: Math.random() * h,
            progress: 0,
            r: 1.5,
            opacity: 0.15,
            delay: i * 0.05,
        });
    }

    function drawParticles() {
        ctx.clearRect(0, 0, w, h);

        // Draw regular particles
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.pulse += 0.02;

            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 107, 157, ${currentOpacity})`;
            ctx.fill();
        });

        // Draw heart particles
        heartParticles.forEach(p => {
            p.progress = Math.min(1, p.progress + 0.003);
            const easedProgress = easeInOutCubic(p.progress);
            const currentX = p.x + (p.baseX - p.x) * easedProgress;
            const currentY = p.y + (p.baseY - p.y) * easedProgress;

            ctx.beginPath();
            ctx.arc(currentX, currentY, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 107, 157, ${p.opacity + easedProgress * 0.3})`;
            ctx.fill();
        });

        // Draw connections between close particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 107, 157, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(drawParticles);
    }

    drawParticles();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ==========================================
// PASSWORD INPUT HANDLING
// ==========================================
function initPasswordInputs() {
    const inputs = document.querySelectorAll('.code-input');
    const errorMsg = document.getElementById('error-msg');

    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }

            // Check if all filled
            const code = Array.from(inputs).map(i => i.value).join('');
            if (code.length === 4) {
                setTimeout(() => validateCode(code), 200);
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        // Allow paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
            if (pasted.length === 4 && /^\d{4}$/.test(pasted)) {
                inputs.forEach((inp, i) => {
                    inp.value = pasted[i];
                });
                setTimeout(() => validateCode(pasted), 200);
            }
        });
    });
}

function validateCode(code) {
    const inputs = document.querySelectorAll('.code-input');
    const errorMsg = document.getElementById('error-msg');

    if (code === CORRECT_CODE) {
        // Success!
        inputs.forEach(i => i.classList.add('success'));
        errorMsg.textContent = '';
        errorMsg.classList.remove('visible');

        setTimeout(() => {
            const passScreen = document.getElementById('password-screen');
            passScreen.classList.add('fade-out');
            setTimeout(() => {
                passScreen.classList.add('hidden');
                startIntro();
            }, 1000);
        }, 600);
    } else {
        // Error
        inputs.forEach(i => {
            i.classList.add('error');
            i.value = '';
        });
        inputs[0].focus();
        errorMsg.textContent = 'Galat code hai... try again ❤️';
        errorMsg.classList.add('visible');

        setTimeout(() => {
            inputs.forEach(i => i.classList.remove('error'));
        }, 600);
    }
}

// ==========================================
// 3D CINEMATIC INTRO — THREE.JS
// ==========================================
let introScene, introCamera, introRenderer, introAnimationId;
let starField, heartMeshes = [];
let introStartTime;

function startIntro() {
    const introScreen = document.getElementById('intro-screen');
    introScreen.classList.remove('hidden');

    initThreeIntro();
    runIntroSequence();
}

function initThreeIntro() {
    const canvas = document.getElementById('intro-canvas');
    introScene = new THREE.Scene();
    introScene.fog = new THREE.FogExp2(0x000005, 0.0008);

    introCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    introCamera.position.z = 500;

    introRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    introRenderer.setSize(window.innerWidth, window.innerHeight);
    introRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 2000;
        positions[i3 + 1] = (Math.random() - 0.5) * 2000;
        positions[i3 + 2] = (Math.random() - 0.5) * 2000;

        // Pink/white/gold colors
        const colorChoice = Math.random();
        if (colorChoice < 0.3) {
            colors[i3] = 1; colors[i3 + 1] = 0.42; colors[i3 + 2] = 0.62; // Pink
        } else if (colorChoice < 0.5) {
            colors[i3] = 1; colors[i3 + 1] = 0.84; colors[i3 + 2] = 0; // Gold
        } else {
            colors[i3] = 0.95; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1; // White
        }

        sizes[i] = Math.random() * 3 + 0.5;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMat = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
    });

    starField = new THREE.Points(starGeo, starMat);
    introScene.add(starField);

    // Create 3D heart particles
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.5, y + 0.5);
    heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    heartShape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1, y);
    heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.1, bevelThickness: 0.1 };
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

    for (let i = 0; i < 40; i++) {
        const heartMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.95 + Math.random() * 0.05, 0.8, 0.6),
            transparent: true,
            opacity: 0,
        });
        const heart = new THREE.Mesh(heartGeo, heartMat);
        heart.position.set(
            (Math.random() - 0.5) * 800,
            (Math.random() - 0.5) * 800,
            (Math.random() - 0.5) * 800
        );
        heart.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.PI);
        const scale = Math.random() * 15 + 5;
        heart.scale.set(scale, scale, scale);
        heart.userData = {
            rotSpeed: (Math.random() - 0.5) * 0.02,
            floatSpeed: Math.random() * 0.5 + 0.2,
            floatOffset: Math.random() * Math.PI * 2,
        };
        introScene.add(heart);
        heartMeshes.push(heart);
    }

    // Ambient light
    introScene.add(new THREE.AmbientLight(0xff6b9d, 0.5));

    introStartTime = Date.now();

    window.addEventListener('resize', onIntroResize);
    animateIntro();
}

function onIntroResize() {
    if (introCamera && introRenderer) {
        introCamera.aspect = window.innerWidth / window.innerHeight;
        introCamera.updateProjectionMatrix();
        introRenderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function animateIntro() {
    introAnimationId = requestAnimationFrame(animateIntro);
    const elapsed = (Date.now() - introStartTime) / 1000;

    // Rotate starfield slowly
    if (starField) {
        starField.rotation.y += 0.0003;
        starField.rotation.x += 0.0001;
    }

    // Move camera forward (flying through stars)
    introCamera.position.z -= 0.8;
    introCamera.position.y = Math.sin(elapsed * 0.3) * 20;
    introCamera.rotation.z = Math.sin(elapsed * 0.2) * 0.02;

    // Animate hearts
    heartMeshes.forEach((heart, i) => {
        heart.rotation.y += heart.userData.rotSpeed;
        heart.position.y += Math.sin(elapsed * heart.userData.floatSpeed + heart.userData.floatOffset) * 0.3;

        // Fade in hearts over time
        if (elapsed > 2) {
            heart.material.opacity = Math.min(0.7, (elapsed - 2) * 0.1);
        }
    });

    introRenderer.render(introScene, introCamera);
}

function runIntroSequence() {
    const texts = [
        { el: '#intro-text-1', start: 500, duration: 2500 },
        { el: '#intro-text-2', start: 3500, duration: 2500 },
        { el: '#intro-text-3', start: 6500, duration: 2500 },
        { el: '#intro-text-4', start: 9500, duration: 2000 },
        { el: '#intro-text-5', start: 12000, duration: 3000 },
    ];

    texts.forEach(t => {
        const el = document.querySelector(t.el);
        setTimeout(() => {
            gsap.fromTo(el,
                { opacity: 0, y: 30, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }
            );
        }, t.start);

        setTimeout(() => {
            gsap.to(el, { opacity: 0, y: -20, duration: 0.8, ease: 'power2.in' });
        }, t.start + t.duration);
    });

    // Auto transition to story
    setTimeout(() => {
        endIntro();
    }, 16000);
}

function endIntro() {
    const introScreen = document.getElementById('intro-screen');
    introScreen.classList.add('fade-out');

    setTimeout(() => {
        introScreen.classList.add('hidden');
        cancelAnimationFrame(introAnimationId);
        window.removeEventListener('resize', onIntroResize);

        // Cleanup Three.js
        if (introRenderer) {
            introRenderer.dispose();
        }

        showStory();
    }, 800);
}

// Skip button
document.getElementById('skip-intro')?.addEventListener('click', () => {
    endIntro();
});

// ==========================================
// STORY SCREEN — BACKGROUND PARTICLES
// ==========================================
function initStoryBackground() {
    const canvas = document.getElementById('story-canvas');
    const ctx = canvas.getContext('2d');
    let w, h;
    const particles = [];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.5 + 0.3,
            dx: (Math.random() - 0.5) * 0.15,
            dy: (Math.random() - 0.5) * 0.15,
            opacity: Math.random() * 0.3 + 0.05,
            pulse: Math.random() * Math.PI * 2,
        });
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            p.pulse += 0.01;

            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            const o = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 107, 157, ${o})`;
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    draw();
}

// ==========================================
// STORY SCREEN — SCROLL ANIMATIONS (GSAP)
// ==========================================
function showStory() {
    const storyScreen = document.getElementById('story-screen');
    storyScreen.classList.remove('hidden');

    initStoryBackground();
    initScrollAnimations();
    spawnFinalHearts();
    initLightbox();
}

function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Animate each chapter card
    gsap.utils.toArray('.chapter').forEach(chapter => {
        const card = chapter.querySelector('.chapter-card');
        const number = chapter.querySelector('.chapter-number');

        if (number) {
            gsap.fromTo(number,
                { opacity: 0, y: 20 },
                {
                    opacity: 0.6, y: 0,
                    scrollTrigger: {
                        trigger: chapter,
                        start: 'top 80%',
                        end: 'top 50%',
                        scrub: 1,
                    }
                }
            );
        }

        if (card) {
            gsap.fromTo(card,
                { opacity: 0, y: 60 },
                {
                    opacity: 1, y: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: chapter,
                        start: 'top 75%',
                        toggleActions: 'play none none reverse',
                    }
                }
            );
        }

        // Animate children inside card
        const children = card?.querySelectorAll('.chapter-text, .chapter-quote, .confession-highlight, .timestamp-reveal, .time-visual, .gallery-grid, .proposal-box, .proposal-cards-container, .song-highlight-section');
        if (children) {
            gsap.fromTo(children,
                { opacity: 0, y: 25 },
                {
                    opacity: 1, y: 0,
                    stagger: 0.15,
                    duration: 0.8,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 65%',
                        toggleActions: 'play none none reverse',
                    }
                }
            );
        }
    });

    // Final section animation
    const finalContent = document.querySelector('.final-content');
    if (finalContent) {
        gsap.fromTo(finalContent.children,
            { opacity: 0, y: 40 },
            {
                opacity: 1, y: 0,
                stagger: 0.2,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.final-section',
                    start: 'top 70%',
                    toggleActions: 'play none none reverse',
                }
            }
        );
    }
}

// ==========================================
// FLOATING HEARTS IN FINAL SECTION
// ==========================================
function spawnFinalHearts() {
    const container = document.getElementById('floating-final');
    if (!container) return;

    const heartEmojis = ['❤️', '💕', '💖', '💗', '💝', '✨', '💫'];

    function createHeart() {
        const heart = document.createElement('span');
        heart.className = 'floating-heart';
        heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
        heart.style.animationDuration = (Math.random() * 4 + 4) + 's';
        heart.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(heart);

        setTimeout(() => {
            heart.remove();
        }, 10000);
    }

    // Spawn hearts periodically
    setInterval(createHeart, 800);
    // Initial batch
    for (let i = 0; i < 8; i++) {
        setTimeout(createHeart, i * 300);
    }
}

// ==========================================
// LIGHTBOX FOR GALLERY
// ==========================================
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.id = 'gallery-lightbox';
    lightbox.className = 'lightbox hidden';
    
    const lightboxImg = document.createElement('img');
    lightboxImg.className = 'lightbox-img';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '×';
    
    lightbox.appendChild(lightboxImg);
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox);
    
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightboxImg.src = item.src;
            lightbox.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Disable scroll
            
            // GSAP fade in
            gsap.fromTo(lightbox, { opacity: 0 }, { opacity: 1, duration: 0.3 });
            gsap.fromTo(lightboxImg, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out(1.7)' });
        });
    });
    
    const closeLightbox = () => {
        gsap.to(lightbox, { 
            opacity: 0, 
            duration: 0.3, 
            onComplete: () => {
                lightbox.classList.add('hidden');
                document.body.style.overflow = ''; // Re-enable scroll
            }
        });
    };
    
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initPasswordParticles();
    initPasswordInputs();
});

// ==========================================
// A VERY SPECIAL MESSAGE — PROPOSAL INTERACTION
// ==========================================
function handleProposalClick(choice) {
    const cardA = document.getElementById('opt-a-card');
    const cardB = document.getElementById('opt-b-card');
    const feedbackBox = document.getElementById('proposal-modal-reveal');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackMsg = document.getElementById('feedback-message');

    if (!feedbackBox || !cardA || !cardB) return;

    if (choice === 'A') {
        cardA.classList.add('selected');
        cardB.classList.remove('selected');

        feedbackIcon.textContent = '💖';
        feedbackMsg.innerHTML = `
            <span style="color: #ff6b9d; font-weight: 600; font-size: 1.4rem;">You chose Option A ❤️</span><br>
            Mera wada raha, I will always try my level best to keep you smiling and happy! Har dard aur khushi mein tera saath nibhaunga.<br>
            <span style="font-family: var(--font-script); color: #ffd700; font-size: 1.5rem; display: inline-block; margin-top: 0.8rem;">Forever with you ✨</span>
        `;
        feedbackBox.classList.remove('hidden');

        // Confetti / floating hearts celebration
        burstCelebrationHearts();
    } else if (choice === 'B') {
        cardB.classList.add('selected');
        cardA.classList.remove('selected');

        feedbackIcon.textContent = '🤍';
        feedbackMsg.innerHTML = `
            <span style="color: #f0e6ff; font-weight: 600; font-size: 1.4rem;">You chose Option B 🕊️</span><br>
            I will always respect your decision with all my heart. Agle janam tak intezaar rahega... Tu hamesha khush rahe aur smile karti rahe, bas yahi dua hai.<br>
            <span style="font-family: var(--font-script); color: #f8a5c2; font-size: 1.4rem; display: inline-block; margin-top: 0.8rem;">Teri khushi hi meri khushi hai... ✨</span>
        `;
        feedbackBox.classList.remove('hidden');
    }

    // Smooth scroll to feedback
    feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function burstCelebrationHearts() {
    const container = document.getElementById('floating-final') || document.body;
    const emojis = ['💖', '❤️', '💕', '✨', '🌸', '💫'];
    for (let i = 0; i < 20; i++) {
        const span = document.createElement('span');
        span.className = 'floating-heart';
        span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        span.style.left = (15 + Math.random() * 70) + '%';
        span.style.bottom = '15%';
        span.style.fontSize = (Math.random() * 1.5 + 1.2) + 'rem';
        span.style.animationDuration = (Math.random() * 3 + 3) + 's';
        span.style.zIndex = '999';
        container.appendChild(span);
        setTimeout(() => span.remove(), 5000);
    }
}

// ==========================================
// SONG PLAYBACK & LIVE SYNTHESIZER
// ==========================================
let audioContext = null;
let isSongPlaying = false;
let synthTimeouts = [];

function toggleSongPlayback() {
    const audio = document.getElementById('bg-song-audio');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const musicBars = document.getElementById('music-bars');

    if (isSongPlaying) {
        stopSongPlayback();
        return;
    }

    // Try playing real audio element if file exists
    if (audio) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isSongPlaying = true;
                if (playIcon) playIcon.textContent = '⏸';
                if (playText) playText.textContent = 'Pause karo';
                if (musicBars) musicBars.classList.add('playing');

                audio.onended = () => stopSongPlayback();
                return;
            }).catch(() => {
                // Audio file not found or browser blocked, fallback to soft synth melody!
                playSynthesizedMelody();
            });
            return;
        }
    }

    playSynthesizedMelody();
}

function stopSongPlayback() {
    isSongPlaying = false;
    const audio = document.getElementById('bg-song-audio');
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const musicBars = document.getElementById('music-bars');

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    // Clear synth timers
    synthTimeouts.forEach(t => clearTimeout(t));
    synthTimeouts = [];

    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
        audioContext = null;
    }

    if (playIcon) playIcon.textContent = '▶';
    if (playText) playText.textContent = 'Suno yeh dhun 🎧';
    if (musicBars) musicBars.classList.remove('playing');
}

function playSynthesizedMelody() {
    isSongPlaying = true;
    const playIcon = document.getElementById('play-icon');
    const playText = document.getElementById('play-text');
    const musicBars = document.getElementById('music-bars');

    if (playIcon) playIcon.textContent = '⏸';
    if (playText) playText.textContent = 'Pause karo';
    if (musicBars) musicBars.classList.add('playing');

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
    } catch (e) {
        console.error('AudioContext not supported');
        return;
    }

    // Poetic, heartfelt melody notes inspired by "Unko bhi humse mohabbat ho zaroori toh nahi"
    const melody = [
        { f: 293.66, d: 600 }, // D4 - Un-
        { f: 329.63, d: 500 }, // E4 - ko
        { f: 349.23, d: 800 }, // F4 - bhi
        { f: 392.00, d: 700 }, // G4 - hum-
        { f: 349.23, d: 600 }, // F4 - se
        { f: 329.63, d: 900 }, // E4 - mo-ha-bbat
        { f: 293.66, d: 1100 }, // D4 - ho...
        { f: 0, d: 400 },      // rest
        { f: 349.23, d: 600 }, // F4 - Za-
        { f: 392.00, d: 600 }, // G4 - roo-
        { f: 440.00, d: 700 }, // A4 - ri
        { f: 392.00, d: 600 }, // G4 - toh
        { f: 349.23, d: 600 }, // F4 - na-
        { f: 329.63, d: 700 }, // E4 - hii...
        { f: 293.66, d: 1400 }, // D4 - ~
        { f: 0, d: 600 },      // rest
        { f: 440.00, d: 700 }, // A4 - Ek
        { f: 466.16, d: 600 }, // Bb4 - si
        { f: 523.25, d: 800 }, // C5 - do-
        { f: 466.16, d: 600 }, // Bb4 - no
        { f: 440.00, d: 700 }, // A4 - ki
        { f: 392.00, d: 900 }, // G4 - haa-lat
        { f: 349.23, d: 1100 }, // F4 - ho...
        { f: 0, d: 400 },      // rest
        { f: 329.63, d: 600 }, // E4 - Za-
        { f: 349.23, d: 600 }, // F4 - roo-
        { f: 392.00, d: 700 }, // G4 - ri
        { f: 349.23, d: 600 }, // F4 - toh
        { f: 329.63, d: 700 }, // E4 - na-
        { f: 293.66, d: 1800 }  // D4 - hii...
    ];

    let timeOffset = 0;

    function scheduleTone(freq, dur, startTime) {
        const tid = setTimeout(() => {
            if (!isSongPlaying || !audioContext || audioContext.state === 'closed') return;
            if (freq === 0) return;

            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            // Warm electric piano / music box timbre (triangle wave)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);

            // Gentle soft attack and release envelope
            gain.gain.setValueAtTime(0.001, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + (dur / 1000) * 0.95);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start();
            osc.stop(audioContext.currentTime + (dur / 1000));
        }, startTime);

        synthTimeouts.push(tid);
    }

    melody.forEach(note => {
        scheduleTone(note.f, note.d, timeOffset);
        timeOffset += note.d;
    });

    // Loop after complete melody
    const loopTid = setTimeout(() => {
        if (isSongPlaying) {
            playSynthesizedMelody();
        }
    }, timeOffset + 1000);
    synthTimeouts.push(loopTid);
}
