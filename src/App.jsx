import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, runTransaction, query, where, orderBy, limit, serverTimestamp, getDocs, writeBatch, documentId, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Users, Monitor, Ticket, Send, Building2, RefreshCw, CheckCircle2, Loader2, X, Archive as ArchiveIcon, Undo2, Edit } from 'lucide-react';

// --- Firebase Configuration ---
// This configuration is provided by the environment.
const firebaseConfig = {
  apiKey: "AIzaSyD8GyML_0U2wxLrLB1YCmF0SwjIF3wYOao",
  authDomain: "inschrijvingenvv.firebaseapp.com",
  projectId: "inschrijvingenvv",
  storageBucket: "inschrijvingenvv.firebasestorage.app",
  messagingSenderId: "856524957873",
  appId: "1:856524957873:web:b88ad271091d16e22b9a90",
  measurementId: "G-P9LHD4EHWS"
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-wachtrij-app';
const availableLocations = Array.from({ length: 10 }, (_, i) => `Lokaal ${i + 1}`);

// --- Main App Component (for local development with navigation) ---
function App() {
    useEffect(() => {
        document.title = 'Wachtrij Systeem';
    }, []);

    return (
        <BrowserRouter>
            <div className="bg-gray-50 h-screen font-sans flex flex-col">
                <nav className="bg-white shadow-md flex-shrink-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link to="/" className="flex items-center">
                                <Users className="h-8 w-8 text-[#d64e78]" />
                                <span className="ml-3 font-bold text-2xl text-gray-800">Wachtrij Systeem</span>
                            </Link>
                            <div className="flex items-center space-x-2">
                                <NavLink to="/" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#d64e78] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Kiosk</NavLink>
                                <NavLink to="/display" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#d64e78] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Weergave</NavLink>
                                <NavLink to="/admin" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#d64e78] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Beheer</NavLink>
                                <NavLink to="/archive" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-[#d64e78] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Archief</NavLink>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<Kiosk />} />
                        <Route path="/display" element={<Display />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/archive" element={<Archive />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

// --- Kiosk Component (Single Page) ---
function Kiosk() {
    const [ticketNumber, setTicketNumber] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = 'Kiosk | Wachtrij Systeem';
    }, []);

    const getTicket = async () => {
        setIsLoading(true);
        setError('');
        setTicketNumber(null);

        try {
            const newTicketNumber = await runTransaction(db, async (transaction) => {
                const counterRef = doc(db, `artifacts/${appId}/public/data/counters`, 'ticketCounter');
                const counterDoc = await transaction.get(counterRef);
                let currentNumber = 0; 
                if (counterDoc.exists()) { currentNumber = counterDoc.data().lastNumber; }
                const newNumber = currentNumber + 1;
                
                const newTicketRef = doc(collection(db, `artifacts/${appId}/public/data/tickets`));

                transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });
                transaction.set(newTicketRef, { ticketNumber: newNumber, status: 'waiting', createdAt: serverTimestamp(), location: null, calledAt: null });
                
                return newNumber;
            });
            setTicketNumber(newTicketNumber);
        } catch (e) {
            console.error("Error getting ticket: ", e);
            setError(`Kon geen nummer ophalen. Fout: ${e.message}`);
        } finally { setIsLoading(false); }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="bg-white p-12 rounded-2xl shadow-xl max-w-2xl w-full">
                {!ticketNumber ? (
                    <>
                        <img src="https://methodeschoolvanveldeke.be/wp-content/uploads/2023/02/Poster-vv2-2048x1448.jpg" alt="Logo Wachtrijsysteem" className="mx-auto h-48 w-auto mb-6 object-contain" />
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Welkom!</h1>
                        <p className="mt-4 text-lg text-gray-600">Druk op de knop om een volgnummer te ontvangen.</p>
                        <button onClick={getTicket} disabled={isLoading} className="mt-10 w-full bg-[#d64e78] text-white font-bold py-6 px-8 rounded-xl text-2xl hover:bg-[#c04169] focus:outline-none focus:ring-4 focus:ring-pink-300 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "Neem een volgnummer"}
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold text-gray-600">Uw volgnummer is:</h2>
                        <p className="text-8xl md:text-9xl font-extrabold text-[#d64e78] my-4 animate-pulse">{ticketNumber}</p>
                        <p className="text-lg text-gray-600">Volg het weergavescherm om te zien wanneer u aan de beurt bent.</p>
                        <button onClick={() => setTicketNumber(null)} className="mt-10 bg-gray-200 text-gray-800 font-bold py-4 px-8 rounded-xl text-xl hover:bg-gray-300 transition-colors">Terug</button>
                    </>
                )}
                 {error && <p className="mt-4 text-red-500 font-semibold">{error}</p>}
            </div>
             <footer className="mt-8 text-gray-500 text-sm">Wachtrijsysteem &copy; {new Date().getFullYear()}</footer>
        </div>
    );
}

// --- Display Component (Single Page) ---
function Display() {
    const [mostRecentTicket, setMostRecentTicket] = useState(null);
    const [busyLocations, setBusyLocations] = useState([]);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        document.title = 'Weergave | Wachtrij Systeem';
    }, []);

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'called'), orderBy('calledAt', 'desc'), limit(1));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const newTicket = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                
                setMostRecentTicket(currentTicket => {
                    if (!currentTicket || currentTicket.id !== newTicket.id) {
                        setFlash(true);
                        return newTicket;
                    }
                    return currentTicket;
                });
            } else {
                setMostRecentTicket(null);
            }
        }, (error) => {
            console.error("Fout bij ophalen van meest recente oproep:", error);
            if (error.message.includes("indexes?")) {
                alert(`BELANGRIJKE DATABASE FOUT: De vereiste database-index voor het WEERGAVESCHERM ontbreekt. Open de browser console (F12), zoek naar de foutmelding van Firebase, en klik op de link om de index aan te maken. Dit is een eenmalige actie.`);
            } else {
                alert(`Fout op weergavescherm: ${error.message}`);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (flash) {
            const timer = setTimeout(() => {
                setFlash(false);
            }, 2000); 
            return () => clearTimeout(timer);
        }
    }, [flash]);

    useEffect(() => {
        const locationsRef = collection(db, `artifacts/${appId}/public/data/locations`);
        const q = query(locationsRef, where('status', '==', 'busy'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const locations = snapshot.docs.map(doc => ({ name: doc.id, ...doc.data() }));
            locations.sort((a, b) => a.name.localeCompare(b.name, 'nl-NL', { numeric: true }));
            setBusyLocations(locations);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="bg-gray-800 text-white p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className={`lg:col-span-2 bg-[#d64e78] rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl transition-all duration-300 ${flash ? 'animate-flash' : ''}`}>
                {mostRecentTicket ? (
                    <>
                        <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 uppercase tracking-wider">Volgnummer</h2>
                        <p className="text-8xl md:text-9xl lg:text-[12rem] font-black my-4 text-white animate-fade-in">{mostRecentTicket.ticketNumber}</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 uppercase tracking-wider">Ga naar</h2>
                        <p className="text-6xl md:text-7xl lg:text-[7rem] font-bold text-white mt-4">{mostRecentTicket.location}</p>
                    </>
                ) : (
                    <div className="text-center">
                        <Monitor className="mx-auto h-32 w-32 text-pink-200 mb-6" />
                        <p className="text-4xl font-semibold text-pink-100">Wacht op de eerste oproep...</p>
                    </div>
                )}
            </div>
            
            <div className="bg-gray-700 rounded-2xl p-6 shadow-lg flex flex-col">
                <h3 className="text-3xl font-bold border-b-4 border-gray-500 pb-3 mb-6 flex-shrink-0">Actieve Lokalen</h3>
                <div className="overflow-y-auto flex-grow">
                    {busyLocations.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                            {busyLocations.map(loc => (
                                <div key={loc.name} className="bg-gray-600 p-4 rounded-lg flex flex-col text-center animate-slide-in">
                                    <span className="font-bold text-2xl text-yellow-400">{loc.name}</span>
                                    <span className="font-black text-4xl text-white mt-1"># {loc.ticketNumber}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 pt-8">
                            <Building2 className="mx-auto h-16 w-16 mb-4"/>
                            <span>Geen lokalen bezet</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Admin Component (Single Page) ---
function Admin() {
    const [waitingTickets, setWaitingTickets] = useState([]);
    const [locationStates, setLocationStates] = useState({});
    const [editableLocations, setEditableLocations] = useState([]);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(null);
    const [isSystemReady, setIsSystemReady] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [finishComment, setFinishComment] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        document.title = 'Beheer | Wachtrij Systeem';

        const configRef = doc(db, `artifacts/${appId}/public/data/config`, 'locations');
        const unsubscribe = onSnapshot(configRef, async (docSnap) => {
            if (docSnap.exists() && docSnap.data().names) {
                setEditableLocations(docSnap.data().names);
            } else {
                const defaultLocations = Array.from({ length: 10 }, (_, i) => `Lokaal ${i + 1}`);
                await setDoc(configRef, { names: defaultLocations });
                setEditableLocations(defaultLocations);
            }
        });
        
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const initializeSystem = async () => {
            console.log("Checking system initialization...");
            const locationsCollectionRef = collection(db, `artifacts/${appId}/public/data/locations`);
            const batch = writeBatch(db);
            let writesMade = false;

            for (const locationName of editableLocations) {
                if (!locationName) continue;
                const locationDocRef = doc(locationsCollectionRef, locationName);
                try {
                    const docSnap = await getDoc(locationDocRef);
                    if (!docSnap.exists()) {
                        batch.set(locationDocRef, { status: 'available', ticketNumber: null, ticketId: null });
                        writesMade = true;
                    }
                } catch (error) {
                    console.error("Error checking location document:", error);
                }
            }

            if (writesMade) {
                console.log("Initializing missing location documents...");
                await batch.commit();
            }
            if (editableLocations.length > 0) {
                 console.log("System is ready.");
                 setIsSystemReady(true);
            }
        };

        if (editableLocations.length > 0) {
            initializeSystem();
        }
    }, [editableLocations]); 

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'waiting'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setWaitingTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (editableLocations.length === 0) return;
        const locationsRef = collection(db, `artifacts/${appId}/public/data/locations`);
        const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
            const states = {};
            snapshot.forEach(doc => {
                states[doc.id] = doc.data();
            });
            setLocationStates(states);
        });
        return () => unsubscribe();
    }, [editableLocations]);

    const handleOpenTicketModal = (location) => {
        setSelectedLocation(location);
        setIsTicketModalOpen(true);
    };

    const callSpecificTicket = async (location, ticket) => {
        if (!location || !ticket || !ticket.id) { alert("Interne fout: ongeldige selectie."); return; }
        setIsProcessing(location);
        setIsTicketModalOpen(false);

        try {
            const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, ticket.id);
            const locationRef = doc(db, `artifacts/${appId}/public/data/locations`, location);
            await runTransaction(db, async (transaction) => {
                const ticketDoc = await transaction.get(ticketRef);
                if (!ticketDoc.exists() || ticketDoc.data().status !== 'waiting') { throw new Error("Ticket is al opgeroepen door een andere gebruiker."); }
                transaction.update(ticketRef, { status: 'called', location: location, calledAt: serverTimestamp() });
                transaction.set(locationRef, { status: 'busy', ticketNumber: ticket.ticketNumber, ticketId: ticket.id });
            });
        } catch (e) {
            console.error("TRANSACTION FAILED: ", e);
            alert(`Fout bij oproepen: ${e.message}`);
        } finally {
            setIsProcessing(null);
            setSelectedLocation(null);
        }
    };

    const putBackTicket = async (location) => {
        if (!location || typeof location !== 'string') { alert("Interne fout: ongeldige locatie."); return; }
        setIsProcessing(location);
        const ticketId = locationStates[location]?.ticketId;

        if (!ticketId) {
            alert("Interne fout: kon het ticket ID niet vinden om terug te plaatsen.");
            setIsProcessing(null);
            return;
        }

        const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, ticketId);
        const locationRef = doc(db, `artifacts/${appId}/public/data/locations`, location);

        try {
            await runTransaction(db, async (transaction) => {
                transaction.set(locationRef, { status: 'available', ticketNumber: null, ticketId: null });
                transaction.update(ticketRef, { status: 'waiting', location: null, calledAt: null });
            });
        } catch (e) {
            console.error("PUT BACK FAILED: ", e);
            alert(`Kon ticket niet terugplaatsen: ${e.message}`);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleOpenFinishModal = (location) => {
        setSelectedLocation(location);
        setIsFinishModalOpen(true);
    };

    const markAsFinished = async (location, comment) => {
        if (!location || typeof location !== 'string') { alert("Interne fout: ongeldige locatie."); return; }
        setIsProcessing(location);
        setIsFinishModalOpen(false);
        const ticketId = locationStates[location]?.ticketId;

        try {
            await runTransaction(db, async(transaction) => {
                const locationRef = doc(db, `artifacts/${appId}/public/data/locations`, location);
                transaction.set(locationRef, { status: 'available', ticketNumber: null, ticketId: null });
                if (ticketId) {
                    const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, ticketId);
                    transaction.update(ticketRef, { status: 'finished', comment: comment || null });
                }
            });
        } catch(e) {
            console.error("FINISH FAILED: ", e);
            alert(`Kon status niet bijwerken: ${e.message}`);
        } finally {
             setIsProcessing(null);
             setFinishComment("");
             setSelectedLocation(null);
        }
    };
    
    const handleResetQueue = async () => {
        const ticketsRef = collection(db, `artifacts/${appId}/public/data/tickets`);
        const locationsRef = collection(db, `artifacts/${appId}/public/data/locations`);
        const counterRef = doc(db, `artifacts/${appId}/public/data/counters`, 'ticketCounter');
        
        try {
            const batch = writeBatch(db);
            const ticketsSnapshot = await getDocs(ticketsRef);
            ticketsSnapshot.forEach(doc => batch.delete(doc.ref));
            
            editableLocations.forEach(loc => {
                const locRef = doc(locationsRef, loc);
                batch.set(locRef, { status: 'available', ticketNumber: null, ticketId: null });
            });

            batch.set(counterRef, { lastNumber: 0 });
            await batch.commit();
        } catch (e) {
            console.error("Failed to reset queue: ", e);
            alert("De wachtrij kon niet worden gereset.");
        } finally {
            setIsResetModalOpen(false);
        }
    };

    const handleSaveLocations = async (newLocationNames) => {
        const configRef = doc(db, `artifacts/${appId}/public/data/config`, 'locations');
        try {
            await setDoc(configRef, { names: newLocationNames });
            setIsLocationModalOpen(false);
        } catch (error) {
            console.error("Error saving locations:", error);
            alert("Kon de lokaalnamen niet opslaan.");
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Beheer Wachtrij</h1>
                <div className="flex items-center space-x-4">
                    <button onClick={() => setIsLocationModalOpen(true)} className="flex items-center bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors">
                        <Edit className="w-5 h-5 mr-2" />
                        Beheer Lokalen
                    </button>
                    <a href="https://wachtrijvv-archive.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-colors">
                        <ArchiveIcon className="w-5 h-5 mr-2" />
                        Archief
                    </a>
                    <button onClick={() => setIsResetModalOpen(true)} className="flex items-center bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors">
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Reset Systeem
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col" style={{maxHeight: 'calc(100vh - 12rem)'}}>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex-shrink-0">Wachtrij ({waitingTickets.length})</h2>
                    <div className="space-y-3 overflow-y-auto flex-grow">
                        {waitingTickets.length > 0 ? waitingTickets.map((ticket, index) => (
                            <div key={ticket.id} className={`p-3 rounded-lg flex justify-between items-center ${index === 0 ? 'bg-pink-100 border-[#d64e78] border-2' : 'bg-gray-100'}`}>
                                <span className={`font-bold text-2xl ${index === 0 ? 'text-[#d64e78]' : 'text-gray-800'}`}>{ticket.ticketNumber}</span>
                                <span className="text-sm text-gray-500">{ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleTimeString('nl-NL') : ''}</span>
                            </div>
                        )) : <p className="text-center p-8 text-gray-500">De wachtrij is leeg.</p>}
                    </div>
                </div>

                <div className="md:col-span-2 lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Status Lokalen</h2>
                    {!isSystemReady ? (
                         <div className="flex items-center justify-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
                            <p className="ml-4 text-gray-500">Systeem initialiseren...</p>
                         </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {editableLocations.map(loc => {
                                const state = locationStates[loc];
                                const isBusy = state?.status === 'busy';
                                const canCall = !isBusy && waitingTickets.length > 0;

                                return (
                                    <div key={loc} className={`p-4 rounded-lg transition-all ${isBusy ? 'bg-yellow-100' : 'bg-green-50'}`}>
                                        <h3 className="font-bold text-lg text-gray-800">{loc}</h3>
                                        {isBusy ? (
                                            <>
                                                <p className="text-3xl font-black text-gray-900 my-2"># {state.ticketNumber}</p>
                                                <div className="flex space-x-2 mt-2">
                                                    <button onClick={() => putBackTicket(loc)} disabled={isProcessing} className="w-full flex items-center justify-center bg-blue-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                        {isProcessing === loc ? <Loader2 className="w-5 h-5 animate-spin"/> : <Undo2 className="w-5 h-5 mr-2" />}
                                                        {isProcessing !== loc && 'Terug'}
                                                    </button>
                                                    <button onClick={() => handleOpenFinishModal(loc)} disabled={isProcessing} className="w-full flex items-center justify-center bg-green-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                        {isProcessing === loc ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                                        {isProcessing !== loc && 'Voltooien'}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-3xl font-black text-gray-400 my-2">-</p>
                                                <button onClick={() => handleOpenTicketModal(loc)} disabled={!canCall || isProcessing} className="w-full mt-2 flex items-center justify-center bg-[#d64e78] text-white font-semibold py-2 px-3 rounded-md hover:bg-[#c04169] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                     {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5 mr-2" />}
                                                    {!isProcessing && 'Kies een nummer'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <TicketSelectionModal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                tickets={waitingTickets}
                location={selectedLocation}
                onSelectTicket={callSpecificTicket}
            />
            <FinishModal
                isOpen={isFinishModalOpen}
                onClose={() => setIsFinishModalOpen(false)}
                location={selectedLocation}
                comment={finishComment}
                setComment={setFinishComment}
                onConfirm={markAsFinished}
            />
             <LocationEditModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} locations={editableLocations} onSave={handleSaveLocations} />
            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetQueue}
                title="Systeem Resetten"
                message="Weet u zeker dat u de volledige wachtrij wilt verwijderen en alle lokalen wilt vrijgeven? Deze actie kan niet ongedaan worden gemaakt."
            />
        </div>
    );
}

// --- Archive Component (Single Page) ---
function Archive() {
    const [finishedTickets, setFinishedTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        document.title = 'Archief | Wachtrij Systeem';
    }, []);

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'finished'), orderBy('calledAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFinishedTickets(tickets);
        });
        return () => unsubscribe();
    }, []);
    
    const filteredTickets = finishedTickets.filter(ticket =>
        ticket.ticketNumber.toString().includes(searchTerm) ||
        (ticket.location && ticket.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Archief</h1>
            <input
                type="text"
                placeholder="Zoek op nummer of lokaal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-6 p-2 border border-gray-300 rounded-md"
            />
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-left table-auto">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            <th className="p-3 font-semibold text-gray-600">Volgnummer</th>
                            <th className="p-3 font-semibold text-gray-600">Lokaal</th>
                            <th className="p-3 font-semibold text-gray-600">Geholpen om</th>
                            <th className="p-3 font-semibold text-gray-600">Opmerking</th>
                        </tr>
                    </thead>
                    <tbody>
                        {finishedTickets.map(ticket => (
                            <tr key={ticket.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-bold text-lg"># {ticket.ticketNumber}</td>
                                <td className="p-3 text-gray-700">{ticket.location}</td>
                                <td className="p-3 text-gray-500">
                                    {ticket.calledAt ? new Date(ticket.calledAt.seconds * 1000).toLocaleString('nl-NL') : '-'}
                                </td>
                                <td className="p-3 text-gray-500">{ticket.comment || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {finishedTickets.length === 0 && (
                     <p className="text-center p-8 text-gray-500">Geen voltooide tickets gevonden.</p>
                 )}
            </div>
        </div>
    );
}

// --- TicketSelectionModal Component ---
function TicketSelectionModal({ isOpen, onClose, tickets, location, onSelectTicket }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full flex flex-col" style={{maxHeight: '80vh'}}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Kies een nummer voor {location}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <div className="overflow-y-auto">
                    {tickets.length > 0 ? (
                        <div className="space-y-2">
                            {tickets.map(ticket => (
                                <button
                                    key={ticket.id}
                                    onClick={() => onSelectTicket(location, ticket)}
                                    className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-[#d64e78] hover:text-white transition-colors flex justify-between items-center"
                                >
                                    <span className="text-2xl font-bold"># {ticket.ticketNumber}</span>
                                    <span className="text-sm text-gray-500">{new Date(ticket.createdAt.seconds * 1000).toLocaleTimeString('nl-NL')}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">Geen nummers in de wachtrij.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- FinishModal Component ---
function FinishModal({ isOpen, onClose, onConfirm, location, comment, setComment }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Voltooi oproep voor {location}</h2>
                <p className="text-gray-600 mb-4">Voeg optioneel een opmerking toe.</p>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Opmerking (optioneel)..."
                    className="w-full p-2 border border-gray-300 rounded-md mb-6"
                    rows="3"
                ></textarea>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold transition-colors">Annuleren</button>
                    <button onClick={() => onConfirm(location, comment)} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold transition-colors">Bevestigen</button>
                </div>
            </div>
        </div>
    );
}

// --- LocationEditModal Component ---
function LocationEditModal({ isOpen, onClose, locations, onSave }) {
    const [localLocations, setLocalLocations] = useState(locations);
    
    useEffect(() => {
        setLocalLocations(locations);
    }, [locations, isOpen]);

    const handleNameChange = (index, newName) => {
        const updatedLocations = [...localLocations];
        updatedLocations[index] = newName;
        setLocalLocations(updatedLocations);
    };

    const handleSave = () => {
        onSave(localLocations);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full flex flex-col" style={{maxHeight: '90vh'}}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900">Beheer Lokaalnamen</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <div className="overflow-y-auto space-y-4">
                    {localLocations.map((name, index) => (
                        <div key={index}>
                            <label className="block text-sm font-medium text-gray-700">Lokaal {index + 1}</label>
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(index, e.target.value)}
                                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#d64e78] focus:border-[#d64e78]"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold transition-colors">Annuleren</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold transition-colors">Opslaan</button>
                </div>
            </div>
        </div>
    );
}

// --- ConfirmationModal Component ---
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full animate-fade-in">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{message}</p>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold transition-colors">Annuleren</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition-colors">Bevestigen</button>
                </div>
            </div>
        </div>
    );
}

// --- Style for animations ---
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .animate-slide-in {
    animation: slide-in 0.5s ease-out;
  }
  @keyframes flash-border {
    50% { box-shadow: 0 0 0 12px rgba(253, 224, 71, 0.7); }
    100% { box-shadow: 0 0 0 20px rgba(253, 224, 71, 0); }
  }
  .animate-flash {
    animation: flash-border 1.5s ease-out;
  }
`;
document.head.appendChild(style);

export default App;
export { Kiosk, Display, Admin, Archive };
