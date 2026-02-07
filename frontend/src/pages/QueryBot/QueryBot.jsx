import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './QueryBot.module.css';
import ChatBubble from '../../components/ChatBubble';
import { api } from '../../services/api';

const getSessionKey = (consultationId) =>
  consultationId ? `helio-chat-session-${consultationId}` : 'helio-chat-session-general';

const SUGGESTIONS = [
  { icon: '💊', text: 'Medication side effects', message: 'What are the side effects of common pain medications?' },
  { icon: '🤒', text: 'Check my symptoms', message: 'I have a headache and fever. What could it be?' },
  { icon: '😴', text: 'Sleep improvement tips', message: 'What are some tips for better sleep?' },
  { icon: '💧', text: 'Daily hydration guide', message: 'How much water should I drink daily?' }
];

const TOPICS = [
  { icon: '💊', label: 'Medications', topic: 'Tell me about common medication interactions' },
  { icon: '🩺', label: 'Symptoms', topic: 'I want to understand some symptoms I\'m experiencing' },
  { icon: '🥗', label: 'Nutrition', topic: 'What are some healthy eating tips?' },
  { icon: '🏃', label: 'Exercise', topic: 'What exercises are good for overall health?' }
];

const WELCOME_MESSAGE = `Hello! I'm your Helio Health Assistant.

I can help you with:
- Understanding your medications and dosages
- General symptom information
- Wellness and nutrition tips
- Finding the right specialist

**How can I assist you today?**`;

export default function QueryBot() {
  const [searchParams, setSearchParams] = useSearchParams();
  const makeWelcome = () => ({
    id: crypto.randomUUID(), text: WELCOME_MESSAGE, isBot: true, timestamp: new Date()
  });

  const [messages, setMessages] = useState([makeWelcome()]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [createNewConsultation, setCreateNewConsultation] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load consultations list on mount, then handle deep link
  useEffect(() => {
    api.getConsultations()
      .then((data) => {
        setConsultations(data);
        const deepLinkId = searchParams.get('consultation');
        if (deepLinkId) {
          const match = data.find(c => c.id === deepLinkId);
          if (match) {
            setSelectedConsultation(match);
          }
          // Clear the param so refresh doesn't re-trigger
          setSearchParams({}, { replace: true });
        }
      })
      .catch(() => {});
  }, []);

  // Persist sessionId to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      const key = getSessionKey(selectedConsultation?.id);
      localStorage.setItem(key, sessionId);
    }
  }, [sessionId, selectedConsultation]);

  // Load saved session and chat history on mount and consultation change
  useEffect(() => {
    const key = getSessionKey(selectedConsultation?.id);
    const savedSessionId = localStorage.getItem(key);

    if (savedSessionId) {
      setSessionId(savedSessionId);
      setLoadingHistory(true);
      api.getChatHistory(savedSessionId)
        .then(history => {
          if (history.length > 0) {
            const loaded = history.map(m => ({
              id: crypto.randomUUID(),
              text: m.content,
              isBot: m.role === 'assistant',
              timestamp: new Date()
            }));
            setMessages([makeWelcome(), ...loaded]);
            setShowSuggestions(false);
          } else {
            setMessages([makeWelcome()]);
            setShowSuggestions(true);
          }
        })
        .catch(() => {
          setMessages([makeWelcome()]);
          setShowSuggestions(true);
        })
        .finally(() => setLoadingHistory(false));
    } else {
      setSessionId(null);
      setMessages([makeWelcome()]);
      setShowSuggestions(true);
    }
  }, [selectedConsultation]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  };

  const handleSelectConsultation = (consultation) => {
    setSelectedConsultation(consultation);
    // useEffect on selectedConsultation handles session + history loading
  };

  const handleClearConsultation = () => {
    setSelectedConsultation(null);
    // useEffect on selectedConsultation handles session + history reset
  };

  const handleSendMessage = async (text = inputValue) => {
    if (!text.trim()) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Show typing indicator
    setIsTyping(true);

    try {
      // Call API with optional consultation context
      const shouldCreate = createNewConsultation && !selectedConsultation;
      const response = await api.chat(text, sessionId, selectedConsultation?.id, shouldCreate);
      setSessionId(response.sessionId);

      // If a new consultation was created from chat, update state
      if (shouldCreate && response.consultation_id) {
        const newConsultation = {
          id: response.consultation_id,
          title: response.title,
          status: 'chat',
          created_at: new Date().toISOString(),
        };
        setSelectedConsultation(newConsultation);
        setConsultations(prev => [newConsultation, ...prev]);
        setCreateNewConsultation(false);
      }

      // Add bot response after delay
      setTimeout(() => {
        setIsTyping(false);
        const botMessage = {
          id: crypto.randomUUID(),
          text: response.response,
          isBot: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      const errorMessage = {
        id: crypto.randomUUID(),
        text: 'Sorry, I encountered an error. Please try again.',
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion.message);
  };

  const handleTopicClick = (topic) => {
    handleSendMessage(topic.topic);
  };

  const handleClearChat = () => {
    const key = getSessionKey(selectedConsultation?.id);
    localStorage.removeItem(key);
    setMessages([makeWelcome()]);
    setShowSuggestions(true);
    setSessionId(null);
  };

  const handleNewChat = () => {
    handleClearChat();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className={styles.queryBot}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLabel}>AI-Powered Health Assistant</div>
          <h1>Your Personal <span className={styles.highlight}>Health Query Bot</span></h1>
          <p className={styles.heroDescription}>
            Get instant answers to your health questions, medication information, and symptom guidance 24/7.
          </p>
        </div>
      </section>

      {/* Chat Section */}
      <section className={styles.chatSection}>
        <div className={styles.container}>
          <div className={styles.chatContainer}>
            {/* Sidebar */}
            <div className={styles.chatSidebar}>
              <div className={styles.sidebarHeader}>
                <h3>Chat History</h3>
                <button className={styles.newChatBtn} onClick={handleNewChat}>
                  <span>+</span> New Chat
                </button>
              </div>
              <div className={styles.chatHistory}>
                <div className={`${styles.historyItem} ${styles.active}`}>
                  <span className={styles.historyIcon}>💬</span>
                  <div className={styles.historyInfo}>
                    <span className={styles.historyTitle}>Current Conversation</span>
                    <span className={styles.historyTime}>Just now</span>
                  </div>
                </div>
              </div>

              {/* Consultation Context Selector */}
              <div className={styles.consultationSelector}>
                <h4>Consultation Context</h4>
                {consultations.length > 0 && (
                  <select
                    className={styles.consultationSelect}
                    value={selectedConsultation?.id || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        handleClearConsultation();
                      } else {
                        const c = consultations.find(c => c.id === id);
                        if (c) handleSelectConsultation(c);
                      }
                    }}
                  >
                    <option value="">General Q&A</option>
                    {consultations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || formatDate(c.created_at)} - {c.status}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className={styles.newConsultationBtn}
                  onClick={() => {
                    handleClearConsultation();
                    setCreateNewConsultation(true);
                    handleClearChat();
                  }}
                  disabled={createNewConsultation}
                >
                  {createNewConsultation ? 'Ready — send first message' : '+ Start New Consultation'}
                </button>
              </div>

              <div className={styles.sidebarFooter}>
                <div className={styles.quickTopics}>
                  <h4>Quick Topics</h4>
                  <div className={styles.topicChips}>
                    {TOPICS.map((topic, index) => (
                      <button
                        key={index}
                        className={styles.topicChip}
                        onClick={() => handleTopicClick(topic)}
                      >
                        {topic.icon} {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat */}
            <div className={styles.chatMain}>
              <div className={styles.chatHeader}>
                <div className={styles.botInfo}>
                  <div className={styles.botAvatar}>
                    <span>🤖</span>
                    <div className={styles.statusDot}></div>
                  </div>
                  <div className={styles.botDetails}>
                    <h3>Helio Health Assistant</h3>
                    <span className={styles.botStatus}>Online - Ready to help</span>
                  </div>
                </div>
                <div className={styles.chatActions}>
                  <button className={styles.actionBtn} onClick={handleClearChat} title="Clear Chat">
                    🗑️
                  </button>
                </div>
              </div>

              {/* Context Banner */}
              {selectedConsultation && (
                <div className={styles.contextBanner}>
                  <span>
                    Chatting about: {selectedConsultation.title || `consultation from ${formatDate(selectedConsultation.created_at)}`}
                  </span>
                  <button className={styles.contextDismiss} onClick={handleClearConsultation}>
                    ✕
                  </button>
                </div>
              )}

              <div className={styles.chatMessages}>
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.text}
                    isBot={msg.isBot}
                    timestamp={msg.timestamp}
                  />
                ))}

                {showSuggestions && (
                  <div className={styles.suggestionCards}>
                    {SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        className={styles.suggestionCard}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <span className={styles.suggestionIcon}>{suggestion.icon}</span>
                        <span className={styles.suggestionText}>{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                )}

                {isTyping && (
                  <div className={styles.typingIndicator}>
                    <div className={styles.messageAvatar}>🤖</div>
                    <div className={styles.typingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className={styles.chatInputContainer}>
                <div className={styles.inputWrapper}>
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your health question here..."
                    rows={1}
                    className={styles.chatInput}
                  />
                  <button
                    className={styles.sendBtn}
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                  >
                    <span>➤</span>
                  </button>
                </div>
                <p className={styles.disclaimer}>
                  ⚠️ This is an AI assistant. For medical emergencies, please call emergency services or visit a hospital.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
