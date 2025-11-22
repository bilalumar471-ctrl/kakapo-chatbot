import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, RotateCcw, Copy, Volume2, VolumeX, Moon, Sun, ArrowLeft, Phone, X } from 'lucide-react';

const KakapoChatbot = () => {
  const [screen, setScreen] = useState('loading');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAskingName, setIsAskingName] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuLevel, setMenuLevel] = useState('main');
  const [isListening, setIsListening] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceModalState, setVoiceModalState] = useState('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [birdLanded, setBirdLanded] = useState(false);
  const [flyingBirds, setFlyingBirds] = useState([]);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const voiceRecognitionRef = useRef(null);

  const images = {
    welcomeBg: '/images/welcome-background.jpg',
    kakapoOnBranch: '/images/kakapo-on-branch.png',
    loadingScreen: '/images/loading-screen.png',
    errorScreen: '/images/error-screen.png',
    chatBg: '/images/chat-background.jpg',
    avatar: '/images/avatar.jpg',
    flyingKakapo: '/images/flying-kakapo.png',
    kakapoSitting: '/images/kakapo-sitting.gif'
  };

  const sounds = {
    chirp: '/images/kakapo_chirp_sound.wav',
    pop: 'https://www.soundjay.com/buttons/sounds/button-09a.mp3',
    success: 'https://www.soundjay.com/misc/sounds/bell-ring-01.mp3'
  };

  const playSound = (soundType) => {
    try {
      const audio = new Audio(sounds[soundType]);
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const mainMenuOptions = [
    { label: '📚 Learning Mode', value: 'learning' },
    { label: '🎯 Quiz Mode', value: 'quiz' }
  ];

  const learningMenuOptions = [
    'Kakapo Diet', 'Habitat', 'Conservation', 'Behaviour', 'General Facts', 'Fun Fact', 'Myth'
  ];

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Multiple flying birds animation
  useEffect(() => {
    if (screen !== 'chat' || showVoiceModal) return;
    
    const createBird = (id) => {
      const startY = Math.random() * 250 + 80;
      const endY = Math.random() * 250 + 80;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const startX = direction === 1 ? -100 : window.innerWidth + 100;
      const endX = direction === 1 ? window.innerWidth + 100 : -100;
      const duration = 6000 + Math.random() * 4000;
      const size = 50 + Math.random() * 30;
      
      return { id, startX, startY, endX, endY, direction, duration, size, visible: true };
    };

    const flyBird = () => {
      const newBird = createBird(Date.now());
      playSound('chirp');
      setFlyingBirds(prev => [...prev, newBird]);
      
      setTimeout(() => {
        setFlyingBirds(prev => prev.filter(b => b.id !== newBird.id));
      }, newBird.duration);
    };

    // Initial birds
    setTimeout(flyBird, 2000);
    setTimeout(flyBird, 5000);
    
    // Random intervals for two birds
    const interval1 = setInterval(flyBird, 12000 + Math.random() * 8000);
    const interval2 = setInterval(flyBird, 18000 + Math.random() * 10000);
    
    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [screen, showVoiceModal]);

  useEffect(() => {
    const timer = setTimeout(() => setScreen('welcome'), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const storedName = localStorage.getItem('kakapo_user_name');
    if (storedName) setUserName(storedName);

    const storedDarkMode = localStorage.getItem('kakapo_dark_mode');
    if (storedDarkMode === 'true') setDarkMode(true);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        setInputText(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);

      voiceRecognitionRef.current = new SpeechRecognition();
      voiceRecognitionRef.current.continuous = false;
      voiceRecognitionRef.current.interimResults = true;
      voiceRecognitionRef.current.lang = 'en-US';

      voiceRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        if (event.results[0].isFinal) handleVoiceModalSend(transcript);
      };
      voiceRecognitionRef.current.onerror = () => setVoiceModalState('idle');
      voiceRecognitionRef.current.onend = () => {
        if (voiceModalState === 'listening') setVoiceModalState('idle');
      };
    }

    return () => window.speechSynthesis.cancel();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('kakapo_dark_mode', newMode.toString());
    playSound('pop');
  };

  const handleStartChat = () => {
    setScreen('chat');
    playSound('chirp');
    const storedName = localStorage.getItem('kakapo_user_name');
    
    if (storedName) {
      setUserName(storedName);
      setTimeout(() => {
        addBotMessage(`${getTimeBasedGreeting()}, ${storedName}! 🦜 What can I do for you today?\n\nChoose a mode to get started:`);
        setShowMenu(true);
        setMenuLevel('main');
      }, 500);
    } else {
      setTimeout(() => {
        addBotMessage(`${getTimeBasedGreeting()}! 🦜 I'm Mosska, a curious Kakapo here to share my world with you! What's your name?`);
        setIsAskingName(true);
      }, 500);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  const stripHtmlTags = (html) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || '';
  // Remove emojis using regex
  text = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F000}-\u{1F02F}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]/gu, '');
  return text.trim();
};

  const addBotMessage = (text, imageUrl = null) => {
    playSound('pop');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'bot',
      text,
      image: imageUrl,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const handleCopyMessage = async (messageId, text) => {
    try {
      await navigator.clipboard.writeText(stripHtmlTags(formatText(text)));
      setCopiedMessageId(messageId);
      playSound('pop');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      alert('Failed to copy message');
    }
  };

  const speakText = (text, onEnd = null) => {
    window.speechSynthesis.cancel();
    const plainText = stripHtmlTags(formatText(text));
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.3;
    utterance.pitch = 1.5;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.includes('Female') || v.name.includes('Zira') || 
      v.name.includes('Samantha') || v.name.includes('Google US English')
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleTextToSpeech = (messageId, text) => {
    if (currentlySpeakingId === messageId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
      return;
    }
    setCurrentlySpeakingId(messageId);
    speakText(text);
  };

  const sendToDialogflow = async (text, menuOption = null) => {
    try {
      setIsTyping(true);
      const response = await fetch('https://kakapo-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: getSessionId() })
      });

      if (!response.ok) throw new Error('Connection failed');
      const data = await response.json();
      setIsTyping(false);

      // Check if quiz completed
      if (data.intent === 'quiz.complete') {
        setIsQuizMode(false);
      }
      
      let followUpText = '';
      if (!isQuizMode && !data.intent?.includes('quiz')) {
        if (menuOption) {
          const followUps = [
            `🌟 Want to dive deeper into **${menuOption}**? Ask me anything! 🦜✨`,
            `💚 Curious about more **${menuOption}** details? Fire away! 🌿🦜`,
          ];
          followUpText = '\n\n' + followUps[Math.floor(Math.random() * followUps.length)];
        } else if (!data.intent?.includes('quiz')) {
          const followUps = [
            `🦜 What else can I help you discover about Kākapos? 🌟`,
            `✨ Anything else you'd like to know? I'm here for you! 💚`,
          ];
          followUpText = '\n\n' + followUps[Math.floor(Math.random() * followUps.length)];
        }
      }
      
      addBotMessage(data.message + followUpText, data.image_url || null);
      
      if (data.intent === 'quiz.complete') {
        playSound('success');
      }
      
      return data;
    } catch (error) {
      setIsTyping(false);
      setScreen('error');
      return null;
    }
  };

  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('kakapo_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('kakapo_session_id', sessionId);
    }
    return sessionId;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    playSound('pop');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    
    if (isAskingName) {
      const name = inputText.trim();
      setUserName(name);
      localStorage.setItem('kakapo_user_name', name);
      setIsAskingName(false);
      setTimeout(() => {
        addBotMessage(`Hello ${name}! 🦜 What can I do for you today?\n\nChoose a mode to get started:`);
        setShowMenu(true);
        setMenuLevel('main');
      }, 500);
    } else {
      sendToDialogflow(inputText);
    }
    setInputText('');
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleMainMenuClick = (option) => {
    playSound('pop');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: option.label,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);

    if (option.value === 'learning') {
      setMenuLevel('learning');
      addBotMessage('📚 **Learning Mode Activated!**\n\nChoose a topic you\'d like to explore:');
    } else if (option.value === 'quiz') {
      setMenuLevel('quiz');
      setIsQuizMode(true);
      setShowMenu(false);
      sendToDialogflow('Take Quiz');
    }
  };

  const handleLearningMenuClick = (option) => {
    playSound('pop');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: option,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    sendToDialogflow(option === 'Myth' ? 'I want to know kakapo myths' : option, option);
  };

  const handleBackToMain = () => {
    playSound('pop');
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: '⬅️ Back to Main Menu',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    setMenuLevel('main');
    setIsQuizMode(false);
    setShowMenu(true);
    addBotMessage('🦜 Back to the main menu! What would you like to do?');
  };

  const handleCancelQuiz = async () => {
    playSound('pop');
    setIsQuizMode(false);
    setMenuLevel('main');
    setShowMenu(true);
    
    // Send end signal to backend
    try {
      await fetch('https://kakapo-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'cancel_quiz', sessionId: getSessionId() })
      });
    } catch (e) {}
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: '❌ Cancel Quiz',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    addBotMessage('🦜 Quiz cancelled! No worries, you can try again anytime.\n\nWhat would you like to do?');
  };

  const handleQuizAgain = () => {
    playSound('pop');
    setIsQuizMode(true);
    setShowMenu(false);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: '🎯 Take Another Quiz',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    sendToDialogflow('Take Quiz');
  };

  const openVoiceModal = () => {
    setShowVoiceModal(true);
    setBirdLanded(false);
    setVoiceModalState('idle');
    setVoiceTranscript('');
    playSound('chirp');
    setTimeout(() => setBirdLanded(true), 1500);
  };

  const closeVoiceModal = () => {
    window.speechSynthesis.cancel();
    if (voiceRecognitionRef.current) voiceRecognitionRef.current.stop();
    setShowVoiceModal(false);
    setBirdLanded(false);
    setVoiceModalState('idle');
    setVoiceTranscript('');
  };

  const startVoiceListening = () => {
    if (!voiceRecognitionRef.current) return;
    setVoiceModalState('listening');
    setVoiceTranscript('');
    playSound('pop');
    voiceRecognitionRef.current.start();
  };

  const handleVoiceModalSend = async (transcript) => {
    if (!transcript.trim()) return;
    setVoiceModalState('processing');
    
    try {
      const response = await fetch('https://kakapo-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcript, sessionId: getSessionId() })
      });
      const data = await response.json();
      
      setVoiceModalState('speaking');
      speakText(data.message, () => setVoiceModalState('idle'));
    } catch (error) {
      setVoiceModalState('idle');
    }
  };

  const handleResetChat = async () => {
    window.speechSynthesis.cancel();
    playSound('pop');
    try {
      await fetch('https://kakapo-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'the_end', sessionId: getSessionId() })
      });
    } catch (e) {}
    
    setMessages([]);
    setUserName('');
    setShowMenu(false);
    setMenuLevel('main');
    setIsAskingName(false);
    setIsQuizMode(false);
    sessionStorage.removeItem('kakapo_session_id');
    localStorage.removeItem('kakapo_user_name');
    setScreen('welcome');
  };

  const colors = darkMode ? {
    headerBg: '#1a3f3f', headerText: '#a3e635', chatBg: '#1a2f2f',
    userBubble: 'from-green-600 to-green-700', botBubble: 'from-teal-800 to-teal-900',
    inputBg: '#2a4444', inputText: '#e5e7eb', timestampText: '#9ca3af'
  } : {
    headerBg: '#ffffff', headerText: '#15803d', chatBg: '#c8d5b9',
    userBubble: 'from-green-300 to-green-400', botBubble: 'from-teal-700 to-teal-800',
    inputBg: '#f9fafb', inputText: '#374151', timestampText: '#4b5563'
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" 
        style={{ backgroundImage: `url('${images.welcomeBg}')`, backgroundColor: '#1a3f3f' }}>
        <div className="text-center">
          <img src={images.loadingScreen} alt="Loading" className="w-full max-w-lg mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#a3e635' }}>Mosska is loading...</h2>
          <div className="w-96 max-w-full mx-auto">
            <div className="h-3 bg-gray-700 bg-opacity-30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-loading-bar"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'error') {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" 
        style={{ backgroundImage: `url('${images.welcomeBg}')`, backgroundColor: '#1a3f3f' }}>
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-black mb-8 text-red-500 animate-bounce">CONNECTION FAILED</h1>
          <img src={images.errorScreen} alt="Error" className="w-full max-w-md mx-auto mb-8" />
          <p className="text-xl text-white mb-8">Please check your internet connection.</p>
          <button onClick={() => { setScreen('loading'); setTimeout(() => setScreen('welcome'), 2000); }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" 
        style={{ backgroundImage: `url('${images.welcomeBg}')`, backgroundColor: '#1a3f3f' }}>
        <div className="text-center max-w-2xl animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-black mb-4 animate-slide-down" 
            style={{ background: 'linear-gradient(to bottom, #a3e635, #fde047)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Kia Ora! I'm<br/>KākapoBot!
          </h1>
          <p className="text-xl text-white mb-12 animate-slide-up">Your expert guide to all things Kākapo.</p>
          <img src={images.kakapoOnBranch} alt="Kakapo" className="w-full max-w-md mx-auto mb-12 animate-bounce-slow" />
          <button onClick={handleStartChat}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-16 py-5 rounded-full text-2xl font-bold hover:scale-110 transition-transform shadow-2xl animate-pulse-glow">
            Start Chatting!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-cover bg-center" 
      style={{ backgroundImage: `url('${images.chatBg}')`, backgroundColor: colors.chatBg }}>
      
      {/* Multiple Flying Kakapos */}
      {flyingBirds.map(bird => (
        <img key={bird.id} src={images.flyingKakapo} alt="Flying Kakapo"
          className="fixed z-40 pointer-events-none animate-fly-bird"
          style={{
            width: `${bird.size}px`,
            height: `${bird.size}px`,
            transform: bird.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)',
            '--start-x': `${bird.startX}px`,
            '--start-y': `${bird.startY}px`,
            '--end-x': `${bird.endX}px`,
            '--end-y': `${bird.endY}px`,
            '--duration': `${bird.duration}ms`,
            animationDuration: `${bird.duration}ms`
          }}
        />
      ))}

      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-85 backdrop-blur-md">
          <button onClick={closeVoiceModal} className="absolute top-4 right-4 p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-40 transition-all">
            <X className="w-8 h-8 text-white" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="relative w-[500px] h-[450px] flex items-center justify-center">
              <img src={images.kakapoSitting} alt="Kakapo"
                className={`w-150 h-150 object-contain transition-all duration-1000 ${birdLanded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'} ${voiceModalState === 'speaking' ? 'animate-bird-talk' : ''}`} />
              
              {voiceModalState === 'speaking' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-72 h-72 rounded-full bg-green-500 opacity-20 animate-ping"></div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-white text-2xl mb-4 font-semibold">
                {voiceModalState === 'idle' && '🎤 Tap to speak with Mosska'}
                {voiceModalState === 'listening' && '🎧 Listening...'}
                {voiceModalState === 'processing' && '🤔 Thinking...'}
                {voiceModalState === 'speaking' && '🦜 Mosska is speaking...'}
              </p>
              {voiceTranscript && <p className="text-green-300 text-lg italic max-w-md">"{voiceTranscript}"</p>}
            </div>

            <button onClick={startVoiceListening} disabled={voiceModalState !== 'idle'}
              className={`mt-8 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                voiceModalState === 'listening' ? 'bg-red-500 animate-pulse scale-110' :
                voiceModalState === 'idle' ? 'bg-green-500 hover:bg-green-600 hover:scale-110' : 'bg-gray-500'
              }`}>
              <Mic className="w-12 h-12 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 rounded-b-3xl shadow-lg px-4 py-4 flex items-center justify-between transition-colors" 
        style={{ backgroundColor: colors.headerBg }}>
        <div className="flex items-center gap-3">
          <img src={images.avatar} alt="Mosska" className="w-12 h-12 rounded-full object-cover shadow-md" />
          <h2 className="text-xl font-bold" style={{ color: colors.headerText }}>
            {userName ? `Mosska - ${userName}` : 'Mosska'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openVoiceModal}
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:scale-110 transition-all"
            title="Voice Mode">
            <Phone className="w-5 h-5 text-white" />
          </button>
          <button onClick={toggleDarkMode} className={`p-2 rounded-full hover:scale-110 transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          <button onClick={handleResetChat} className={`p-2 rounded-full hover:scale-110 transition-all ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <RotateCcw className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-4 pt-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 animate-message-in ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'bot' && <img src={images.avatar} alt="Mosska" className="w-8 h-8 rounded-full shadow-md" />}
              <div className={`max-w-[75%] ${msg.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-3xl px-4 py-3 shadow-md bg-gradient-to-br ${msg.type === 'user' ? colors.userBubble + ' text-gray-900' : colors.botBubble + ' text-white'}`}>
                  {msg.type === 'bot' ? <p dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} /> : <p>{msg.text}</p>}
                  {msg.image && <img src={msg.image} alt="Kakapo" className="rounded-2xl mt-2" />}
                </div>
                {msg.type === 'bot' && (
                  <div className="flex gap-2 mt-2 px-2">
                    <button onClick={() => handleTextToSpeech(msg.id, msg.text)} 
                      className={`p-1.5 rounded-full transition-all hover:scale-110 ${currentlySpeakingId === msg.id ? 'bg-green-500 text-white' : 'hover:bg-gray-200'}`}>
                      {currentlySpeakingId === msg.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleCopyMessage(msg.id, msg.text)} 
                      className={`p-1.5 rounded-full transition-all hover:scale-110 ${copiedMessageId === msg.id ? 'bg-green-500 text-white' : 'hover:bg-gray-200'}`}>
                      <Copy className="w-4 h-4" />
                    </button>
                    {copiedMessageId === msg.id && <span className="text-xs text-green-500">Copied!</span>}
                  </div>
                )}
                <p className={`text-xs mt-1 px-2 ${msg.type === 'user' ? 'text-right' : ''}`} style={{ color: colors.timestampText }}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
          
          {/* Main Menu */}
          {showMenu && menuLevel === 'main' && (
            <div className="flex flex-wrap gap-3 justify-center my-4 animate-fade-in">
              {mainMenuOptions.map((opt, i) => (
                <button key={i} onClick={() => handleMainMenuClick(opt)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:scale-110 transition-transform shadow-lg">
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          
          {/* Learning Menu */}
          {showMenu && menuLevel === 'learning' && (
            <div className="my-4 animate-fade-in">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {learningMenuOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleLearningMenuClick(opt)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform shadow-md">
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button onClick={handleBackToMain}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform">
                  <ArrowLeft className="w-4 h-4" /> Back to Main Menu
                </button>
              </div>
            </div>
          )}

          {/* Quiz Mode - Cancel Button */}
          {isQuizMode && (
            <div className="flex justify-center my-4 animate-fade-in">
              <button onClick={handleCancelQuiz}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
                <X className="w-4 h-4" /> Cancel Quiz
              </button>
            </div>
          )}

          {/* Quiz Complete Options */}
          {!isQuizMode && menuLevel === 'quiz' && (
            <div className="flex flex-wrap gap-3 justify-center my-4 animate-fade-in">
              <button onClick={handleQuizAgain}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-5 py-3 rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
                🎯 Take Another Quiz
              </button>
              <button onClick={handleBackToMain}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-3 rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
                <ArrowLeft className="w-4 h-4" /> Back to Main Menu
              </button>
            </div>
          )}
          
          {isTyping && (
            <div className="flex gap-2 animate-fade-in">
              <img src={images.avatar} alt="Mosska" className="w-8 h-8 rounded-full shadow-md" />
              <div className={`rounded-3xl px-5 py-4 shadow-md bg-gradient-to-br ${colors.botBubble}`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="rounded-3xl shadow-lg mx-4 mb-4 p-3 transition-colors" style={{ backgroundColor: darkMode ? '#2a4444' : '#ffffff' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button onClick={handleVoiceInput}
            className={`p-2 rounded-full transition-all hover:scale-110 ${isListening ? 'bg-red-500 animate-pulse' : 'hover:bg-gray-100'}`}>
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            className="flex-1 px-4 py-2 rounded-full outline-none transition-colors"
            style={{ backgroundColor: colors.inputBg, color: colors.inputText }}
          />
          
          <button onClick={handleSendMessage} disabled={!inputText.trim()}
            className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-full disabled:opacity-50 hover:scale-110 transition-transform shadow-md">
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes fly-bird {
          0% { left: var(--start-x); top: var(--start-y); }
          25% { top: calc(var(--start-y) - 40px); }
          50% { top: calc(var(--start-y) + 20px); }
          75% { top: calc(var(--end-y) - 30px); }
          100% { left: var(--end-x); top: var(--end-y); }
        }
        @keyframes bird-talk {
          0%, 100% { transform: scale(1) translateY(0); }
          25% { transform: scale(1.08) translateY(-8px); }
          50% { transform: scale(1) translateY(0); }
          75% { transform: scale(1.05) translateY(-5px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes message-in {
          from { opacity: 0; transform: translateX(-20px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8); }
        }
        .animate-loading-bar { animation: loading-bar 2.5s ease-out forwards; }
        .animate-fly-bird { animation: fly-bird var(--duration, 8s) linear forwards; }
        .animate-bird-talk { animation: bird-talk 0.4s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-down { animation: slide-down 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.8s ease-out 0.2s both; }
        .animate-message-in { animation: message-in 0.4s ease-out; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        strong { font-weight: 700; }
        em { font-style: italic; }
      `}</style>
    </div>
  );
};

export default KakapoChatbot;