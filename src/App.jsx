import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, runTransaction, query, where, orderBy, limit, serverTimestamp, getDocs, writeBatch, documentId, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Users, Monitor, Ticket, Send, Building2, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';

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

// --- Main App Component ---
function App() {
    return (
        <BrowserRouter>
            <div className="bg-gray-50 min-h-screen font-sans">
                <nav className="bg-white shadow-md">
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
                            </div>
                        </div>
                    </div>
                </nav>
                <main>
                    <Routes>
                        <Route path="/" element={<Kiosk />} />
                        <Route path="/display" element={<Display />} />
                        <Route path="/admin" element={<Admin />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

// --- Kiosk Component (Home Page: /) ---
function Kiosk() {
    const [ticketNumber, setTicketNumber] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
        <div className="flex flex-col items-center justify-center p-8 text-center" style={{minHeight: 'calc(100vh - 64px)'}}>
            <div className="bg-white p-12 rounded-2xl shadow-xl max-w-2xl w-full">
                {!ticketNumber ? (
                    <>
                        <Ticket className="mx-auto h-24 w-24 text-[#d64e78] mb-6" />
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

// --- Display Component (Page: /display) ---
function Display() {
    const [mostRecentTicket, setMostRecentTicket] = useState(null);
    const [busyLocations, setBusyLocations] = useState([]);
    const audioRef = useRef(null);

    useEffect(() => {
        if (window.Tone) { audioRef.current = new window.Tone.Synth().toDestination(); } 
        const startAudio = () => {
            if (window.Tone && window.Tone.context.state !== 'running') { window.Tone.context.resume(); }
            document.body.removeEventListener('click', startAudio);
        };
        document.body.addEventListener('click', startAudio);
        return () => document.body.removeEventListener('click', startAudio);
    }, []);

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'called'), orderBy('calledAt', 'desc'), limit(1));
        
        const unsubscribe = onSnapshot(q, 
            (snapshot) => { // Success callback
                if (!snapshot.empty) {
                    const newTicket = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    
                    setMostRecentTicket(currentTicket => {
                        if (!currentTicket || currentTicket.id !== newTicket.id) {
                            if (audioRef.current && window.Tone.context.state === 'running') {
                                audioRef.current.triggerAttackRelease("C5", "8n");
                            }
                            return newTicket;
                        }
                        return currentTicket;
                    });
                } else {
                    setMostRecentTicket(null);
                }
            }, 
            (error) => { // Error callback to guide user
                console.error("Fout bij ophalen van meest recente oproep:", error);
                if (error.message.includes("indexes?")) {
                    alert(`BELANGRIJKE DATABASE FOUT: De vereiste database-index voor het WEERGAVESCHERM ontbreekt. Open de browser console (F12), zoek naar de foutmelding van Firebase, en klik op de link om de index aan te maken. Dit is een eenmalige actie.`);
                } else {
                    alert(`Fout op weergavescherm: ${error.message}`);
                }
            }
        );
        return () => unsubscribe();
    }, []);

    // Listener for the status of all locations
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
        <div className="bg-gray-800 text-white p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8" style={{minHeight: 'calc(100vh - 64px)'}}>
            <div className="lg:col-span-2 bg-[#d64e78] rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl">
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
            
            <div className="bg-gray-700 rounded-2xl p-6 shadow-lg">
                <h3 className="text-3xl font-bold border-b-4 border-gray-500 pb-3 mb-6">Actieve Lokalen</h3>
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
    );
}

// --- Admin Component (Page: /admin) ---
function Admin() {
    const [waitingTickets, setWaitingTickets] = useState([]);
    const [locationStates, setLocationStates] = useState({});
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSystemReady, setIsSystemReady] = useState(false);

    useEffect(() => {
        const initializeSystem = async () => {
            console.log("Checking system initialization...");
            const locationsCollectionRef = collection(db, `artifacts/${appId}/public/data/locations`);
            const batch = writeBatch(db);
            let writesMade = false;

            for (const locationName of availableLocations) {
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
            console.log("System is ready.");
            setIsSystemReady(true);
        };

        initializeSystem();
    }, []); 

    // Get waiting tickets
    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'waiting'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setWaitingTickets(tickets);
            },
            (error) => {
                console.error("Fout bij ophalen van de wachtrij:", error);
                if (error.message.includes("indexes?")) {
                    alert(`DATABASE FOUT: De vereiste database-index voor de BEHEER-pagina ontbreekt. Open de browser console (F12), zoek naar de foutmelding van Firebase, en klik op de link om de index aan te maken. Dit is een eenmalige actie.`);
                }
            }
        );
        return () => unsubscribe();
    }, []);

    // Get status of all locations
    useEffect(() => {
        const locationsRef = collection(db, `artifacts/${appId}/public/data/locations`);
        const unsubscribe = onSnapshot(locationsRef, (snapshot) => {
            const states = {};
            snapshot.forEach(doc => {
                states[doc.id] = doc.data();
            });
            setLocationStates(states);
        });
        return () => unsubscribe();
    }, []);

    const callNextTicket = async (location) => {
        if (!location || typeof location !== 'string') {
            alert("Interne fout: ongeldige locatie.");
            return;
        }
        setIsProcessing(true);

        try {
            if (waitingTickets.length === 0) {
                 throw new Error("No tickets in queue");
            }
            const nextTicket = waitingTickets[0];
            
            if (!nextTicket || !nextTicket.id) {
                throw new Error("Wachtrij data is onvolledig. Probeer de pagina te verversen.");
            }

            const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, nextTicket.id);
            const locationRef = doc(db, `artifacts/${appId}/public/data/locations`, location);

            await runTransaction(db, async (transaction) => {
                const ticketDoc = await transaction.get(ticketRef);
                if (!ticketDoc.exists() || ticketDoc.data().status !== 'waiting') {
                    throw new Error("Ticket is al opgeroepen door een andere gebruiker.");
                }

                transaction.update(ticketRef, { status: 'called', location: location, calledAt: serverTimestamp() });
                transaction.set(locationRef, { status: 'busy', ticketNumber: nextTicket.ticketNumber, ticketId: nextTicket.id });
            });

        } catch (e) {
            console.error("TRANSACTION FAILED: ", e);
            if (e.message.includes("No tickets in queue")) {
                // Not a user-facing error
            } else {
                alert(`Fout bij oproepen: ${e.message}`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const markAsFinished = async (location) => {
        if (!location || typeof location !== 'string') {
            alert("Interne fout: ongeldige locatie.");
            return;
        }
        setIsProcessing(true);
        const locationRef = doc(db, `artifacts/${appId}/public/data/locations`, location);
        const ticketId = locationStates[location]?.ticketId;

        try {
            await runTransaction(db, async(transaction) => {
                transaction.set(locationRef, { status: 'available', ticketNumber: null, ticketId: null });
                if (ticketId) {
                    const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, ticketId);
                    transaction.update(ticketRef, { status: 'finished' });
                }
            });
        } catch(e) {
            console.error("FINISH FAILED: ", e);
            alert(`Kon status niet bijwerken: ${e.message}`);
        } finally {
             setIsProcessing(false);
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
            
            availableLocations.forEach(loc => {
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

    return (
        <>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Beheer Wachtrij</h1>
                    <button onClick={() => setIsResetModalOpen(true)} className="flex items-center bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors">
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Reset Systeem
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Wachtrij ({waitingTickets.length})</h2>
                        <div className="space-y-3">
                            {waitingTickets.length > 0 ? waitingTickets.slice(0, 5).map((ticket, index) => (
                                <div key={ticket.id} className={`p-3 rounded-lg flex justify-between items-center ${index === 0 ? 'bg-blue-100 border-blue-400 border-2' : 'bg-gray-100'}`}>
                                    <span className={`font-bold text-2xl ${index === 0 ? 'text-blue-600' : 'text-gray-800'}`}>{ticket.ticketNumber}</span>
                                    <span className="text-sm text-gray-500">{ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleTimeString('nl-NL') : ''}</span>
                                </div>
                            )) : <p className="text-center p-8 text-gray-500">De wachtrij is leeg.</p>}
                             {waitingTickets.length > 5 && <p className="text-center text-sm text-gray-500 mt-4">... en {waitingTickets.length - 5} meer.</p>}
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
                                {availableLocations.map(loc => {
                                    const state = locationStates[loc];
                                    const isBusy = state?.status === 'busy';
                                    const canCall = !isBusy && waitingTickets.length > 0;

                                    return (
                                        <div key={loc} className={`p-4 rounded-lg transition-all ${isBusy ? 'bg-yellow-100' : 'bg-green-50'}`}>
                                            <h3 className="font-bold text-lg text-gray-800">{loc}</h3>
                                            {isBusy ? (
                                                <>
                                                    <p className="text-3xl font-black text-gray-900 my-2"># {state.ticketNumber}</p>
                                                    <button onClick={() => markAsFinished(loc)} disabled={isProcessing} className="w-full mt-2 flex items-center justify-center bg-green-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                                        {!isProcessing && 'Voltooien'}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-3xl font-black text-gray-400 my-2">-</p>
                                                    <button onClick={() => callNextTicket(loc)} disabled={!canCall || isProcessing} className="w-full mt-2 flex items-center justify-center bg-blue-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                                         {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5 mr-2" />}
                                                        {!isProcessing && 'Volgende oproepen'}
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
            </div>
            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetQueue}
                title="Systeem Resetten"
                message="Weet u zeker dat u de volledige wachtrij wilt verwijderen en alle lokalen wilt vrijgeven? Deze actie kan niet ongedaan worden gemaakt."
            />
        </>
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
`;
document.head.appendChild(style);

// ** NEW EXPORTS FOR main.jsx **
export default App;
export { Kiosk, Display, Admin };
