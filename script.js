// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Configuration ---
    // IMPORTANT: Replace with your actual Firebase project configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAY3ODjMfF62CiiWYV90ndSv7EaEzm1U2g",
        authDomain: "snippetsaver-1136b.firebaseapp.com",
        projectId: "snippetsaver-1136b",
        storageBucket: "snippetsaver-1136b.firebasestorage.app",
        messagingSenderId: "616307570898",
        appId: "1:616307570898:web:63679fcd1472efaf1b550b",
        measurementId: "G-4VJ6G94VGZ"
      };

    // Initialize Firebase
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not loaded. Ensure firebase-app-compat.js is included and loaded before this script.");
            const tempNotificationArea = document.getElementById('notification-area');
            if (tempNotificationArea) {
                tempNotificationArea.innerHTML = `<div class="notification error show" style="transform: translateX(0); opacity: 1;"><i class="fas fa-exclamation-circle"></i> Application files are missing. Please contact support.</div>`;
            }
            return; 
        }
    } catch (e) {
        console.error("Error initializing Firebase. Ensure SDKs are loaded and config is correct.", e);
        const tempNotificationArea = document.getElementById('notification-area');
        if (tempNotificationArea) {
             tempNotificationArea.innerHTML = `<div class="notification error show" style="transform: translateX(0); opacity: 1;"><i class="fas fa-exclamation-circle"></i> Error initializing application. Please try again later.</div>`;
        }
        return; 
    }
    
    const auth = firebase.auth();
    const db = firebase.firestore();
    let currentUser = null; 
    let snippetsUnsubscribe = null; 
    let categoriesUnsubscribe = null; 


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
    const searchInputEl = document.getElementById('search-input');
    const filterCategoryEl = document.getElementById('filter-category');
    const mainViewEl = document.getElementById('main-view');
    const detailViewEl = document.getElementById('detail-view');
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
    const detailContentViewEl = document.getElementById('detail-content-view');
    const detailContentEditEl = document.getElementById('detail-content-edit');
    const editSnippetIdEl = document.getElementById('edit-snippet-id');
    const editSnippetTextEl = document.getElementById('edit-snippet-text');
    const editSnippetUrlEl = document.getElementById('edit-snippet-url');
    const editSnippetCategoryEl = document.getElementById('edit-snippet-category');
    const editSnippetNoteEl = document.getElementById('edit-snippet-note');
    const saveEditedSnippetBtn = document.getElementById('save-edited-snippet-btn');
    const cancelEditSnippetBtn = document.getElementById('cancel-edit-snippet-btn');
    const introOverlay = document.getElementById('intro-overlay');
    const dynamicLogo = document.getElementById('dynamic-logo');
    const introSubtitle = document.getElementById('intro-subtitle');
    const appContainer = document.getElementById('app-container'); 
    const headerLogoSVG = document.getElementById('header-logo-svg');

    const authViewEl = document.getElementById('auth-view');
    const loginFormContainerEl = document.getElementById('login-form-container'); 
    const signupFormContainerEl = document.getElementById('signup-form-container'); 
    const loginFormEl = document.getElementById('login-form');
    const signupFormEl = document.getElementById('signup-form');
    const loginEmailEl = document.getElementById('login-email');
    const loginPasswordEl = document.getElementById('login-password');
    const signupEmailEl = document.getElementById('signup-email');
    const signupPasswordEl = document.getElementById('signup-password');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmailDisplayEl = document.getElementById('user-email-display');

    let currentEditingSnippetId = null;
    let localSnippetsCache = []; 
    let localCategoriesCache = []; 
    const defaultCategoryNames = ["General", "Code Snippets", "Recipes", "Bookmarks", "Ideas", "Learning"];


    // --- Navigation / View Management ---
    function showAuthView() {
        if(authViewEl) authViewEl.classList.remove('hidden');
        if(appContainer) {
            appContainer.classList.add('hidden'); 
            appContainer.classList.add('hidden-for-auth'); 
        }
        if(mainViewEl) mainViewEl.classList.add('hidden'); 
        if(detailViewEl) detailViewEl.classList.add('hidden'); 
        
        if (introOverlay && introOverlay.style.display !== 'none') { 
            introOverlay.style.display = 'none'; 
        }
        if (loginFormContainerEl && signupFormContainerEl) {
            loginFormContainerEl.classList.remove('hidden');
            signupFormContainerEl.classList.add('hidden');
        }
    }

    function showAppView() {
        if(authViewEl) authViewEl.classList.add('hidden');
        if(appContainer) {
            appContainer.classList.remove('hidden');
            appContainer.classList.remove('hidden-for-auth');
            // Add 'loaded' class to trigger fade-in/slide-up animation of the app container
            appContainer.classList.add('loaded'); 
        }
        
        // Animate header logo if app is shown
        setTimeout(() => { // Small delay for visual consistency
            if (headerLogoSVG && currentUser) { 
                const paths = headerLogoSVG.querySelectorAll('path');
                paths.forEach(path => {
                    const length = path.getTotalLength();
                    path.style.strokeDasharray = length;
                    path.style.strokeDashoffset = length;
                    path.style.animation = `drawPath 2s 0.5s ease-out forwards`;
                });
            }
        }, 100); // Delay can be adjusted
    
        showMainView(); // Show the main content area within the app
    }
    
    function showMainView() {
        if(mainViewEl) mainViewEl.classList.remove('hidden');
        if(detailViewEl) detailViewEl.classList.add('hidden');
        currentEditingSnippetId = null; 
        renderSnippets(); 
    }

    function showDetailView(snippetId, mode = 'view') {
        const snippet = localSnippetsCache.find(s => s.id === snippetId);
        if (!snippet) {
            showNotification('Error: Snippet not found.', 'error');
            showMainView();
            return;
        }
        currentEditingSnippetId = snippet.id;
        if(mainViewEl) mainViewEl.classList.add('hidden');
        if(detailViewEl) detailViewEl.classList.remove('hidden');

        if (mode === 'view') {
            if(detailContentViewEl) detailContentViewEl.classList.remove('hidden');
            if(detailContentEditEl) detailContentEditEl.classList.add('hidden');
            if(detailTitleEl) detailTitleEl.textContent = "Snippet Details";
            if(detailCategoryViewEl) detailCategoryViewEl.textContent = snippet.category;
            if(detailTextViewEl) detailTextViewEl.textContent = snippet.text;
            
            if (snippet.url) {
                if(detailUrlViewEl) {
                    detailUrlViewEl.href = snippet.url;
                    detailUrlViewEl.textContent = snippet.url;
                }
                if(detailUrlViewContainerEl) detailUrlViewContainerEl.classList.remove('hidden');
            } else {
                if(detailUrlViewContainerEl) detailUrlViewContainerEl.classList.add('hidden');
            }
            if (snippet.note) {
                if(detailNoteViewEl) detailNoteViewEl.textContent = snippet.note;
                if(detailNoteViewContainerEl) detailNoteViewContainerEl.classList.remove('hidden');
            } else {
                if(detailNoteViewContainerEl) detailNoteViewContainerEl.classList.add('hidden');
            }
            const createdAtDate = snippet.createdAt && typeof snippet.createdAt.toDate === 'function' 
                                ? snippet.createdAt.toDate() 
                                : new Date(snippet.createdAt); 
            if(detailDateViewEl) detailDateViewEl.textContent = `${createdAtDate.toLocaleDateString()} ${createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (mode === 'edit') {
            if(detailContentViewEl) detailContentViewEl.classList.add('hidden');
            if(detailContentEditEl) detailContentEditEl.classList.remove('hidden');
            if(detailTitleEl) detailTitleEl.textContent = "Edit Snippet";
            if(editSnippetIdEl) editSnippetIdEl.value = snippet.id;
            if(editSnippetTextEl) editSnippetTextEl.value = snippet.text;
            if(editSnippetUrlEl) editSnippetUrlEl.value = snippet.url;
            populateCategoryDropdown(editSnippetCategoryEl, localCategoriesCache); 
            if(editSnippetCategoryEl) editSnippetCategoryEl.value = snippet.category; 
            if(editSnippetNoteEl) editSnippetNoteEl.value = snippet.note;
        }
        window.scrollTo(0, 0);
    }
    
    // --- Notifications ---
    function showNotification(message, type = 'info', duration = 3500) { 
        if (!notificationAreaEl) return; 
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${message}`;
        notificationAreaEl.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10); 
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) { 
                    notification.remove();
                }
            }, 500); 
        }, duration);
    }

    // --- Intro Animation ---
    function playIntroAnimation(onCompleteCallback) {
        if (!introOverlay) { 
            if(onCompleteCallback) onCompleteCallback();
            return; 
        }
        
        if (introOverlay.style.display === 'none') {
            introOverlay.style.display = 'flex';
        }
        introOverlay.style.opacity = '1'; 
        introOverlay.style.pointerEvents = 'auto';

        if(dynamicLogo) dynamicLogo.classList.add('animate-pop');
        if(introSubtitle) setTimeout(() => introSubtitle.classList.add('animate-fade-in-up'), 300);
        
        setTimeout(() => { 
            if(introOverlay) {
                introOverlay.style.opacity = '0';
                introOverlay.style.pointerEvents = 'none'; 
            }
            if(onCompleteCallback) onCompleteCallback(); 
        }, 2000); 

        setTimeout(() => { 
            if (introOverlay && introOverlay.parentNode) {
                introOverlay.parentNode.removeChild(introOverlay);
            }
        }, 3000); 
    }

    // --- Firebase Authentication ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            if(userEmailDisplayEl) userEmailDisplayEl.textContent = `${user.email}`; 
            
            loadUserCategories(); 
            loadUserSnippets();   
            
            playIntroAnimation(() => { 
                showAppView(); 
            });
        } else {
            currentUser = null;
            if(userEmailDisplayEl) userEmailDisplayEl.textContent = '';
            localSnippetsCache = []; 
            localCategoriesCache = [];
            renderSnippets(); 
            populateCategoryDropdown(snippetCategoryEl, []); 
            populateCategoryDropdown(filterCategoryEl, []);
            populateCategoryDropdown(editSnippetCategoryEl, []);
            showAuthView();
            if (snippetsUnsubscribe) snippetsUnsubscribe(); 
            if (categoriesUnsubscribe) categoriesUnsubscribe();
            if (introOverlay && introOverlay.parentNode) { 
                 introOverlay.style.display = 'none';
            }
        }
    });

    if(loginFormEl) loginFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginEmailEl.value;
        const password = loginPasswordEl.value;
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                showNotification('Logged in successfully!', 'success');
                // onAuthStateChanged will handle UI update and intro
            })
            .catch(error => {
                console.error("Login error:", error);
                showNotification(`Login failed: ${error.message}`, 'error', 5000);
            });
    });

    if(signupFormEl) signupFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = signupEmailEl.value;
        const password = signupPasswordEl.value;
        if (password.length < 6) {
            showNotification('Password should be at least 6 characters.', 'error');
            return;
        }
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                showNotification('Account created! Please log in.', 'success');
                const userCategoriesCollection = db.collection('users').doc(userCredential.user.uid).collection('categories');
                const batch = db.batch();
                
                defaultCategoryNames.forEach(catName => {
                    const catRef = userCategoriesCollection.doc(); 
                    batch.set(catRef, { 
                        name: catName, 
                        system: true, 
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                    });
                });
                return batch.commit(); 
            })
            .then(() => {
                if(signupFormContainerEl) signupFormContainerEl.classList.add('hidden');
                if(loginFormContainerEl) loginFormContainerEl.classList.remove('hidden');
                if(loginEmailEl) loginEmailEl.value = email; 
                if(loginPasswordEl) loginPasswordEl.value = ''; 
                if(loginPasswordEl) loginPasswordEl.focus();
            })
            .catch(error => {
                console.error("Signup error:", error);
                showNotification(`Signup failed: ${error.message}`, 'error', 5000);
            });
    });

    if(logoutBtn) logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            showNotification('Logged out successfully.', 'info');
            // onAuthStateChanged will handle UI update
        }).catch(error => {
            console.error("Logout error:", error);
            showNotification(`Logout failed: ${error.message}`, 'error');
        });
    });

    if(showSignupBtn) showSignupBtn.addEventListener('click', () => {
        if(loginFormContainerEl) loginFormContainerEl.classList.add('hidden');
        if(signupFormContainerEl) signupFormContainerEl.classList.remove('hidden');
    });
    if(showLoginBtn) showLoginBtn.addEventListener('click', () => {
        if(signupFormContainerEl) signupFormContainerEl.classList.add('hidden');
        if(loginFormContainerEl) loginFormContainerEl.classList.remove('hidden');
    });

    // --- Category Management (Firestore) ---
    function populateCategoryDropdown(selectElement, categoriesData) {
        if (!selectElement) return; 
        const currentVal = selectElement.value;
        selectElement.innerHTML = ''; 
        if (selectElement.id === 'filter-category') {
            const allOption = document.createElement('option');
            allOption.value = ""; allOption.textContent = "All Categories";
            selectElement.appendChild(allOption);
        }
        
        const userCategoryNames = categoriesData.map(c => c.name);
        const uniqueCategories = [...new Set([...defaultCategoryNames, ...userCategoryNames])].sort();

        uniqueCategories.forEach(categoryName => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            selectElement.appendChild(option);
        });

        if (uniqueCategories.includes(currentVal)) {
            selectElement.value = currentVal;
        } else if (selectElement.id !== 'filter-category' && uniqueCategories.includes("General")) {
             selectElement.value = "General"; 
        } else if (selectElement.id !== 'filter-category' && uniqueCategories.length > 0) {
             selectElement.value = uniqueCategories[0]; 
        } else if (selectElement.id === 'filter-category') {
            selectElement.value = ""; 
        }
    }

    async function loadUserCategories() {
        if (!currentUser) return;
        if (categoriesUnsubscribe) categoriesUnsubscribe(); 

        categoriesUnsubscribe = db.collection('users').doc(currentUser.uid).collection('categories')
            .orderBy('name') 
            .onSnapshot(snapshot => {
                localCategoriesCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                populateCategoryDropdown(snippetCategoryEl, localCategoriesCache);
                populateCategoryDropdown(filterCategoryEl, localCategoriesCache);
                if (editSnippetCategoryEl && !detailViewEl.classList.contains('hidden') && !detailContentEditEl.classList.contains('hidden')) {
                    const currentEditCategory = editSnippetCategoryEl.value;
                    populateCategoryDropdown(editSnippetCategoryEl, localCategoriesCache);
                    const allPossibleCategories = [...new Set([...defaultCategoryNames, ...localCategoriesCache.map(c => c.name)])];
                    if (allPossibleCategories.includes(currentEditCategory)) {
                         editSnippetCategoryEl.value = currentEditCategory;
                    }
                }
            }, error => {
                console.error("Error loading categories: ", error);
                showNotification("Failed to load categories.", "error");
            });
    }

    async function handleAddCategory() {
        if (!currentUser) {
            showNotification('You must be logged in to add categories.', 'error');
            return;
        }
        const newCategoryName = newCategoryNameEl.value.trim();
        if (newCategoryName === '') {
            showNotification('Category name cannot be empty.', 'error');
            return;
        }
        const allExistingCategoryNames = [...new Set([...localCategoriesCache.map(c => c.name.toLowerCase()), ...defaultCategoryNames.map(c => c.toLowerCase())])];
        if (allExistingCategoryNames.includes(newCategoryName.toLowerCase())) {
            showNotification('This category name already exists or is a default option.', 'info');
            newCategoryNameEl.value = '';
            return;
        }

        try {
            await db.collection('users').doc(currentUser.uid).collection('categories').add({ 
                name: newCategoryName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp() 
            });
            newCategoryNameEl.value = '';
            showNotification(`Category "${newCategoryName}" added.`, 'success');
        } catch (error) {
            console.error("Error adding category: ", error);
            showNotification('Failed to add category.', 'error');
        }
    }

    // --- Snippet Management (Firestore) ---
    async function loadUserSnippets() {
        if (!currentUser) return;
        if (snippetsUnsubscribe) snippetsUnsubscribe(); 

        snippetsUnsubscribe = db.collection('users').doc(currentUser.uid).collection('snippets')
            .orderBy('createdAt', 'desc') 
            .onSnapshot(snapshot => {
                localSnippetsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderSnippets(); 
            }, error => {
                console.error("Error loading snippets: ", error);
                showNotification("Failed to load snippets.", "error");
            });
    }
    
    function renderSnippets(isNewSnippetAdded = false) {
        if (!snippetsListEl) return; 
        let snippetsToRender = [...localSnippetsCache]; 
        const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : "";
        const selectedCategoryFilter = filterCategoryEl ? filterCategoryEl.value : "";

        if (searchTerm) {
            snippetsToRender = snippetsToRender.filter(s => 
                s.text.toLowerCase().includes(searchTerm) ||
                (s.note && s.note.toLowerCase().includes(searchTerm)) ||
                (s.url && s.url.toLowerCase().includes(searchTerm)) ||
                s.category.toLowerCase().includes(searchTerm)
            );
        }
        if (selectedCategoryFilter) {
            snippetsToRender = snippetsToRender.filter(s => s.category === selectedCategoryFilter);
        }

        snippetsListEl.innerHTML = '';
        if (snippetsToRender.length === 0) {
            const message = (searchTerm || selectedCategoryFilter) 
                ? "No snippets match your current filter." 
                : "Your vault is empty! Add your first snippet.";
            snippetsListEl.innerHTML = `<p class="no-snippets-message"><i class="fas fa-folder-open fa-2x mb-3 text-gray-400"></i><br>${message}</p>`;
            return;
        }

        snippetsToRender.forEach((snippet) => {
            const snippetItem = document.createElement('div');
            snippetItem.className = 'snippet-item';
            if (isNewSnippetAdded && localSnippetsCache.length > 0 && snippet.id === localSnippetsCache[0].id) { 
                snippetItem.classList.add('new-snippet-animation');
            }
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'snippet-header';
            const titleCategoryDiv = document.createElement('div');
            titleCategoryDiv.className = 'snippet-title-category';
            const categoryTag = document.createElement('span');
            categoryTag.className = 'snippet-category-tag';
            categoryTag.textContent = snippet.category || 'General';
            titleCategoryDiv.appendChild(categoryTag);
            headerDiv.appendChild(titleCategoryDiv);
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'snippet-actions';
            const editBtn = document.createElement('button');
            editBtn.innerHTML = `<i class="fas fa-edit"></i> Edit`;
            editBtn.className = 'action-btn edit-btn';
            editBtn.title = "Edit snippet";
            editBtn.addEventListener('click', (e) => { e.stopPropagation(); showDetailView(snippet.id, 'edit'); });
            actionsDiv.appendChild(editBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Delete`;
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.title = "Delete snippet";
            deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteSnippet(snippet.id); });
            actionsDiv.appendChild(deleteBtn);
            headerDiv.appendChild(actionsDiv);
            snippetItem.appendChild(headerDiv);
            const textPreviewP = document.createElement('p');
            textPreviewP.className = 'snippet-text-preview';
            textPreviewP.textContent = snippet.text;
            snippetItem.appendChild(textPreviewP);
            const readMoreBtn = document.createElement('button');
            readMoreBtn.className = 'read-more-btn';
            readMoreBtn.innerHTML = 'Read More <i class="fas fa-arrow-right ml-1"></i>';
            readMoreBtn.addEventListener('click', () => showDetailView(snippet.id, 'view'));
            snippetItem.appendChild(readMoreBtn);
            const metaListDiv = document.createElement('div');
            metaListDiv.className = 'snippet-meta-list-view';
            if (snippet.url) {
                metaListDiv.innerHTML += `<p><i class="fas fa-link"></i> <a href="${snippet.url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${snippet.url.length > 30 ? snippet.url.substring(0,27)+'...' : snippet.url}</a></p>`;
            }
            if (snippet.note) {
                 metaListDiv.innerHTML += `<p><i class="fas fa-sticky-note"></i> ${snippet.note.length > 30 ? snippet.note.substring(0,27)+'...' : snippet.note}</p>`;
            }
            const createdAtDate = snippet.createdAt && typeof snippet.createdAt.toDate === 'function' 
                                ? snippet.createdAt.toDate() 
                                : new Date(snippet.createdAt);
            metaListDiv.innerHTML += `<p><i class="fas fa-calendar-alt"></i> ${createdAtDate.toLocaleDateString()}</p>`;
            snippetItem.appendChild(metaListDiv);
            snippetsListEl.appendChild(snippetItem);
        });
        if (isNewSnippetAdded && snippetsListEl.firstChild) {
            snippetsListEl.firstChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    async function handleSaveSnippet() {
        if (!currentUser) {
            showNotification('You must be logged in to save snippets.', 'error');
            return;
        }
        const text = snippetTextEl.value.trim();
        const urlInput = snippetUrlEl.value.trim();
        const category = snippetCategoryEl.value || "General"; 
        const note = snippetNoteEl.value.trim();

        if (text === '') {
            showNotification('Snippet content cannot be empty.', 'error');
            return;
        }
        const url = (urlInput && !(urlInput.startsWith('http://') || urlInput.startsWith('https://'))) ? `http://${urlInput}` : urlInput;

        const newSnippet = {
            text, url, category, note,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), 
            userId: currentUser.uid 
        };
        try {
            await db.collection('users').doc(currentUser.uid).collection('snippets').add(newSnippet);
            if(snippetTextEl) snippetTextEl.value = ''; 
            if(snippetUrlEl) snippetUrlEl.value = ''; 
            if(snippetNoteEl) snippetNoteEl.value = ''; 
            if(snippetCategoryEl) snippetCategoryEl.value = "General"; 
            if(snippetTextEl) snippetTextEl.focus();
            showNotification('Snippet saved successfully!', 'success');
            renderSnippets(true); 
        } catch (error) {
            console.error("Error saving snippet: ", error);
            showNotification('Failed to save snippet.', 'error');
        }
    }
    
    async function handleSaveEditedSnippet() {
        if (!currentUser) {
            showNotification('You must be logged in to edit snippets.', 'error');
            return;
        }
        const id = editSnippetIdEl.value;
        const text = editSnippetTextEl.value.trim();
        const urlInput = editSnippetUrlEl.value.trim();
        const category = editSnippetCategoryEl.value || "General";
        const note = editSnippetNoteEl.value.trim();

        if (text === '') {
            showNotification('Snippet content cannot be empty.', 'error');
            return;
        }
        const url = (urlInput && !(urlInput.startsWith('http://') || urlInput.startsWith('https://'))) ? `http://${urlInput}` : urlInput;
        
        const updatedSnippetData = { 
            text, url, category, note,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            await db.collection('users').doc(currentUser.uid).collection('snippets').doc(id).update(updatedSnippetData);
            showNotification('Snippet updated successfully!', 'success');
            showDetailView(id, 'view'); 
        } catch (error) {
            console.error("Error updating snippet: ", error);
            showNotification('Failed to update snippet.', 'error');
        }
    }

    async function handleDeleteSnippet(snippetId) {
        if (!currentUser) {
            showNotification('You must be logged in to delete snippets.', 'error');
            return;
        }
        if (confirm('Are you sure you want to permanently delete this snippet?')) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('snippets').doc(snippetId).delete();
                showNotification('Snippet deleted.', 'info');
                if (currentEditingSnippetId === snippetId && detailViewEl && !detailViewEl.classList.contains('hidden')) { 
                    showMainView(); 
                }
            } catch (error) {
                console.error("Error deleting snippet: ", error);
                showNotification('Failed to delete snippet.', 'error');
            }
        }
    }
    
    function setFooterYear() {
        if(currentYearEl) currentYearEl.textContent = new Date().getFullYear();
    }

    // --- Event Listeners ---
    if(addCategoryBtn) addCategoryBtn.addEventListener('click', handleAddCategory);
    if(saveSnippetBtn) saveSnippetBtn.addEventListener('click', handleSaveSnippet);
    if(searchInputEl) searchInputEl.addEventListener('input', () => renderSnippets()); 
    if(filterCategoryEl) filterCategoryEl.addEventListener('change', () => renderSnippets()); 

    if(backToListBtn) backToListBtn.addEventListener('click', showMainView);
    if(editSnippetFromViewBtn) editSnippetFromViewBtn.addEventListener('click', () => {
        if (currentEditingSnippetId) showDetailView(currentEditingSnippetId, 'edit');
    });
    if(saveEditedSnippetBtn) saveEditedSnippetBtn.addEventListener('click', handleSaveEditedSnippet);
    if(cancelEditSnippetBtn) cancelEditSnippetBtn.addEventListener('click', () => {
        if (currentEditingSnippetId) showDetailView(currentEditingSnippetId, 'view');
    });

    // --- Initial Load ---
    setFooterYear();
    // onAuthStateChanged handles initial view and intro animation logic.
});
