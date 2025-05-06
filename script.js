// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const snippetTextEl = document.getElementById('snippet-text');
    const snippetUrlEl = document.getElementById('snippet-url');
    const snippetCategoryEl = document.getElementById('snippet-category');
    const snippetNoteEl = document.getElementById('snippet-note');
    const newCategoryNameEl = document.getElementById('new-category-name');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const saveSnippetBtn = document.getElementById('save-snippet-btn');
    const snippetsListEl = document.getElementById('snippets-list');
    const currentYearEl = document.getElementById('current-year');
    const notificationAreaEl = document.getElementById('notification-area');

    // Search and Filter
    const searchInputEl = document.getElementById('search-input');
    const filterCategoryEl = document.getElementById('filter-category');

    // Views
    const mainViewEl = document.getElementById('main-view');
    const detailViewEl = document.getElementById('detail-view');

    // Detail View Elements (View Mode)
    const backToListBtn = document.getElementById('back-to-list-btn');
    const detailTitleEl = document.getElementById('detail-title');
    const detailCategoryViewEl = document.getElementById('detail-category-view');
    const detailTextViewEl = document.getElementById('detail-text-view');
    const detailUrlViewContainerEl = document.getElementById('detail-url-view-container');
    const detailUrlViewEl = document.getElementById('detail-url-view');
    const detailNoteViewContainerEl = document.getElementById('detail-note-view-container');
    const detailNoteViewEl = document.getElementById('detail-note-view');
    const detailDateViewEl = document.getElementById('detail-date-view');
    const editSnippetFromViewBtn = document.getElementById('edit-snippet-from-view-btn');

    // Detail View Elements (Edit Mode)
    const detailContentViewEl = document.getElementById('detail-content-view');
    const detailContentEditEl = document.getElementById('detail-content-edit');
    const editSnippetIdEl = document.getElementById('edit-snippet-id');
    const editSnippetTextEl = document.getElementById('edit-snippet-text');
    const editSnippetUrlEl = document.getElementById('edit-snippet-url');
    const editSnippetCategoryEl = document.getElementById('edit-snippet-category');
    const editSnippetNoteEl = document.getElementById('edit-snippet-note');
    const saveEditedSnippetBtn = document.getElementById('save-edited-snippet-btn');
    const cancelEditSnippetBtn = document.getElementById('cancel-edit-snippet-btn');

    // Intro Animation Elements
    const introOverlay = document.getElementById('intro-overlay');
    const dynamicLogo = document.getElementById('dynamic-logo');
    const introSubtitle = document.getElementById('intro-subtitle');
    const appContainer = document.getElementById('app-container');
    const headerLogoSVG = document.getElementById('header-logo-svg');

    const SNIPPETS_STORAGE_KEY = 'snipVaultSnippets_v2'; // Updated key for new structure
    const CATEGORIES_STORAGE_KEY = 'snipVaultCategories_v2';

    let currentEditingSnippetId = null; // To track which snippet is being viewed/edited

    // --- Navigation / View Management ---
    function showMainView() {
        mainViewEl.classList.remove('hidden');
        detailViewEl.classList.add('hidden');
        currentEditingSnippetId = null; // Clear when going back to list
        renderSnippets(); // Re-render to reflect any changes and apply filters
    }

    function showDetailView(snippetId, mode = 'view') { // mode can be 'view' or 'edit'
        const snippets = getSavedSnippets();
        const snippet = snippets.find(s => s.id === snippetId);
        if (!snippet) {
            showNotification('Error: Snippet not found.', 'error');
            showMainView();
            return;
        }

        currentEditingSnippetId = snippet.id;
        mainViewEl.classList.add('hidden');
        detailViewEl.classList.remove('hidden');

        if (mode === 'view') {
            detailContentViewEl.classList.remove('hidden');
            detailContentEditEl.classList.add('hidden');
            detailTitleEl.textContent = "Snippet Details";

            detailCategoryViewEl.textContent = snippet.category;
            detailTextViewEl.textContent = snippet.text;
            
            if (snippet.url) {
                detailUrlViewEl.href = snippet.url;
                detailUrlViewEl.textContent = snippet.url;
                detailUrlViewContainerEl.classList.remove('hidden');
            } else {
                detailUrlViewContainerEl.classList.add('hidden');
            }

            if (snippet.note) {
                detailNoteViewEl.textContent = snippet.note;
                detailNoteViewContainerEl.classList.remove('hidden');
            } else {
                detailNoteViewContainerEl.classList.add('hidden');
            }
            detailDateViewEl.textContent = `${new Date(snippet.createdAt).toLocaleDateString()} ${new Date(snippet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        } else if (mode === 'edit') {
            detailContentViewEl.classList.add('hidden');
            detailContentEditEl.classList.remove('hidden');
            detailTitleEl.textContent = "Edit Snippet";

            editSnippetIdEl.value = snippet.id;
            editSnippetTextEl.value = snippet.text;
            editSnippetUrlEl.value = snippet.url;
            // Repopulate and set category for editing
            populateCategoryDropdown(editSnippetCategoryEl); 
            editSnippetCategoryEl.value = snippet.category;
            editSnippetNoteEl.value = snippet.note;
        }
        window.scrollTo(0, 0); // Scroll to top of detail view
    }
    
    // --- Notifications ---
    function showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
        
        notificationAreaEl.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500); // Remove from DOM after fade out
        }, duration);
    }

    // --- Intro Animation ---
    function playIntroAnimation() {
        if (!introOverlay) return; // Guard if already removed
        dynamicLogo.classList.add('animate-pop');
        setTimeout(() => introSubtitle.classList.add('animate-fade-in-up'), 300);
        setTimeout(() => {
            introOverlay.style.opacity = '0';
            introOverlay.style.pointerEvents = 'none';
            appContainer.classList.add('loaded');
            setTimeout(() => {
                if (headerLogoSVG) {
                    const paths = headerLogoSVG.querySelectorAll('path');
                    paths.forEach(path => {
                        const length = path.getTotalLength();
                        path.style.strokeDasharray = length;
                        path.style.strokeDashoffset = length;
                        path.style.animation = `drawPath 2s 0.5s ease-out forwards`;
                    });
                }
            }, 500);
        }, 2000);
        setTimeout(() => {
            if (introOverlay && introOverlay.parentNode) {
                introOverlay.parentNode.removeChild(introOverlay);
            }
        }, 3000);
    }

    // --- Category Management ---
    function populateCategoryDropdown(selectElement) {
        const savedCategories = JSON.parse(localStorage.getItem(CATEGORIES_STORAGE_KEY)) || [];
        const defaultCategories = ["General", "Code Snippets", "Recipes", "Bookmarks", "Ideas", "Learning"];
        let categoriesToLoad = [...new Set([...defaultCategories, ...savedCategories])];
        
        selectElement.innerHTML = ''; // Clear existing options

        if (selectElement.id === 'filter-category') { // Add "All Categories" for filter
            const allOption = document.createElement('option');
            allOption.value = "";
            allOption.textContent = "All Categories";
            selectElement.appendChild(allOption);
        }

        categoriesToLoad.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        });
    }

    function loadCategories() {
        populateCategoryDropdown(snippetCategoryEl); // For new snippet form
        populateCategoryDropdown(filterCategoryEl); // For filter dropdown
        // Edit form category dropdown is populated when switching to edit mode
    }

    function handleAddCategory() {
        const newCategoryName = newCategoryNameEl.value.trim();
        if (newCategoryName === '') {
            showNotification('Category name cannot be empty.', 'error');
            return;
        }
        const currentCategories = JSON.parse(localStorage.getItem(CATEGORIES_STORAGE_KEY)) || [];
        if (currentCategories.map(c => c.toLowerCase()).includes(newCategoryName.toLowerCase())) {
            showNotification('This category already exists.', 'info');
            newCategoryNameEl.value = '';
            return;
        }
        currentCategories.push(newCategoryName);
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(currentCategories));
        
        loadCategories(); // Reload all category dropdowns
        snippetCategoryEl.value = newCategoryName; // Select new category in form
        if (editSnippetCategoryEl.closest('#detail-view:not(.hidden)')) { // if edit view is active
            editSnippetCategoryEl.value = newCategoryName;
        }
        newCategoryNameEl.value = '';
        showNotification(`Category "${newCategoryName}" added.`, 'success');
    }

    // --- Snippet Management ---
    function getSavedSnippets() {
        return JSON.parse(localStorage.getItem(SNIPPETS_STORAGE_KEY)) || [];
    }

    function storeSnippets(snippets) {
        localStorage.setItem(SNIPPETS_STORAGE_KEY, JSON.stringify(snippets));
    }

    function renderSnippets(isNewSnippetAdded = false) {
        let snippets = getSavedSnippets();
        const searchTerm = searchInputEl.value.toLowerCase();
        const selectedCategory = filterCategoryEl.value;

        // Filter snippets
        if (searchTerm) {
            snippets = snippets.filter(s => 
                s.text.toLowerCase().includes(searchTerm) ||
                (s.note && s.note.toLowerCase().includes(searchTerm)) ||
                (s.url && s.url.toLowerCase().includes(searchTerm)) ||
                s.category.toLowerCase().includes(searchTerm)
            );
        }
        if (selectedCategory) {
            snippets = snippets.filter(s => s.category === selectedCategory);
        }

        snippets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort newest first
        
        snippetsListEl.innerHTML = '';
        if (snippets.length === 0) {
            snippetsListEl.innerHTML = `<p class="no-snippets-message"><i class="fas fa-folder-open fa-2x mb-3 text-gray-400"></i><br>No snippets found. Try adjusting your search or add a new one!</p>`;
            return;
        }

        snippets.forEach((snippet, index) => {
            const snippetItem = document.createElement('div');
            snippetItem.className = 'snippet-item';
            if (isNewSnippetAdded && snippet.id === snippets[0].id) { // Highlight if it's the newest one just added
                snippetItem.classList.add('new-snippet-animation');
            }

            // Header: Category and Actions
            const headerDiv = document.createElement('div');
            headerDiv.className = 'snippet-header';
            
            const titleCategoryDiv = document.createElement('div');
            titleCategoryDiv.className = 'snippet-title-category';
            const categoryTag = document.createElement('span');
            categoryTag.className = 'snippet-category-tag';
            categoryTag.textContent = snippet.category || 'General';
            titleCategoryDiv.appendChild(categoryTag);
            // Could add a title element here in future if snippets have titles
            headerDiv.appendChild(titleCategoryDiv);

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'snippet-actions';
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = `<i class="fas fa-edit"></i> Edit`;
            editBtn.className = 'action-btn edit-btn';
            editBtn.title = "Edit snippet";
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDetailView(snippet.id, 'edit');
            });
            actionsDiv.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Delete`;
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.title = "Delete snippet";
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteSnippet(snippet.id);
            });
            actionsDiv.appendChild(deleteBtn);
            headerDiv.appendChild(actionsDiv);
            snippetItem.appendChild(headerDiv);

            // Snippet Text Preview
            const textPreviewP = document.createElement('p');
            textPreviewP.className = 'snippet-text-preview';
            textPreviewP.textContent = snippet.text; // CSS will handle truncation
            snippetItem.appendChild(textPreviewP);

            // Read More Button
            const readMoreBtn = document.createElement('button');
            readMoreBtn.className = 'read-more-btn';
            readMoreBtn.innerHTML = 'Read More <i class="fas fa-arrow-right ml-1"></i>';
            readMoreBtn.addEventListener('click', () => showDetailView(snippet.id, 'view'));
            snippetItem.appendChild(readMoreBtn);

            // Meta Info (URL, Note, Date) for List View
            const metaListDiv = document.createElement('div');
            metaListDiv.className = 'snippet-meta-list-view';
            if (snippet.url) {
                metaListDiv.innerHTML += `<p><i class="fas fa-link"></i> <a href="${snippet.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${snippet.url.length > 30 ? snippet.url.substring(0,27)+'...' : snippet.url}</a></p>`;
            }
            if (snippet.note) {
                 metaListDiv.innerHTML += `<p><i class="fas fa-sticky-note"></i> ${snippet.note.length > 30 ? snippet.note.substring(0,27)+'...' : snippet.note}</p>`;
            }
            metaListDiv.innerHTML += `<p><i class="fas fa-calendar-alt"></i> ${new Date(snippet.createdAt).toLocaleDateString()}</p>`;
            snippetItem.appendChild(metaListDiv);

            snippetsListEl.appendChild(snippetItem);
        });
        if (isNewSnippetAdded) {
            const firstSnippet = snippetsListEl.firstChild;
            if (firstSnippet) {
                firstSnippet.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    function handleSaveSnippet() {
        const text = snippetTextEl.value.trim();
        const urlInput = snippetUrlEl.value.trim();
        const category = snippetCategoryEl.value;
        const note = snippetNoteEl.value.trim();

        if (text === '') {
            showNotification('Snippet content cannot be empty.', 'error');
            return;
        }
        const url = (urlInput && !(urlInput.startsWith('http://') || urlInput.startsWith('https://'))) ? `http://${urlInput}` : urlInput;

        const newSnippet = {
            id: Date.now().toString(),
            text, url, category, note,
            createdAt: new Date().toISOString()
        };
        let snippets = getSavedSnippets();
        snippets.unshift(newSnippet);
        storeSnippets(snippets);
        renderSnippets(true); // Pass true to indicate a new snippet was added

        snippetTextEl.value = ''; snippetUrlEl.value = ''; snippetNoteEl.value = '';
        snippetTextEl.focus();
        showNotification('Snippet saved successfully!', 'success');
    }
    
    function handleSaveEditedSnippet() {
        const id = editSnippetIdEl.value;
        const text = editSnippetTextEl.value.trim();
        const urlInput = editSnippetUrlEl.value.trim();
        const category = editSnippetCategoryEl.value;
        const note = editSnippetNoteEl.value.trim();

        if (text === '') {
            showNotification('Snippet content cannot be empty.', 'error');
            return;
        }
        const url = (urlInput && !(urlInput.startsWith('http://') || urlInput.startsWith('https://'))) ? `http://${urlInput}` : urlInput;

        let snippets = getSavedSnippets();
        const snippetIndex = snippets.findIndex(s => s.id === id);
        if (snippetIndex === -1) {
            showNotification('Error: Could not find snippet to update.', 'error');
            return;
        }
        snippets[snippetIndex] = { ...snippets[snippetIndex], text, url, category, note, updatedAt: new Date().toISOString() };
        storeSnippets(snippets);
        showNotification('Snippet updated successfully!', 'success');
        showDetailView(id, 'view'); // Go back to view mode for the same snippet
    }

    function handleDeleteSnippet(snippetId) {
        // Could add a custom confirmation modal here later instead of confirm()
        if (confirm('Are you sure you want to delete this snippet? This action cannot be undone.')) {
            let snippets = getSavedSnippets();
            snippets = snippets.filter(snippet => snippet.id !== snippetId);
            storeSnippets(snippets);
            showNotification('Snippet deleted.', 'info');
            if (detailViewEl.classList.contains('hidden')) { // If on main list view
                renderSnippets();
            } else { // If on detail view of the deleted snippet
                showMainView();
            }
        }
    }
    
    function setFooterYear() {
        if(currentYearEl) currentYearEl.textContent = new Date().getFullYear();
    }

    // --- Event Listeners ---
    addCategoryBtn.addEventListener('click', handleAddCategory);
    saveSnippetBtn.addEventListener('click', handleSaveSnippet);
    searchInputEl.addEventListener('input', () => renderSnippets());
    filterCategoryEl.addEventListener('change', () => renderSnippets());

    // Detail View Listeners
    backToListBtn.addEventListener('click', showMainView);
    editSnippetFromViewBtn.addEventListener('click', () => {
        if (currentEditingSnippetId) showDetailView(currentEditingSnippetId, 'edit');
    });
    saveEditedSnippetBtn.addEventListener('click', handleSaveEditedSnippet);
    cancelEditSnippetBtn.addEventListener('click', () => {
        if (currentEditingSnippetId) showDetailView(currentEditingSnippetId, 'view'); // Revert to view mode
    });


    // --- Initial Load ---
    playIntroAnimation();
    loadCategories(); 
    renderSnippets();
    setFooterYear();
});

