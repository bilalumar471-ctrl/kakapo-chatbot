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
  const [flyingBirdPosition, setFlyingBirdPosition] = useState({ x: -100, y: 100 });
  const [flyingBirdVisible, setFlyingBirdVisible] = useState(false);
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
    kakapoSitting: '/images/kakapo-sitting.png',
    branch: '/images/branch.png'
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

  // Flying bird animation
  useEffect(() => {
    if (screen !== 'chat' || showVoiceModal) return;
    
    const flyBird = () => {
      setFlyingBirdVisible(true);
      const startY = Math.random() * 300 + 100;
      const endY = Math.random() * 300 + 100;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const startX = direction === 1 ? -100 : window.innerWidth + 100;
      const endX = direction === 1 ? window.innerWidth + 100 : -100;
      
      setFlyingBirdPosition({ x: startX, y: startY, endX, endY, direction });
      
      setTimeout(() => setFlyingBirdVisible(false), 8000);
    };

    const interval = setInterval(flyBird, 15000 + Math.random() * 10000);
    setTimeout(flyBird, 3000);
    
    return () => clearInterval(interval);
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
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
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
        if (event.results[0].isFinal) {
          handleVoiceModalSend(transcript);
        }
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
  };

  const handleStartChat = () => {
    setScreen('chat');
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
    return tmp.textContent || tmp.innerText || '';
  };

  const addBotMessage = (text, imageUrl = null) => {
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      text,
      image: imageUrl,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleCopyMessage = async (messageId, text) => {
    try {
      await navigator.clipboard.writeText(stripHtmlTags(formatText(text)));
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      alert('Failed to copy message');
    }
  };

  const speakText = (text, onEnd = null) => {
    window.speechSynthesis.cancel();
    const plainText = stripHtmlTags(formatText(text));
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.1;
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
    return utterance;
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
      
      let followUpText = '';
      if (menuOption) {
        const followUps = [
          `🌟 Want to dive deeper into **${menuOption}**? Ask me anything! 🦜✨`,
          `💚 Curious about more **${menuOption}** details? Fire away! 🌿🦜`,
        ];
        followUpText = followUps[Math.floor(Math.random() * followUps.length)];
      } else {
        const followUps = [
          `🦜 What else can I help you discover about Kākapos? 🌟`,
          `✨ Anything else you'd like to know? I'm here for you! 💚`,
        ];
        followUpText = followUps[Math.floor(Math.random() * followUps.length)];
      }
      
      const fullMessage = data.message + '\n\n' + followUpText;
      addBotMessage(fullMessage, data.image_url || null);
      return data.message;
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
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    
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
      alert('Speech recognition not supported. Use Chrome or Edge.');
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
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: option.label,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);

    if (option.value === 'learning') {
      setMenuLevel('learning');
      addBotMessage('📚 **Learning Mode Activated!**\n\nChoose a topic you\'d like to explore:');
    } else if (option.value === 'quiz') {
      setMenuLevel('quiz');
      sendToDialogflow('Take Quiz');
      setShowMenu(false);
    }
  };

  const handleLearningMenuClick = (option) => {
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: option,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    sendToDialogflow(option === 'Myth' ? 'I want to know kakapo myths' : option, option);
  };

  const handleBackToMain = () => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: '⬅️ Back to Main Menu',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]);
    setMenuLevel('main');
    addBotMessage('🦜 Back to the main menu! What would you like to do?');
  };

  // Voice Modal Functions
  const openVoiceModal = () => {
    setShowVoiceModal(true);
    setBirdLanded(false);
    setVoiceModalState('idle');
    setVoiceTranscript('');
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
          <img src={images.loadingScreen} alt="Loading" className="w-full max-w-lg mx-auto mb-4" />
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
          <h1 className="text-5xl font-black mb-8 text-red-600">CONNECTION FAILED</h1>
          <img src={images.errorScreen} alt="Error" className="w-full max-w-md mx-auto mb-8" />
          <p className="text-xl text-white mb-8">Please check your internet connection.</p>
          <button onClick={() => { setScreen('loading'); setTimeout(() => setScreen('welcome'), 2000); }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-full text-xl font-bold">
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
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-black mb-4" style={{ background: 'linear-gradient(to bottom, #a3e635, #fde047)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Kia Ora! I'm<br/>KākapoBot!
          </h1>
          <p className="text-xl text-white mb-12">Your expert guide to all things Kākapo.</p>
          <img src={images.kakapoOnBranch} alt="Kakapo" className="w-full max-w-md mx-auto mb-12" />
          <button onClick={handleStartChat}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-16 py-5 rounded-full text-2xl font-bold hover:scale-105 transition-transform">
            Start Chatting!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-cover bg-center" 
      style={{ backgroundImage: `url('${images.chatBg}')`, backgroundColor: colors.chatBg }}>
      {/* Flying Kakapo */}
      {flyingBirdVisible && (
        <img src={images.flyingKakapo} alt="Flying Kakapo"
          className="fixed w-16 h-16 z-40 pointer-events-none animate-fly-bird"
          style={{
            transform: flyingBirdPosition.direction === -1 ? 'scaleX(-1)' : 'scaleX(1)',
            '--start-x': `${flyingBirdPosition.x}px`,
            '--start-y': `${flyingBirdPosition.y}px`,
            '--end-x': `${flyingBirdPosition.endX}px`,
            '--end-y': `${flyingBirdPosition.endY}px`
          }}
        />
      )}

      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
          <button onClick={closeVoiceModal} className="absolute top-4 right-4 p-3 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30">
            <X className="w-8 h-8 text-white" />
          </button>
          
          <div className="flex flex-col items-center">
            {/* Branch and Bird */}
            <div className="relative w-80 h-64 flex items-end justify-center">
              <img src={images.kakapoSitting} alt="Kakapo"
                className={`absolute w-40 transition-all duration-1000 ${birdLanded ? 'bottom-8 opacity-100' : '-bottom-20 opacity-0'} ${voiceModalState === 'speaking' ? 'animate-bird-talk' : ''}`} />
            </div>

            {/* Status Text */}
            <div className="mt-8 text-center">
              <p className="text-white text-xl mb-4">
                {voiceModalState === 'idle' && '🎤 Tap to speak with Mosska'}
                {voiceModalState === 'listening' && '🎧 Listening...'}
                {voiceModalState === 'processing' && '🤔 Thinking...'}
                {voiceModalState === 'speaking' && '🦜 Mosska is speaking...'}
              </p>
              {voiceTranscript && <p className="text-green-300 text-lg">"{voiceTranscript}"</p>}
            </div>

            {/* Mic Button */}
            <button onClick={startVoiceListening} disabled={voiceModalState !== 'idle'}
              className={`mt-8 w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                voiceModalState === 'listening' ? 'bg-red-500 animate-pulse' :
                voiceModalState === 'idle' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'
              }`}>
              <Mic className="w-10 h-10 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 rounded-b-3xl shadow-lg px-4 py-4 flex items-center justify-between" style={{ backgroundColor: colors.headerBg }}>
        <div className="flex items-center gap-3">
          <img src={images.avatar} alt="Mosska" className="w-12 h-12 rounded-full object-cover shadow-md" />
          <h2 className="text-xl font-bold" style={{ color: colors.headerText }}>
            {userName ? `Mosska - ${userName}` : 'Mosska'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openVoiceModal}
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-colors"
            title="Voice Conversation Mode">
            <Phone className="w-5 h-5 text-white" />
          </button>
          <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-100">
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
          <button onClick={handleResetChat} className="p-2 rounded-full hover:bg-gray-100">
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'bot' && <img src={images.avatar} alt="Mosska" className="w-8 h-8 rounded-full" />}
              <div className={`max-w-[75%] ${msg.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-3xl px-4 py-3 shadow-md bg-gradient-to-br ${msg.type === 'user' ? colors.userBubble + ' text-gray-900' : colors.botBubble + ' text-white'}`}>
                  {msg.type === 'bot' ? <p dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} /> : <p>{msg.text}</p>}
                  {msg.image && <img src={msg.image} alt="Kakapo" className="rounded-2xl mt-2" />}
                </div>
                {msg.type === 'bot' && (
                  <div className="flex gap-2 mt-2 px-2">
                    <button onClick={() => handleTextToSpeech(msg.id, msg.text)} className="p-1.5 rounded-full hover:bg-gray-200">
                      {currentlySpeakingId === msg.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleCopyMessage(msg.id, msg.text)} className="p-1.5 rounded-full hover:bg-gray-200">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className={`text-xs mt-1 px-2 ${msg.type === 'user' ? 'text-right' : ''}`} style={{ color: colors.timestampText }}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
          
          {showMenu && menuLevel === 'main' && (
            <div className="flex flex-wrap gap-3 justify-center my-4">
              {mainMenuOptions.map((opt, i) => (
                <button key={i} onClick={() => handleMainMenuClick(opt)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform">
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          
          {showMenu && menuLevel === 'learning' && (
            <div className="my-4">
              <div className="flex flex-wrap gap-2 justify-center mb-3">
                {learningMenuOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleLearningMenuClick(opt)}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform">
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button onClick={handleBackToMain}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Main Menu
                </button>
              </div>
            </div>
          )}
          
          {isTyping && (
            <div className="flex gap-2">
              <img src={images.avatar} alt="Mosska" className="w-8 h-8 rounded-full" />
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
      <div className="rounded-3xl shadow-lg mx-4 mb-4 p-3" style={{ backgroundColor: darkMode ? '#2a4444' : '#ffffff' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button onClick={handleVoiceInput}
            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'hover:bg-gray-100'}`}>
            {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            className="flex-1 px-4 py-2 rounded-full outline-none"
            style={{ backgroundColor: colors.inputBg, color: colors.inputText }}
          />
          
          <button onClick={handleSendMessage} disabled={!inputText.trim()}
            className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-full disabled:opacity-50">
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
          0% { 
            left: var(--start-x); 
            top: var(--start-y); 
          }
          50% {
            top: calc(var(--start-y) - 50px);
          }
          100% { 
            left: var(--end-x); 
            top: var(--end-y); 
          }
        }
        @keyframes bird-talk {
          0%, 100% { transform: scale(1) translateY(0); }
          25% { transform: scale(1.05) translateY(-3px); }
          50% { transform: scale(1) translateY(0); }
          75% { transform: scale(1.03) translateY(-2px); }
        }
        .animate-loading-bar { animation: loading-bar 2.5s ease-out forwards; }
        .animate-fly-bird { animation: fly-bird 8s linear forwards; }
        .animate-bird-talk { animation: bird-talk 0.5s ease-in-out infinite; }
        strong { font-weight: 700; }
        em { font-style: italic; }
      `}</style>
    </div>
  );
};

export default KakapoChatbot;