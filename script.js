// script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const snippetTextEl = document.getElementById('snippet-text');
    const snippetUrlEl = document.getElementById('snippet-url');
    const snippetCategoryEl = document.getElementById('snippet-category');
    const snippetNoteEl = document.getElementById('snippet-note');
    const newCategoryNameEl = document.getElementById('new-category-name');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const saveSnippetBtn = document.getElementById('save-snippet-btn');
    const snippetsListEl = document.getElementById('snippets-list');
    const currentYearEl = document.getElementById('current-year');

    // Intro Animation Elements
    const introOverlay = document.getElementById('intro-overlay');
    const dynamicLogo = document.getElementById('dynamic-logo');
    const introSubtitle = document.getElementById('intro-subtitle');
    const appContainer = document.getElementById('app-container');
    const headerLogoSVG = document.getElementById('header-logo-svg');


    const SNIPPETS_STORAGE_KEY = 'snipVaultSnippets'; // Updated key
    const CATEGORIES_STORAGE_KEY = 'snipVaultCategories'; // Updated key

    // --- Intro Animation ---
    function playIntroAnimation() {
        // Animate logo first
        dynamicLogo.classList.add('animate-pop');

        // Animate subtitle after logo
        setTimeout(() => {
            introSubtitle.classList.add('animate-fade-in-up');
        }, 300); // Start subtitle animation slightly after logo animation begins

        // Fade out overlay and show app content
        setTimeout(() => {
            introOverlay.style.opacity = '0';
            introOverlay.style.pointerEvents = 'none'; // Allow interaction with content below
            
            appContainer.classList.add('loaded'); // Trigger app container fade-in and slide-up

            // Trigger header SVG logo animation after app container starts loading
            setTimeout(() => {
                if (headerLogoSVG) { // Check if element exists
                    const paths = headerLogoSVG.querySelectorAll('path');
                    paths.forEach(path => {
                        path.style.strokeDasharray = path.getTotalLength();
                        path.style.strokeDashoffset = path.getTotalLength();
                        path.style.animation = 'drawPath 2s 0.5s ease-out forwards';
                    });
                }
            }, 500); // Delay to sync with app container appearance


        }, 2000); // Duration of intro screen before fading out

        // Remove overlay from DOM after transition
        setTimeout(() => {
            if (introOverlay.parentNode) {
                introOverlay.parentNode.removeChild(introOverlay);
            }
        }, 3000); // introOverlay opacity transition is 1s
    }


    // --- Category Management ---
    function loadCategories() {
        const savedCategories = JSON.parse(localStorage.getItem(CATEGORIES_STORAGE_KEY));
        const defaultCategories = ["General", "Code Snippets", "Recipes", "Bookmarks", "Ideas", "Learning"];
        
        let categoriesToLoad = defaultCategories;

        if (savedCategories && Array.isArray(savedCategories) && savedCategories.length > 0) {
            categoriesToLoad = [...new Set([...defaultCategories, ...savedCategories])];
        }
        
        snippetCategoryEl.innerHTML = ''; 
        categoriesToLoad.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            snippetCategoryEl.appendChild(option);
        });

        if (JSON.stringify(categoriesToLoad) !== JSON.stringify(savedCategories)) {
            localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categoriesToLoad));
        }
    }

    function handleAddCategory() {
        const newCategoryName = newCategoryNameEl.value.trim();
        if (newCategoryName === '') {
            // Consider a more styled notification later
            alert('Category name cannot be empty.'); 
            return;
        }

        const existingOptions = Array.from(snippetCategoryEl.options).map(opt => opt.value.toLowerCase());
        if (existingOptions.includes(newCategoryName.toLowerCase())) {
            alert('This category already exists.');
            newCategoryNameEl.value = '';
            return;
        }

        const option = document.createElement('option');
        option.value = newCategoryName;
        option.textContent = newCategoryName;
        snippetCategoryEl.appendChild(option);
        snippetCategoryEl.value = newCategoryName;

        const currentCategories = Array.from(snippetCategoryEl.options).map(opt => opt.value);
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(currentCategories));
        
        newCategoryNameEl.value = '';
    }

    // --- Snippet Management ---
    function getSavedSnippets() {
        return JSON.parse(localStorage.getItem(SNIPPETS_STORAGE_KEY)) || [];
    }

    function storeSnippets(snippets) {
        localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
    }

    function renderSnippets(isNewSnippet = false) {
        const snippets = getSavedSnippets();
        // Store the current scroll position
        const scrollPosition = window.scrollY;

        snippetsListEl.innerHTML = ''; 

        if (snippets.length === 0) {
            snippetsListEl.innerHTML = `<p class="no-snippets-message"><i class="fas fa-folder-open fa-2x mb-3 text-gray-400"></i><br>Your vault is empty! Add your first snippet.</p>`;
            return;
        }

        // Sort snippets by creation date, newest first
        snippets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


        snippets.forEach((snippet, index) => {
            const snippetItem = document.createElement('div');
            snippetItem.className = 'snippet-item'; // Base class from CSS
             // Add animation class only to the newest snippet if it's just added
            if (isNewSnippet && index === 0) { // Assumes newest is pushed to the start or sorted so
                snippetItem.classList.add('new-snippet-animation');
            }


            // Snippet Header (Category Tag and Delete Button)
            const headerDiv = document.createElement('div');
            headerDiv.className = 'snippet-header';

            const categoryTag = document.createElement('span');
            categoryTag.className = 'snippet-category-tag';
            categoryTag.textContent = snippet.category || 'General';
            headerDiv.appendChild(categoryTag);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i>`; // Using Font Awesome
            deleteBtn.className = 'delete-btn';
            deleteBtn.title = "Delete snippet";
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering other click events on the card
                handleDeleteSnippet(snippet.id); // Use ID for deletion
            });
            headerDiv.appendChild(deleteBtn);
            snippetItem.appendChild(headerDiv);

            // Snippet Text
            const textP = document.createElement('p');
            textP.className = 'snippet-text-content';
            textP.textContent = snippet.text;
            snippetItem.appendChild(textP);
            
            // Meta Information (URL, Note, Date)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'snippet-meta';

            if (snippet.url) {
                const urlP = document.createElement('p');
                urlP.innerHTML = `<i class="fas fa-link"></i><strong>Source:</strong> <a href="${snippet.url}" target="_blank" rel="noopener noreferrer">${snippet.url}</a>`;
                metaDiv.appendChild(urlP);
            }

            if (snippet.note) {
                const noteDiv = document.createElement('div'); // Changed to div for better styling
                noteDiv.className = 'snippet-note-content';
                noteDiv.innerHTML = `<strong>Note:</strong> ${snippet.note}`; // Keep strong for "Note:"
                metaDiv.appendChild(noteDiv); // Appending the div directly
            }
            
            const dateP = document.createElement('p');
            dateP.innerHTML = `<i class="fas fa-calendar-alt"></i><strong>Saved:</strong> ${new Date(snippet.createdAt).toLocaleDateString()} ${new Date(snippet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            metaDiv.appendChild(dateP);
            
            if (snippet.url || snippet.note || snippet.createdAt) {
                 snippetItem.appendChild(metaDiv);
            }

            snippetsListEl.appendChild(snippetItem);
        });
        // Restore scroll position after rendering
        if (!isNewSnippet) { // Avoid jump if adding new snippet to top
            window.scrollTo(0, scrollPosition);
        } else {
             // Optionally, scroll the new item into view if it's added at the top
            const firstSnippet = snippetsListEl.firstChild;
            if (firstSnippet) {
                firstSnippet.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    function handleSaveSnippet() {
        const text = snippetTextEl.value.trim();
        const url = snippetUrlEl.value.trim();
        const category = snippetCategoryEl.value;
        const note = snippetNoteEl.value.trim();

        if (text === '') {
            alert('Snippet content cannot be empty.');
            return;
        }

        const newSnippet = {
            id: Date.now().toString(), // Ensure ID is a string for consistency if ever needed
            text,
            url: (url && (url.startsWith('http://') || url.startsWith('https://'))) ? url : (url ? `http://${url}` : ''), // Basic URL prefixing
            category,
            note,
            createdAt: new Date().toISOString()
        };

        let snippets = getSavedSnippets();
        snippets.unshift(newSnippet); // Add new snippet to the beginning for "newest first"
        storeSnippets(snippets);
        renderSnippets(true); // Pass true to indicate a new snippet was added

        // Clear input fields
        snippetTextEl.value = '';
        snippetUrlEl.value = '';
        snippetNoteEl.value = '';
        // snippetCategoryEl.value = 'General'; // Reset category or keep current
        snippetTextEl.focus(); // Focus back on the main text area
    }

    function handleDeleteSnippet(snippetId) {
        if (confirm('Are you sure you want to delete this snippet? This action cannot be undone.')) {
            let snippets = getSavedSnippets();
            snippets = snippets.filter(snippet => snippet.id !== snippetId);
            storeSnippets(snippets);
            renderSnippets();
        }
    }
    
    function setFooterYear() {
        if(currentYearEl) {
            currentYearEl.textContent = new Date().getFullYear();
        }
    }

    // --- Event Listeners ---
    addCategoryBtn.addEventListener('click', handleAddCategory);
    saveSnippetBtn.addEventListener('click', handleSaveSnippet);

    // --- Initial Load ---
    playIntroAnimation(); // Play intro animation
    loadCategories(); 
    renderSnippets();
    setFooterYear();
});
