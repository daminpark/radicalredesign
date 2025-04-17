"use strict"; // Enable strict mode

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        // Configuration
        lang: 'en', // Default language
        scrollThreshold: 300, // Pixels from top to show back-to-top button
        animationObserverThreshold: 0.15, // Percentage of element visible to trigger animation

        // Elements Cache (cache frequently accessed elements)
        elements: {
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
            animatedElements: document.querySelectorAll('.animate-on-scroll'),
            faqItems: document.querySelectorAll('.faq-item'),
            galleryItems: document.querySelectorAll('.gallery-item'), // Gallery item containers
            imageModal: document.getElementById('image-modal'),
            lightboxImage: document.getElementById('lightbox-image'),
            // Add more cached elements if needed
        },

        // Initialization
        init() {
            console.log('App Initializing...');
            this.initMobileMenu();
            this.initModals();
            this.initLanguage();
            this.initCopyright();
            this.initBackToTop();
            this.initScrollAnimations();
            this.initAccordions();
            this.injectModalContent(); // Inject content *before* setting initial language display
            console.log('App Initialized.');
        },

        // --- Feature Initializers ---

        initMobileMenu() {
            const { menuButton, mobileMenu, menuIconBars, menuIconClose } = this.elements;
            if (!menuButton || !mobileMenu || !menuIconBars || !menuIconClose) return;

            menuButton.addEventListener('click', () => {
                const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
                mobileMenu.classList.toggle('hidden');
                menuIconBars.classList.toggle('hidden');
                menuIconClose.classList.toggle('hidden');
                menuButton.setAttribute('aria-expanded', !isExpanded);
                // Toggle body scroll lock
                this.elements.body.style.overflow = isExpanded ? '' : 'hidden';
            });

            mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                    menuIconBars.classList.remove('hidden');
                    menuIconClose.classList.add('hidden');
                    menuButton.setAttribute('aria-expanded', 'false');
                    this.elements.body.style.overflow = ''; // Ensure scroll is re-enabled
                });
            });
        },

        initModals() {
            const { modalTriggers, modals, modalCloses, galleryItems, imageModal } = this.elements;

            const openModal = (modal) => {
                if (modal) {
                    modal.classList.remove('hidden');
                    this.elements.body.style.overflow = 'hidden'; // Lock scroll
                    setTimeout(() => modal.classList.add('opacity-100'), 10); // Slight delay for transition

                    // Basic focus trapping
                    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if(focusable.length) focusable[0].focus();
                    modal.userData = { lastFocus: document.activeElement }; // Store last focused element
                }
            }

            const closeModal = (modal) => {
                if (modal) {
                    modal.classList.remove('opacity-100'); // Start fade out
                    setTimeout(() => {
                         modal.classList.add('hidden');
                         this.elements.body.style.overflow = ''; // Unlock scroll
                          // Return focus
                        if (modal.userData && modal.userData.lastFocus && typeof modal.userData.lastFocus.focus === 'function') {
                             modal.userData.lastFocus.focus();
                         }
                    }, 300); // Match transition duration
                }
            }

            // Standard triggers
            modalTriggers.forEach(trigger => {
                 // Skip gallery triggers managed separately
                if (!trigger.closest('.gallery-item')) {
                     trigger.addEventListener('click', (e) => {
                        e.preventDefault(); // Prevent default link behavior
                         const targetModalId = trigger.getAttribute('data-modal-target');
                        const targetModal = document.getElementById(targetModalId);
                         openModal(targetModal);
                    });
                }
             });

             // Gallery item triggers (for image lightbox)
             galleryItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const imgSrc = item.getAttribute('href') || item.dataset.imageSrc; // Allow link or data attribute
                    if (imgSrc && imageModal && this.elements.lightboxImage) {
                        this.elements.lightboxImage.src = imgSrc;
                        openModal(imageModal);
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
        },

        initLanguage() {
            const { langButtons, html } = this.elements;

            this.setLanguage = (lang) => { // Assign to instance for accessibility
                const validLangs = ['en', 'ko'];
                if (!validLangs.includes(lang)) lang = 'en';
                this.lang = lang; // Store current lang
                const targetLangCode = lang === 'ko' ? 'ko-KR' : 'en-GB';
                html.lang = targetLangCode;

                document.querySelectorAll('.lang-en, .lang-ko').forEach(el => {
                    el.style.display = el.classList.contains(`lang-${lang}`) ? '' : 'none';
                });

                langButtons.forEach(btn => {
                    const isActive = btn.getAttribute('data-lang') === lang;
                    btn.classList.toggle('active', isActive);
                     btn.setAttribute('aria-pressed', isActive);
                 });
                try { localStorage.setItem('preferredLang', lang); } catch (e) {}
            };

            langButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const selectedLang = button.getAttribute('data-lang');
                    this.setLanguage(selectedLang);
                     // Close mobile menu if open
                     if (this.elements.mobileMenu && !this.elements.mobileMenu.classList.contains('hidden')) {
                        this.elements.menuButton.click(); // Simulate click to toggle menu off
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
             this.setLanguage(initialLang);
        },

        initCopyright() {
            const { copyrightYear } = this.elements;
             if (copyrightYear) {
                 copyrightYear.textContent = new Date().getFullYear();
             }
        },

        initBackToTop() {
            const { backToTopButton } = this.elements;
             if (!backToTopButton) return;

            const toggleVisibility = () => {
                if (window.scrollY > this.scrollThreshold) {
                     backToTopButton.classList.add('visible');
                } else {
                     backToTopButton.classList.remove('visible');
                 }
            };

             window.addEventListener('scroll', toggleVisibility, { passive: true });
            backToTopButton.addEventListener('click', () => {
                 window.scrollTo({ top: 0, behavior: 'smooth' });
            });
             toggleVisibility(); // Initial check
         },

        initScrollAnimations() {
            const { animatedElements } = this.elements;
             if (!animatedElements || !('IntersectionObserver' in window)) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                     if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                         observer.unobserve(entry.target);
                    }
                });
             }, { threshold: this.animationObserverThreshold });

            animatedElements.forEach(el => observer.observe(el));
        },

        initAccordions() {
            const { faqItems } = this.elements;
            faqItems.forEach(item => {
                 const summary = item.querySelector('summary');
                 const content = item.querySelector('.faq-content'); // Assuming content follows summary
                if (summary && content) {
                     summary.addEventListener('click', (e) => {
                        // Optional: Prevent default if needed, though default works for details/summary
                        // e.preventDefault();
                         // We rely on the browser's default open/close mechanism for <details>
                    });
                 }
             });
        },

        // --- Content Injection ---

         // Helper function to inject bilingual content
        injectContent(targetElement, contentEn, contentKo) {
            if(targetElement) {
                targetElement.innerHTML = `<span class="lang-en">${contentEn}</span><span class="lang-ko hidden">${contentKo}</span>`;
             } else {
                 console.warn('Target element for injection not found.');
             }
        },

         fillModalContent(modalId, titleEn, titleKo, contentHtmlEn, contentHtmlKo) {
            const modal = document.getElementById(modalId);
            if (modal) {
                const titleElement = modal.querySelector('.modal-content h3');
                const contentElement = modal.querySelector('.modal-content .prose');
                if (titleElement && contentElement) {
                    titleElement.innerHTML = `<span class="lang-en">${titleEn}</span><span class="lang-ko hidden">${titleKo}</span>`;
                     // Wrap content correctly for language switching
                     contentElement.innerHTML = `<div class="lang-en">${contentHtmlEn}</div><div class="lang-ko hidden">${contentHtmlKo}</div>`;

                    // Ensure injected content reflects current language immediately
                     contentElement.querySelectorAll('.lang-en, .lang-ko').forEach(el => {
                         el.style.display = el.classList.contains(`lang-${this.lang}`) ? '' : 'none';
                     });
                     titleElement.querySelectorAll('.lang-en, .lang-ko').forEach(el => {
                        el.style.display = el.classList.contains(`lang-${this.lang}`) ? '' : 'none';
                     });

                 } else {
                     console.warn(`Could not find title or content elements in modal: ${modalId}`);
                }
            } else {
                console.warn(`Could not find modal: ${modalId}`);
             }
        },

        injectModalContent() {
            console.log('Injecting modal content...');
             // --- ABOUT MODAL ---
             this.fillModalContent(
                 'about-modal',
                'Dr. Fiona Park - Qualifications & Experience',
                '박지연 원장 - 약력 및 경력',
                `
                 <p><strong>Education & Licensing:</strong></p>
                 <ul>
                    <li>Bachelor of Dental Surgery (BDS): Queen Mary University of London, Barts and The London School of Medicine and Dentistry (2005-2010)</li>
                    <li>Master of Dental Surgery (MSD), Dental Anesthesia: Seoul National University, School of Dentistry (2013 onwards)</li>
                    <li>Doctoral Course (Preventive Dentistry): Seoul National University, School of Dentistry (ongoing)</li>
                     <li>UK General Dental Council (GDC) Registered</li>
                    <li>Korean Dental License Holder</li>
                 </ul>
                 <p><strong>Experience:</strong></p>
                <ul>
                    <li>London Dental Clinic, Seoul (Current Owner/Practitioner)</li>
                    <li>God’s Purpose Dental Clinic, Seoul</li>
                    <li>Grin Dental Clinic, Cheongju</li>
                    <li>Senior House Officer (OMFS Dept): Royal Surrey County Hospital NHS Foundation Trust, UK (2012-2013)</li>
                    <li>General Dental Practitioner: Norwood Dental Surgery, London (2011-2012)</li>
                </ul>
                <p><strong>Memberships:</strong></p>
                 <ul>
                    <li>British Dental Association (BDA)</li>
                     <li>Korean Dental Association (KDA)</li>
                    <li>Korean Women Dental Association</li>
                    <li>Korean Academy of Advanced General Dentistry</li>
                     <li>Korean Dental Society of Anesthesiology</li>
                    <li>Korean Academy of Preventative Dentistry & Oral Health</li>
                    <li>The Korean Academy of Implant Dentistry</li>
                    <li>Korean Britain Society (KBS)</li>
                 </ul>
                 `,
                 `
                 <p><strong>학력 및 면허:</strong></p>
                 <ul>
                     <li>치의학 학사 (BDS): 런던 퀸메리 대학교, 바츠 앤드 런던 의학치의학부 (2005-2010)</li>
                     <li>치의학 석사 (MSD), 치과마취과학: 서울대학교 치의학대학원 (2013-)</li>
                    <li>치의학 박사 과정, 예방치과학: 서울대학교 치의학대학원 (진행중)</li>
                    <li>영국 일반 치과 위원회 (GDC) 등록</li>
                     <li>대한민국 치과의사 면허 보유</li>
                </ul>
                <p><strong>경력:</strong></p>
                <ul>
                    <li>런던치과, 서울 (現 원장)</li>
                    <li>목적이 이끄는 치과, 서울</li>
                    <li>그린치과, 청주</li>
                    <li>상급 인턴 (구강악안면외과): 영국 왕립 서리 카운티 병원 NHS 재단 (2012-2013)</li>
                    <li>일반 치과의사: 노우드 치과의원, 런던 (2011-2012)</li>
                 </ul>
                 <p><strong>학회 활동:</strong></p>
                 <ul>
                     <li>영국 치과의사 협회 (BDA)</li>
                    <li>대한 치과의사 협회 (KDA)</li>
                     <li>대한 여자 치과의사회</li>
                     <li>대한 통합 치과학회</li>
                    <li>대한 치과 마취 과학회</li>
                     <li>대한 예방치과 구강보건 학회</li>
                     <li>대한 치과 이식 임플란트 학회</li>
                     <li>한영 협회 (KBS)</li>
                </ul>
                 `
            );

             // --- EQUIPMENT MODAL ---
            this.fillModalContent(
                 'equipment-modal',
                 'Our Advanced Dental Technology',
                '첨단 치과 장비 소개',
                 `
                <p>We utilize state-of-the-art equipment to provide accurate diagnoses and comfortable, effective treatments.</p>
                <h4>Digital CT X-ray (Vatech)</h4>
                <p>Our Vatech CT scanner provides detailed 3D images of your jaw and teeth with significantly lower radiation compared to traditional methods. This is crucial for precise implant planning, nerve assessment, and identifying hidden issues.</p>
                <ul>
                     <li>Benefits: High-resolution 3D views, low radiation dose, faster diagnostics, improved treatment planning.</li>
                </ul>
                 <h4>Surgical Microscope (Zeiss)</h4>
                 <p>The Zeiss surgical microscope offers powerful magnification (up to 16x) and brilliant illumination. This enhanced visibility allows Dr. Park to perform complex procedures like root canals, intricate restorative work, and implant surgery with exceptional precision, preserving more tooth structure and ensuring better long-term results.</p>
                 <ul>
                    <li>Benefits: Improved accuracy, minimally invasive procedures, better detection of micro-fractures, enhanced outcome quality.</li>
                </ul>
                <!-- Optional: Add other relevant tech if available -->
                <h4>PiezoLED Ultrasonic Scaler</h4>
                <p>Used for gentle yet effective removal of plaque and tartar during cleanings. The ultrasonic vibrations break down deposits efficiently, while LED illumination enhances visibility for the hygienist. Irrigation simultaneously flushes away bacteria.</p>
                <ul><li>Benefits: More comfortable cleaning, efficient removal of calculus, promotes gum healing.</li></ul>

                 <p class="mt-6 text-xs text-gray-500">Learn more at <a href="http://www.vatech.com/" target="_blank" rel="noopener">Vatech</a> and <a href="https://www.zeiss.com/meditec/us/products/dentistry.html" target="_blank" rel="noopener">Zeiss Dentistry</a>.</p>
                 `,
                `
                 <p>정확한 진단과 편안하고 효과적인 치료를 제공하기 위해 최첨단 장비를 사용합니다.</p>
                 <h4>디지털 CT 엑스-레이 (Vatech)</h4>
                 <p>저희 바텍 CT 스캐너는 기존 방식에 비해 현저히 낮은 방사선량으로 턱과 치아의 상세한 3D 이미지를 제공합니다. 이는 정확한 임플란트 계획, 신경 평가 및 숨겨진 문제 식별에 매우 중요합니다.</p>
                 <ul>
                     <li>장점: 고해상도 3D 시야 확보, 낮은 방사선량, 신속한 진단, 향상된 치료 계획 수립.</li>
                 </ul>
                 <h4>수술용 현미경 (Zeiss)</h4>
                 <p>Zeiss 수술용 현미경은 강력한 배율(최대 16배)과 뛰어난 조명을 제공합니다. 이 향상된 가시성을 통해 박 원장님은 근관 치료, 복잡한 보철 작업, 임플란트 수술과 같은 복잡한 시술을 탁월한 정밀도로 수행하여 치아 구조를 더 많이 보존하고 더 나은 장기적 결과를 보장할 수 있습니다.</p>
                <ul>
                     <li>장점: 정확성 향상, 최소 침습 시술, 미세 균열 발견 개선, 치료 결과 품질 향상.</li>
                 </ul>
                 <h4>피에조LED 초음파 스케일러</h4>
                 <p>스케일링 시 플라그와 치석을 부드럽고 효과적으로 제거하는 데 사용됩니다. 초음파 진동이 침전물을 효율적으로 분해하는 동안 LED 조명이 치과 위생사의 가시성을 향상시킵니다. 관류는 동시에 박테리아를 씻어냅니다.</p>
                 <ul><li>장점: 더 편안한 스케일링, 효율적인 치석 제거, 잇몸 치유 촉진.</li></ul>

                 <p class="mt-6 text-xs text-gray-500">자세한 정보는 <a href="http://www.vatech.co.kr/" target="_blank" rel="noopener">Vatech</a> 및 <a href="https://www.zeiss.co.kr/meditec/ko/products/dentistry.html" target="_blank" rel="noopener">Zeiss Dentistry</a>에서 확인하세요.</p>
                 `
             );


             // --- FIRST APPOINTMENT MODAL ---
            this.fillModalContent(
                 'first-appointment-modal',
                 'Your First Visit Experience',
                 '첫 방문 안내',
                `
                <p>Welcome to London Dental Clinic! We want your first visit to be comfortable and informative. Here’s what you can typically expect:</p>
                <h4>1. Welcome & Consultation</h4>
                 <p>We'll begin with a friendly chat to understand your dental history, concerns, and goals. This is a great time to ask any initial questions.</p>
                <h4>2. Comprehensive Examination</h4>
                 <p>Dr. Park will conduct a thorough examination of your teeth, gums, jaw, and surrounding tissues. This includes a visual inspection and may involve checking your bite and screening for oral cancer.</p>
                <h4>3. Digital Diagnostics</h4>
                <p>If necessary, we'll take digital X-rays (like bitewings or potentially a CT scan if needed for specific issues). These low-radiation images help us see between teeth and below the gum line.</p>
                <h4>4. Treatment Planning</h4>
                 <p>Based on the exam and diagnostics, Dr. Park will discuss her findings with you in clear terms (English or Korean). We'll explain any recommended treatments, alternatives, timelines, and associated costs, creating a personalized plan together.</p>
                <h4>5. Cleaning (If Scheduled)</h4>
                 <p>Often, your first visit may include a professional cleaning (scaling) by our dental hygienist to remove plaque and tartar build-up.</p>
                 <h4>6. Next Steps & Home Care</h4>
                 <p>We'll finalize your treatment plan, schedule any necessary follow-up appointments, and provide personalized advice on maintaining your oral health at home.</p>
                 <p>Our goal is to ensure you leave fully informed and comfortable with your path to a healthier smile.</p>
                `,
                 `
                 <p>런던치과에 오신 것을 환영합니다! 첫 방문이 편안하고 유익한 시간이 되도록 최선을 다하겠습니다. 일반적으로 다음과 같은 과정으로 진행됩니다:</p>
                 <h4>1. 환영 및 상담</h4>
                 <p>환자분의 치과 병력, 우려 사항 및 목표를 이해하기 위해 편안한 대화로 시작합니다. 궁금한 점이 있으시면 언제든지 질문해주세요.</p>
                <h4>2. 종합 구강 검진</h4>
                 <p>박 원장님이 치아, 잇몸, 턱 및 주변 조직을 면밀히 검사합니다. 시진, 교합 검사, 구강암 검진 등이 포함될 수 있습니다.</p>
                 <h4>3. 디지털 정밀 진단</h4>
                <p>필요한 경우, 디지털 X-레이(교익 촬영 또는 특정 문제 확인을 위한 CT 촬영 등)를 촬영합니다. 낮은 방사선량의 이 이미지는 치아 사이나 잇몸 하방을 확인하는 데 도움이 됩니다.</p>
                 <h4>4. 치료 계획 수립</h4>
                 <p>검진 및 진단 결과를 바탕으로 박 원장님이 명확한 용어(한국어 또는 영어)로 소견을 설명드립니다. 권장 치료, 대안, 일정 및 관련 비용을 설명하고 함께 개인 맞춤형 계획을 수립합니다.</p>
                <h4>5. 스케일링 (예약된 경우)</h4>
                <p>종종 첫 방문에는 치과 위생사가 플라그와 치석 침전물을 제거하는 전문 스케일링이 포함될 수 있습니다.</p>
                 <h4>6. 다음 단계 및 자가 관리</h4>
                 <p>치료 계획을 확정하고 필요한 후속 진료 예약을 잡으며, 가정에서의 구강 건강 유지 방법에 대한 맞춤형 조언을 제공합니다.</p>
                 <p>저희 목표는 환자분께서 충분한 정보를 얻고 더 건강한 미소를 향한 과정에 편안함을 느끼도록 하는 것입니다.</p>
                `
            );


            // --- ORAL EXAMS MODAL --- (Copy actual content from previous prompt's #pum-1224)
            this.fillModalContent(
                'oral-exams-modal',
                 'Comprehensive Oral Exams',
                '종합 구강 검진',
                `
                <p>The American Dental Association (ADA) recommends that new dental patients have a thorough exam on their first visit to their new dentist. Existing patients are advised to undergo the exam every year. Undergoing a comprehensive oral exam will take a whole appointment.</p>
                <p>The ADA defines a ‘comprehensive exam’ as “an extensive evaluation and the recording of all extraoral, intraoral, and soft tissues.”</p>
                <p><strong>What to Expect During the Oral Examination</strong></p>
                <p>During the oral examination, the dentist will conduct a manual and visual screening of the mouth and the lymph nodes. Examining the soft and hard palate and the lips’ inner and outer part are the next step. The dentist will then investigate under the mouth, and then the cheeks, and behind the molars. Preventative dental care is always the main focus of London Dental. During the oral exam, our dentist is also screening for cancer.</p>
                <p><strong>Why Is An Oral Cancer Screening Important?</strong></p>
                <p>We want you to maintain a healthy and happy smile for as long as possible. If you have a history of smoking and drinking, then it’s important to have a comprehensive dental examination (or oral exam) when you visit the dentist. For low-risk patients, then it is fine to have an exam every three years.</p>
                <p>Oral cancer exams (oral cancer screenings) are used as a tool to screen for cancer before a person has symptoms... (continue full text)</p>
                 `,
                `
                 <p>미국 치과 협회 (ADA)는 신규 치과 환자가 치과를 처음 방문할 때 철저히 검사 받을 것을 권장합니다. 기존 환자는 매년 검사를 받는 것이 좋습니다. 포괄적인 구강 검사를 받으려면 사전 예약이 필요합니다.</p>
                <p>ADA는 "종합 검진"을 "모든 구강 내외 및 연조직의 광범위한 평가 및 기록"으로 정의합니다.</p>
                <p><strong>구강 검진에서 하는 사항</strong></p>
                 <p>전반적 구강 검진 중에 치과 의사는 구강과 림프절을 촉각과 시각으로 검사합니다... (continue full text)</p>
                 <p><strong>구강암 검진의 중요성</strong></p>
                <p>우리는 귀하께서 가능한 한 오랜 동안 건강하고 행복한 미소를 유지하기를 원합니다... (continue full text)</p>
                 `
             );


            // --- IMPLANTS MODAL --- (Copy from #pum-1212)
             this.fillModalContent(
                 'implants-modal',
                'Dental Implants',
                 '임플란트',
                `
                 <p>A dental implant is an ideal tooth restoration for people who are missing one or more teeth... (continue full text)</p>
                <p><strong>At London Dental Clinic, if you are 65 or older and have health insurance, you are covered for up to two implants in your lifetime.</strong></p>
                 <p class="mt-6 text-xs text-gray-500">To learn more or schedule, call <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">+82-2-732-1917</a>.</p>
                `,
                `
                 <p>치과 임플란트는 부상, 치주 질환 또는 기타 이유로 하나 이상의 치아를 잃은 사람들에게 이상적인 치아 복원술입니다... (continue full text)</p>
                 <p><strong>런던치과에서는 만 65세 이상이면서 건강보험을 가지고 계신 경우, 평생 2개까지 임플란트 보험 혜택을 받으실 수 있습니다.</strong></p>
                 <p class="mt-6 text-xs text-gray-500">더 자세한 내용 또는 예약 문의는 <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>로 전화주십시오.</p>
                `
            );

             // --- HYGIENE MODAL --- (Copy from #pum-1191)
             this.fillModalContent(
                 'hygiene-modal',
                'Dental Hygiene & Gum Care',
                 '스케일링 & 잇몸 관리',
                 `
                <h4>Dental Hygiene Care</h4>
                <p>Maintaining good dental hygiene is one of the most important things you can do for your teeth and gums... (continue full text)</p>
                 <h4>Perio Maintenance (Gum Care)</h4>
                 <p>Rather than just addressing the visible part of your tooth... (continue full text)</p>
                 <p class="mt-6 text-xs text-gray-500">For healthier gums, schedule your cleaning today: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">+82-2-732-1917</a>.</p>
                 `,
                `
                 <h4>치과 위생관리</h4>
                 <p>좋은 구강 위생을 유지하는 것은 치아와 잇몸을 위해 할 수 있는 가장 중요한 일 중 하나입니다... (continue full text)</p>
                <h4>잇몸 관리 (치주 관리)</h4>
                <p>치아의 보이는 부분 크라운뿐 아니라 치아 뿌리, 잇몸 및 뼈를 보존하는 것이 필요합니다... (continue full text)</p>
                <p class="mt-6 text-xs text-gray-500">건강한 잇몸을 위해 오늘 스케일링을 예약하세요: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>.</p>
                 `
            );

            // --- EXTRACTIONS MODAL --- (Copy from #pum-1222)
             this.fillModalContent(
                 'extractions-modal',
                 'Tooth Extractions & Oral Surgery',
                '발치 & 구강 소수술',
                 `
                 <p>Good oral hygiene should always be practiced... Reasons for extraction:</p>
                 <ul><li>Severe decay</li>... (continue full list and text)</ul>
                 <h4>Minor Oral Surgeries</h4>
                 <p>Minor oral surgery includes removal of retained roots, broken teeth... (continue full text)</p>
                 <h4>Wisdom Tooth Extractions</h4>
                 <p>Wisdom teeth are the last molars... (continue full text)</p>
                <p class="mt-6 text-xs text-gray-500">Consult about extractions: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">+82-2-732-1917</a>.</p>
                 `,
                 `
                 <p>좋은 구강 위생은 항상 실천해야 합니다... 발치 이유:</p>
                <ul><li>심한 충치</li>... (continue full list and text)</ul>
                 <h4>구강 소수술</h4>
                <p>경미한 구강 수술에는 잔존 치근, 부러진 치아 제거 등이 포함됩니다... (continue full text)</p>
                 <h4>사랑니 발치</h4>
                <p>사랑니는 마지막 어금니입니다... (continue full text)</p>
                <p class="mt-6 text-xs text-gray-500">발치 상담 문의: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>.</p>
                `
             );

             // --- COSMETIC MODAL --- (Copy from #pum-1217)
            this.fillModalContent(
                 'cosmetic-modal',
                'Cosmetic Dentistry & Whitening',
                 '심미 치과 & 치아 미백',
                `
                <h4>Cosmetic Dentistry</h4>
                <p>Cosmetic dentistry includes procedures correct imperfections or enhance the appearance... (continue full text)</p>
                <h4>Teeth Whitening</h4>
                 <p>Tooth whitening is a popular procedure to make teeth whiter... Tray whitening details... (continue full text)</p>
                 <p class="mt-6 text-xs text-gray-500">Enhance your smile: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">+82-2-732-1917</a>.</p>
                 `,
                `
                 <h4>심미 치과</h4>
                 <p>미용 치과에는 결점을 교정하거나 입 모양을 개선하는 시술이 포함됩니다... (continue full text)</p>
                 <h4>치아 미백</h4>
                 <p>치아 미백은 치아를 더 하얗고 밝게 만드는 인기있는 시술입니다... 트레이 미백 상세... (continue full text)</p>
                 <p class="mt-6 text-xs text-gray-500">미소를 더 밝게: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>.</p>
                `
             );

             // --- RESTORATIVE MODAL --- (Copy from #pum-1207)
             this.fillModalContent(
                 'restorative-modal',
                 'Restorative Dentistry (Fillings, Root Canals)',
                '보존 치료 (충치, 신경치료)',
                 `
                 <h4>Bonding and Fillings</h4>
                 <p>Composite resin (a tooth-colored plastic material) can be used... Filling material options... (continue full text)</p>
                 <h4>Root Canal Treatment</h4>
                 <p>Root canal treatment is made necessary when an untreated cavity reaches the pulp... (continue full text)</p>
                <h4>Non-Surgical Gum Treatment</h4>
                <p>The gums, ligaments, and bone around the teeth form the foundation... (continue full text)</p>
                <p class="mt-6 text-xs text-gray-500">For restorations, call <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">+82-2-732-1917</a>.</p>
                `,
                 `
                <h4>접착 및 충전</h4>
                <p>복합 수지 (치아 색 플라스틱 소재)를 사용하여 동시에 충치를 메우고... 충전재 옵션... (continue full text)</p>
                <h4>근관 치료 (신경 치료)</h4>
                <p>근관 치료는 치료되지 않은 충치가 치수까지 도달 할 때 필요합니다... (continue full text)</p>
                 <h4>비수술 잇몸 치료</h4>
                <p>치아 주변의 잇몸, 인대 및 뼈는 치아의 기초를 형성합니다... (continue full text)</p>
                <p class="mt-6 text-xs text-gray-500">수복 치료 문의: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>.</p>
                `
            );

            // --- PROSTHODONTICS MODAL --- (Copy from #pum-1202)
            this.fillModalContent(
                 'prosthodontics-modal',
                 'Prosthodontics (Crowns, Bridges, Dentures)',
                '보철 치료 (크라운, 브릿지, 틀니)',
                `
                <p>At London Dental, we offer the following restorative services:</p>
                 <h4>Crowns and Bridges</h4>
                <p>Crowns and most bridges aid in restoring the health of your smile... (continue full text on crowns and bridges)</p>
                 <h4>Dentures</h4>
                <p>A denture is a removable replacement for missing teeth... (continue full text on dentures)</p>
                <p><strong>At London Dental Clinic, if you are 65 or older and have health insurance, you are covered for a partial denture and/or a complete denture for both upper and/or lower jaw every seven years.</strong></p>
                 <p class="mt-6 text-xs text-gray-500">Discuss replacement options: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">+82-2-732-1917</a>.</p>
                 `,
                `
                 <p>런던치과는 다음과 같은 복원 서비스를 제공합니다:</p>
                <h4>크라운 및 브리지</h4>
                 <p>크라운과 대부분의 브리지는 건강한 미소를 되찾는 데 도움이 됩니다... (크라운 및 브리지 전문 텍스트 계속)</p>
                 <h4>틀니</h4>
                 <p>의치는 빠진 치아와 주변 조직을 수복하는 가철식 대체품입니다... (틀니 전문 텍스트 계속)</p>
                <p><strong>런던치과에서는 만 65세 이상이고 건강 보험이 적용되는 경우, 상악 및/또는 하악의 부분 틀니 및/또는 전체 틀니에 대해 7년마다 보험 적용을 받을 수 있습니다.</strong></p>
                <p class="mt-6 text-xs text-gray-500">치아 대체 옵션 상담: <a href="tel:+8227321917" class="font-semibold text-teal-700 hover:underline">02-732-1917</a>.</p>
                `
            );

             // --- PRIVACY POLICY MODAL --- (Copy from #pum-1295)
            this.fillModalContent(
                 'privacy-modal',
                'Privacy Policy',
                 '개인정보처리방침',
                `
                 <p>Last updated: January 31, 2021</p>
                <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service...</p>
                <h4>Interpretation and Definitions</h4>
                <p>Interpretation: The words...</p>
                <p>Definitions: For the purposes...</p>
                <!-- ... CONTINUE PASTING THE ENTIRE PRIVACY POLICY TEXT HERE ... -->
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
                <p>본 개인정보처리방침은 귀하가 서비스를 사용할 때 귀하의 정보 수집, 사용 및 공개에 대한 당사의 정책 및 절차를 설명하고 귀하의 개인 정보 보호 권리와 법률이 귀하를 보호하는 방법에 대해 설명합니다...</p>
                <h4>해석 및 정의</h4>
                 <p>해석: 첫 글자가 대문자 인 단어...</p>
                 <p>정의: 본 개인 정보 보호 정책의 목적 상...</p>
                 <!-- ... PASTE KOREAN PRIVACY POLICY HERE IF AVAILABLE, OTHERWISE KEEP ENGLISH ... -->
                 <h4>연락처</h4>
                 <p>본 개인 정보 보호 정책에 대해 질문이있는 경우 당사에 문의하십시오.</p>
                 <ul>
                     <li>이메일: <a href="mailto:seoul.londondental@gmail.com">seoul.londondental@gmail.com</a></li>
                    <li>전화번호: <a href="tel:+8227321917">02-732-1917</a></li>
                     <li>주소: 서울시 종로구 종로5길 97, 런던치과</li>
                 </ul>
                 ` // Use English as fallback for KO if no translation exists for policy
            );

            // --- FAQ MODAL CONTENT (Structure was in HTML, this populates) ---
            // The HTML contains the basic FAQ structure. We can use JS to populate it dynamically
            // Or simply rely on the HTML structure if it's simple enough.
            // Let's assume the simple HTML structure works fine. No JS needed here for basic FAQs.

            console.log('Modal content injection attempt complete.');
        },
    }; // End App Object

    app.init(); // Run the initializer

}); // End DOMContentLoaded Listener
