// --- START OF FILE script.js ---

"use strict"; // Enable strict mode

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const config = {
        lang: 'en', // Default language
        scrollThreshold: 300, // Pixels from top to show back-to-top button
        animationObserverThreshold: 0.1, // Percentage of element visible to trigger animation
    };

    // --- Elements Cache ---
    const elements = {
        html: document.documentElement,
        body: document.body,
        header: document.getElementById('main-header'),
        menuButton: document.getElementById('mobile-menu-button'),
        mobileMenu: document.getElementById('mobile-menu'),
        menuIconBars: document.getElementById('menu-icon-bars'),
        menuIconClose: document.getElementById('menu-icon-close'),
        langButtons: document.querySelectorAll('.lang-button'),
        modals: document.querySelectorAll('.modal'),
        modalTriggers: document.querySelectorAll('.modal-trigger'),
        modalCloses: document.querySelectorAll('.modal-close'),
        copyrightYear: document.getElementById('copyright-year'),
        backToTopButton: document.getElementById('back-to-top'),
        animatedElements: document.querySelectorAll('.animate-on-scroll'), // Ensure elements have this class in HTML
        // *FIX: Target the images inside gallery items now*
        galleryItems: document.querySelectorAll('.gallery-item img'),
        imageModal: document.getElementById('image-modal'),
        lightboxImage: document.getElementById('lightbox-image'),
        modalsContainer: document.getElementById('modals-container'), // Assuming modals are inside this
    };

    // --- State ---
    let currentLang = config.lang; // Initialize with default

    // --- Initialization ---
    function init() {
        console.log('App Initializing...');
        initMobileMenu();
        initModals(); // Init modals structure first
        injectModalContent(); // Populate content
        initLanguage(); // Setup language switching & set initial lang (which reruns display logic)
        initCopyright();
        initBackToTop();
        initScrollAnimations();
        initAccordions(); // Init FAQ accordions if using <details>
        console.log('App Initialized.');
    }

    // --- Feature Initializers ---

    function initMobileMenu() {
        const { menuButton, mobileMenu, menuIconBars, menuIconClose, body } = elements;
        if (!menuButton || !mobileMenu || !menuIconBars || !menuIconClose) return;

        menuButton.addEventListener('click', () => {
            const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
            mobileMenu.classList.toggle('hidden');
            menuIconBars.classList.toggle('hidden');
            menuIconClose.classList.toggle('hidden');
            menuButton.setAttribute('aria-expanded', !isExpanded);
            body.style.overflow = isExpanded ? '' : 'hidden'; // Toggle body scroll lock
        });

        mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                menuIconBars.classList.remove('hidden');
                menuIconClose.classList.add('hidden');
                menuButton.setAttribute('aria-expanded', 'false');
                body.style.overflow = ''; // Ensure scroll is re-enabled
            });
        });
    }

    function initModals() {
        const { modalTriggers, modals, modalCloses, galleryItems, imageModal, body } = elements;

        const openModal = (modal) => {
            if (modal) {
                modal.classList.remove('hidden');
                body.style.overflow = 'hidden';
                setTimeout(() => modal.classList.add('opacity-100'), 10);

                const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable.length) {
                     modal.userData = { lastFocus: document.activeElement }; // Store before changing focus
                     focusable[0].focus();
                 } else {
                     modal.userData = { lastFocus: document.activeElement }; // Store even if nothing focusable inside
                     modal.focus(); // Focus the modal itself as a fallback
                 }
            }
        }

        const closeModal = (modal) => {
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.remove('opacity-100');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    // Only unlock scroll if no *other* modals are open
                    const anyOpenModals = document.querySelector('.modal:not(.hidden)');
                     if (!anyOpenModals) {
                        body.style.overflow = '';
                    }
                     // Return focus
                     if (modal.userData && modal.userData.lastFocus && typeof modal.userData.lastFocus.focus === 'function') {
                        modal.userData.lastFocus.focus();
                    }
                 }, 300);
             }
         }

        // Standard triggers (now ignores gallery items automatically due to selector change)
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const targetModalId = trigger.getAttribute('data-modal-target');
                const targetModal = document.getElementById(targetModalId);
                if(targetModal) openModal(targetModal);
            });
        });

         // *FIX: Gallery item triggers now target the IMG elements*
         galleryItems.forEach(item => {
             item.addEventListener('click', (e) => {
                 e.preventDefault();
                 // *FIX: Get src from clicked img or data-image-src*
                 const imgSrc = item.dataset.imageSrc || item.src;
                 if (imgSrc && imageModal && elements.lightboxImage) {
                     elements.lightboxImage.src = imgSrc;
                     openModal(imageModal);
                 } else {
                     console.warn("Could not open image modal for:", item);
                 }
             });
         });


        // Close buttons
        modalCloses.forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
        });

        // Background click
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModalElement = document.querySelector('.modal:not(.hidden)');
                if (openModalElement) closeModal(openModalElement);
            }
        });
    }

    function initLanguage() {
        const { langButtons, html } = elements;

        // Make setLanguage accessible globally within the script if needed elsewhere
        window.setLanguage = (lang) => {
            const validLangs = ['en', 'ko'];
            if (!validLangs.includes(lang)) lang = 'en';
            currentLang = lang; // Update global state
            const targetLangCode = lang === 'ko' ? 'ko-KR' : 'en-GB';
            html.lang = targetLangCode;

            // *** FIX: Use inline style for display, ignore Tailwind 'hidden' class ***
            document.querySelectorAll('.lang-en, .lang-ko').forEach(el => {
                // Check if the element should be visible for the current language
                const shouldBeVisible = el.classList.contains(`lang-${lang}`);
                // Set display style directly
                el.style.display = shouldBeVisible ? '' : 'none';
            });
            // *** END FIX ***

            langButtons.forEach(btn => {
                const isActive = btn.getAttribute('data-lang') === lang;
                btn.classList.toggle('active', isActive); // 'active' class controls styling (bold/underline)
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
            try { localStorage.setItem('preferredLang', lang); } catch (e) { console.warn("LocalStorage error:", e);}
        };

        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedLang = button.getAttribute('data-lang');
                window.setLanguage(selectedLang);
                // Close mobile menu if applicable
                 if (elements.mobileMenu && !elements.mobileMenu.classList.contains('hidden')) {
                     elements.menuButton.click();
                 }
             });
        });

         // Set initial language
         let initialLang = 'en';
         try {
             const storedLang = localStorage.getItem('preferredLang');
             if (storedLang && ['en', 'ko'].includes(storedLang)) {
                 initialLang = storedLang;
             } else {
                 const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
                 if (browserLang.startsWith('ko')) initialLang = 'ko';
             }
         } catch (e) {}
         window.setLanguage(initialLang); // Call the global function to set initial state AFTER content is injected
    }

    function initCopyright() {
        const { copyrightYear } = elements;
        if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();
    }

    function initBackToTop() {
        const { backToTopButton } = elements;
         if (!backToTopButton) return;

        const toggleVisibility = () => {
            backToTopButton.classList.toggle('visible', window.scrollY > config.scrollThreshold);
        };

         window.addEventListener('scroll', toggleVisibility, { passive: true });
        backToTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        toggleVisibility(); // Initial check
    }

    function initScrollAnimations() {
        const { animatedElements } = elements;
         if (!animatedElements || !('IntersectionObserver' in window)) return;

         const observer = new IntersectionObserver((entries) => {
             entries.forEach(entry => {
                 if (entry.isIntersecting) {
                     entry.target.classList.add('is-visible');
                     observer.unobserve(entry.target);
                 }
             });
         }, { threshold: config.animationObserverThreshold });

        animatedElements.forEach(el => observer.observe(el));
    }

    function initAccordions() {
        // Native <details> handles this, no JS needed unless custom animation is desired
    }


    // --- Content Injection ---
     function fillModalContent(modalId, titleEn, titleKo, contentHtmlEn, contentHtmlKo) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Use more specific selectors if needed, e.g., data attributes or more specific IDs
            const titleElement = modal.querySelector('.modal-content h3');
            const contentElement = modal.querySelector('.modal-content .prose');
            if (titleElement && contentElement) {
                // Inject titles - *FIX: Do not add 'hidden' class here*
                titleElement.innerHTML = `<span class="lang-en">${titleEn}</span><span class="lang-ko">${titleKo}</span>`;
                 // Inject content wrapped in language divs - *FIX: Do not add 'hidden' class here*
                 contentElement.innerHTML = `<div class="lang-en">${contentHtmlEn}</div><div class="lang-ko">${contentHtmlKo}</div>`;
                 // IMPORTANT: setLanguage (called via initLanguage) runs AFTER this and will set the correct initial display style
             } else {
                 console.warn(`Could not find title or content elements in modal: ${modalId}`);
             }
         } else {
             console.warn(`Could not find modal: ${modalId}`);
         }
    }

    function injectModalContent() {
        console.log('Injecting modal content...');

        // --- ABOUT MODAL (#pum-1158) ---
        fillModalContent(
            'about-modal',
            'About Fiona Park',
            '원장 박 지연',
            // ... (rest of the content is unchanged) ...
            `
             <p><strong>Experience</strong></p>
             <p><strong>– 2000</strong><br>Gagyeong Elementary and Middle School, Cheongju</p>
             <p><strong>2001 – 2003</strong><br>Roedean School, Brighton, UK</p>
             <p><strong>2003 – 2005</strong><br>Surbiton High School, Kingston upon Thames, UK</p>
             <p><strong>2005 – 2010</strong><br>Queen Mary University of London, Barts and the London School of Medicine and Dentistry, London : Bachelor of Dental Surgery (BDS)</p>
             <p><strong>2010 –</strong><br>British Dental Association (BDA)</p>
             <p><strong>2011 – 2012</strong><br>Norwood Dental Surgery, London : General Dental Practitioner</p>
             <p><strong>2012 – 2013</strong><br>Royal Surrey County Hospital NHS Foundation Trust, Oral and Maxillofacial Surgery (OMFS) Department, Senior House Officer, Guildford, United Kingdom</p>
             <p><strong>2013 –</strong><br>Master of Dental Surgery (MSD) School of Dentistry, Seoul National University: Dental Anesthesia</p>
             <p>Doctoral Course in School of Dentistry, Seoul National University: Preventive Dentistry</p>
             <p><strong>2018 –</strong><br>Grin Dental Clinic, Cheongju<br>God’s Purpose Dental Clinic, Seoul<br>London Dental Clinic, Seoul</p>
             <p>Korean Dental Association (KDA)<br>Korean Women Dental Association<br>Korean Academy of Advanced General Dentistry<br>Korean Dental Society of anesthesiology<br>Korean Academy of Preventative Dentistry and Oral Health<br>The Korean Academy of Implant Dentistry</p>
             <p><strong>2015 –</strong><br>Korean Britain Society (KBS)</p>
             <p class="mt-6 text-xs text-gray-500">To schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
             <p><strong>약력</strong></p>
             <p><strong>– 2000</strong><br>가경 초등학교 중학교, 청주</p>
             <p><strong>2001 – 2003</strong><br>로딘 중학교, 브라이튼, 영국</p>
             <p><strong>2003 – 2005</strong><br>서비튼 고등학교, 킹스턴 어픈 테임즈, 영국</p>
             <p><strong>2005 – 2010</strong><br>런던 퀸메리 대학교, 바츠 앤드 런던 의학치의학부, 런던 : 치의학 학사</p>
             <p><strong>2010 –</strong><br>영국 치과의사 협회 (BDA)</p>
             <p><strong>2011 – 2012</strong><br>노우드 치과의원, 런던 : 치과 일반의</p>
             <p><strong>2012 – 2013</strong><br>왕립 서리병원 구강악안면외과, 길포드, 영국 : 상급 인턴</p>
             <p><strong>2013 –</strong><br>치의학 석사, 서울대학교 치의학대학원 : 치과마취과학</p>
             <p>치의학 박사 과정, 서울대학교 치의학대학원 : 예방치과학</p>
             <p><strong>2018 –</strong><br>그린치과, 청주<br>목적이 이끄는 치과, 서울<br>런던치과, 서울</p>
             <p>대한치과의사협회 (KDA)<br>대한여자치과의사회<br>대한통합치과학회<br>대한치과마취과학회<br>대한예방치과구강보건학회<br>대한치과이식임플란트학회</p>
             <p><strong>2015 –</strong><br>한영협회 (KBS)</p>
             <p class="mt-6 text-xs text-gray-500">예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- EQUIPMENT MODAL (#pum-1178) ---
        fillModalContent(
             'equipment-modal',
             'Our Equipment',
             '장비',
             // ... (rest of the content is unchanged) ...
            `
            <h4>Digital CT X-ray (Vatech)</h4>
            <p>The dental profession has improved dramatically over the past 60+ years. Today, dental x-rays are far safer and much more convenient.</p>
            <p>The traditional dental X-ray emits a much lower amount of radiation than those in the past and, as a result, they are exceptionally safe.</p>
            <p>Using digital radiography is a technologically advanced alternative with the following benefits:</p>
            <ul>
                <li>Ability to transfer oral records by email</li>
                <li>Absolutely no chemicals involved</li>
                <li>Environmentally friendly</li>
                <li>Shorter dental appointments</li>
                <li>Greater quality imagery</li>
            </ul>
            <p>Find out more from <a href="http://www.vatech.com/" target="_blank" rel="noopener noreferrer">Vatech</a></p>

            <h4>Microscope Dentistry (Zeiss)</h4>
            <p>Dental microscopes provide a range of magnification from 2.6-16x with the average microscope dentist operating at an 8x magnification (compared to 2.5-4.5x magnification for most loupe users). This enhanced magnification can improve accuracy of tooth preparations and margins, allow for more conservative treatment, and can be kinder and gentler to adjacent teeth/restorations as well as the supporting soft tissues. Ultimately, higher magnification provides enhanced visibility in all aspects of dentistry from diagnosing to prepping, seating and finishing restorations.</p>
            <p>Find out more from <a href="https://www.zeiss.com/meditec/us/products/dentistry.html" target="_blank" rel="noopener noreferrer">Zeiss</a></p>
            <p class="mt-6 text-xs text-gray-500">To learn more or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <h4>디지털 CT 엑스-레이 (Vatech)</h4>
            <p>치과 시술법은 지난 60년 이상 동안 극적으로 발전되었습니다. 오늘날 치과용 엑스-레이는 훨씬 더 안전하고 편리합니다.</p>
            <p>본 치과 엑스-레이기는 과거보다 훨씬 적은 양의 방사선을 방출하므로 결과적으로 매우 안전합니다.</p>
            <p>디지털 방사선 촬영은 다음과 같은 이점이 있는 기술적으로 진보된 장비입니다:</p>
            <ul>
                <li>이메일로 구강내 기록을 전송하는 기능</li>
                <li>화학 물질에 전혀 영향받지 않음</li>
                <li>환경 친화적 기기</li>
                <li>시술 시간 단축</li>
                <li>고품질 해상력</li>
            </ul>
            <p>더 알고 싶으시면 <a href="http://www.vatech.co.kr/" target="_blank" rel="noopener noreferrer">Vatech</a></p>

            <h4>현미경 시술 (Zeiss)</h4>
            <p>치과용 현미경으로 우리는 시술시 8배 확대 (대부분의 루페 사용자의 경우는 2.5-4.5배 배율)를 사용하며 총 2.6-16배 범위의 배율을 제공합니다. 이 향상된 배율은 치아 삭제 및 마진의 정확성을 개선하여 보다 보존적인 치료를 가능하게 하며 인접 치아 및 수복물과 지지하는 연조직에 더 사려깊고 조심스러운 진료를 보장합니다. 궁극적으로 더 높은 배율은 진단에서 수복물 준비, 장착 및 마무리에 이르기까지 치과 치료의 모든 면에서 향상된 시야를 제공합니다.</p>
            <p>더 알고 싶으시면 <a href="https://www.zeiss.co.kr/meditec/ko/products/dentistry.html" target="_blank" rel="noopener noreferrer">Zeiss</a></p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- FIRST APPOINTMENT MODAL (#pum-1367) ---
        fillModalContent(
             'first-appointment-modal',
             'What to Expect at Your First Appointment',
             '초진시 진료 안내',
             // ... (rest of the content is unchanged) ...
             `
            <h4>Dental Consultation, Exam and Cleaning</h4>
            <p>At London Dental, we begin your first visit with a comprehensive examination of your teeth and gums to create a treatment plan that suits your unique oral needs. Your exam will include digital x-rays to detect decay between the teeth. We use digital x-rays because they are safer than traditional film. A routine examination with four bitewing x-rays exposes you to roughly the same amount of radiation you experience during one to two hours on an airplane. Each exam includes a cleaning during which our dental hygienist uses both hand instruments and a PiezoLED ultrasonic power scaler to gently break up plaque and tartar that build up below the gum line. Simultaneously, irrigation is applied to flush out harmful bacteria and biofilm in the gum pockets, which ultimately promotes healing. This technology allows our dental hygienist to safely treat patients in a shorter amount of time.</p>
            <p>Regular exams and cleanings prevent the accumulation of plaque and calculus around the teeth and under the gums. Removal of these deposits, through scaling, along with digital x-ray exams can help prevent tooth decay, gingivitis, bone loss, halitosis (bad breath), and tooth loss.</p>
            <p>At the end of your consultation, our team will review your at-home care plan so that you can maintain the health of your teeth.</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <h4>상담, 검진 및 클리닝</h4>
            <p>런던치과에서는 귀하의 구강에 알맞는 치료 계획을 수립하기 위해 치아와 잇몸 및 구강 조직에 대한 포괄적인 검사를 첫 방문에 시작합니다. 치과의사의 초진에는 치아 사이의 충치를 감지하기 위한 디지털 엑스-레이가 포함될 수 있습니다. 우리는 전통적인 필름보다 훨씬 더 안전한 디지털 엑스레이를 사용합니다. 4개의 교합 엑스-레이로 일상적인 검사를 하면 한두 시간 동안 비행기 탈 때 받는 정도의 방사선에 노출될 뿐입니다. 각 검사에는 치과 위생사가 손 기구와 피에조 LED 초음파 파워 스케일러를 사용하여 잇몸 부위에 쌓인 플라그와 치석을 부드럽게 분해해 주는 클리닝이 포함될 수 있습니다. 동시에 관주를 통해 잇몸 주머니에 있는 해로운 박테리아와 균막을 씻어내어 궁극적으로 치유를 촉진시킵니다. 이 시술을 통해 본원의 치과 의료진은 보다 짧은 시간에 안전하게 환부를 돌볼 수 있습니다.</p>
            <p>정기적인 검사와 세척은 치아 주변과 잇몸 아래에 플라그와 치석이 축적되는 것을 방지합니다. 디지털 X- 레이 검사와 함께 스케일링을 통해 이러한 침전물을 제거하면 충치, 치은염, 골 손실, 구취 (입냄새) 및 치아 손상을 예방할 수 있습니다.</p>
            <p>상담이 끝나면 저희 팀은 귀하의 구강 건강을 유지할 수 있도록 재택 치료 계획을 검토할 것입니다.</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- ORAL EXAMS MODAL (#pum-1224) ---
        fillModalContent(
             'oral-exams-modal',
             'Comprehensive Oral Exams',
             '종합 구강 검진',
             // ... (rest of the content is unchanged) ...
            `
            <p>The American Dental Association (ADA) recommends that new dental patients have a thorough exam on their first visit to their new dentist. Existing patients are advised to undergo the exam every year. Undergoing a comprehensive oral exam will take a whole appointment.</p>
            <p>The ADA defines a ‘comprehensive exam’ as “an extensive evaluation and the recording of all extraoral, intraoral, and soft tissues.”</p>
            <p>The ADA defines a ‘periodic oral exam’ as “an exam that is done on existing patients to determine any changes in health and dental status since a previous comprehensive or periodic evaluation.”</p>
            <h4>What to Expect During the Oral Examination</h4>
            <p>During the oral examination, the dentist will conduct a manual and visual screening of the mouth and the lymph nodes. Examining the soft and hard palate and the lips’ inner and outer part are the next step. The dentist will then investigate under the mouth, and then the cheeks, and behind the molars. Preventative dental care is always the main focus of London Dental. During the oral exam, our dentist is also screening for cancer.</p>
            <h4>Why Is An Oral Cancer Screening Important?</h4>
            <p>We want you to maintain a healthy and happy smile for as long as possible. If you have a history of smoking and drinking, then it’s important to have a comprehensive dental examination (or oral exam) when you visit the dentist. For low-risk patients, then it is fine to have an exam every three years.</p>
            <p>Oral cancer exams (oral cancer screenings) are used as a tool to screen for cancer before a person has symptoms... (rest of paragraph)</p>
            <h4>The Connection Between Oral Health and Overall Health</h4>
            <p>Mouth cancer refers to cancer that develops in any part of the oral cavity, your mouth. The list includes:</p>
            <ul><li>Lips</li><li>Gums</li><li>Tongue</li><li>The inner lining of cheeks</li><li>Roof of the mouth</li><li>Floor of the mouth</li><li>Maxillofacial bone</li></ul>
            <p>A comprehensive oral examination helps protect oral health and your overall health.</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <p>미국 치과 협회 (ADA)는 신규 치과 환자가 치과를 처음 방문할 때 철저히 검사 받을 것을 권장합니다. 기존 환자는 매년 검사를 받는 것이 좋습니다. 포괄적인 구강 검사를 받으려면 사전 예약이 필요합니다.</p>
            <p>ADA는 "종합 검진"을 "모든 구강 내외 및 연조직의 광범위한 평가 및 기록"으로 정의합니다.</p>
            <p>ADA는 '정기 구강 검진'을 '기존 종합 또는 정기 평가 이후 건강 및 치과 상태의 변화를 확인하기 위해 기존 환자에게 실시하는 검사'로 정의합니다.</p>
            <h4>구강 검진에서 하는 사항</h4>
            <p>전반적 구강 검진 중에 치과 의사는 구강과 림프절을 촉각과 시각으로 검사합니다. 다음 단계는 부드럽고 단단한 입천장 부위와 입술의 안쪽과 바깥 쪽 부분을 검사합니다. 그런 다음 치과 의사는 입 아래, 뺨, 어금니 후방 부위를 조사합니다. 예방 치과 치료는 항상 본 런던치과의 중요 사항입니다. 구강 검진 중에 치과 의사가 구강 암 검진도 하게 됩니다.</p>
            <h4>구강암 검진의 중요성</h4>
            <p>우리는 귀하께서 가능한 한 오랜 동안 건강하고 행복한 미소를 유지하기를 원합니다. 흡연과 음주 경험이 있으시다면 치과에 방문할 때 종합적인 치과 검진(또는 구강 검진)를 받는 것이 더욱 중요합니다. 저위험군 환자들의 경우에도 3년마다 검사를 받는 것이 좋습니다.</p>
            <p>구강암 검진은 증상이 나타나기 전에 암을 검사하는 방법입니다... (나머지 문단)</p>
            <h4>구강 건강과 전반적인 건강의 연관성</h4>
            <p>구강암은 구강, 입의 어느 부분에서나 발병하는 암을 말합니다. 목록은 다음과 같습니다 :</p>
            <ul><li>입술</li><li>잇몸</li><li>혀</li><li>볼 점막</li><li>입천장</li><li>혀 밑</li><li>악안면부위 골</li></ul>
            <p>종합적인 구강 진단은 구강 건강 및 전반적인 건강을 보호하는 데 큰 도움이 됩니다.</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // ... Repeat fillModalContent for ALL other modals (Implants, Hygiene, Extractions, Cosmetic, Restorative, Prosthodontics, Privacy)
        // Ensure the KO content does not have 'hidden' added within the template literal strings in fillModalContent calls.

        // --- IMPLANTS MODAL (#pum-1212) ---
        fillModalContent(
            'implants-modal',
            'Dental Implants',
            '임플란트',
            `
            <p>A dental implant is an ideal tooth restoration for people who are missing one or more teeth as a result of injury, periodontal disease, or any other reason. A dental implant is a metal post that is surgically positions into the jaw. Once in place and bone surrounding the implant has had time to heal, a replacement tooth is attached to the post. While implants are typically more expensive than other methods of tooth replacement, they provide superior benefits. Implants are stronger than natural teeth and generally last 10-20 years. They are also a more favorable approach than bridgework since they do not depending on neighboring teeth for support.</p>
            <p>To receive implants, you need to have healthy gums and adequate bone to support the implant. You must also be committed to excellent oral hygiene and regular dental visits as these are critical to the long-term success of dental implants.</p>
            <p>Dental implants are the closest you can get to healthy, natural teeth. Think of dental implants as artificial tooth roots, similar in shape to screws. When they are placed in your jawbone, they bond with your natural bone and become a sturdy base for supporting one or more artificial teeth, called crowns.</p>
            <p class="font-semibold">At London Dental Clinic, if you are 65 or older and have health insurance, you are covered for up to two implants in your lifetime.</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <p>치과 임플란트는 부상, 치주 질환 또는 기타 이유로 하나 이상의 치아를 잃은 사람들에게 이상적인 치아 복원술입니다. 치과 임플란트는 턱에 외과적으로 삽입하는 금속 기둥입니다. 일단 수술 부위에 자리 잡고 임플란트를 둘러싼 뼈가 치유될 시간이 지나면, 인공 치아를 기둥에 올립니다. 임플란트는 일반적으로 다른 치아 교체 방법보다 비싸지만 탁월한 장점을 제공합니다. 임플란트는 자연치아보다 강하며 일반적으로 10-20년 동안 지속됩니다. 또한 지지를 위해 이웃 치아에 의존하지 않기 때문에 브리지보다 더 유리한 방식입니다.</p>
            <p>임플란트를 시술 받으려면 건강한 잇몸과 임플란트를 지탱할 수 있는 적절한 뼈가 필요합니다. 이는 치과 임플란트의 장기적인 성공에 매우 중요하기 때문에 구강 위생과 정기적인 치과 방문에도 열심히 하셔야 합니다.</p>
            <p>임플란트는 건강하고 자연스러운 치아에 가장 가까이 다가갈 수 있습니다. 치과 임플란트를 나사와 비슷한 인공 치아 뿌리라고 생각해 보십시오. 턱뼈에 시술하면 자연 뼈와 결합하여 크라운이라고 불리는 하나 이상의 인공 치아를 지탱하는 튼튼한 기반이 될 것입니다.</p>
            <p class="font-semibold">런던치과에서는 만 65세 이상이면서 건강보험을 가지고 있으면 평생 2개까지 임플란트 보험 혜택을 드릴 수 있습니다.</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- HYGIENE MODAL (#pum-1191) ---
        fillModalContent(
            'hygiene-modal',
            'Dental Hygiene Care & Perio Maintenance',
            '스케일링 & 잇몸 관리',
            `
            <h4>Dental Hygiene Care</h4>
            <p>Maintaining good dental hygiene is one of the most important things you can do for your teeth and gums. Healthy teeth not only enable you to look and feel good, they make it possible to eat and speak properly. Good oral health is important to your overall well-being. Daily preventive care, including proper brushing and flossing, will help stop problems before they develop.</p>
            <p>In between regular visits to the dentist, there are simple steps that each of us can take to greatly decrease the risk of developing tooth decay, gum disease and other dental problems. These include:</p>
            <ul><li>Brush thoroughly twice a day and floss daily</li><li>Eat a balanced diet and limit snacks between meals</li><li>Use dental products which contain fluoride, including toothpaste</li><li>Rinse with a fluoride mouth rinse if advised to do so</li><li>Make sure children under 12 drink fluoridated water or take a fluoride supplement if they live in an on-fluoridated area</li><li>Visit your dentist regularly for professional cleanings and oral exams</li><li>Replace your toothbrush every 3-4 months</li></ul>
            <h4>Perio Maintenance (Gum Care)</h4>
            <p>Rather than just addressing the visible part of your tooth, known as the crown, perio maintenance cares for your tooth roots, gums and bones. It is ongoing deep cleaning and maintenance for the tissues affected by periodontal disease. If your gums become inflamed or easily bleed during tooth brushing, perio maintenance may help improve your condition.</p>
            <p>We offer a range of treatments to stop or reverse gum disease. In the early stages, most treatment involves non-surgical procedures like scaling, root planing and specialized deep cleanings. In more advanced stages, surgical procedures like opening up the affected gum tissue to remove calculus build-up may be recommended.</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <h4>치과 위생관리</h4>
            <p>좋은 구강 위생을 유지하는 것은 치아와 잇몸을 위해 할 수 있는 가장 중요한 일 중 하나입니다. 건강한 치아는 여러분을 보기에도 좋고 기분 좋게 할 뿐만 아니라, 먹고 말할 수 있게 해줍니다. 구강 건강은 전반적인 행복에 중요합니다. 적절한 양치질과 치실을 포함한 매일 매일의 구강 관리는 문제가 발생하기 전에 예방하는 데 도움이 될 것입니다.</p>
            <p>치과를 정기적으로 방문하는 사이 사이에 충치, 잇몸 질환 및 기타 치과 질환의 위험을 크게 줄이기 위해 우리 각자가 취할 수 있는 간단한 조치가 있습니다. 여기에는 다음이 포함됩니다:</p>
            <ul><li>하루 두 번 이상 철저히 닦고 치실 사용하기</li><li>균형 잡힌 식사와 간식 줄이기</li><li>불소가 함유된 치과 제품과 치약 사용하기</li><li>불소 함유액으로 양치하기</li><li>12세 미만 어린이는 불화 상수도수를 마시거나 불소보충제를 복용하기</li><li>전문적인 스케일링과 구강 검진을 위해 정기적으로 치과 방문하기</li><li>3-4개월마다 칫솔을 교체하기</li></ul>
            <h4>잇몸 관리 (치주 관리)</h4>
            <p>치아의 보이는 부분 크라운뿐 아니라 치아 뿌리, 잇몸 및 뼈를 보존하는 것이 필요합니다. 치주 질환의 영향을 받는 조직에 대한 심층 세척과 관리를 진행합니다. 잇몸에 염증이 있거나 치솔질 중에 출혈이 쉽게 생기면 잇몸 치료가 상태를 개선하는 데 도움이 됩니다.</p>
            <p>우리는 잇몸 질환을 멈추거나 되돌릴 수 있는 다양한 치료법을 제공합니다. 초기 단계에서 대부분의 치료에는 스케일링, 치근 활택술 및 전문화된 심층 세척과 같은 비외과적 절차가 포함됩니다. 더 진행된 단계에서는 축적된 치석을 제거하기 위하여 염증이 있는 잇몸 조직을 절개하는 외과적 절차가 필요하기도 합니다.</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- EXTRACTIONS MODAL (#pum-1222) ---
        fillModalContent(
            'extractions-modal',
            'Tooth Extractions & Oral Surgery',
            '발치 & 구강 소수술',
            `
            <p>Good oral hygiene should always be practiced because the loss of a single tooth can have major impact upon your oral health and appearance. Although dentists will use every measure to prevent tooth loss, there are still occasions when a tooth may need to be extracted. A tooth may need to be extracted for the following reasons:</p>
            <ul><li>Severe decay</li><li>Advanced periodontal disease</li><li>Infection or abscess</li><li>Orthodontic correction</li><li>Malposition teeth</li><li>Fractured teeth or roots</li><li>Impacted teeth</li></ul>
            <p>After careful examination and treatment, the dentist may advise to have a tooth extracted. Before a tooth is removed, the dentist will take an x-ray in order to understand the shape and position of the tooth and surrounding bone. Based on the degree of difficulty, we may refer you to a specialized oral surgeon.</p>
            <p>For a simple extraction, we will first apply a local anesthetic to prevent pain and discomfort. The tooth will be loosened with a tool called an elevator and then removed with dental forceps. Once the procedure is complete, the area may be closed with one or two stitches. We will then provide you with care instructions to alleviate discomfort and ensure proper healing.</p>
            <h4>Minor Oral Surgeries</h4>
            <p>Minor oral surgery includes removal of retained or burried roots, broken teeth, wisdom teeth and cysts of the upper and lower jaw. It also includes apical surgery and removal of small soft tissue lesions like mucocele, ranula, high labial or lingual frenum etc in the mouth. These procedures are carried out under local anesthesia with or without iv sedation and have relatively short recovery period.</p>
            <h4>Wisdom Tooth Extractions</h4>
            <p>Wisdom teeth are the last molars or “third molars” that develop on each side of the jaws. Wisdom teeth usually emerge in the back of the mouth between the ages of 16-20.</p>
            <p>Wisdom teeth are a valuable asset to the mouth when they are healthy and properly positioned... (rest of paragraph)</p>
            <p>A wisdom tooth extraction is a relatively routine procedure... (rest of paragraph)</p>
            <p>After the tooth is removed, we will provide care instructions... (rest of paragraph)</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <p>좋은 구강 위생은 항상 실천해야 합니다. 치아가 하나라도 손실되면 구강 건강과 외모에 큰 영향을 미칠 수 있기 때문입니다. 다음과 같은 이유로 발치를 해야 할 때가 있습니다:</p>
            <ul><li>심한 충치</li><li>진행된 치주 질환</li><li>감염 또는 농양</li><li>교정 치료를 위하여</li><li>위치가 잘못된 치아</li><li>골절 된 치아 또는 치근</li><li>매복치</li></ul>
            <p>신중한 검사와 치료 후 치과 의사는 치아를 뽑으라고 조언 할 수도 있습니다. 치아를 제거하기 전에 치과 의사는 치아와 주변 뼈의 모양과 위치를 잘 알기 위해 엑스레이를 촬영합니다. 난이도에 따라 전문 구강 외과의에게 의뢰할 수도 있습니다.</p>
            <p>간단한 발치는 먼저 국소 마취제를 적용하여 통증과 불편함을 예방합니다. 치아는 엘리베이터라는 도구로 헐거워지게 한 다음 치과용 겸자로 제거합니다. 절차가 완료되면 해당 부위를 한두 바늘 꿰멜 수 있습니다. 그런 다음 불편함을 완화하고 적절한 치유를 위해 주의 사항을 알려드립니다.</p>
            <h4>구강 소수술</h4>
            <p>경미한 구강 수술에는 잔존 치근이나 묻힌 치아 뿌리, 부러진 치아, 사랑니 및 위턱과 아래턱의 낭종 제거가 포함됩니다. 또한 입안의 점액종, 하마종, 설순 소대 등과 같은 작은 연조직 병변의 제거와 근단 절제 수술을 포함합니다. 이러한 시술은 수면제를 사용하기도 하나 보통 국소 마취하에 시행되며 비교적 회복 기간이 짧습니다.</p>
            <h4>사랑니 발치</h4>
            <p>사랑니는 상하악 턱의 양쪽에서 있는 마지막 어금니 또는“제3 대구치”입니다. 사랑니는 대개 16-20 세 사이에 입안에 나옵니다.</p>
            <p>사랑니는 건강하고 적절한 위치에 있을 때는 귀중한 자산입니다... (나머지 문단)</p>
            <p>사랑니 발치는 비교적 일상적인 시술입니다... (나머지 문단)</p>
            <p>치아를 제거한 후 적절한 치유를 위해 관리 지침을 제공합니다... (나머지 문단)</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- COSMETIC MODAL (#pum-1217) ---
        fillModalContent(
            'cosmetic-modal',
            'Cosmetic Dentistry & Whitening',
            '심미 치과 & 치아 미백',
            `
            <h4>Cosmetic Dentistry</h4>
            <p>Cosmetic dentistry includes procedures correct imperfections or enhance the appearance of the mouth. Tooth color, alignment, spacing as well as regularity of the teeth are the characteristics that give the overall appearance. Any of these can be enhanced to provide a stunning new smile.</p>
            <h4>Teeth Whitening</h4>
            <p>Tooth whitening is a popular procedure to make teeth whiter and brighter, and therefore more attractive. Bleaching can be used to whitening stained and discolored teeth, or simply to enhance a dull smile. Either way, tooth whitening is a safe and relatively painless procedure ideal for most patients.</p>
            <p>Tray whitening is a less expensive whitening treatment you can use while in the comfort of your own home. We will first take an impression of your mouth to create a customized clear whitening trays for you to wear. Within a few days your trays will be ready to be picked up and we will show you how to apply the special bleaching material to the trays. The whitening gel trays should be worn 30-60 minutes up to twice a day. At the end of this period, you will see maximum whitening results that are nothing short of dazzling. Occasional treatment can be used at your convenience to maintain your new smile.</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
             `
             <h4>심미 치과</h4>
             <p>미용 치과에는 결점을 교정하거나 입 모양을 개선하는 시술이 포함됩니다. 치아의 색상, 정렬, 간격 및 치아의 규칙성은 전반적인 미를 제공하는 특성입니다. 이들 중 어느 것이든 개선시켜 놀랍고도 새로운 미소를 제공해 드릴 수 있습니다.</p>
             <h4>치아 미백</h4>
             <p>치아 미백은 치아를 더 하얗고 밝게 만들어 더 매력적으로 만드는 인기있는 시술입니다. 표백은 착색되고 변색 된 치아를 미백하거나 윤기없는 미소를 간단하게 향상시키는 데 사용할 수 있습니다. 어느 쪽이든, 치아 미백은 대부분의 환자에게 이상적인 안전하고 비교적 통증이 없는 시술입니다.</p>
             <p>트레이 미백은 집에서 편안하게 사용할 수 있는 저렴한 미백 치료법입니다. 먼저 입안의 본을 떠 착용할 수 있는 개인용 투명 미백 트레이를 만듭니다. 며칠 내로 트레이가 만들어 지면 특수 약품을 트레이에 적용하는 방법을 알려드립니다. 미백 젤 트레이는 하루에 두 번 30-60 분 정도 착용해야합니다. 이 기간이 끝나면 눈부신 최대의 미백 결과를 볼 수 있습니다. 새로운 멋진 미소를 유지하기 위해 당신의 필요에 따라 가끔은 치료하셔도 됩니다.</p>
             <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- RESTORATIVE MODAL (#pum-1207) ---
        fillModalContent(
            'restorative-modal',
            'Restorative Dentistry',
            '보존/신경 치료',
            `
            <h4>Bonding and Fillings</h4>
            <p>Composite resin (a tooth-colored plastic material) can be used to simultaneously fill a cavity and improve your smile... (rest of paragraph)</p>
            <p><strong>Bonding:</strong> Bonding involves adhering composite resin material... (rest of paragraph)</p>
            <p><strong>Fillings:</strong> A filling is a way to restore a tooth damaged by decay... Filling material options: Amalgam (silver)... Composite (plastic) resins... Porcelain fillings (inlays/onlays)... (rest of detailed paragraphs)</p>
            <h4>Root Canal Treatment</h4>
            <p>Root canal treatment (also referred to as root canal therapy or endodontic therapy) is made necessary when an untreated cavity reaches the pulp... (rest of paragraph)</p>
            <p>A root canal is performed to clean out the infected tooth pulp... (rest of paragraph)</p>
            <p>Root canal is a procedure used to repair and save a badly damaged or infected tooth... (rest of paragraph)</p>
            <h4>Non-Surgical Gum Treatment</h4>
            <p>The gums, ligaments, and bone around the teeth form the foundation... (rest of paragraph)</p>
            <p>If you’re having a problem, come in and see us... (rest of paragraph)</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <h4>접착 및 충전</h4>
            <p>복합 수지 (치아 색 플라스틱 소재)를 사용하여 동시에 충치를 메우고 미소를 개선할 수 있습니다... (나머지 문단)</p>
            <p><strong>접합:</strong> 접합은 치아의 색상과 일치하는 복합 수지 재료를 치아 전면에 접착하는 것입니다... (나머지 문단)</p>
            <p><strong>충전:</strong> 충전은 충치로 손상된 치아를 정상적인 기능과 모양으로 되돌리는 방법입니다... 충전재 옵션: 아말감(은)... 합성 (플라스틱) 수지... 도자기 충전재 (인레이/온레이)... (나머지 상세 문단)</p>
            <h4>근관 치료 (신경 치료)</h4>
            <p>근관 치료 (또는 신경 치료라고도 함)는 치료되지 않은 구멍이 치수까지 도달 할 때 필요합니다... (나머지 문단)</p>
            <p>감염된 치아 근관을 깨끗이하고 치아의 근관을 소독하기 위해 근관 치료를 시행합니다... (나머지 문단)</p>
            <p>근관은 심하게 손상되거나 감염된 치아를 빼는 대신 복구하고 살리는 데 사용되는 시술입니다... (나머지 문단)</p>
            <h4>비수술 잇몸 치료</h4>
            <p>치아 주변의 잇몸, 인대 및 뼈는 치아의 기초를 형성합니다... (나머지 문단)</p>
            <p>문제가 있는 경우 즉시 치료 할 수 있도록 방문해 주십시요... (나머지 문단)</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

        // --- PROSTHODONTICS MODAL (#pum-1202) ---
        fillModalContent(
            'prosthodontics-modal',
            'Prosthodontics (Crowns, Bridges, Dentures)',
            '보철 치료 (크라운, 브릿지, 틀니)',
            `
            <p>At London Dental, we are proud to offer our community a variety of services to help make your smile fulfill its potential. We offer the following restorative services:</p>
            <h4>Crowns and Bridges</h4>
            <p>Crowns and most bridges aid in restoring the health of your smile... (rest of intro paragraph)</p>
            <p><strong>Crowns:</strong> A crown (also referred to as a cap) is used to entirely cover a damaged tooth... Crowns may be used to: (list follows)...</p>
            <p><strong>Bridges:</strong> A bridge is an ideal method to fill the space created by missing teeth... (rest of paragraph about function, materials)</p>
            <p>It is important that a missing tooth be replaced as soon as possible... (rest of paragraph about consequences)</p>
            <p>Bridges and crowns are made by first taking an impression... (rest of paragraph about process)</p>
            <p>Bridges and crowns are very durable... (rest of paragraph about longevity)</p>
            <h4>Dentures</h4>
            <p>As with all of our treatments, depending on your needs your dentist will design a denture that is right for you... (rest of paragraph)</p>
            <p>A denture is a removable replacement for missing teeth... (rest of paragraph about types)</p>
            <p>This restoration method is used to restore your smile... (rest of paragraph about complete dentures)</p>
            <p>A removable partial denture is a device used when one or more natural teeth still remain... (rest of paragraph about partial dentures)</p>
            <p>New dentures may feel awkward or loose for the first few weeks... (rest of paragraph about adjustment)</p>
            <p class="font-semibold">At London Dental Clinic, if you are 65 or older and have health insurance, you are covered for a partial denture and/or a complete denture for both upper and/or lower jaw every seven years.</p>
            <p class="mt-6 text-xs text-gray-500">To learn more about this service or to schedule an appointment, call London Dental today at <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a></p>
            `,
            `
            <p>런던치과는 귀하의 미소가 발휘될 수 있도록 다양한 진료를 지역사회에 제공하게 된 것을 자랑스럽게 생각합니다. 우리는 다음과 같은 복원 서비스를 제공합니다:</p>
            <h4>크라운 및 브리지</h4>
            <p>크라운과 대부분의 브리지는 건강한 미소를 되찾는 데 도움이 됩니다... (도입부 문단 나머지)</p>
            <p><strong>크라운:</strong> 크라운 (캡이라고도 함)은 손상된 치아를 완전히 덮는 데 사용됩니다... 크라운 사용 목적: (목록 이어짐)...</p>
            <p><strong>브리지:</strong> 브리지는 빠진 치아로 생긴 공간을 채우는 이상적인 방법입니다... (기능, 재료 관련 문단 나머지)</p>
            <p>빠진 치아는 가능한 한 빨리 교체하는 것이 중요합니다... (결과 관련 문단 나머지)</p>
            <p>브리지와 크라운은 먼저 입안의 인상을 떠서 만듭니다... (과정 관련 문단 나머지)</p>
            <p>브리지와 크라운은 내구성이 매우 뛰어나며... (수명 관련 문단 나머지)</p>
            <h4>틀니</h4>
            <p>모든 치료와 마찬가지로 귀하의 필요에 따라 치과 의사가 귀하에게 적합한 의치를 디자인할 것입니다... (나머지 문단)</p>
            <p>의치는 빠진 치아와 주변 조직을 수복하는 가철식 대체품입니다... (종류 관련 문단 나머지)</p>
            <p>이 복원 방법은 모든 치아가 손실 된 경우 미소와 입 기능을 복원하는 데 사용됩니다... (전체 틀니 관련 문단 나머지)</p>
            <p>착탈 가능한 부분 의치는 하나 이상의 자연 치아가 여전히 턱에 남아있을 때 사용되는 장치입니다... (부분 틀니 관련 문단 나머지)</p>
            <p>새로운 의치와 뺨과 혀의 근육이 제자리를 유지하는 방법을 배우고 편안하게 먹고 말할 때까지 처음 몇 주 동안 어색하거나 헐렁해 질 수 있습니다... (적응 관련 문단 나머지)</p>
            <p class="font-semibold">런던치과에서는 만 65세 이상이고 건강 보험이 적용되는 경우, 상악 및/또는 하악의 부분 틀니 및/또는 전체 틀니에 대해 7년마다 보험 적용을 받을 수 있습니다.</p>
            <p class="mt-6 text-xs text-gray-500">더 자세한 내용을 알아보고 싶으시거나 예약을 원하시면 런던치과 <a href="tel:+827321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화하십시오.</p>
            `
        );

         // --- PRIVACY POLICY MODAL (#pum-1295) ---
        fillModalContent(
             'privacy-modal',
            'Privacy Policy',
             '개인정보처리방침',
            `
            <p>Last updated: January 31, 2021</p>
             <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p>
            <p>We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
             <h4>Interpretation and Definitions</h4>
             <p><strong>Interpretation:</strong> The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
             <p><strong>Definitions:</strong> For the purposes of this Privacy Policy: Account means...; Company means...; Cookies means...; Country means...; Device means...; Personal Data means...; Service means...; Service Provider means...; Third-party Social Media Service means...; Usage Data means...; Website means...; You means...</p>
            <h4>Collecting and Using Your Personal Data</h4>
             <p><strong>Types of Data Collected:</strong> Personal Data (Email address, First name and last name, Phone number, Usage Data); Usage Data (collected automatically); Tracking Technologies and Cookies (Cookies or Browser Cookies, Flash Cookies, Web Beacons)...</p>
             <p><strong>Use of Your Personal Data:</strong> To provide and maintain our Service; To manage Your Account; For the performance of a contract; To contact You; To provide You with news...; To manage Your requests; For business transfers; For other purposes...</p>
            <p><strong>Retention of Your Personal Data:</strong> The Company will retain Your Personal Data only for as long as is necessary...</p>
             <p><strong>Transfer of Your Personal Data:</strong> Your information, including Personal Data, is processed at the Company's operating offices...</p>
            <p><strong>Disclosure of Your Personal Data:</strong> Business Transactions; Law enforcement; Other legal requirements...</p>
             <p><strong>Security of Your Personal Data:</strong> The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet is 100% secure...</p>
             <h4>Links to Other Websites</h4>
            <p>Our Service may contain links to other websites that are not operated by Us...</p>
             <h4>Changes to this Privacy Policy</h4>
            <p>We may update Our Privacy Policy from time to time...</p>
             <h4>Contact Us</h4>
             <p>If you have any questions about this Privacy Policy, You can contact us:</p>
            <ul>
                 <li>By email: <a href="mailto:seoul.londondental@gmail.com">seoul.londondental@gmail.com</a></li>
                 <li>By phone number: <a href="tel:+8227321917">+82-2-732-1917</a></li>
                <li>By mail: London Dental, 97 Jong-ro 5-gil, Jongno-gu, Seoul</li>
             </ul>
            `,
            `
            <p>최종 수정일: 2021년 1월 31일</p>
            <p>본 개인정보처리방침은 귀하가 서비스를 사용할 때 귀하의 정보 수집, 사용 및 공개에 대한 당사의 정책 및 절차를 설명하고 귀하의 개인 정보 보호 권리와 법률이 귀하를 보호하는 방법에 대해 설명합니다.</p>
            <p>당사는 서비스를 제공하고 개선하기 위해 귀하의 개인 데이터를 사용합니다. 서비스를 사용함으로써 귀하는 본 개인 정보 보호 정책에 따라 정보를 수집하고 사용하는 데 동의합니다.</p>
            <h4>해석 및 정의</h4>
             <p><strong>해석:</strong> 첫 글자가 대문자 인 단어는 다음 조건에 따라 정의 된 의미를 갖습니다. 다음 정의는 단수 또는 복수로 표시되는지 여부에 관계없이 동일한 의미를 갖습니다.</p>
             <p><strong>정의:</strong> 본 개인 정보 보호 정책의 목적 상: 계정 의미...; 회사 의미...; 쿠키 의미...; 국가 의미...; 기기 의미...; 개인 데이터 의미...; 서비스 의미...; 서비스 제공 업체 의미...; 제 3 자 소셜 미디어 서비스 의미...; 사용 데이터 의미...; 웹 사이트 의미...; 귀하 의미...</p>
             <h4>개인 데이터 수집 및 사용</h4>
             <p><strong>수집 된 데이터 유형 :</strong> 개인 데이터 (이메일 주소, 이름 및 성, 전화 번호, 사용 데이터); 사용 데이터 (자동으로 수집 됨); 추적 기술 및 쿠키 (쿠키 또는 브라우저 쿠키, 플래시 쿠키, 웹 비콘) ...</p>
             <p><strong>개인 데이터 사용 :</strong> 서비스 제공 및 유지; 계정 관리; 계약 이행; 연락하기; 뉴스 제공...; 요청 관리; 사업 양도; 기타 목적...</p>
             <p><strong>개인 데이터 보유 :</strong> 회사는 본 개인 정보 보호 정책에 명시된 목적에 필요한 기간 동안 만 귀하의 개인 데이터를 보유합니다...</p>
             <p><strong>개인 데이터 전송 :</strong> 개인 데이터를 포함한 귀하의 정보는 회사의 운영 사무소 및 처리 관련 당사자가있는 다른 모든 장소에서 처리됩니다...</p>
             <p><strong>개인 데이터 공개 :</strong> 비즈니스 거래; 법 집행; 기타 법적 요구 사항...</p>
            <p><strong>개인 데이터 보안 :</strong> 귀하의 개인 데이터 보안은 당사에게 중요하지만 인터넷을 통한 전송 방법이나 전자 저장 방법은 100 % 안전하지 않다는 점을 기억하십시오...</p>
            <h4>다른 웹 사이트 링크</h4>
            <p>당사 서비스에는 당사가 운영하지 않는 다른 웹 사이트에 대한 링크가 포함될 수 있습니다...</p>
             <h4>본 개인 정보 보호 정책 변경</h4>
             <p>당사는 때때로 개인 정보 보호 정책을 업데이트 할 수 있습니다...</p>
             <h4>문의하기</h4>
            <p>본 개인 정보 보호 정책에 대해 질문이있는 경우 당사에 문의하십시오.</p>
             <ul>
                 <li>이메일: <a href="mailto:seoul.londondental@gmail.com">seoul.londondental@gmail.com</a></li>
                <li>전화번호: <a href="tel:+8227321917">02-732-1917</a></li>
                <li>주소: 서울시 종로구 종로5길 97, 런던치과</li>
            </ul>
             `
        );


        // --- FAQ MODAL (Content already in HTML) ---
        console.log('Modal content injection complete.');
    }

    // --- Run Initializer ---
    init();

}); // End DOMContentLoaded Listener
// --- END OF FILE script.js ---