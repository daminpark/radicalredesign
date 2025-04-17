document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle ---
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIconBars = document.getElementById('menu-icon-bars');
    const menuIconClose = document.getElementById('menu-icon-close');

    if (menuButton && mobileMenu && menuIconBars && menuIconClose) {
        menuButton.addEventListener('click', () => {
            const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
            mobileMenu.classList.toggle('hidden');
            menuIconBars.classList.toggle('hidden');
            menuIconClose.classList.toggle('hidden');
            menuButton.setAttribute('aria-expanded', !isExpanded);
        });

        // Close mobile menu when a link is clicked
        mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuIconBars.classList.remove('hidden');
                menuIconClose.classList.add('hidden');
                menuButton.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- Modal Functionality ---
    const modalTriggers = document.querySelectorAll('.modal-trigger');
    const modals = document.querySelectorAll('.modal');
    const modalCloses = document.querySelectorAll('.modal-close');
    const imageLightboxTriggers = document.querySelectorAll('.gallery-image[data-modal-target="image-modal"]');
    const imageModal = document.getElementById('image-modal');
    const lightboxImage = document.getElementById('lightbox-image');

    const openModal = (modal) => {
        if (modal) {
            modal.classList.remove('hidden');
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            // Focus trapping could be added here for better accessibility
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length) {
                 focusableElements[0].focus();
            }
        }
    }

    const closeModal = (modal) => {
         if (modal) {
            modal.classList.add('hidden');
            // Re-enable background scrolling
            document.body.style.overflow = '';
        }
    }

    // Standard modal triggers
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            // Prevent default if it's for image lightbox
            if (!trigger.hasAttribute('data-image-src')) {
                 e.preventDefault();
            }
            const targetModalId = trigger.getAttribute('data-modal-target');
            const targetModal = document.getElementById(targetModalId);
             // Don't open image modal via generic triggers
             if(targetModal && targetModalId !== 'image-modal') {
                openModal(targetModal);
             }
        });
    });

    // Image lightbox triggers
    imageLightboxTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const imgSrc = trigger.dataset.imageSrc;
            if (imgSrc && imageModal && lightboxImage) {
                lightboxImage.src = imgSrc;
                openModal(imageModal);
            }
        });
    });

    // Close buttons
    modalCloses.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeModal(closeBtn.closest('.modal'));
        });
    });

    // Close modal clicking background overlay
    modals.forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });

     // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const openModalElement = document.querySelector('.modal:not(.hidden)');
            if(openModalElement) {
                closeModal(openModalElement);
            }
        }
    });


    // --- Language Switching ---
    const langButtons = document.querySelectorAll('.lang-button');
    const htmlElement = document.documentElement;

    function setLanguage(lang) {
        // Validate lang input
        const validLangs = ['en', 'ko'];
        if (!validLangs.includes(lang)) {
            console.error('Invalid language code:', lang);
            lang = 'en'; // Default to English on error
        }

        const targetLangCode = lang === 'ko' ? 'ko-KR' : 'en-GB';
        htmlElement.lang = targetLangCode; // Update HTML lang attribute

        // Batch DOM reads/writes for potential performance
        const elementsToToggle = document.querySelectorAll('.lang-en, .lang-ko');
        elementsToToggle.forEach(el => {
            if (el.classList.contains(`lang-${lang}`)) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

         // Update active state of buttons
         langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
                 btn.setAttribute('aria-pressed', 'true'); // Accessibility: Indicate active state
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });

        // Store preference safely
        try {
            localStorage.setItem('preferredLang', lang);
        } catch (e) {
            console.warn("Could not save language preference to localStorage:", e);
        }
    }

    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedLang = button.getAttribute('data-lang');
            setLanguage(selectedLang);
            // Close mobile menu if open after lang change
             if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                 mobileMenu.classList.add('hidden');
                 menuIconBars.classList.remove('hidden');
                 menuIconClose.classList.add('hidden');
                 menuButton.setAttribute('aria-expanded', 'false');
             }
        });
    });

    // Initial Language Setup
    let preferredLang = 'en'; // Default language
    try {
        const storedLang = localStorage.getItem('preferredLang');
        if (storedLang && (storedLang === 'en' || storedLang === 'ko')) {
            preferredLang = storedLang;
        } else {
            const browserLang = navigator.language || navigator.userLanguage;
             if (browserLang && browserLang.toLowerCase().startsWith('ko')) {
                preferredLang = 'ko';
             }
        }
    } catch (e) {
         console.warn("Could not read language preference from localStorage:", e);
    }
    setLanguage(preferredLang); // Set initial language on page load


    // --- Copyright Year ---
    const copyrightYearElement = document.getElementById('copyright-year');
    if (copyrightYearElement) {
        copyrightYearElement.textContent = new Date().getFullYear();
    }


    // --- Back to Top Button ---
    const backToTopButton = document.getElementById('back-to-top');

    if(backToTopButton) {
        const scrollThreshold = 300; // Pixels from top to show button

        const toggleBackToTopVisibility = () => {
            if (window.scrollY > scrollThreshold) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', toggleBackToTopVisibility);

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

         // Initial check in case page loads already scrolled down
         toggleBackToTopVisibility();
    }

     // --- Animation on Scroll Placeholder (Requires external library like AOS or custom IntersectionObserver) ---
     // Example using Intersection Observer (Simple Fade In)
    const animatedElements = document.querySelectorAll('.animate-fade-in, .animate-fade-in-slow, .animate-slide-in-left, .animate-slide-in-right');
     const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
             if (entry.isIntersecting) {
                 entry.target.classList.add('is-visible'); // Add a class to trigger animation
                observer.unobserve(entry.target); // Stop observing once visible
             }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of element is visible

    // Add temporary CSS for the animation states (or define in Tailwind JIT)
    const style = document.createElement('style');
     style.textContent = `
         .animate-fade-in, .animate-fade-in-slow, .animate-slide-in-left, .animate-slide-in-right { opacity: 0; transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
         .animate-slide-in-left { transform: translateX(-30px); }
         .animate-slide-in-right { transform: translateX(30px); }
         .animate-fade-in-slow { transition-duration: 1s; } /* Slower fade */

         .is-visible { opacity: 1; transform: translateX(0); }
    `;
     document.head.appendChild(style);

     animatedElements.forEach(el => {
         observer.observe(el);
         // Add base animation classes to elements dynamically (can also be done in HTML)
         if (!el.classList.contains('animate-fade-in-slow') && !el.classList.contains('animate-slide-in-left') && !el.classList.contains('animate-slide-in-right') ){
             el.classList.add('animate-fade-in');
         }
     });

    // --- Fill Modal Placeholders (Important: Copy content from old modals) ---
    // This function simplifies adding content, assuming consistent structure
    function fillModalContent(modalId, titleEn, titleKo, contentHtmlEn, contentHtmlKo) {
         const modal = document.getElementById(modalId);
         if (modal) {
            const titleElement = modal.querySelector('.modal-content h3'); // Adjust selector if needed
            const contentElement = modal.querySelector('.modal-content .prose'); // Adjust selector if needed
             if (titleElement && contentElement) {
                titleElement.innerHTML = `<span class="lang-en">${titleEn}</span><span class="lang-ko hidden">${titleKo}</span>`;
                contentElement.innerHTML = `<div class="lang-en">${contentHtmlEn}</div><div class="lang-ko hidden">${contentHtmlKo}</div>`;
             } else {
                 console.warn(`Could not find title or content elements in modal: ${modalId}`);
             }
         } else {
             console.warn(`Could not find modal: ${modalId}`);
         }
    }

     // *** Replace with ACTUAL modal content from previous code generation ***
    // Example structure (You need to copy the full HTML content for EN and KO)
     fillModalContent(
         'oral-exams-modal',
         'Comprehensive Oral Exams', // English Title
         '종합 구강 검진', // Korean Title
         `<!-- PASTE ENGLISH HTML for Oral Exams modal content HERE -->
         <p>The American Dental Association (ADA) recommends...</p>...`, // English Content HTML
         `<!-- PASTE KOREAN HTML for Oral Exams modal content HERE -->
          <p>미국 치과 협회 (ADA)는 신규 치과 환자가...</p>...` // Korean Content HTML
     );
     fillModalContent(
         'implants-modal',
         'Dental Implants',
         '임플란트',
         `<!-- PASTE ENGLISH HTML for Implants modal content HERE -->`,
         `<!-- PASTE KOREAN HTML for Implants modal content HERE -->`
     );
     fillModalContent(
        'hygiene-modal',
        'Dental Hygiene & Gum Care',
         '스케일링 & 잇몸 관리',
         `<!-- PASTE ENGLISH HTML for Hygiene modal content HERE -->`,
        `<!-- PASTE KOREAN HTML for Hygiene modal content HERE -->`
     );
    fillModalContent(
         'extractions-modal',
         'Tooth Extractions & Oral Surgery',
         '발치 & 구강 소수술',
        `<!-- PASTE ENGLISH HTML for Extractions modal content HERE -->`,
         `<!-- PASTE KOREAN HTML for Extractions modal content HERE -->`
     );
    fillModalContent(
        'cosmetic-modal',
         'Cosmetic Dentistry & Whitening',
        '심미 치과 & 치아 미백',
        `<!-- PASTE ENGLISH HTML for Cosmetic modal content HERE -->`,
        `<!-- PASTE KOREAN HTML for Cosmetic modal content HERE -->`
    );
    fillModalContent(
        'restorative-modal',
         'Restorative Dentistry',
        '보존/신경 치료',
         `<!-- PASTE ENGLISH HTML for Restorative modal content HERE -->`,
        `<!-- PASTE KOREAN HTML for Restorative modal content HERE -->`
     );
    fillModalContent(
         'prosthodontics-modal',
        'Prosthodontics (Crowns, Bridges, Dentures)',
        '보철 치료 (크라운, 브릿지, 틀니)',
        `<!-- PASTE ENGLISH HTML for Prosthodontics modal content HERE -->`,
         `<!-- PASTE KOREAN HTML for Prosthodontics modal content HERE -->`
    );
    fillModalContent(
         'equipment-modal',
        'Advanced Dental Technology',
         '첨단 치과 기술',
        `<!-- PASTE ENGLISH HTML for Equipment modal content HERE -->`,
        `<!-- PASTE KOREAN HTML for Equipment modal content HERE -->`
     );
    fillModalContent(
        'first-appointment-modal',
         'Your First Visit', // Simplified Title
         '초진시 진료 안내',
        `<!-- PASTE ENGLISH HTML for First Appointment modal content HERE -->`,
        `<!-- PASTE KOREAN HTML for First Appointment modal content HERE -->`
     );


    // Re-run setLanguage after filling modals to ensure correct visibility
    setLanguage(preferredLang);

}); // End DOMContentLoaded