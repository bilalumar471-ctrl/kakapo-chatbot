import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, RotateCcw } from 'lucide-react';

const KakapoChatbot = () => {
  const [screen, setScreen] = useState('loading'); // loading, welcome, chat, error
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('');
  const [isAskingName, setIsAskingName] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Image URLs
  const images = {
    welcomeBg: '/images/welcome-background.jpg',
    kakapoOnBranch: '/images/kakapo-on-branch.jpg',
    loadingScreen: '/images/loading-screen.jpg',
    errorScreen: '/images/error-screen.jpg',
    chatBg: '/images/chat-background.jpg',
    avatar: '/images/avatar.jpg'
  };

  // Menu options
  const menuOptions = [
    'Kakapo Diet',
    'Habitat',
    'Conservation',
    'Behaviour',
    'General Facts'
  ];

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen('welcome');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Check for stored username on mount
  useEffect(() => {
    const storedName = localStorage.getItem('kakapo_user_name');
    if (storedName) {
      setUserName(storedName);
    }

    // Initialize Speech Recognition
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

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please enable microphone permissions.');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Start chat
  const handleStartChat = () => {
    setScreen('chat');
    const storedName = localStorage.getItem('kakapo_user_name');
    
    if (storedName) {
      // User returning - greet with stored name
      setUserName(storedName);
      setTimeout(() => {
        const greeting = getTimeBasedGreeting();
        addBotMessage(`${greeting}, ${storedName}! 🦜 What can I do for you today?`);
        setShowMenu(true);
      }, 500);
    } else {
      // New user - ask for name
      setTimeout(() => {
        const greeting = getTimeBasedGreeting();
        addBotMessage(`${greeting}! 🦜 I'm Mosska, a curious Kakapo here to share my world with you! What's your name?`);
        setIsAskingName(true);
      }, 500);
    }
  };

  // Format text with markdown-style bold and italic
  const formatText = (text) => {
    if (!text) return '';
    
    console.log('Original text:', text); // Debug log
    
    // First convert **text** to <strong>text</strong>
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    console.log('After bold:', formatted); // Debug log
    
    // Then convert remaining single * to <em>text</em>
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br> tags
    formatted = formatted.replace(/\n/g, '<br>');
    
    console.log('Final formatted:', formatted); // Debug log
    
    return formatted;
  };

  // Add bot message
  const addBotMessage = (text, imageUrl = null) => {
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      text,
      image: imageUrl,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Send message to Dialogflow
  const sendToDialogflow = async (text, menuOption = null) => {
    try {
      setIsTyping(true);
      
      const response = await fetch('https://kakapo-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          sessionId: getSessionId()
        })
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();
      
      setIsTyping(false);
      
      // Add follow-up text based on whether it's a menu option or custom question
      let followUpText = '';
      if (menuOption) {
        // Menu button follow-ups
        const followUps = [
          `🌟 Want to dive deeper into **${menuOption}**? Ask me anything! 🦜✨`,
          `💚 Curious about more **${menuOption}** details? Fire away! 🌿🦜`,
          `🦜 Got more questions about **${menuOption}**? I'm all ears! 💫`,
        ];
        followUpText = followUps[Math.floor(Math.random() * followUps.length)];
      } else {
        // Custom question follow-ups
        const followUps = [
          `🦜 What else can I help you discover about Kākapos? 🌟`,
          `✨ Anything else you'd like to know? I'm here for you! 💚`,
          `🌿 Keep the questions coming! What's next? 🦜💫`,
          `💚 Fascinated yet? There's so much more to learn! 🦜✨`,
        ];
        followUpText = followUps[Math.floor(Math.random() * followUps.length)];
      }
      
      // Combine bot response with follow-up
      const fullMessage = data.message + '\n\n' + followUpText;
      
      // Add bot response with image if available
      addBotMessage(fullMessage, data.image_url || null);
      
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      setScreen('error');
    }
  };

  // Get or create session ID
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('kakapo_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('kakapo_session_id', sessionId);
    }
    return sessionId;
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedImage) return;

    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      image: selectedImage,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Check if asking for name
    if (isAskingName) {
      const name = inputText.trim();
      setUserName(name);
      localStorage.setItem('kakapo_user_name', name);
      setIsAskingName(false);
      
      // Show personalized greeting
      setTimeout(() => {
        addBotMessage(`Hello ${name}! 🦜 What can I do for you today?`);
        setShowMenu(true);
      }, 500);
    } else {
      // Send to Dialogflow
      sendToDialogflow(inputText, selectedImage);
    }
    
    setInputText('');
    setSelectedImage(null);
  };

  // Handle menu button click
  const handleMenuClick = (option) => {
    const newMessage = {
      id: Date.now(),
      type: 'user',
      text: option,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    setMessages(prev => [...prev, newMessage]);
    sendToDialogflow(option, option); // Pass menu option as second parameter
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle reset chat
  const handleResetChat = async () => {
    try {
      // Send "the_end" intent to backend
      await fetch('https://kakapo-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'the_end',
          sessionId: getSessionId()
        })
      });
    } catch (error) {
      console.error('Error resetting:', error);
    }
    
    // Reset UI and clear localStorage
    setMessages([]);
    setUserName('');
    setShowMenu(false);
    setIsAskingName(false);
    sessionStorage.removeItem('kakapo_session_id');
    localStorage.removeItem('kakapo_user_name');
    setScreen('welcome');
  };

  // Retry connection
  const handleRetry = () => {
    setScreen('loading');
    setTimeout(() => {
      setScreen('welcome');
    }, 2000);
  };

  // Loading Screen
  if (screen === 'loading') {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
        style={{
          backgroundImage: `url('${images.welcomeBg}')`,
          backgroundColor: '#1a3f3f'
        }}>
        <div className="text-center">
          <img 
            src={images.loadingScreen} 
            alt="Mosska is loading" 
            className="w-full max-w-lg mx-auto animate-fade-in mb-4"
          />
          <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: '#a3e635' }}>
            Mosska is loading...
          </h2>
          <div className="w-96 max-w-full mx-auto">
            <div className="h-3 bg-gray-700 bg-opacity-30 rounded-full overflow-hidden backdrop-blur-sm border border-gray-600 shadow-lg">
              <div className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-400 rounded-full animate-loading-bar shadow-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (screen === 'error') {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
        style={{
          backgroundImage: `url('${images.welcomeBg}')`,
          backgroundColor: '#1a3f3f'
        }}>
        <div className="text-center animate-fade-in max-w-2xl">
          <h1 
            className="text-5xl md:text-6xl font-black mb-8"
            style={{
              color: '#dc2626',
              textShadow: '3px 3px 0 #7f1d1d, -1px -1px 0 #fef2f2, 1px -1px 0 #fef2f2, -1px 1px 0 #fef2f2, 1px 1px 0 #fef2f2'
            }}>
            CONNECTION FAILED
          </h1>
          
          <img 
            src={images.errorScreen} 
            alt="Connection Failed" 
            className="w-full max-w-md mx-auto mb-8"
          />
          
          <p className="text-lg md:text-xl text-white mb-8 px-4 leading-relaxed drop-shadow-lg">
            Don't worry, I'm just having bit trouble connecting to my forest network. Please check your internet connection and try again in a moment.
          </p>
          
          <button
            onClick={handleRetry}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all shadow-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Welcome Screen
  if (screen === 'welcome') {
    return (
      <div 
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
        style={{
          backgroundImage: `url('${images.welcomeBg}')`,
          backgroundColor: '#1a3f3f'
        }}>
        <div className="text-center animate-fade-in max-w-2xl">
          <h1 
            className="text-5xl md:text-7xl font-black mb-4 animate-slide-down"
            style={{
              background: 'linear-gradient(to bottom, #a3e635, #fde047)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
            }}>
            Kia Ora! I'm<br/>KākapoBot!
          </h1>
          <p className="text-xl md:text-2xl text-white mb-12 animate-slide-up drop-shadow-lg">
            Your expert guide to all things Kākapo.
          </p>
          <div className="mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <img 
              src={images.kakapoOnBranch} 
              alt="Kakapo" 
              className="w-full max-w-md mx-auto drop-shadow-2xl"
            />
          </div>
          <button
            onClick={handleStartChat}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 md:px-16 py-4 md:py-5 rounded-full text-xl md:text-2xl font-bold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all shadow-lg animate-fade-in"
            style={{ animationDelay: '0.5s' }}>
            Start Chatting!
          </button>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{
        backgroundImage: `url('${images.chatBg}')`,
        backgroundColor: '#c8d5b9'
      }}>
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-white rounded-b-3xl shadow-lg px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={images.avatar} 
            alt="Mosska" 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shadow-md"
          />
          <h2 className="text-xl md:text-2xl font-bold text-green-700">
            {userName ? `Mosska - Chatting with ${userName}` : 'Mosska'}
          </h2>
        </div>
        <button
          onClick={handleResetChat}
          className="p-2 md:p-3 hover:bg-gray-100 rounded-full transition-colors"
          title="Reset Chat">
          <RotateCcw className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex gap-2 md:gap-3 animate-fade-in ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animationDelay: `${index * 0.1}s` }}>
              {msg.type === 'bot' && (
                <img 
                  src={images.avatar} 
                  alt="Mosska" 
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0 shadow-md"
                />
              )}
              <div className={`max-w-[75%] md:max-w-md lg:max-w-xl ${msg.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-3xl px-4 md:px-5 py-3 shadow-md ${
                  msg.type === 'user' 
                    ? 'bg-gradient-to-br from-green-300 to-green-400 text-gray-900' 
                    : 'bg-gradient-to-br from-teal-700 to-teal-800 text-white'
                }`}>
                  {msg.text && msg.type === 'bot' ? (
                    <p 
                      className="text-sm md:text-base leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                    />
                  ) : msg.text ? (
                    <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                  ) : null}
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Kakapo" 
                      className="rounded-2xl max-w-full h-auto mt-2"
                    />
                  )}
                </div>
                <p className={`text-xs text-gray-600 mt-1 px-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          
          {/* Menu Buttons */}
          {showMenu && (
            <div className="flex flex-wrap gap-2 justify-center my-4 animate-fade-in">
              {menuOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMenuClick(option)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all shadow-md">
                  {option}
                </button>
              ))}
            </div>
          )}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2 md:gap-3 animate-fade-in">
              <img 
                src={images.avatar} 
                alt="Mosska" 
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0 shadow-md"
              />
              <div className="bg-gradient-to-br from-teal-700 to-teal-800 rounded-3xl px-5 py-4 shadow-md">
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
      <div className="bg-white rounded-3xl shadow-lg mx-4 mb-4 p-3 md:p-4 animate-slide-up">
        <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
          <button
            onClick={handleVoiceInput}
            className={`p-2 md:p-3 rounded-full transition-colors flex-shrink-0 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'hover:bg-gray-100'
            }`}>
            {isListening ? (
              <MicOff className="w-5 h-5 md:w-6 md:h-6 text-white" />
            ) : (
              <Mic className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            )}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-gray-50 rounded-full outline-none text-sm md:text-base text-gray-700 placeholder-gray-400"
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="bg-gradient-to-r from-green-500 to-green-600 p-3 md:p-4 rounded-full hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0">
            <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-down { animation: slide-down 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-loading-bar { animation: loading-bar 2.5s ease-out forwards; }
        
        /* Formatting styles */
        strong { font-weight: 700; }
        em { font-style: italic; }
      `}</style>
    </div>
  );
};

export default KakapoChatbot;