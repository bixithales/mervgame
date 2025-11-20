import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, HelpCircle, Key, Rocket, Star, Heart, ShieldCheck, DoorOpen, RefreshCcw, Infinity, Upload, Scan, AlertOctagon, Eye, Settings, Radio } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- FIREBASE KURULUMU ---
const firebaseConfig = {
  apiKey: "AIzaSyB60LDBpsqwCDZm6FtlhZqIiUaedq2qdYw",
  authDomain: "mervearg-2a516.firebaseapp.com",
  projectId: "mervearg-2a516",
  storageBucket: "mervearg-2a516.firebasestorage.app",
  messagingSenderId: "517370332542",
  appId: "1:517370332542:web:b66e6863e88d9340795f2f",
  measurementId: "G-7YEH79W56Q"
};

// Firebase başlatma (Hata korumalı)
let app, auth, db, storage;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (e) {
  console.warn("Firebase başlatılamadı, çevrimdışı mod aktif:", e);
}

const appId = "merve-game-v1"; 
const GAME_COLLECTION = "games";
const GAME_DOC_ID = "merve_progress";

// --- Fontlar ve Stiller ---
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Orbitron:wght@400;700&family=Press+Start+2P&display=swap');
      .font-cinzel { font-family: 'Cinzel', serif; }
      .font-orbitron { font-family: 'Orbitron', sans-serif; }
      .font-pixel { font-family: 'Press Start 2P', cursive; }
      
      .scanlines {
        background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1));
        background-size: 100% 4px;
        position: fixed; inset: 0; pointer-events: none; z-index: 40;
      }
      .pixel-art { image-rendering: pixelated; }
      
      @keyframes shake { 
        10%, 90% { transform: translate3d(-2px, 0, 0); } 
        20%, 80% { transform: translate3d(4px, 0, 0); } 
        30%, 50%, 70% { transform: translate3d(-8px, 0, 0); } 
        40%, 60% { transform: translate3d(8px, 0, 0); } 
      }
      .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    `}
  </style>
);

// --- 3D Sahne (Arka Plan) ---
const ThreeScene = ({ gameStage, errorCount }) => {
  const mountRef = useRef(null);
  useEffect(() => {
    if (!mountRef.current) return;
    const manager = new THREE.LoadingManager();
    const textureLoader = new THREE.TextureLoader(manager);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0005);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(30, 40, 140);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xFFFFFF, 2, 800);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    const alertLight = new THREE.PointLight(0xff0000, 0, 500);
    alertLight.position.set(0, 50, 0);
    scene.add(alertLight);

    const solarSystem = new THREE.Group();
    solarSystem.position.set(-30, -10, 0);
    scene.add(solarSystem);

    const sunGeometry = new THREE.SphereGeometry(18, 64, 64); 
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFAA00, map: textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/9/99/Map_of_the_full_sun.jpg') });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    solarSystem.add(sun); 
    const glowGeo = new THREE.SphereGeometry(22, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFDD44, transparent: true, opacity: 0.2 });
    const sunGlow = new THREE.Mesh(glowGeo, glowMat);
    solarSystem.add(sunGlow);

    const planets = [];
    function createPlanet(size, textureUrl, distance, speed, colorHex) {
        const geometry = new THREE.SphereGeometry(size, 64, 64);
        const materialConfig = { roughness: 0.8, metalness: 0.1 };
        if (textureUrl) { materialConfig.map = textureLoader.load(textureUrl); materialConfig.color = 0xffffff; } 
        else { materialConfig.color = colorHex; }
        const material = new THREE.MeshStandardMaterial(materialConfig);
        const planet = new THREE.Mesh(geometry, material);
        planet.position.x = distance;
        const planetData = { mesh: planet, distance: distance, speed: speed, angle: Math.random() * Math.PI * 2 };
        solarSystem.add(planet); planets.push(planetData);
        const orbitGeo = new THREE.RingGeometry(distance - 0.2, distance + 0.2, 128);
        const orbitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.03 });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        solarSystem.add(orbit); 
    }

    const earthTexture = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
    const moonTexture = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg';
    const marsTexture = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/1024px-OSIRIS_Mars_true_color.jpg';
    const jupiterTexture = 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg'; 
    const mercuryTexture = 'https://upload.wikimedia.org/wikipedia/commons/3/30/Mercury_in_color_-_Prockter07_centered.jpg';
    
    createPlanet(4, mercuryTexture, 35, 0.002);    
    createPlanet(6, earthTexture, 60, 0.0015);     
    createPlanet(5, marsTexture, 85, 0.0012);      
    createPlanet(14, jupiterTexture, 130, 0.0005); 
    createPlanet(3, moonTexture, 170, 0.0008);     

    const starGeo = new THREE.BufferGeometry();
    const starCount = 8000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) starPos[i] = (Math.random() - 0.5) * 2000;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ size: 1.2, color: 0xFFFFFF });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    const asteroids = [];
    const asteroidColors = [0x888888, 0x666666, 0x444444];
    for(let i=0; i<400; i++) {
        const size = Math.random() * 0.8 + 0.3; const geo = new THREE.DodecahedronGeometry(size, 0);
        const color = asteroidColors[Math.floor(Math.random() * asteroidColors.length)];
        const mat = new THREE.MeshLambertMaterial({ color: color }); const ast = new THREE.Mesh(geo, mat);
        const angle = Math.random() * Math.PI * 2; const radius = 100 + Math.random() * 15; 
        ast.position.set(Math.cos(angle)*radius, (Math.random()-0.5)*5, Math.sin(angle)*radius);
        ast.userData = { angle: angle, radius: radius, speed: 0.0001 + Math.random() * 0.0002, rotX: (Math.random()-0.5)*0.02, rotY: (Math.random()-0.5)*0.02 };
        solarSystem.add(ast); asteroids.push(ast);
    }

    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (e) => { mouseX = (e.clientX - window.innerWidth/2) * 0.05; mouseY = (e.clientY - window.innerHeight/2) * 0.05; };
    window.addEventListener('mousemove', handleMouseMove);
    let frameId;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const stressLevel = Math.min(errorCount / 5, 1);
        
        if (gameStage === 5) {
            alertLight.intensity = 1.5 + Math.sin(Date.now() * 0.002) * 1; 
            sunGlow.material.color.setHex(0x550000); 
            sun.material.color.setHex(0x330000); 
            ambientLight.color.setHex(0x110000); 
        } else if (stressLevel > 0 && gameStage < 6) {
            alertLight.intensity = stressLevel * 5 + Math.sin(Date.now() * 0.01) * 2;
            sunGlow.material.color.setHex(0xff0000);
        } else {
            alertLight.intensity = 0;
            sunGlow.material.color.setHex(0xFFDD44);
            sun.material.color.setHex(0xFFAA00);
            ambientLight.color.setHex(0x404040);
        }
        
        const speedMult = gameStage === 5 ? 0.2 : 1 + (stressLevel * 12); 
        
        sun.rotation.y += 0.0005 * speedMult; stars.rotation.y += 0.00005 * speedMult; 
        planets.forEach(p => { p.angle += p.speed * speedMult; p.mesh.position.x = Math.cos(p.angle) * p.distance; p.mesh.position.z = Math.sin(p.angle) * p.distance; p.mesh.rotation.y += 0.002; });
        asteroids.forEach(a => { a.userData.angle += a.userData.speed * speedMult; a.position.x = Math.cos(a.userData.angle) * a.userData.radius; a.position.z = Math.sin(a.userData.angle) * a.userData.radius; a.rotation.x += a.userData.rotX * speedMult; a.rotation.y += a.userData.rotY * speedMult; });
        camera.position.x += (mouseX - camera.position.x + 30) * 0.05; camera.position.y += (40 + mouseY * 0.5 - camera.position.y) * 0.05;
        camera.lookAt(solarSystem.position);
        renderer.render(scene, camera);
    }
    animate();
    const handleResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('resize', handleResize);
    
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('resize', handleResize); cancelAnimationFrame(frameId); if (mountRef.current) mountRef.current.removeChild(renderer.domElement); };
  }, [gameStage]); 
  return <div ref={mountRef} className="absolute inset-0 z-0 bg-black" />;
};

// --- SEVİMLİ BEBEK (SVG) ---
const BabyAvatar = ({ isWalking }) => (
    <svg width="60" height="70" viewBox="0 0 100 120" className={`drop-shadow-lg ${isWalking ? 'animate-bounce' : ''}`} style={{ overflow: 'visible' }}>
        <circle cx="50" cy="35" r="30" fill="#ffe0bd" stroke="#5c3a22" strokeWidth="2"/> <path d="M25 20 Q50 -5 75 20" fill="none" stroke="#5c3a22" strokeWidth="4" strokeLinecap="round"/> <path d="M45 10 Q50 0 55 10" fill="none" stroke="#5c3a22" strokeWidth="3" strokeLinecap="round"/> <circle cx="40" cy="35" r="3" fill="#333" /> <circle cx="60" cy="35" r="3" fill="#333" /> <circle cx="35" cy="42" r="4" fill="#ffafb0" opacity="0.6" /> <circle cx="65" cy="42" r="4" fill="#ffafb0" opacity="0.6" /> <circle cx="50" cy="50" r="6" fill="#ff69b4" stroke="#db4a94" strokeWidth="1"/> <circle cx="50" cy="50" r="2" fill="#fff" opacity="0.5" /> <path d="M50 56 Q50 62 54 60" stroke="#db4a94" strokeWidth="2" fill="none"/> <path d="M30 65 Q20 90 35 100 L45 105 L55 105 L65 100 Q80 90 70 65 Z" fill="#87ceeb" stroke="#4682b4" strokeWidth="2" /> <ellipse cx="22" cy="75" rx="8" ry="5" fill="#ffe0bd" transform="rotate(-20 22 75)" stroke="#5c3a22" strokeWidth="1"/> <ellipse cx="78" cy="75" rx="8" ry="5" fill="#ffe0bd" transform="rotate(20 78 75)" stroke="#5c3a22" strokeWidth="1"/> <ellipse cx="40" cy="105" rx="7" ry="9" fill="#ffe0bd" stroke="#5c3a22" strokeWidth="1"/> <ellipse cx="60" cy="105" rx="7" ry="9" fill="#ffe0bd" stroke="#5c3a22" strokeWidth="1"/>
    </svg>
);

// --- UNDERTALE BATTLE ---
const UndertaleBattle = ({ level, failures, onWin, onLose }) => {
    const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 });
    const [obstacles, setObstacles] = useState([]);
    const [timer, setTimer] = useState(10); 
    const [gameOver, setGameOver] = useState(false);
    const [levelComplete, setLevelComplete] = useState(false); 
    const [safeZones, setSafeZones] = useState([]); 
    const [inSafeZone, setInSafeZone] = useState(false);
    const boxRef = useRef(null);
    const frameRef = useRef();
    const lastSpawnRef = useRef(0);
    const startRef = useRef(Date.now());
    const safeZoneTimerRef = useRef(0);

    const levelConfig = { 
        1: { speed: 0.8, rate: 500, count: 1, modes: ['top'], reward: "MAN", obsSize: "w-2 h-2" }, 
        2: { speed: 0.9, rate: 550, count: 5, modes: ['top', 'side'], reward: "DA", obsSize: "w-2 h-2" }, 
        3: { speed: 0.5, rate: 350, count: 6, modes: ['all'], reward: "LA", obsSize: "w-6 h-6" } 
    };
    const config = levelConfig[level];
    const enableSafeZone = (level >= 2 && failures >= 2);

    const handleMove = (cx, cy) => { if (!boxRef.current || gameOver || levelComplete) return; const rect = boxRef.current.getBoundingClientRect(); let x = ((cx - rect.left) / rect.width) * 100; let y = ((cy - rect.top) / rect.height) * 100; x = Math.max(2, Math.min(98, x)); y = Math.max(2, Math.min(98, y)); setPlayerPos({ x, y }); };
    useEffect(() => { if (levelComplete) return; const loop = () => { const now = Date.now(); const remaining = Math.max(0, 10 - (now - startRef.current) / 1000); setTimer(remaining); if (remaining <= 0) { setLevelComplete(true); return; }
    if (enableSafeZone) { const zonesCount = Math.max(1, failures - 1); if (safeZones.length === 0 && now - safeZoneTimerRef.current > 100) { const newZones = []; for (let i = 0; i < zonesCount; i++) { newZones.push({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, size: 18 }); } setSafeZones(newZones); safeZoneTimerRef.current = now; } else if (safeZones.length > 0 && now - safeZoneTimerRef.current > 3000) { setSafeZones([]); safeZoneTimerRef.current = now; } }
    let isSafe = false; if (safeZones.length > 0) { for (let zone of safeZones) { const dx = Math.abs(playerPos.x - zone.x); const dy = Math.abs(playerPos.y - zone.y); if (dx < zone.size / 2 && dy < zone.size / 2) { isSafe = true; break; } } } setInSafeZone(isSafe);
    if (now - lastSpawnRef.current > config.rate) { let spawnCount = config.count; if (level === 3) { spawnCount = Math.max(1, config.count - (failures * 2)); } for (let i = 0; i < spawnCount; i++) { let side = config.modes.includes('all') ? Math.floor(Math.random() * 4) : (config.modes.includes('side') && Math.random() > 0.5 ? 1 : 0); let obs = { id: now + i + Math.random(), x: 50, y: 50, vx: 0, vy: 0 }; const s = config.speed + (Math.random() * 0.5); if (side === 0) { obs.x = Math.random()*100; obs.y = 0; obs.vy = s; obs.vx = (Math.random()-0.5)*s; } else if (side === 1) { obs.x = 100; obs.y = Math.random()*100; obs.vx = -s; obs.vy = (Math.random()-0.5)*s; } else if (side === 2) { obs.x = Math.random()*100; obs.y = 100; obs.vy = -s; obs.vx = (Math.random()-0.5)*s; } else { obs.x = 0; obs.y = Math.random()*100; obs.vx = s; obs.vy = (Math.random()-0.5)*s; } setObstacles(p => [...p, obs]); } lastSpawnRef.current = now; }
    setObstacles(prev => { const next = []; for (let o of prev) { o.x += o.vx; o.y += o.vy; const dx = o.x - playerPos.x; const dy = o.y - playerPos.y; const hitDistance = level === 3 ? 7 : 4; if (!isSafe && Math.sqrt(dx*dx + dy*dy) < hitDistance) { setGameOver(true); setTimeout(onLose, 500); return []; } if (o.x > -10 && o.x < 110 && o.y > -10 && o.y < 110) next.push(o); } return next; }); if (!gameOver) frameRef.current = requestAnimationFrame(loop); }; frameRef.current = requestAnimationFrame(loop); return () => cancelAnimationFrame(frameRef.current); }, [gameOver, playerPos, level, enableSafeZone, safeZones, levelComplete]);
    if (levelComplete) { return ( <div className="flex flex-col items-center justify-center w-full max-w-md h-64 bg-black border-4 border-green-500 shadow-[0_0_50px_green] animate-pulse z-50 gap-6 text-center"> <h2 className="text-green-400 font-orbitron text-lg tracking-widest">BÖLGE TAMAMLANDI</h2> <h1 className="text-6xl font-cinzel text-yellow-400 font-bold animate-bounce drop-shadow-lg">{config.reward}</h1> <button onClick={onWin} className="px-8 py-3 bg-green-700 hover:bg-green-600 text-white font-pixel text-sm rounded border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all"> İLERLE {'>'}{'>'} </button> </div> ) }
    return ( <div className="flex flex-col items-center gap-4 w-full max-w-md z-50 relative"> <div className="text-yellow-400 font-pixel text-xs animate-pulse">KALAN SÜRE: {Math.ceil(timer)}</div> {enableSafeZone && <div className="absolute top-[-40px] bg-blue-900/90 text-blue-100 text-[10px] px-3 py-2 rounded font-pixel animate-bounce border-2 border-blue-400 shadow-lg text-center"><ShieldCheck className="inline w-3 h-3 mr-1"/>{safeZones.length} GÜVENLİ ALAN AKTİF!</div>} <div ref={boxRef} className={`relative w-full aspect-square bg-black border-4 border-cyan-500 shadow-[0_0_30px_cyan] touch-none overflow-hidden ${gameOver ? 'border-red-600 animate-pulse bg-red-900/20' : ''}`} onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)} onMouseMove={e => handleMove(e.clientX, e.clientY)}> {safeZones.map((zone, i) => ( <div key={i} className="absolute border-2 border-blue-400 bg-blue-500/30 animate-pulse shadow-[0_0_10px_blue]" style={{ left: `${zone.x - zone.size/2}%`, top: `${zone.y - zone.size/2}%`, width: `${zone.size}%`, height: `${zone.size}%` }} /> ))} <div className={`absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ${inSafeZone ? 'text-blue-400 scale-125' : 'text-red-500'}`} style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}> {inSafeZone ? <ShieldCheck className="w-full h-full fill-current" /> : <Heart className="w-full h-full fill-current" />} </div> {obstacles.map(o => ( <div key={o.id} className={`absolute bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_5px_white] ${config.obsSize}`} style={{ left: `${o.x}%`, top: `${o.y}%` }} /> ))} </div> <p className="text-gray-500 font-orbitron text-[10px] mt-2">SEVİYE {level} / 3</p> </div> );
};
const MinimalMap = ({ unlockedLevel, onLevelSelect, onFinalSubmit }) => {
    const [friskPos, setFriskPos] = useState({ left: 10, bottom: 20 }); const [isWalking, setIsWalking] = useState(false); const [mandalaInput, setMandalaInput] = useState(""); const [mandalaError, setMandalaError] = useState(false);
    const handleDoorClick = (level) => { if (unlockedLevel < level) return; const targets = { 1: { left: 20, bottom: 40 }, 2: { left: 50, bottom: 40 }, 3: { left: 80, bottom: 40 } }; const target = targets[level]; setIsWalking(true); setFriskPos(target); setTimeout(() => { setIsWalking(false); onLevelSelect(level); }, 1500); };
    const handleMandalaSubmit = (e) => { 
        e.preventDefault(); 
        logActivity('MANDALA_ATTEMPT', mandalaInput);
        if (mandalaInput.trim().toLocaleUpperCase('tr-TR') === 'MANDALA') { onFinalSubmit(); } 
        else { setMandalaError(true); setTimeout(() => setMandalaError(false), 1000); } 
    };
    return ( <div className="w-full max-w-xl bg-black/80 border-2 border-gray-700 p-4 rounded-lg flex flex-col items-center gap-4 shadow-2xl relative overflow-hidden" style={{height: '480px'}}> <div className="absolute inset-0 pointer-events-none"><div className="absolute bottom-0 w-full h-1 bg-white/20"></div></div> <h2 className="text-gray-400 font-orbitron text-sm z-20 tracking-[0.3em]">BÖLGELER</h2> <div className="absolute z-30 transition-all duration-[1500ms] ease-in-out" style={{ left: `${friskPos.left}%`, bottom: `${friskPos.bottom}%` }}> <BabyAvatar isWalking={isWalking} /> </div> <div className="absolute bottom-[40%] w-full flex justify-around z-10"> {[1, 2, 3].map((lvl) => ( <button key={lvl} onClick={() => handleDoorClick(lvl)} disabled={unlockedLevel < lvl} className={`relative flex flex-col items-center transition-transform ${unlockedLevel >= lvl ? 'hover:scale-110 cursor-pointer opacity-100' : 'opacity-30 grayscale'}`}> <div className={`w-16 h-24 border-2 relative flex items-center justify-center rounded-t-full transition-all duration-500 ${unlockedLevel >= lvl ? 'border-white bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-gray-600'}`}> {unlockedLevel > lvl ? <Star className="text-yellow-400 w-6 h-6"/> : (unlockedLevel === lvl ? <DoorOpen className="text-white w-6 h-6 animate-pulse"/> : <Lock className="text-gray-600 w-4 h-4"/>)} </div> <div className="mt-2 text-[9px] font-orbitron text-gray-400 tracking-widest">KAPI {['I', 'II', 'III'][lvl-1]}</div> </button> ))} </div> {unlockedLevel >= 4 && ( <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-4 w-full px-8 z-40"> <form onSubmit={handleMandalaSubmit} className="flex flex-col gap-2 items-center"> <input type="text" value={mandalaInput} onChange={(e) => setMandalaInput(e.target.value)} placeholder="ŞİFREYİ BİRLEŞTİR" className={`w-full bg-transparent border-b-2 py-2 text-center text-white font-pixel text-sm focus:outline-none ${mandalaError ? 'border-red-500 placeholder:text-red-500 animate-shake' : 'border-gray-500 focus:border-yellow-400'}`} /> {mandalaInput.trim().toLocaleUpperCase('tr-TR') === 'MANDALA' ? ( <button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-orbitron text-xs rounded animate-pulse">İLERLE</button> ) : ( mandalaError && ( <button type="button" onClick={() => setMandalaInput("")} className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 font-pixel text-[10px] rounded border border-red-500">HATALI - TEKRAR DENE</button> ) )} </form> </motion.div> )} </div> );
};
const UndertaleManager = ({ onComplete }) => {
    const [view, setView] = useState('map'); const [unlockedLevel, setUnlockedLevel] = useState(1); const [currentLevel, setCurrentLevel] = useState(1); const [failures, setFailures] = useState({ 1: 0, 2: 0, 3: 0 }); 
    const startLevel = (lvl) => { setCurrentLevel(lvl); setView('battle'); };
    const devSkip = () => { onComplete(); };
    const handleWin = () => { if (currentLevel === unlockedLevel) setUnlockedLevel(prev => prev + 1); setView('map'); };
    const handleLose = () => { setFailures(prev => ({ ...prev, [currentLevel]: prev[currentLevel] + 1 })); setView('map'); };
    const handleFinalSubmit = () => { onComplete(); };
    return ( <div className="w-full flex flex-col items-center justify-center relative"> <button onClick={devSkip} className="absolute top-[-30px] left-0 text-[8px] bg-white/10 px-2 py-1 rounded text-gray-400 hover:text-white z-50">⏩ GEÇ (TEST)</button> {view === 'map' ? ( <MinimalMap unlockedLevel={unlockedLevel} onLevelSelect={startLevel} onFinalSubmit={handleFinalSubmit} /> ) : ( <UndertaleBattle level={currentLevel} failures={failures[currentLevel]} onWin={handleWin} onLose={handleLose} /> )} </div> );
};

// --- Klasik Wordle (Tekrar Dene + Ortalı Buton) ---
const WORDLE_ANSWER = "KİTAP";
const MAX_ATTEMPTS = 5;
const ClassicWordle = ({ onSuccess, onError }) => {
  const [board, setBoard] = useState(Array(MAX_ATTEMPTS).fill(null).map((_, i) => ({ word: "", colors: Array(5).fill(""), status: i === 0 ? 'active' : 'empty' })));
  const [activeRow, setActiveRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [shake, setShake] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [failed, setFailed] = useState(false); 

  const resetGame = () => {
      setBoard(Array(MAX_ATTEMPTS).fill(null).map((_, i) => ({ word: "", colors: Array(5).fill(""), status: i === 0 ? 'active' : 'empty' })));
      setActiveRow(0); setCurrentGuess(""); setLocked(false); setFailed(false);
  };
  const devSkip = () => { onSuccess(); };
  const handleInput = (key) => { if (locked || failed) return; if (key === 'ENTER') submitGuess(); else if (key === 'DEL') setCurrentGuess(p => p.slice(0, -1)); else if (currentGuess.length < 5) setCurrentGuess(p => p + key); };
  const submitGuess = async () => { 
      if (currentGuess.length !== 5) { setShake(true); setTimeout(() => setShake(false), 500); return; } 
      setLocked(true); 
      logActivity('WORDLE_GUESS', currentGuess);
      const colors = Array(5).fill(""); const answerChars = WORDLE_ANSWER.split(""); 
      currentGuess.split("").forEach((c, i) => { if(c===answerChars[i]) { colors[i]="bg-green-600 border-green-500"; answerChars[i]=null; } }); 
      currentGuess.split("").forEach((c, i) => { if(!colors[i] && answerChars.includes(c)) { colors[i]="bg-yellow-600 border-yellow-500"; answerChars[answerChars.indexOf(c)]=null; } else if(!colors[i]) colors[i]="bg-gray-700 border-gray-600"; }); 
      const newBoard = [...board]; newBoard[activeRow] = { ...newBoard[activeRow], word: currentGuess, colors, status: 'revealed' }; setBoard(newBoard); 
      if (currentGuess === WORDLE_ANSWER) { setTimeout(onSuccess, 1500); } 
      else { onError(); if(activeRow + 1 < MAX_ATTEMPTS) { newBoard[activeRow+1].status='active'; setActiveRow(p=>p+1); setBoard([...newBoard]); setCurrentGuess(""); setLocked(false); } else { setFailed(true); } } 
  };

  const keys = ["QWERTYUIOPĞÜ".split(""), "ASDFGHJKLŞİ".split(""), "ZXCVBNMÖÇ".split("")];
  return ( <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 z-20 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 relative"> 
    <button onClick={resetGame} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all" title="Oyunu Sıfırla"> <RefreshCcw className="w-4 h-4" /> </button> <button onClick={devSkip} className="absolute top-2 left-2 text-[8px] bg-white/10 px-2 py-1 rounded text-gray-400 hover:text-white">⏩ GEÇ (TEST)</button> <div className="flex flex-col gap-2 w-full items-center mt-4"> {board.map((row, ri) => ( <motion.div key={ri} animate={row.status==='active' && shake ? {x:[-5,5,0]} : {}} className={`flex gap-2 ${row.status==='empty'?'opacity-30':''}`}> {[...Array(5)].map((_, i) => ( <div key={i} className={`w-12 h-12 flex items-center justify-center text-xl font-bold text-white border-2 rounded ${row.status==='revealed'?row.colors[i]:'border-gray-500 bg-black/40'}`}> {row.status==='active' && ri===activeRow ? currentGuess[i] : row.word[i]} </div> ))} </motion.div> ))} </div> <div className="flex flex-col gap-2 w-full"> {keys.map((r,i)=><div key={i} className="flex justify-center gap-1">{r.map(k=><button key={k} onClick={()=>handleInput(k)} className="px-2 py-3 bg-white/10 rounded text-white text-xs font-bold min-w-[30px]">{k}</button>)} {i===2&&<><button onClick={()=>handleInput('DEL')} className="px-3 bg-red-900/50 text-white text-xs rounded">SIL</button><button onClick={()=>handleInput('ENTER')} className="px-3 bg-green-900/50 text-white text-xs rounded">GİR</button></>}</div>)} </div> {activeRow>=3&&!showHint&&<button onClick={()=>setShowHint(true)} className="flex items-center gap-2 text-yellow-400 text-sm font-orbitron mt-2"><HelpCircle size={16}/> İPUCU</button>} {showHint&&<div className="text-yellow-300 font-cinzel italic bg-black/60 px-4 py-2 rounded border border-yellow-500/30">"Sessiz öğretmen."</div>} </div> );
};

// --- Karanlık Aşaması (Gerçek Onaylı - İnsan Kontrolü) ---
const DarkChallenge = ({ onSuccess, currentData }) => {
  const [step, setStep] = useState('prompt'); // prompt, uploading, pending
  const [error, setError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Firebase'den gelen status 'approved' ise geç
    if (currentData?.status === 'approved') {
      onSuccess();
    } else if (currentData?.status === 'waiting_approval') {
      setStep('pending');
    }
  }, [currentData, onSuccess]);

  const handleFileSelect = async (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        // Offline mode için
        if (!auth.currentUser) {
             setStep('pending');
             // Offline modda onay simülasyonu (Test için)
             // setTimeout(() => onSuccess(), 5000); 
        } else {
             try {
                 setStep('pending'); // Yükleniyor göstergesi eklenebilir
                 const storageRef = ref(storage, `proofs/${GAME_DOC_ID}_${Date.now()}`);
                 const snapshot = await uploadBytes(storageRef, file);
                 const downloadURL = await getDownloadURL(snapshot.ref);
                 
                 logActivity('PROOF_UPLOADED', 'Fotoğraf yüklendi. URL veritabanına kaydedildi.');

                 updateProgress({ 
                     status: 'waiting_approval', 
                     uploadedAt: new Date().toISOString(),
                     proofUrl: downloadURL
                 });
             } catch (error) {
                 console.error("Upload failed", error);
                 setError(true);
                 setStep('prompt');
             }
        }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto z-50 p-6 bg-black/80 backdrop-blur-xl rounded-lg border border-gray-800 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      <AnimatePresence mode='wait'>
        {step === 'prompt' && (
          <motion.div key="prompt" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center text-center gap-4">
             <AlertOctagon className="w-12 h-12 text-gray-500 animate-pulse" />
             <p className="text-gray-300 font-cinzel leading-relaxed text-sm">
               "Buraya kadar gelebildin demek... Buradan sonra işler masum devam etmeyecek."
             </p>
             <p className="text-gray-400 font-bold font-cinzel text-md border-l-2 border-gray-600 pl-4 italic">
               "Yatağındaki timsahı öldürmeni istiyorum. Paramparça et onu ve fotoğrafını buraya yükle."
             </p>
             <button onClick={() => fileInputRef.current.click()} className="mt-4 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-orbitron text-sm rounded border border-gray-700 flex items-center gap-2 transition-all">
               <Upload className="w-4 h-4" /> KANITI YÜKLE
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          </motion.div>
        )}

        {step === 'pending' && (
           <motion.div key="pending" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full flex flex-col items-center gap-4 text-center">
              <Scan className="w-16 h-16 text-yellow-500 animate-pulse" />
              <h2 className="text-yellow-500 font-orbitron text-lg">İNCELEME BEKLENİYOR</h2>
              <p className="text-gray-400 font-mono text-xs">Yönetici kanıtı inceliyor... Lütfen bekleyin.</p>
              <div className="w-full h-1 bg-gray-800 rounded overflow-hidden">
                  <motion.div className="h-full bg-yellow-600" animate={{ width: ["0%", "100%"] }} transition={{ repeat: Infinity, duration: 2 }} />
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
};

// --- Admin Paneli (Gizli) ---
const AdminPanel = ({ onClose, currentData }) => {
    const handleReset = () => {
        if (auth.currentUser) {
             setDoc(doc(db, 'artifacts', appId, 'public', 'data', GAME_COLLECTION, GAME_DOC_ID), { stage: 0, status: 'init', lastUpdate: new Date().toISOString() });
        }
        onClose();
    };
    const handleApprove = () => {
        if (auth.currentUser) {
             updateDoc(doc(db, 'artifacts', appId, 'public', 'data', GAME_COLLECTION, GAME_DOC_ID), { status: 'approved', stage: 6 });
        }
        onClose();
    };
    
    // Sort history by timestamp descending (newest first)
    const logs = currentData?.history ? [...currentData.history].reverse() : [];

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-green-500 p-6 rounded w-full max-w-4xl font-mono text-green-500 max-h-[90vh] overflow-y-auto flex flex-col gap-4 shadow-[0_0_50px_rgba(0,255,0,0.2)]">
                <div className="flex justify-between items-center border-b border-green-800 pb-2"> 
                    <h2 className="text-xl font-bold tracking-widest">ADMIN CONSOLE v2.0</h2> 
                    <button onClick={onClose} className="hover:text-white text-xl">&times;</button> 
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Status & Controls */}
                    <div className="flex flex-col gap-4">
                        <div className="text-xs border border-green-900 p-3 bg-black/50 rounded"> 
                            <p className="font-bold text-green-400 mb-2 border-b border-green-900/50 pb-1">SYSTEM STATUS</p>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-gray-500">User Stage:</span> <span className="text-white font-bold">{currentData?.stage || 0}</span>
                                <span className="text-gray-500">Status:</span> <span className="text-white font-bold">{currentData?.status || 'N/A'}</span>
                                <span className="text-gray-500">Last Update:</span> <span className="text-white">{currentData?.lastUpdate ? new Date(currentData.lastUpdate).toLocaleTimeString() : 'N/A'}</span>
                            </div>
                        </div>

                        {currentData?.proofUrl && (
                            <div className="border border-green-900 p-3 bg-black/50 rounded">
                                <p className="mb-2 font-bold text-yellow-500 text-xs flex items-center gap-2"><AlertOctagon size={12}/> YÜKLENEN KANIT:</p>
                                <a href={currentData.proofUrl} target="_blank" rel="noopener noreferrer" className="block border border-green-700 hover:border-green-400 transition-colors rounded overflow-hidden relative group">
                                    <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-all z-10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="bg-black/80 text-white text-[10px] px-2 py-1 rounded">BÜYÜT</span>
                                    </div>
                                    <img src={currentData.proofUrl} alt="Kullanıcı Kanıtı" className="w-full h-48 object-cover" />
                                </a>
                                <button onClick={handleApprove} className="w-full mt-3 p-2 bg-green-900/50 hover:bg-green-600 hover:text-black text-green-400 border border-green-700 font-bold text-xs rounded transition-all"> [ FOTOĞRAFI ONAYLA ] </button>
                            </div>
                        )}
                        
                        <button onClick={handleReset} className="p-3 border border-red-900/50 bg-red-900/10 text-red-500 hover:bg-red-900/30 text-xs mt-auto rounded transition-all flex items-center justify-center gap-2"> <AlertOctagon size={14}/> RESET SYSTEM (DANGER) </button>
                    </div>

                    {/* Right Column: Activity Logs */}
                    <div className="border border-green-900 p-3 bg-black/50 rounded flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-2 border-b border-green-900/50 pb-2">
                            <p className="font-bold text-green-400 text-xs flex items-center gap-2"><Scan size={12}/> ACTIVITY LOGS</p>
                            <span className="text-[10px] text-gray-500">{logs.length} RECORDS</span>
                        </div>
                        <div className="overflow-y-auto flex-1 flex flex-col gap-1 pr-1 custom-scrollbar">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                                    <Radio size={24} className="animate-pulse"/>
                                    <p className="text-[10px] italic">No signals detected yet...</p>
                                </div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="text-[10px] border-b border-green-900/20 pb-1 mb-1 last:border-0 hover:bg-green-900/10 p-1 rounded transition-colors">
                                        <div className="flex justify-between text-gray-500 mb-0.5">
                                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            <span className="text-[9px] opacity-50">{new Date(log.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className={`font-bold ${log.type.includes('ERROR') ? 'text-red-400' : (log.type.includes('SUCCESS') ? 'text-green-400' : 'text-yellow-500')}`}>{log.type}:</span>
                                            <span className="text-gray-300 break-all font-mono">{log.detail}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

// --- Yardımcı Fonksiyon: Veri Güncelleme ---
const updateProgress = async (data) => {
    try {
        if (!auth.currentUser) return;
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', GAME_COLLECTION, GAME_DOC_ID);
        await updateDoc(docRef, data);
    } catch (e) { console.error("Update failed", e); }
};

const logActivity = async (type, detail) => {
    try {
        if (!auth.currentUser) return;
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', GAME_COLLECTION, GAME_DOC_ID);
        await updateDoc(docRef, {
            history: arrayUnion({
                type: type,
                detail: detail,
                timestamp: new Date().toISOString()
            })
        });
    } catch (e) { console.error("Log failed", e); }
};

// --- Ana Uygulama ---
export default function App() {
  const [gameStage, setGameStage] = useState(0); 
  const [introStep, setIntroStep] = useState(0);
  const [password, setPassword] = useState("");
  const [errorCount, setErrorCount] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverData, setServerData] = useState(null); 
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (e) { console.log("Offline mode"); }
        
        // Local Storage Check first for instant load
        const savedLocal = localStorage.getItem('merve_universe_v23');
        if (savedLocal) {
            const s = parseInt(savedLocal);
            setGameStage(s);
            if (s > 0) setIntroStep(3); else startIntro();
            setLoading(false);
        } else {
            startIntro();
            setLoading(false);
        }

        // Then Firebase Sync
        if (auth.currentUser) {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', GAME_COLLECTION, GAME_DOC_ID);
            const unsub = onSnapshot(docRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setServerData(data);
                    
                    // SADECE kullanıcı zaten giriş yapmışsa (stage > 0) veritabanından güncelle
                    // Bu sayede siteye yeni giren biri direkt Merve'nin kaldığı yeri görmez, şifreyi girmesi gerekir.
                    const localStage = parseInt(localStorage.getItem('merve_universe_v23') || '0');
                    
                    if (localStage > 0 && data.stage !== undefined && data.stage > localStage) {
                        setGameStage(data.stage);
                        localStorage.setItem('merve_universe_v23', data.stage.toString());
                    }
                } else {
                    setDoc(docRef, { stage: 0, status: 'init' });
                }
            });
            return () => unsub();
        }
    };
    init();
  }, []);

  const startIntro = () => { setTimeout(()=>setIntroStep(1),3500); setTimeout(()=>setIntroStep(2),8000); setTimeout(()=>setIntroStep(3),13000); };
  const saveProgress = (stage) => { 
      setGameStage(stage); 
      localStorage.setItem('merve_universe_v23', stage.toString()); 
      setErrorCount(0);
      if (auth.currentUser) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', GAME_COLLECTION, GAME_DOC_ID);
          // Sadece ileriye dönük güncelleme yap (Geriye düşürme)
          if (serverData && serverData.stage > stage) return;
          updateDoc(docRef, { stage: stage });
      }
  };
  const triggerError = () => { setError(true); setErrorCount(c=>c+1); setTimeout(()=>setError(false),500); };

  const handleLogin1 = (e) => { 
      e.preventDefault(); 
      logActivity('LOGIN_ATTEMPT_1', password);
      if(password.trim().toUpperCase('TR')==='DÜNYA') { 
          // Şifre doğruysa: Önce veritabanındaki kaydı kontrol et
          if (serverData && serverData.stage > 1) {
              // Eğer veritabanında daha ileri bir seviye varsa oraya ışınla (Kaldığı yerden devam)
              saveProgress(serverData.stage);
          } else {
              // Yoksa normal devam et
              saveProgress(1); 
          }
          setPassword(""); 
      } 
      else if(password.trim() === 'ADMIN') { setShowAdmin(true); } 
      else triggerError(); 
  };
  const handleLogin2 = (e) => { 
      e.preventDefault(); 
      logActivity('LOGIN_ATTEMPT_2', password);
      if(password.trim().toUpperCase('TR')==='GEZEGEN') { saveProgress(3); setPassword(""); } 
      else triggerError(); 
  }; 
  const handleLogin3 = (e) => { 
      e.preventDefault(); 
      logActivity('LOGIN_ATTEMPT_3', password);
      if(password.trim().toUpperCase('TR')==='SONSUZLUK') { saveProgress(5); setPassword(""); } 
      else triggerError(); 
  }; 
  
  const handleWordleSuccess = () => { saveProgress(2); setPassword(""); };
  const handleUndertaleSuccess = () => { saveProgress(4); setPassword(""); }; 
  const handleDarkChallengeSuccess = () => { saveProgress(6); }; 

  const fade = { hidden:{opacity:0,blur:"10px"}, visible:{opacity:1,blur:"0px",transition:{duration:1.5}}, exit:{opacity:0} };

  if (loading) return <div className="bg-black h-screen w-full flex items-center justify-center text-white font-cinzel tracking-widest">SİNYAL ARANIYOR...</div>;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      <FontStyles />
      <div className="scanlines"></div>
      
      {/* GLOBAL ADMIN ACCESS BUTTON */}
      <button 
        onClick={() => {
            const pwd = prompt("Sistem Erişim Şifresi:");
            if (pwd === "ADMIN") setShowAdmin(true);
        }}
        className="fixed top-4 right-4 z-[90] text-gray-800 hover:text-white transition-colors opacity-50 hover:opacity-100"
        title="Admin Girişi"
      >
        <Settings size={20} />
      </button>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} currentData={serverData} />}
      <ThreeScene gameStage={gameStage} errorCount={errorCount} />
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: `radial-gradient(circle, transparent 60%, rgba(${gameStage===5 ? 50 : Math.min(errorCount*40,200)},0,0,${gameStage===5 ? 0.9 : Math.min(errorCount*0.1,0.6)}) 100%)` }} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
         <AnimatePresence mode='wait'>
            {gameStage===0 && introStep===0 && <motion.h1 key="i0" variants={fade} initial="hidden" animate="visible" exit="exit" className="text-5xl md:text-7xl text-white font-cinzel text-center">Hoşgeldin Merve</motion.h1>}
            {gameStage===0 && introStep===1 && <motion.h1 key="i1" variants={fade} initial="hidden" animate="visible" exit="exit" className="text-3xl md:text-5xl text-gray-300 font-cinzel text-center italic">Demek mektubumdaki gizemi çözdün...</motion.h1>}
            {gameStage===0 && introStep===2 && <motion.div key="i2" variants={fade} initial="hidden" animate="visible" exit="exit" className="text-center"><h1 className="text-3xl md:text-4xl text-white font-cinzel">Seninle oyun oynamayı çok özledim.</h1><p className="text-orange-400 text-xl mt-6 font-orbitron tracking-widest">OYUN BAŞLASIN</p></motion.div>}

            {/* STAGE 0: LOGIN 1 (DÜNYA) */}
            {gameStage===0 && introStep===3 && (
                <motion.div key="l1" variants={fade} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md flex flex-col items-center gap-6 bg-black/40 p-8 rounded-2xl border border-white/10 backdrop-blur-md">
                    <Lock className={`w-12 h-12 ${errorCount>3?'text-red-500 animate-pulse':'text-orange-400'}`} />
                    <h2 className="text-2xl font-orbitron text-white tracking-widest text-center">EVREN GİRİŞİ</h2>
                    <form onSubmit={handleLogin1} className="w-full"><input type="text" autoFocus value={password} onChange={e=>setPassword(e.target.value)} placeholder="ŞİFRE" className={`w-full bg-transparent border-b py-3 text-center text-2xl text-white font-cinzel focus:outline-none transition-colors ${error?'border-red-500 text-red-500':'border-white/30 focus:border-orange-400'}`} /><button type="submit" className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded text-orange-400 font-orbitron tracking-widest transition-all">DOĞRULA</button></form>
                </motion.div>
            )}

            {/* STAGE 1: WORDLE (KİTAP) */}
            {gameStage===1 && <motion.div key="wordle" variants={fade} initial="hidden" animate="visible" exit="exit" className="w-full"><ClassicWordle onSuccess={handleWordleSuccess} onError={triggerError} /></motion.div>}

            {/* STAGE 2: LOGIN 2 (GEZEGEN) */}
            {gameStage===2 && (
                <motion.div key="l2" variants={fade} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md flex flex-col items-center gap-6 bg-black/40 p-8 rounded-2xl border border-blue-500/30 backdrop-blur-md">
                    <Key className={`w-12 h-12 ${errorCount>3?'text-red-500 animate-pulse':'text-blue-400'}`} />
                    <form onSubmit={handleLogin2} className="w-full"><input type="text" autoFocus value={password} onChange={e=>setPassword(e.target.value)} placeholder="......" className={`w-full bg-transparent border-b py-3 text-center text-2xl text-white font-cinzel focus:outline-none transition-colors ${error?'border-red-500 text-red-500':'border-blue-500/30 focus:border-blue-400'}`} /><button type="submit" className="w-full mt-6 py-3 bg-blue-900/30 hover:bg-blue-900/50 rounded text-blue-400 font-orbitron tracking-widest transition-all">GİRİŞ</button></form>
                </motion.div>
            )}

            {/* STAGE 3: UNDERTALE (MANDALA) */}
            {gameStage===3 && (
                <motion.div key="undertale" variants={fade} initial="hidden" animate="visible" exit="exit" className="w-full flex justify-center">
                    <UndertaleManager onComplete={handleUndertaleSuccess} />
                </motion.div>
            )}

            {/* STAGE 4: LOGIN 3 (SONSUZLUK) */}
            {gameStage===4 && (
                <motion.div key="l3" variants={fade} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md flex flex-col items-center gap-6 bg-black/40 p-8 rounded-2xl border border-purple-500/30 backdrop-blur-md shadow-[0_0_50px_rgba(128,0,128,0.2)]">
                    <Infinity className={`w-12 h-12 ${errorCount>3?'text-red-500 animate-pulse':'text-purple-400'}`} />
                    <h2 className="text-2xl font-orbitron text-purple-100 tracking-widest text-center">ŞİFREYİ GİRİN</h2>
                    <form onSubmit={handleLogin3} className="w-full"><input type="text" autoFocus value={password} onChange={e=>setPassword(e.target.value)} placeholder="......" className={`w-full bg-transparent border-b py-3 text-center text-2xl text-white font-cinzel focus:outline-none transition-colors ${error?'border-red-500 text-red-500':'border-purple-500/30 focus:border-purple-400'}`} /><button type="submit" className="w-full mt-6 py-3 bg-purple-900/30 hover:bg-purple-900/50 rounded text-purple-400 font-orbitron tracking-widest transition-all">KAPIYI AÇ</button></form>
                </motion.div>
            )}

            {/* STAGE 5: DARK CHALLENGE (BEDEL) - SADECE RESİM YÜKLEME + ADMIN ONAYI */}
            {gameStage===5 && (
                <motion.div key="dark" variants={fade} initial="hidden" animate="visible" exit="exit" className="w-full flex justify-center">
                    <DarkChallenge onSuccess={handleDarkChallengeSuccess} currentData={serverData} />
                </motion.div>
            )}

            {/* STAGE 6: FINAL */}
            {gameStage===6 && (
                <motion.div key="final" variants={fade} initial="hidden" animate="visible" className="text-center">
                    <h1 className="text-6xl md:text-8xl font-cinzel text-green-500 drop-shadow-[0_0_30px_rgba(0,255,0,0.6)]">BAŞARILI</h1>
                    <div className="flex justify-center gap-4 mt-8"><Rocket className="w-12 h-12 text-white animate-bounce" /><Star className="w-12 h-12 text-yellow-400 animate-pulse" /></div>
                    <p className="mt-6 text-gray-400 font-orbitron tracking-[0.5em] text-xs">GÖREV TAMAMLANDI</p>
                </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
