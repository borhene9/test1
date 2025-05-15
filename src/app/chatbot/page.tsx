'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import styles from './chatbot.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const sessionId = useRef(uuidv4());
  const pathname = usePathname();

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [pathname]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          sessionId: sessionId.current
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  // Suggestion cards data
  const suggestions = [
    {
      label: 'Tell me about the customer with the id C034114',
      desc: '',
      onClick: () => setInput('Tell me about the customer with the id C034114'),
    },
    {
      label: 'Which agency has the most accounts?',
      desc: '',
      onClick: () => setInput('Which agency has the most accounts?'),
    },
    {
      label: 'Show me recent transactions',
      desc: '',
      onClick: () => setInput('Show me recent transactions'),
    },
    {
      label: 'What are our top products?',
      desc: '',
      onClick: () => setInput('What are our top products?'),
    },
  ];

  return (
    <div className={`${styles.chatContainer} bg-gradient-to-b from-white to-green-50 flex items-center justify-center p-8`}>
      <div className="w-full max-w-2xl flex flex-col justify-between h-full">
        {/* Suggestion cards */}
        {messages.length === 0 && input === '' && (
          <div className={styles.suggestionsContainer} key={messages.length}>
            <div className={styles.suggestions}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={s.onClick}
                  className={styles.suggestionButton}
                >
                  <span className="font-semibold text-lg mb-1">{s.label}</span>
                  <span className="text-sm text-green-800 leading-tight">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Chat bubbles */}
        <div className={styles.chatMessages}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.messageRow} ${message.role === 'user' ? styles.user : ''}`}
            >
              <div className={`${styles.avatar} ${message.role === 'user' ? styles.user : styles.assistant}`}>
                {message.role === 'user' ? '🧑' : '💬'}
              </div>
              <div className={`${styles.messageBubble} ${message.role === 'user' ? styles.user : styles.assistant}`}>
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={styles.loadingMessage}>
              <div className={styles.avatar + ' ' + styles.assistant}>💬</div>
              <div className={styles.loadingDots}>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Floating input bar, send button inside input */}
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <input
            type="text"
            name="message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Amen Bank Assistant..."
            className={styles.inputField}
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            name="send"
            disabled={isLoading}
            className={styles.sendButton}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
