// Firebase Imports
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
        import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, collection, query, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

        document.addEventListener('DOMContentLoaded', () => {
            // Firebase State
            let db, auth, appId;
            let listeners = [];

            // App State
            let currentUser = null;
            let currentUserIsParroco = false;
            let currentDate = new Date();
            let data = {
                calendar: {}, directory: [], agenda: [], specificTasks: [], announcements: [],
                manual: { habilidades: '' }, revisionTasks: getInitialRevisionTasks(), revisionChecklists: {}
            }; 
            let selectedDateKey = null;

            // DOM Elements
            const loginModal = document.getElementById('login-modal');
            const loginForm = document.getElementById('login-form');
            const currentUserDisplay = document.getElementById('current-user-display');
            const allModals = document.querySelectorAll('.fixed.inset-0');
            const clockEl = document.getElementById('clock');
            const dateEl = document.getElementById('date');
            const monthYearEl = document.getElementById('month-year');
            const calendarDaysEl = document.getElementById('calendar-days');
            const prevMonthBtn = document.getElementById('prev-month');
            const nextMonthBtn = document.getElementById('next-month');
            const todayBtn = document.getElementById('today-btn');
            const remindersListEl = document.getElementById('reminders-list');
            const openDirectoryBtn = document.getElementById('open-directory-btn');
            const openAgendaBtn = document.getElementById('open-agenda-btn');
            const openRevisionesBtn = document.getElementById('open-revisiones-btn');
            const openHabilidadesBtn = document.getElementById('open-habilidades-btn');
            const openTareasBtn = document.getElementById('open-tareas-btn');
            const openAnunciosBtn = document.getElementById('open-anuncios-btn');
            const navButtons = document.querySelectorAll('.main-nav-btn');
            
            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

            const liturgicalDates2025 = ["2025-01-01", "2025-01-06", "2025-03-05", "2025-04-13", "2025-04-17", "2025-04-18", "2025-04-19", "2025-04-20", "2025-05-29", "2025-06-08", "2025-06-22", "2025-06-29", "2025-08-15", "2025-11-01", "2025-11-23", "2025-12-08", "2025-12-12", "2025-12-25"];

            function getInitialRevisionTasks() {
                return {
                    before: [
                        { id: 'rt-b-1', text: 'Verificar limpieza y orden del presbiterio y la sacristía.' },
                        { id: 'rt-b-2', text: 'Preparar los vasos sagrados (cáliz, patena, copones).' },
                    ],
                    during: [ { id: 'rt-d-1', text: 'Asistir al sacerdote en lo que necesite discretamente.' } ],
                    after: [ { id: 'rt-a-1', text: 'Reservar el Santísimo Sacramento en el sagrario.' } ]
                };
            }

            function setActiveNav(button) {
                navButtons.forEach(btn => btn.classList.remove('active'));
                if (button) {
                    button.classList.add('active');
                }
            }

            // --- Modal Manager ---
            const modalManager = {
                open: (modalEl, navBtn) => {
                    setActiveNav(navBtn);
                    modalEl.classList.remove('hidden');
                    modalEl.classList.add('flex');
                    setTimeout(() => {
                        const innerModal = modalEl.querySelector('.transform');
                        if (innerModal) innerModal.classList.remove('scale-95', 'opacity-0');
                    }, 10);
                },
                close: (modalEl) => {
                    setActiveNav(null);
                    const innerModal = modalEl.querySelector('.transform');
                    if (innerModal) innerModal.classList.add('scale-95', 'opacity-0');
                    setTimeout(() => modalEl.classList.add('hidden'), 300);
                }
            };
            
            allModals.forEach(modal => {
                const closeBtn = modal.querySelector('[id^="close-"]');
                if (closeBtn) closeBtn.addEventListener('click', () => modalManager.close(modal));
                modal.addEventListener('click', (e) => { if (e.target === modal) modalManager.close(modal); });
            });

            // --- Authentication & Initialization ---
            async function initFirebase() {
                appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                
                let firebaseConfig;
                if (typeof __firebase_config !== 'undefined' && __firebase_config !== '{}') {
                    firebaseConfig = JSON.parse(__firebase_config);
                } else {
                    document.body.innerHTML = `
                        <div class="p-8 text-center text-orange-600 bg-orange-50 min-h-screen flex items-center justify-center">
                            <div>
                                <h1 class="text-2xl font-bold mb-4">Configuración de Firebase no encontrada</h1>
                                <p class="mb-2">Asegúrate de que <code>firebase-config.js</code> exista y contenga tus credenciales.</p>
                                <p>Si ya lo has hecho, es posible que necesites refrescar la página.</p>
                            </div>
                        </div>`;
                    return false;
                }
                
                if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "AQUI_VA_TU_API_KEY") {
                    document.body.innerHTML = `
                        <div class="p-8 text-center text-orange-600 bg-orange-50 min-h-screen flex items-center justify-center">
                            <div>
                                <h1 class="text-2xl font-bold mb-4">Configuración Requerida</h1>
                                <p class="mb-2">Para utilizar esta aplicación, necesitas conectarla a tu propio proyecto de Firebase.</p>
                                <p>Por favor, <strong>edita el código fuente de este archivo HTML</strong> y sigue las instrucciones dentro de la función <code>initFirebase</code> para añadir tu configuración.</p>
                            </div>
                        </div>`;
                    return false;
                }
                
                const app = initializeApp(firebaseConfig);
                db = getFirestore(app);
                auth = getAuth(app);

                onAuthStateChanged(auth, (user) => {
                    if (user) {
                        const isParroco = user.email === 'alexveo855@gmail.com';
                        const userName = isParroco ? 'Administrador' : user.displayName;
                        handleLoginSuccess(userName, isParroco);
                    } else {
                        handleLogout();
                    }
                });
                return true;
            }

            if (loginForm) {
                loginForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-password').value;
                    const loginError = document.getElementById('login-error');
                    if (loginError) loginError.textContent = ''; // Clear previous errors

                    try {
                        await signInWithEmailAndPassword(auth, email, password);
                    } catch (error) {
                        console.error("Error signing in with email/password:", error);
                        if (loginError) {
                            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                                loginError.textContent = 'Correo o contraseña incorrectos.';
                            } else {
                                loginError.textContent = 'Error al iniciar sesión.';
                            }
                        }
                    }
                });
            }

            const googleLoginBtn = document.getElementById('google-login-btn');
            if (googleLoginBtn) {
                googleLoginBtn.addEventListener('click', async () => {
                    const provider = new GoogleAuthProvider();
                    try {
                        await signInWithPopup(auth, provider);
                    } catch (error) {
                        console.error("Error signing in with Google:", error);
                        const loginError = document.getElementById('login-error');
                        if (loginError) {
                            loginError.textContent = `Error Google: ${error.code}`;
                            console.error("Detailed Google Sign-in Error:", error);
                        }
                    }
                });
            }
            
            function handleLoginSuccess(userName, isParroco) {
                currentUser = userName;
                currentUserIsParroco = isParroco;
                
                currentUserDisplay.innerHTML = `<span>Usuario: <strong>${currentUser}</strong></span><button id="logout-btn" class="text-xs text-[var(--primary-color)] hover:underline ml-2">(Salir)</button>`;
                currentUserDisplay.classList.remove('hidden');
                currentUserDisplay.classList.add('flex');
                modalManager.close(loginModal);

                document.getElementById('logout-btn').addEventListener('click', async () => {
                    await signOut(auth);
                });
                
                setupFirestoreListeners();
            }

            function handleLogout() {
                modalManager.open(loginModal);
                if (listeners.length > 0) {
                    listeners.forEach(unsub => unsub());
                    listeners = [];
                }
                currentUserDisplay.classList.add('hidden');
            }
            
            // --- Firestore Path Helpers ---
            function getCollectionRef(name) {
                return collection(db, `artifacts/${appId}/public/data/${name}`);
            }
            function getDocRef(collectionName, docId) {
                return doc(db, `artifacts/${appId}/public/data/${collectionName}/${docId}`);
            }

            // --- Firestore Listeners ---
            function setupFirestoreListeners() {
                if (listeners.length > 0) {
                    listeners.forEach(unsub => unsub());
                    listeners = [];
                }
                const collectionsToListen = ['calendar', 'directory', 'agenda', 'specificTasks', 'revisionChecklists', 'announcements'];
                collectionsToListen.forEach(name => {
                    const q = query(getCollectionRef(name));
                    const unsub = onSnapshot(q, (querySnapshot) => {
                        if (name === 'calendar' || name === 'revisionChecklists') {
                            data[name] = {};
                            querySnapshot.forEach(doc => { data[name][doc.id] = doc.data(); });
                        } else {
                             data[name] = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                        }
                        // Trigger relevant UI updates
                        if (name === 'calendar') { renderCalendar(); updateRemindersList(); }
                        if (name === 'directory') { renderDirectory(); }
                        if (name === 'agenda') { renderAgenda(); }
                        if (name === 'specificTasks') { renderSpecificTasks(); }
                        if (name === 'announcements') { renderAnuncios(); }
                    }, (error) => console.error(`Error listening to ${name}:`, error));
                    listeners.push(unsub);
                });
            }
            
            // --- Clock & Date ---
            function updateClock() {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                clockEl.textContent = `${hours}:${minutes}:${seconds}`;
                dateEl.textContent = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
            }

            // --- Calendar Logic ---
            function renderCalendar() {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                monthYearEl.textContent = `${monthNames[month]} ${year}`;
                calendarDaysEl.innerHTML = '';
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                for (let i = 0; i < firstDayOfMonth; i++) {
                    calendarDaysEl.innerHTML += `<div class="border-r border-b border-gray-200 bg-gray-50"></div>`;
                }

                for (let day = 1; day <= daysInMonth; day++) {
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const today = new Date();
                    const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
                    
                    let dayCellHTML = `<div class="calendar-day relative p-2 border-r border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors flex flex-col" data-date="${dateKey}">`;
                    dayCellHTML += `<span class="text-xs sm:text-sm ${isToday ? 'bg-[var(--primary-color)] text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold' : ''}">${day}</span>`;

                    if (data.calendar[dateKey] && data.calendar[dateKey].events && data.calendar[dateKey].events.length > 0) {
                        dayCellHTML += '<div class="flex flex-wrap gap-1 mt-1">';
                        data.calendar[dateKey].events.slice(0, 3).forEach(() => {
                            dayCellHTML += '<div class="event-dot bg-[var(--primary-color)]"></div>';
                        });
                        dayCellHTML += '</div>';
                    }
                    dayCellHTML += `</div>`;
                    calendarDaysEl.innerHTML += dayCellHTML;
                }
            }
            
            function updateRemindersList() {
                remindersListEl.innerHTML = '';
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcomingEvents = [];
                for (let i = 0; i < 30; i++) {
                    const checkDate = new Date(today);
                    checkDate.setDate(today.getDate() + i);
                    const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                    if (data.calendar[dateKey] && data.calendar[dateKey].events) {
                        data.calendar[dateKey].events.forEach(event => {
                            const eventText = typeof event === 'object' ? event.text : event;
                            upcomingEvents.push({ date: checkDate, text: eventText });
                        });
                    }
                }
                 if (upcomingEvents.length === 0) {
                     remindersListEl.innerHTML = '<p class="text-gray-500 italic">No hay recordatorios próximos.</p>';
                     return;
                 }
                upcomingEvents.sort((a,b) => a.date - b.date);
                upcomingEvents.slice(0, 10).forEach(event => {
                    const item = document.createElement('div');
                    item.className = 'bg-white p-2 rounded-lg shadow border border-gray-200';
                    item.innerHTML = `<p class="font-medium text-gray-800 text-sm">${event.text}</p><p class="text-xs text-gray-500">${event.date.getDate()} de ${monthNames[event.date.getMonth()]}</p>`;
                    remindersListEl.appendChild(item);
                });
            }

            function renderDirectory() {
                const directoryListEl = document.getElementById('directory-list');
                if (!directoryListEl) return;
                const searchTerm = document.getElementById('search-contact-input').value.toLowerCase();
                const filteredDirectory = (data.directory || []).filter(c => c.nombre && c.nombre.toLowerCase().includes(searchTerm));
                
                directoryListEl.innerHTML = filteredDirectory.length === 0 ? '<p class="text-gray-500 italic text-center mt-4">No se encontraron contactos.</p>' : filteredDirectory.map(contact => {
                    const canEdit = currentUserIsParroco || currentUser === contact.createdBy;
                    const editButton = `<button class="edit-contact-btn text-sm ${canEdit ? 'text-[var(--primary-color)] hover:underline' : 'text-gray-400 cursor-not-allowed'}" ${!canEdit ? 'disabled' : ''}>Editar</button>`;
                    const deleteButton = `<button class="delete-contact-btn text-sm ${canEdit ? 'text-red-600 hover:underline' : 'text-gray-400 cursor-not-allowed'}" ${!canEdit ? 'disabled' : ''}>Eliminar</button>`;
                    const createdByText = contact.createdBy ? `Creado por: ${contact.createdBy}` : '';
                    let modifiedByText = '';
                    if (contact.lastModifiedBy) {
                        const modDate = new Date(contact.modifiedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                        modifiedByText = ` | Mod. por: ${contact.lastModifiedBy} (${modDate})`;
                    }
                    
                    return `<div class="p-4 border border-gray-200 rounded-lg bg-white shadow transition-shadow hover:shadow-md" data-id="${contact.id}"><div class="flex justify-between items-start"><div><p class="font-bold text-lg text-gray-800">${contact.nombre}</p><p class="text-sm text-gray-500">${contact.telefono || 'Sin teléfono'}</p></div><div class="flex items-center space-x-3 flex-shrink-0">${editButton}${deleteButton}</div></div><div class="text-xs text-gray-400 mt-2">${createdByText}${modifiedByText}</div><div class="details-section mt-3 pt-3 border-t border-gray-200 space-y-1 text-sm"><p><strong>Domicilio:</strong> ${contact.domicilio || 'N/A'}</p></div><button class="toggle-details-btn text-sm text-[var(--primary-color)] hover:underline mt-2">Ver más detalles</button></div>`;
                }).join('');
            }
            
            function renderAgenda() {
                const agendaListEl = document.getElementById('manual-modal')?.querySelector('#agenda-list');
                if (!agendaListEl) return;
                const sortedAgenda = [...(data.agenda || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
                agendaListEl.innerHTML = sortedAgenda.length === 0 ? '<p class="text-gray-500 italic text-center mt-4">No hay eventos en la agenda.</p>' : sortedAgenda.map(item => {
                    const itemDate = new Date(item.date);
                    const formattedDate = `${dayNames[itemDate.getDay()]} ${itemDate.getDate()} de ${monthNames[itemDate.getMonth()]} - ${String(itemDate.getHours()).padStart(2,'0')}:${String(itemDate.getMinutes()).padStart(2,'0')} hs`;
                    
                    const canEdit = currentUserIsParroco || currentUser === item.createdBy;
                    const editButton = `<button data-id="${item.id}" class="edit-agenda-btn text-sm ${canEdit ? 'text-[var(--primary-color)] hover:underline' : 'text-gray-400 cursor-not-allowed'}" ${!canEdit ? 'disabled' : ''}>Editar</button>`;
                    const deleteButton = `<button data-id="${item.id}" data-activity="${item.activity}" class="delete-agenda-btn text-sm ${canEdit ? 'text-red-600 hover:underline' : 'text-gray-400 cursor-not-allowed'}" ${!canEdit ? 'disabled' : ''}>Eliminar</button>`;
                    const createdBy = item.createdBy ? `<span class="text-xs text-gray-400">Creado por: ${item.createdBy}</span>` : '';
                    const modifiedBy = item.lastModifiedBy ? `<span class="text-xs text-gray-400 ml-2">| Mod. por: ${item.lastModifiedBy}</span>` : '';

                    return `<div class="p-4 border border-gray-200 rounded-lg bg-white shadow"><div class="flex justify-between items-start"><div><p class="font-bold text-md text-[var(--primary-color)]">${item.activity}</p><p class="text-sm font-semibold text-gray-600">${formattedDate}</p><p class="text-sm text-gray-500">${item.place || 'Lugar no especificado'}</p></div><div class="flex space-x-2 flex-shrink-0">${editButton}${deleteButton}</div></div><div class="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-700 space-y-1"><p><strong>Contacto:</strong> ${item.contact || 'N/A'}</p><p><strong>Notas:</strong> ${item.notes || 'N/A'}</p></div><div class="mt-2 pt-2 border-t border-gray-100">${createdBy}${modifiedBy}</div></div>`;
                }).join('');
            }

            function renderSpecificTasks() { /* ... similar logic to renderAgenda/Directory ... */ }

            // --- Announcements Logic ---
            function renderAnuncios() {
                const anunciosListEl = document.getElementById('anuncios-list');
                const addAnuncioForm = document.getElementById('add-anuncio-form');
                if (!anunciosListEl || !addAnuncioForm) return;

                // Show form only for Parroco
                if (currentUserIsParroco) {
                    addAnuncioForm.classList.remove('hidden');
                } else {
                    addAnuncioForm.classList.add('hidden');
                }

                const sortedAnuncios = [...(data.announcements || [])].sort((a, b) => b.createdAt - a.createdAt);

                anunciosListEl.innerHTML = sortedAnuncios.length === 0 
                    ? '<p class="text-gray-500 italic text-center mt-4">No hay anuncios en este momento.</p>' 
                    : sortedAnuncios.map(anuncio => {
                        const deleteButton = currentUserIsParroco 
                            ? `<button data-id="${anuncio.id}" class="delete-anuncio-btn text-sm text-red-500 hover:underline">Eliminar</button>` 
                            : '';
                        const date = new Date(anuncio.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

                        return `
                            <div class="p-4 border border-gray-200 rounded-lg bg-white shadow">
                                <div class="flex justify-between items-start">
                                    <h4 class="font-bold text-md text-[var(--primary-color)]">${anuncio.title}</h4>
                                    ${deleteButton}
                                </div>
                                <p class="text-sm text-gray-700 mt-2 whitespace-pre-wrap">${anuncio.content}</p>
                                <p class="text-xs text-gray-400 mt-3 text-right">Publicado por ${anuncio.createdBy} el ${date}</p>
                            </div>
                        `;
                }).join('');
            }

            // --- Event Listeners and other functions ---
            async function init() {
                const firebaseReady = await initFirebase();
                if (!firebaseReady) return;

                setInterval(updateClock, 1000);
                updateClock();
                renderCalendar();
                if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
                if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
                if (todayBtn) todayBtn.addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });
                if (calendarDaysEl) calendarDaysEl.addEventListener('click', (e) => {
                    const dayCell = e.target.closest('.calendar-day');
                    if (dayCell && dayCell.dataset.date) {
                        // openDayModal(dayCell.dataset.date);
                    }
                });
                if (openDirectoryBtn) openDirectoryBtn.addEventListener('click', () => modalManager.open(document.getElementById('directory-modal'), openDirectoryBtn));
                if (openAgendaBtn) openAgendaBtn.addEventListener('click', () => {
                    const manualModal = document.getElementById('manual-modal');
                    const agendaContent = document.getElementById('tab-content-agenda');
                    
                    // Lazy load content if it's not there
                    if(!agendaContent.innerHTML) {
                         agendaContent.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-full"><div class="md:col-span-1 bg-white p-4 rounded-lg shadow-sm"><h4 id="agenda-form-title" class="text-lg font-semibold mb-4 text-gray-700">Añadir Evento</h4><form id="agenda-form" class="space-y-4"><input type="hidden" id="agenda-edit-id"><div><label for="agenda-date" class="block text-sm font-medium text-gray-600">Fecha y Hora</label><input type="datetime-local" id="agenda-date" class="form-input" required></div><div><label for="agenda-activity" class="block text-sm font-medium text-gray-600">Actividad</label><input type="text" id="agenda-activity" class="form-input" placeholder="Ej. Misa de Bodas" required></div><div><label for="agenda-place" class="block text-sm font-medium text-gray-600">Lugar</label><input type="text" id="agenda-place" class="form-input" placeholder="Ej. Templo principal"></div><div><label for="agenda-contact" class="block text-sm font-medium text-gray-600">Contacto (Nombre y Teléfono)</label><input type="text" id="agenda-contact" class="form-input" placeholder="Ej. Familia Pérez - 2281234567"></div><div><label for="agenda-notes" class="block text-sm font-medium text-gray-600">Notas Adicionales</label><textarea id="agenda-notes" rows="3" class="form-input" placeholder="Detalles, preparativos, etc."></textarea></div><div class="flex space-x-2"><button type="submit" id="agenda-submit-btn" class="btn btn-primary w-full">Guardar</button><button type="button" id="agenda-cancel-btn" class="btn btn-secondary w-full hidden">Cancelar</button></div></form></div><div class="md:col-span-2 bg-white p-4 rounded-lg shadow-sm flex flex-col"><h4 class="text-lg font-semibold mb-4 text-gray-700">Próximos Eventos</h4><div id="agenda-list" class="space-y-3 overflow-y-auto flex-grow"></div></div></div>`;
                         
                         const agendaForm = document.getElementById('agenda-form');
                         if(agendaForm) {
                             agendaForm.addEventListener('submit', async (e) => {
                                 e.preventDefault();
                                 const activity = document.getElementById('agenda-activity').value.trim();
                                 const date = document.getElementById('agenda-date').value;
                                 if (activity && date) {
                                     try {
                                         await addDoc(getCollectionRef('agenda'), {
                                             activity,
                                             date,
                                             place: document.getElementById('agenda-place').value.trim(),
                                             contact: document.getElementById('agenda-contact').value.trim(),
                                             notes: document.getElementById('agenda-notes').value.trim(),
                                             createdBy: currentUser,
                                             createdAt: Date.now()
                                         });
                                         agendaForm.reset();
                                     } catch (error) {
                                         console.error("Error adding agenda event: ", error);
                                         alert('Hubo un error al guardar el evento.');
                                     }
                                 }
                             });
                         }
                    }

                    renderAgenda();
                    modalManager.open(manualModal, openAgendaBtn);
                    manualModal.querySelector('#manual-modal-title').textContent = 'Agenda Parroquial';
                    manualModal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    agendaContent.classList.add('active');
                });

                if (openAnunciosBtn) openAnunciosBtn.addEventListener('click', () => {
                    modalManager.open(document.getElementById('anuncios-modal'), openAnunciosBtn);
                });

                const addAnuncioForm = document.getElementById('add-anuncio-form');
                if (addAnuncioForm) addAnuncioForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const titleInput = document.getElementById('anuncio-title');
                    const contentInput = document.getElementById('anuncio-content');
                    const title = titleInput.value.trim();
                    const content = contentInput.value.trim();

                    if (title && content && currentUserIsParroco) {
                        try {
                            await addDoc(getCollectionRef('announcements'), {
                                title: title,
                                content: content,
                                createdBy: currentUser,
                                createdAt: Date.now()
                            });
                            titleInput.value = '';
                            contentInput.value = '';
                        } catch (error) {
                            console.error("Error adding announcement: ", error);
                            alert('Hubo un error al publicar el anuncio.');
                        }
                    }
                });

                const anunciosList = document.getElementById('anuncios-list');
                if (anunciosList) anunciosList.addEventListener('click', async (e) => {
                    if (e.target.classList.contains('delete-anuncio-btn') && currentUserIsParroco) {
                        const anuncioId = e.target.dataset.id;
                        // Using a simple confirm dialog for now
                        const isConfirmed = await new Promise(resolve => {
                            const confirmModal = document.getElementById('confirm-modal');
                            document.getElementById('confirm-modal-text').textContent = '¿Estás seguro de que quieres eliminar este anuncio? Esta acción no se puede deshacer.';
                            modalManager.open(confirmModal);
                            document.getElementById('confirm-modal-confirm-btn').onclick = () => resolve(true);
                            document.getElementById('confirm-modal-cancel-btn').onclick = () => resolve(false);
                        }).finally(() => modalManager.close(document.getElementById('confirm-modal')));

                        if (isConfirmed) {
                            try {
                                await deleteDoc(getDocRef('announcements', anuncioId));
                            } catch (error) {
                                console.error("Error deleting announcement: ", error);
                                alert('Hubo un error al eliminar el anuncio.');
                            }
                        }
                    }
                });

                 if (openRevisionesBtn) openRevisionesBtn.addEventListener('click', () => {
                    const manualModal = document.getElementById('manual-modal');
                    const revisionesContent = document.getElementById('tab-content-revisiones');
                    
                    modalManager.open(manualModal, openRevisionesBtn);
                    manualModal.querySelector('#manual-modal-title').textContent = 'Revisiones';
                    manualModal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    revisionesContent.classList.add('active');
                });

                if (openHabilidadesBtn) openHabilidadesBtn.addEventListener('click', () => {
                    const manualModal = document.getElementById('manual-modal');
                    const habilidadesContent = document.getElementById('tab-content-habilidades');
                    
                    modalManager.open(manualModal, openHabilidadesBtn);
                    manualModal.querySelector('#manual-modal-title').textContent = 'Habilidades';
                    manualModal.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                    habilidadesContent.classList.add('active');
                });

                if (openTareasBtn) openTareasBtn.addEventListener('click', () => {
                    modalManager.open(document.getElementById('add-task-modal'), openTareasBtn);
                });

                 // Hamburger Menu Logic
                const hamburgerBtn = document.getElementById('hamburger-btn');
                const mobileMenu = document.getElementById('mobile-menu');
                const mobileDirectoryBtn = document.getElementById('mobile-open-directory-btn');
                const mobileAgendaBtn = document.getElementById('mobile-open-agenda-btn');
                const mobileAnunciosBtn = document.getElementById('mobile-open-anuncios-btn');
                const mobileRevisionesBtn = document.getElementById('mobile-open-revisiones-btn');
                const mobileHabilidadesBtn = document.getElementById('mobile-open-habilidades-btn');
                const mobileTareasBtn = document.getElementById('mobile-open-tareas-btn');

                if (hamburgerBtn && mobileMenu) {
                    hamburgerBtn.addEventListener('click', () => {
                        mobileMenu.classList.toggle('hidden');
                    });
                }

                const setupMobileButton = (btn, desktopBtn) => {
                    if (btn && desktopBtn) {
                        btn.addEventListener('click', () => {
                            desktopBtn.click();
                            if (mobileMenu) mobileMenu.classList.add('hidden');
                        });
                    }
                };

                setupMobileButton(mobileDirectoryBtn, openDirectoryBtn);
                setupMobileButton(mobileAgendaBtn, openAgendaBtn);
                setupMobileButton(mobileAnunciosBtn, openAnunciosBtn);
                setupMobileButton(mobileRevisionesBtn, openRevisionesBtn);
                setupMobileButton(mobileHabilidadesBtn, openHabilidadesBtn);
                setupMobileButton(mobileTareasBtn, openTareasBtn);

                 // Add other nav button listeners here
            }
            
            init();
        });