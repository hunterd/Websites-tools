// feedback-widget.js
(function () {
    // Prevent multiple initializations
    if (window.__feedbackWidgetInitialized) return;
    window.__feedbackWidgetInitialized = true;

    // Initialize Client ID
    let clientId = localStorage.getItem('feedback_client_id');
    if (!clientId) {
        clientId = 'c_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('feedback_client_id', clientId);
    }

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
            max-width: 500px;
            padding: 30px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: translateY(20px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: 'Outfit', sans-serif;
            color: #f3f1f8;
            display: flex;
            flex-direction: column;
        }
        .feedback-overlay.active .feedback-modal {
            transform: translateY(0) scale(1);
        }
        .feedback-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
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
        
        .feedback-badge {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 13px;
            color: #e2e8f0;
            margin-bottom: 18px;
            align-self: flex-start;
        }

        /* Chat Discussion Thread */
        .feedback-chat-container {
            max-height: 220px;
            overflow-y: auto;
            margin-bottom: 20px;
            padding-right: 5px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 20px;
        }
        
        /* Scrollbar styles */
        .feedback-chat-container::-webkit-scrollbar {
            width: 6px;
        }
        .feedback-chat-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.01);
            border-radius: 3px;
        }
        .feedback-chat-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }
        .feedback-chat-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        /* Message Bubble */
        .feedback-msg-bubble {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            padding: 10px 14px;
            max-width: 85%;
            align-self: flex-start;
            animation: slideIn 0.3s ease-out;
            position: relative;
        }
        
        .feedback-msg-bubble.creator {
            background: rgba(124, 58, 237, 0.1);
            border-color: rgba(124, 58, 237, 0.25);
            align-self: flex-end;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .feedback-msg-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 4px;
            font-size: 11px;
            font-weight: 500;
        }
        .feedback-msg-author {
            color: #ffffff;
        }
        .feedback-msg-bubble.creator .feedback-msg-author {
            color: #c084fc;
        }
        .feedback-msg-date {
            color: #a39eb9;
        }
        .feedback-msg-text {
            font-size: 13px;
            line-height: 1.5;
            color: #e2e8f0;
            white-space: pre-wrap;
            text-align: left;
        }

        .feedback-chat-placeholder {
            text-align: center;
            color: #a39eb9;
            font-size: 13px;
            padding: 30px 10px;
            font-style: italic;
        }
        
        .feedback-chat-loading {
            text-align: center;
            color: #a39eb9;
            font-size: 13px;
            padding: 35px 10px;
        }

        /* Edit Controls */
        .feedback-msg-edit-btn {
            background: none;
            border: none;
            color: #8b5cf6;
            cursor: pointer;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            transition: all 0.2s;
            margin-left: 6px;
        }
        .feedback-msg-edit-btn:hover {
            color: #c084fc;
            background: rgba(124, 58, 237, 0.15);
        }

        .feedback-msg-edited-badge {
            font-size: 10px;
            color: #a39eb9;
            cursor: pointer;
            text-decoration: underline;
            margin-left: 6px;
            position: relative;
            user-select: none;
        }
        .feedback-msg-edited-badge:hover {
            color: #ffffff;
        }

        /* History Popup */
        .feedback-history-popup {
            display: none;
            position: absolute;
            top: 25px;
            left: 0;
            background: #181528;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 12px;
            padding: 12px;
            width: 250px;
            z-index: 10000;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            font-size: 11px;
            color: #d1d5db;
        }
        .feedback-history-popup.active {
            display: block;
        }
        .feedback-history-title {
            font-weight: 600;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 5px;
            margin-bottom: 6px;
            color: #ffffff;
        }
        .feedback-history-item {
            border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
            padding: 5px 0;
        }
        .feedback-history-item:last-child {
            border-bottom: none;
        }
        .feedback-history-meta {
            color: #a39eb9;
            margin-bottom: 2px;
        }
        .feedback-history-comment {
            white-space: pre-wrap;
        }

        /* Form styling */
        .feedback-group {
            margin-bottom: 14px;
        }
        .feedback-label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 6px;
            color: #a39eb9;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .feedback-input, .feedback-textarea {
            width: 100%;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 10px 12px;
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
            height: 70px;
            resize: none;
        }
        
        .feedback-form-buttons {
            display: flex;
            gap: 10px;
        }
        
        .feedback-btn-submit {
            flex: 1;
            padding: 12px;
            background: #7c3aed;
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 14px;
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

        .feedback-btn-cancel {
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            color: #a39eb9;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .feedback-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Create Modal HTML elements
    let activeSectionName = "";
    let activeSectionId = "";
    
    // State variables for editing
    let editingMessageId = null;
    let messagesCache = [];

    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    overlay.appendChild(modal);

    // Formatter utility for Date
    function formatDate(dateString) {
        try {
            const date = new Date(dateString.replace(/-/g, '/'));
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Helper to check if author is David / Creator
    function isCreator(authorName) {
        const lower = authorName.toLowerCase();
        return lower.includes('david') || lower.includes('mussard') || lower.includes('admin') || lower.includes('créateur');
    }

    // Load and render discussion thread
    async function loadDiscussion() {
        const container = document.getElementById('feedbackChatContainer');
        if (!container) return;

        try {
            const response = await fetch(`/feedback.php?section=${encodeURIComponent(activeSectionName)}&client_id=${clientId}`);
            if (!response.ok) throw new Error("Could not fetch messages");
            const messages = await response.json();
            messagesCache = messages; // cache them so we can query comments when editing

            if (messages.length === 0) {
                container.innerHTML = `<div class="feedback-chat-placeholder">Aucune remarque pour le moment. Laissez un message ci-dessous !</div>`;
            } else {
                container.innerHTML = messages.map(msg => {
                    const isDev = isCreator(msg.name);
                    const hasHistory = msg.history && msg.history.length > 0;
                    
                    // Render edit history sub-items if present
                    let historyHtml = '';
                    if (hasHistory) {
                        historyHtml = `
                            <span class="feedback-msg-edited-badge" data-msg-id="${msg.id}">
                                (modifié)
                                <div class="feedback-history-popup" id="hist_${msg.id}">
                                    <div class="feedback-history-title">Historique des modifications</div>
                                    ${msg.history.map(h => `
                                        <div class="feedback-history-item">
                                            <div class="feedback-history-meta">Par <strong>${h.name}</strong> le ${formatDate(h.date)}</div>
                                            <div class="feedback-history-comment">${h.comment}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </span>
                        `;
                    }

                    // Render edit button if owned
                    const editButtonHtml = msg.is_mine ? `
                        <button type="button" class="feedback-msg-edit-btn" data-edit-msg-id="${msg.id}">Modifier</button>
                    ` : '';

                    return `
                        <div class="feedback-msg-bubble ${isDev ? 'creator' : ''}" id="bubble_${msg.id}">
                            <div class="feedback-msg-meta">
                                <span class="feedback-msg-author">${msg.name}</span>
                                <div>
                                    <span class="feedback-msg-date">${formatDate(msg.date)}</span>
                                    ${historyHtml}
                                    ${editButtonHtml}
                                </div>
                            </div>
                            <div class="feedback-msg-text" id="text_${msg.id}">${msg.comment}</div>
                        </div>
                    `;
                }).join('');
                
                // Attach event handlers for history badge toggles
                container.querySelectorAll('.feedback-msg-edited-badge').forEach(badge => {
                    badge.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const msgId = this.getAttribute('data-msg-id');
                        const popup = document.getElementById('hist_' + msgId);
                        if (popup) {
                            // Toggle
                            popup.classList.toggle('active');
                        }
                    });
                });

                // Attach event handlers for edit buttons
                container.querySelectorAll('.feedback-msg-edit-btn').forEach(btn => {
                    btn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        const msgId = this.getAttribute('data-edit-msg-id');
                        enterEditMode(msgId);
                    });
                });

                // Auto scroll to bottom
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            container.innerHTML = `<div class="feedback-chat-placeholder" style="color: #ef4444;">Impossible de charger la discussion : ${e.message}</div>`;
        }
    }

    // Enter Edit Mode
    function enterEditMode(msgId) {
        const msg = messagesCache.find(m => m.id === msgId);
        if (!msg) return;

        editingMessageId = msgId;
        
        // Highlight active message bubble
        document.querySelectorAll('.feedback-msg-bubble').forEach(b => b.style.outline = 'none');
        const bubble = document.getElementById('bubble_' + msgId);
        if (bubble) {
            bubble.style.outline = '2px solid #7c3aed';
        }

        // Fill in fields
        const nameInput = document.getElementById('feedbackName');
        const commentInput = document.getElementById('feedbackComment');
        const submitBtn = document.getElementById('feedbackSubmitBtn');
        const cancelBtn = document.getElementById('feedbackCancelBtn');

        nameInput.value = msg.name;
        commentInput.value = msg.comment;
        commentInput.focus();

        // Update buttons
        submitBtn.querySelector('span').textContent = "Mettre à jour";
        cancelBtn.style.display = 'block';
    }

    // Exit Edit Mode
    function exitEditMode() {
        editingMessageId = null;
        
        // Remove outline highlight
        document.querySelectorAll('.feedback-msg-bubble').forEach(b => b.style.outline = 'none');

        // Reset inputs to default values
        let defaultName = '';
        if (window.__feedbackConfig && window.__feedbackConfig.defaultName) {
            defaultName = window.__feedbackConfig.defaultName;
        }
        const savedName = localStorage.getItem('feedback_user_name') || defaultName;

        const nameInput = document.getElementById('feedbackName');
        const commentInput = document.getElementById('feedbackComment');
        const submitBtn = document.getElementById('feedbackSubmitBtn');
        const cancelBtn = document.getElementById('feedbackCancelBtn');

        nameInput.value = savedName;
        commentInput.value = '';

        // Update buttons
        submitBtn.querySelector('span').textContent = "Envoyer la remarque";
        cancelBtn.style.display = 'none';
    }

    function showForm() {
        let defaultName = '';
        if (window.__feedbackConfig && window.__feedbackConfig.defaultName) {
            defaultName = window.__feedbackConfig.defaultName;
        }
        const savedName = localStorage.getItem('feedback_user_name') || defaultName;

        modal.innerHTML = `
            <div class="feedback-header">
                <h3 class="feedback-title">💬 Discussion de section</h3>
                <button class="feedback-close" id="feedbackCloseBtn">&times;</button>
            </div>
            <div class="feedback-badge">
                <strong>Section :</strong> <span id="feedbackActiveSectionName"></span>
            </div>
            
            <!-- Chat history -->
            <div class="feedback-chat-container" id="feedbackChatContainer">
                <div class="feedback-chat-loading">Chargement des échanges...</div>
            </div>

            <!-- Form input -->
            <form id="feedbackForm">
                <div class="feedback-group">
                    <label class="feedback-label" for="feedbackName">Votre Nom / Identifiant</label>
                    <input class="feedback-input" type="text" id="feedbackName" required placeholder="Ex: Client ou contact@..." value="${savedName}">
                </div>
                <div class="feedback-group">
                    <label class="feedback-label" for="feedbackComment">Votre remarque / réponse</label>
                    <textarea class="feedback-textarea" id="feedbackComment" required placeholder="Tapez votre message ici..."></textarea>
                </div>
                <div class="feedback-form-buttons">
                    <button class="feedback-btn-cancel" type="button" id="feedbackCancelBtn" style="display: none;">Annuler</button>
                    <button class="feedback-btn-submit" type="submit" id="feedbackSubmitBtn">
                        <span>Envoyer la remarque</span>
                    </button>
                </div>
            </form>
        `;

        document.getElementById('feedbackActiveSectionName').textContent = activeSectionName;

        // Load messages
        loadDiscussion();

        // Cancel Button Handler
        document.getElementById('feedbackCancelBtn').addEventListener('click', exitEditMode);

        // Form Submission
        document.getElementById('feedbackForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            const submitBtn = document.getElementById('feedbackSubmitBtn');
            const nameInput = document.getElementById('feedbackName');
            const commentInput = document.getElementById('feedbackComment');

            const name = nameInput.value.trim();
            const comment = commentInput.value.trim();

            if (!name || !comment) return;

            // Save name preference
            localStorage.setItem('feedback_user_name', name);

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Traitement...</span>';

            const payload = {
                client_id: clientId,
                name: name,
                comment: comment,
                section: activeSectionName,
                section_id: activeSectionId,
                url: window.location.href
            };

            // If in edit mode, append edit action details
            if (editingMessageId) {
                payload.action = 'edit';
                payload.id = editingMessageId;
            }

            try {
                const response = await fetch('/feedback.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    // Reset edit state and clear textarea
                    exitEditMode();
                    // Reload chat thread
                    await loadDiscussion();
                } else {
                    const errText = await response.text();
                    alert("Erreur lors de la soumission : " + (errText || "Erreur serveur"));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = editingMessageId ? '<span>Mettre à jour</span>' : '<span>Envoyer la remarque</span>';
                }
            } catch (err) {
                alert("Erreur réseau : " + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = editingMessageId ? '<span>Mettre à jour</span>' : '<span>Envoyer la remarque</span>';
            }
        });

        // Close button handler
        document.getElementById('feedbackCloseBtn').addEventListener('click', closeModal);
    }

    function openModal(sectionName, sectionId) {
        activeSectionName = sectionName;
        activeSectionId = sectionId;
        showForm();
        overlay.classList.add('active');
    }

    function closeModal() {
        overlay.classList.remove('active');
        editingMessageId = null; // reset edit state when closed
    }

    // Close on click outside modal
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeModal();
        }
        // Close history popups when clicking anywhere else
        document.querySelectorAll('.feedback-history-popup').forEach(p => {
            p.classList.remove('active');
        });
    });

    // Helper to extract a readable section name
    function getSectionName(el) {
        if (el.getAttribute('data-feedback-name')) {
            return el.getAttribute('data-feedback-name');
        }
        if (el.id) {
            return el.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
        const h = el.querySelector('h1, h2, h3, h4');
        if (h) {
            const cleanText = h.textContent.trim().replace(/\s+/g, ' ');
            if (cleanText.length > 2 && cleanText.length < 50) {
                return cleanText;
            }
        }
        return "Partie " + (el.tagName.toLowerCase()) + " (" + (el.className || "sans-classe") + ")";
    }

    // Initialize Widget: scan page for sections
    function init() {
        const targets = document.querySelectorAll('section, header:not(nav header), footer, main > div[id]');
        targets.forEach(el => {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
