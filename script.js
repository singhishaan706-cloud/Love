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
        const children = card?.querySelectorAll('.chapter-text, .chapter-quote, .confession-highlight, .timestamp-reveal, .time-visual');
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
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initPasswordParticles();
    initPasswordInputs();
});
