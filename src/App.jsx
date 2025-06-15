import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, runTransaction, query, where, orderBy, limit, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { Users, Monitor, Ticket, Send, Building2, RefreshCw } from 'lucide-react';

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

// --- Main App Component ---
// This component now uses react-router-dom to handle navigation.
export default function App() {
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setIsAuthReady(true);
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Anonymous sign-in failed:", error);
                });
            }
        });
        return () => unsubscribe();
    }, []);

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-700">Authenticatie wordt geladen...</p>
                    <div className="mt-4 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }
    
    // Using BrowserRouter to enable routing
    return (
        <BrowserRouter>
            <div className="bg-gray-50 min-h-screen font-sans">
                <nav className="bg-white shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Link to="/" className="flex items-center">
                                <Users className="h-8 w-8 text-blue-600" />
                                <span className="ml-3 font-bold text-2xl text-gray-800">Wachtrij Systeem</span>
                            </Link>
                            <div className="flex items-center space-x-2">
                                <NavLink to="/" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Kiosk</NavLink>
                                <NavLink to="/display" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Weergave</NavLink>
                                <NavLink to="/admin" className={({isActive}) => `px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Beheer</NavLink>
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

        const counterRef = doc(db, `artifacts/${appId}/public/data/counters`, 'ticketCounter');
        const ticketsCollectionRef = collection(db, `artifacts/${appId}/public/data/tickets`);

        try {
            const newTicketNumber = await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                let currentNumber = 0; 
                if (counterDoc.exists()) {
                    currentNumber = counterDoc.data().lastNumber;
                }
                const newNumber = currentNumber + 1;
                transaction.set(counterRef, { lastNumber: newNumber }, { merge: true });
                await addDoc(ticketsCollectionRef, {
                    ticketNumber: newNumber,
                    status: 'waiting',
                    createdAt: serverTimestamp(),
                    location: null,
                    calledAt: null,
                });
                return newNumber;
            });
            setTicketNumber(newTicketNumber);
        } catch (e) {
            console.error("Error getting ticket: ", e);
            setError("Kon geen nummer ophalen. Probeer het opnieuw.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center" style={{minHeight: 'calc(100vh - 64px)'}}>
            <div className="bg-white p-12 rounded-2xl shadow-xl max-w-2xl w-full">
                {!ticketNumber ? (
                    <>
                        <Ticket className="mx-auto h-24 w-24 text-blue-500 mb-6" />
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Welkom!</h1>
                        <p className="mt-4 text-lg text-gray-600">Druk op de knop om een volgnummer te ontvangen.</p>
                        <button
                            onClick={getTicket}
                            disabled={isLoading}
                            className="mt-10 w-full bg-blue-600 text-white font-bold py-6 px-8 rounded-xl text-2xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "Neem een volgnummer"}
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold text-gray-600">Uw volgnummer is:</h2>
                        <p className="text-8xl md:text-9xl font-extrabold text-blue-600 my-4 animate-pulse">{ticketNumber}</p>
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
    const [calledTickets, setCalledTickets] = useState([]);
    const [busyLocations, setBusyLocations] = useState([]);
    const audioRef = useRef(null);

    useEffect(() => {
        if (window.Tone) { audioRef.current = new window.Tone.Synth().toDestination(); } 
        else { console.warn("Tone.js not available."); }
        const startAudio = () => {
            if (window.Tone && window.Tone.context.state !== 'running') { window.Tone.context.resume(); }
            document.body.removeEventListener('click', startAudio);
        };
        document.body.addEventListener('click', startAudio);
        return () => document.body.removeEventListener('click', startAudio);
    }, []);

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'called'), orderBy('calledAt', 'desc'), limit(30));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCalledTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (calledTickets.length > 0 && newCalledTickets.length > 0 && newCalledTickets[0].id !== calledTickets[0].id) {
                if (audioRef.current && window.Tone.context.state === 'running') { audioRef.current.triggerAttackRelease("C5", "8n"); }
            }
            setCalledTickets(newCalledTickets);

            const latestCallsByLocation = {};
            for (const ticket of newCalledTickets) {
                if (ticket.location && !latestCallsByLocation[ticket.location]) { latestCallsByLocation[ticket.location] = ticket; }
            }
            const sortedBusyLocations = Object.values(latestCallsByLocation).sort((a, b) => a.location.localeCompare(b.location, 'nl-NL', { numeric: true }));
            setBusyLocations(sortedBusyLocations);
        }, (error) => { console.error("Error fetching called tickets:", error); });
        return () => unsubscribe();
    }, [calledTickets]);

    const mostRecentTicket = calledTickets.length > 0 ? calledTickets[0] : null;

    return (
        <div className="bg-gray-800 text-white p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8" style={{minHeight: 'calc(100vh - 64px)'}}>
            <div className="lg:col-span-2 bg-blue-600 rounded-2xl flex flex-col items-center justify-center p-8 shadow-2xl">
                {mostRecentTicket ? (
                    <>
                        <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 uppercase tracking-wider">Volgnummer</h2>
                        <p className="text-8xl md:text-9xl lg:text-[12rem] font-black my-4 text-white animate-fade-in">{mostRecentTicket.ticketNumber}</p>
                        <h2 className="text-4xl md:text-5xl font-bold text-yellow-300 uppercase tracking-wider">Ga naar</h2>
                        <p className="text-6xl md:text-7xl lg:text-[7rem] font-bold text-white mt-4">{mostRecentTicket.location}</p>
                    </>
                ) : (
                    <div className="text-center">
                        <Monitor className="mx-auto h-32 w-32 text-blue-300 mb-6" />
                        <p className="text-4xl font-semibold text-blue-200">Wacht op de eerste oproep...</p>
                    </div>
                )}
            </div>
            
            <div className="bg-gray-700 rounded-2xl p-6 shadow-lg">
                <h3 className="text-3xl font-bold border-b-4 border-gray-500 pb-3 mb-6">Actieve Lokalen</h3>
                {busyLocations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {busyLocations.map(ticket => (
                            <div key={ticket.location} className="bg-gray-600 p-4 rounded-lg flex flex-col text-center animate-slide-in">
                                <span className="font-bold text-2xl text-yellow-400">{ticket.location}</span>
                                <span className="font-black text-4xl text-white mt-1"># {ticket.ticketNumber}</span>
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
    const [location, setLocation] = useState('Lokaal 1');
    const [callingId, setCallingId] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    
    const availableLocations = Array.from({ length: 10 }, (_, i) => `Lokaal ${i + 1}`);

    useEffect(() => {
        const q = query(collection(db, `artifacts/${appId}/public/data/tickets`), where('status', '==', 'waiting'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWaitingTickets(tickets);
        }, (error) => { console.error("Error fetching waiting tickets:", error); });
        return () => unsubscribe();
    }, []);

    const callNextTicket = async () => {
        if (waitingTickets.length === 0) { alert("Er zijn geen wachtenden in de rij."); return; }
        const nextTicket = waitingTickets[0];
        setCallingId(nextTicket.id);
        const ticketRef = doc(db, `artifacts/${appId}/public/data/tickets`, nextTicket.id);
        try {
            await updateDoc(ticketRef, { status: 'called', location: location, calledAt: serverTimestamp() });
        } catch (e) {
            console.error("Error calling ticket: ", e);
            alert("Er is een fout opgetreden bij het oproepen van het nummer.");
        } finally {
            setCallingId(null);
        }
    };
    
    const handleResetQueue = async () => {
        console.log("Resetting the entire queue...");
        const ticketsCollectionRef = collection(db, `artifacts/${appId}/public/data/tickets`);
        const counterRef = doc(db, `artifacts/${appId}/public/data/counters`, 'ticketCounter');
        
        try {
            const querySnapshot = await getDocs(ticketsCollectionRef);
            const batch = writeBatch(db);
            querySnapshot.forEach(doc => { batch.delete(doc.ref); });
            batch.set(counterRef, { lastNumber: 0 });
            await batch.commit();
            console.log("Queue has been reset successfully.");
        } catch (e) {
            console.error("Failed to reset queue: ", e);
            alert("De wachtrij kon niet worden gereset.");
        } finally {
            setIsResetModalOpen(false);
        }
    };

    const nextInLine = waitingTickets.length > 0 ? waitingTickets[0] : null;

    return (
        <>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Beheer Wachtrij</h1>
                    <button
                        onClick={() => setIsResetModalOpen(true)}
                        className="flex items-center bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Reset Wachtrij
                    </button>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Volgende Klant Oproepen</h2>
                    {nextInLine ? (
                        <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-4">
                            <div className="flex items-center bg-gray-100 p-4 rounded-lg flex-shrink-0">
                                 <Ticket className="w-8 h-8 text-blue-600 mr-3"/>
                                <span className="text-3xl font-bold text-gray-800">{nextInLine.ticketNumber}</span>
                            </div>
                            <select value={location} onChange={(e) => setLocation(e.target.value)} className="flex-grow w-full md:w-auto p-4 border-2 bg-white border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition">
                               {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                            <button onClick={callNextTicket} disabled={callingId !== null} className="w-full md:w-auto bg-green-500 text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 ease-in-out flex items-center justify-center disabled:bg-gray-400">
                                 {callingId === nextInLine.id ? 'Oproepen...' : 'Oproepen'}
                                 <Send className="w-5 h-5 ml-2"/>
                            </button>
                        </div>
                    ) : ( <p className="text-gray-500">Er staan momenteel geen mensen in de wachtrij.</p> )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                     <h2 className="text-2xl font-semibold text-gray-800 mb-4">Wachtrij ({waitingTickets.length})</h2>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-sm"><tr><th className="p-3">Volgnummer</th><th className="p-3">Tijd van aanmelden</th></tr></thead>
                            <tbody>
                                {waitingTickets.map(ticket => (
                                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-bold text-lg text-gray-800">{ticket.ticketNumber}</td>
                                        <td className="p-3 text-gray-600">{ticket.createdAt ? new Date(ticket.createdAt.seconds * 1000).toLocaleTimeString('nl-NL') : 'Laden...'}</td>
                                    </tr>
                                ))}
                                 {waitingTickets.length === 0 && (<tr><td colSpan="2" className="text-center p-8 text-gray-500">De wachtrij is leeg.</td></tr>)}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleResetQueue}
                title="Wachtrij Resetten"
                message="Weet u zeker dat u de volledige wachtrij wilt verwijderen en de teller wilt resetten? Deze actie kan niet ongedaan worden gemaakt."
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
