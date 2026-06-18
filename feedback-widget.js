// feedback-widget.js
(function () {
    // Prevent multiple initializations
    if (window.__feedbackWidgetInitialized) return;
    window.__feedbackWidgetInitialized = true;

    // Load Outfit font if not present
    if (!document.getElementById('feedback-font')) {
        const link = document.createElement('link');
        link.id = 'feedback-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap';
        document.head.appendChild(link);
    }

    // Inject CSS styles
    const styles = `
        /* Widget Styles */
        .feedback-section-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 9999;
            background: rgba(124, 58, 237, 0.9);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 8px 14px;
            border-radius: 20px;
            font-family: 'Outfit', sans-serif;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(5px);
        }
        .feedback-section-btn:hover {
            background: #6d28d9;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }
        .feedback-section-btn:active {
            transform: translateY(0);
        }
        
        /* Make sure parent section has relative position so the absolute button aligns correctly */
        .feedback-relative-parent {
            position: relative !important;
        }

        /* Modal Overlay */
        .feedback-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 12, 27, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
        }
        .feedback-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* Modal Card */
        .feedback-modal {
            background: rgba(25, 20, 40, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 24px;
            width: 90%;
            max-width: 480px;
            padding: 30px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: translateY(20px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: 'Outfit', sans-serif;
            color: #f3f1f8;
        }
        .feedback-overlay.active .feedback-modal {
            transform: translateY(0) scale(1);
        }
        .feedback-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .feedback-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .feedback-close {
            background: none;
            border: none;
            color: #a39eb9;
            font-size: 20px;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s;
        }
        .feedback-close:hover {
            color: #ffffff;
        }
        .feedback-group {
            margin-bottom: 18px;
        }
        .feedback-label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #a39eb9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .feedback-input, .feedback-textarea {
            width: 100%;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 12px 14px;
            color: #f3f1f8;
            font-family: inherit;
            font-size: 14px;
            outline: none;
            transition: all 0.3s ease;
        }
        .feedback-input:focus, .feedback-textarea:focus {
            border-color: #7c3aed;
            background: rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
        }
        .feedback-textarea {
            height: 120px;
            resize: none;
        }
        .feedback-btn-submit {
            width: 100%;
            padding: 14px;
            background: #7c3aed;
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .feedback-btn-submit:hover {
            background: #6d28d9;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
        }
        .feedback-btn-submit:active {
            transform: translateY(1px);
        }
        .feedback-btn-submit:disabled {
            background: rgba(124, 58, 237, 0.5);
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .feedback-badge {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 13px;
            color: #e2e8f0;
            margin-bottom: 15px;
            display: inline-block;
        }
        .feedback-success {
            text-align: center;
            padding: 20px 0;
            animation: fadeIn 0.4s ease-out;
        }
        .feedback-success-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: inline-block;
            animation: pulse 2s infinite;
        }
        .feedback-success-title {
            font-size: 20px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 8px;
        }
        .feedback-success-desc {
            color: #a39eb9;
            font-size: 14px;
            line-height: 1.5;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Create Modal HTML elements
    let activeSectionName = "";
    let activeSectionId = "";

    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    overlay.appendChild(modal);

    function showForm() {
        const savedName = localStorage.getItem('feedback_user_name') || '';
        modal.innerHTML = `
            <div class="feedback-header">
                <h3 class="feedback-title">💬 Laisser une remarque</h3>
                <button class="feedback-close" id="feedbackCloseBtn">&times;</button>
            </div>
            <div class="feedback-badge">
                <strong>Section :</strong> <span id="feedbackActiveSectionName"></span>
            </div>
            <form id="feedbackForm">
                <div class="feedback-group">
                    <label class="feedback-label" for="feedbackName">Votre Nom / Email</label>
                    <input class="feedback-input" type="text" id="feedbackName" required placeholder="Ex: Client ou contact@..." value="${savedName}">
                </div>
                <div class="feedback-group">
                    <label class="feedback-label" for="feedbackComment">Votre remarque</label>
                    <textarea class="feedback-textarea" id="feedbackComment" required placeholder="Ce que vous aimeriez changer, corriger ou améliorer sur cette partie..."></textarea>
                </div>
                <button class="feedback-btn-submit" type="submit" id="feedbackSubmitBtn">
                    <span>Envoyer le retour</span>
                </button>
            </form>
        `;

        document.getElementById('feedbackActiveSectionName').textContent = activeSectionName;

        // Form Submission
        document.getElementById('feedbackForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            const submitBtn = document.getElementById('feedbackSubmitBtn');
            const nameInput = document.getElementById('feedbackName');
            const commentInput = document.getElementById('feedbackComment');

            const name = nameInput.value.trim();
            const comment = commentInput.value.trim();

            if (!name || !comment) return;

            // Save name for convenience next time
            localStorage.setItem('feedback_user_name', name);

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Envoi en cours...</span>';

            try {
                const response = await fetch('/feedback.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        section: activeSectionName,
                        section_id: activeSectionId,
                        comment: comment,
                        url: window.location.href
                    })
                });

                if (response.ok) {
                    showSuccess();
                } else {
                    const errText = await response.text();
                    alert("Erreur lors de l'envoi : " + (errText || "Erreur serveur"));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>Envoyer le retour</span>';
                }
            } catch (err) {
                alert("Erreur réseau : " + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Envoyer le retour</span>';
            }
        });

        // Close button handler
        document.getElementById('feedbackCloseBtn').addEventListener('click', closeModal);
    }

    function showSuccess() {
        modal.innerHTML = `
            <div class="feedback-success">
                <span class="feedback-success-icon">🎉</span>
                <h3 class="feedback-success-title">Remarque enregistrée !</h3>
                <p class="feedback-success-desc">Merci pour votre retour. Votre remarque sur la section <strong>${activeSectionName}</strong> a été transmise à l'administrateur avec succès.</p>
                <button class="feedback-btn-submit" style="margin-top: 25px;" id="feedbackCloseSuccessBtn">Fermer</button>
            </div>
        `;
        document.getElementById('feedbackCloseSuccessBtn').addEventListener('click', closeModal);
    }

    function openModal(sectionName, sectionId) {
        activeSectionName = sectionName;
        activeSectionId = sectionId;
        showForm();
        overlay.classList.add('active');
    }

    function closeModal() {
        overlay.classList.remove('active');
    }

    // Close on click outside modal
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Helper to extract a readable section name
    function getSectionName(el) {
        // Try custom attribute first
        if (el.getAttribute('data-feedback-name')) {
            return el.getAttribute('data-feedback-name');
        }
        // Try ID
        if (el.id) {
            return el.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        // Try first heading
        const h = el.querySelector('h1, h2, h3, h4');
        if (h) {
            const cleanText = h.textContent.trim().replace(/\s+/g, ' ');
            if (cleanText.length > 2 && cleanText.length < 50) {
                return cleanText;
            }
        }
        // Fallback
        return "Partie " + (el.tagName.toLowerCase()) + " (" + (el.className || "sans-classe") + ")";
    }

    // Initialize Widget: scan page for sections
    function init() {
        // Find structural elements (sections, main, headers, footers, etc.)
        const targets = document.querySelectorAll('section, header:not(nav header), footer, main > div[id]');
        targets.forEach(el => {
            // Skip elements that are nested inside other targets to avoid button stacking
            let parent = el.parentElement;
            let isNested = false;
            while (parent) {
                if (parent.tagName === 'SECTION' || parent.tagName === 'HEADER' || parent.tagName === 'FOOTER') {
                    isNested = true;
                    break;
                }
                parent = parent.parentElement;
            }
            if (isNested) return;

            // Make parent relative
            el.classList.add('feedback-relative-parent');

            const sectionName = getSectionName(el);
            const sectionId = el.id || '';

            // Add button
            const btn = document.createElement('button');
            btn.className = 'feedback-section-btn';
            btn.innerHTML = '<span>💬 Remarque</span>';
            btn.type = 'button';
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                openModal(sectionName, sectionId);
            });

            el.appendChild(btn);
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
