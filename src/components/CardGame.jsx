import React, { useState, useEffect, useCallback } from 'react';
import { X, Pause, Play } from 'lucide-react';
import { intro } from '../tools/LoadImg';
import cardsData from '../data/cards-data.json';
import CARD_BACK_IMAGE from '../assets/back-card.png';

const GAME_STATES = {
  INTRO: 'intro',
  PLAYING: 'playing',
  ENDED: 'ended'
};

const GAME_DURATION = 180; // 3 minutes in seconds
const CARD_DISPLAY_TIME = 3000; // 3 seconds per card display (adjust as needed for kids)
const WARNING_TIME = 20; // 20 seconds remaining
const STACKS_COUNT = 3;

const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
          }}
        />
      ))}
    </div>
  );
};

const CardStack = ({ currentCard, isActive, stackIndex, onCardClick }) => {
  return (
    <div className="relative w-40 h-56 perspective-1000">
      {/* Background cards in stack */}
      <div className="absolute inset-0 transform translate-y-2">
        <div className="w-40 h-56 rounded-xl shadow-lg overflow-hidden">
          <img 
            src={CARD_BACK_IMAGE} 
            alt="Card back" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <div className="absolute inset-0 transform translate-y-1">
        <div className="w-40 h-56 rounded-xl shadow-lg overflow-hidden">
          <img 
            src={CARD_BACK_IMAGE} 
            alt="Card back" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Flipping card container */}
      <div 
        onClick={() => onCardClick(currentCard, stackIndex)}
        className="card-container w-40 h-56 cursor-pointer absolute inset-0 transition-all duration-500"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: isActive ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Card Back (Initial visible side) */}
        <div 
          className="absolute inset-0 w-full h-full rounded-xl shadow-xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <img 
            src={CARD_BACK_IMAGE} 
            alt="Card back" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Card Front (Value side - initially hidden) */}
        <div 
          className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {currentCard && (
            <div className={`flex flex-col items-center justify-center h-full
              ${currentCard.color === 'red' ? 'text-red-500' : 'text-gray-900'}`}>
              <div className="absolute top-4 left-4 text-3xl font-bold">{currentCard.value}</div>
              <div className="absolute top-4 right-4 text-3xl font-bold">{currentCard.suit}</div>
              <div className="text-6xl font-bold">{currentCard.value}</div>
              <div className="text-6xl font-bold">{currentCard.suit}</div>
              <div className="absolute bottom-4 left-4 text-3xl font-bold rotate-180">{currentCard.value}</div>
              <div className="absolute bottom-4 right-4 text-3xl font-bold rotate-180">{currentCard.suit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CardGame = () => {
  const [gameState, setGameState] = useState(GAME_STATES.INTRO);
  const [deck, setDeck] = useState([]);
  const [currentCards, setCurrentCards] = useState(Array(STACKS_COUNT).fill(null));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPaused, setIsPaused] = useState(false);
  const [activeStackIndex, setActiveStackIndex] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Initialize deck from JSON data
  const createDeck = useCallback(() => {
    return shuffleDeck([...cardsData]);
  }, []);

  // Fisher-Yates shuffle
  const shuffleDeck = (deckToShuffle) => {
    const shuffled = [...deckToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get a random card from the deck
  const getRandomCard = useCallback(() => {
    if (deck.length === 0) {
      setDeck(createDeck());
      return null;
    }
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    setDeck(prev => [...prev.slice(0, randomIndex), ...prev.slice(randomIndex + 1)]);
    return card;
  }, [deck, createDeck]);

  // Initialize game
  const startGame = useCallback(() => {
    setDeck(createDeck());
    setCurrentCards(Array(STACKS_COUNT).fill(null));
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setIsPaused(false);
    setGameState(GAME_STATES.PLAYING);
    setActiveStackIndex(null);
  }, [createDeck]);

  // Handle card click
  const handleCardClick = useCallback((card, stackIndex) => {
    if (stackIndex !== activeStackIndex || isPaused || !card) return;

    // Using isCorrect from the JSON data
    if (card.isCorrect) {
      setScore(prev => prev + 5);
      triggerConfetti();
    } else {
      showWrongAnswer();
    }
    
    // Force the card to flip back immediately after interaction
    setActiveStackIndex(null);
  }, [activeStackIndex, isPaused]);

  // Celebration effect for correct answers
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
  };

  // Wrong answer feedback
  const showWrongAnswer = () => {
    const element = document.getElementById('game-container');
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 500);
  };

  // Timer effect
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState(GAME_STATES.ENDED);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, isPaused]);

  // SIMPLIFIED Card display management
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || isPaused) return;
    
    // Simple, clear card cycle:
    // 1. Show card (by setting active stack index)
    // 2. Wait for CARD_DISPLAY_TIME
    // 3. Hide card (by setting active stack index to null)
    // 4. Repeat
    
    const interval = setInterval(() => {
      // If there's already an active card, hide it first
      if (activeStackIndex !== null) {
        setActiveStackIndex(null);
        // Wait a bit before showing the next card
        setTimeout(() => {
          const stackIndex = Math.floor(Math.random() * STACKS_COUNT);
          const newCard = getRandomCard();
          
          // Update the card in the chosen stack
          setCurrentCards(prev => {
            const newCards = [...prev];
            newCards[stackIndex] = newCard;
            return newCards;
          });
          
          // Make the stack active (flipping the card)
          setActiveStackIndex(stackIndex);
        }, 500); // Half-second pause between cards
      } else {
        // Show a new card
        const stackIndex = Math.floor(Math.random() * STACKS_COUNT);
        const newCard = getRandomCard();
        
        setCurrentCards(prev => {
          const newCards = [...prev];
          newCards[stackIndex] = newCard;
          return newCards;
        });
        
        setActiveStackIndex(stackIndex);
      }
    }, CARD_DISPLAY_TIME);
    
    return () => clearInterval(interval);
  }, [gameState, isPaused, getRandomCard, activeStackIndex]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div 
      className="min-h-screen bg-cover bg-center p-4 flex flex-col items-center justify-center" 
      style={{ backgroundImage: "url('https://t3.ftcdn.net/jpg/03/22/48/50/360_F_322485076_wuZ8D5R9biTRNSGJMWZBor9uUcO1Md59.jpg')" }}
      id="game-container"
    >
      {showConfetti && <Confetti />}

      <div className="bg-black bg-opacity-70 p-8 rounded-xl max-w-4xl w-full">
        {gameState === GAME_STATES.INTRO && (
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-white">Card Flip Challenge</h1>
            <div className="p-4 flex justify-center">
              <img 
                src={intro["gif"]} 
                alt="How to play" 
                className="rounded-lg max-w-md w-full"
              />
            </div>
            <p className="text-lg text-white">
              Watch for cards greater than 6 and click them quickly! 
              Each correct pick earns you 5 points. Cards will appear
              for {CARD_DISPLAY_TIME/1000} seconds at a time.
            </p>
            <button 
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg
                transition-colors duration-200 transform hover:scale-105"
            >
              Play Now
            </button>
          </div>
        )}

        {gameState === GAME_STATES.PLAYING && (
          <>
            <div className="flex justify-between items-center mb-10">
              <div className="text-2xl font-bold text-white">Score: {score}</div>
              <div className={`text-2xl font-bold ${timeLeft <= WARNING_TIME ? 'text-red-500' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setIsPaused(prev => !prev)}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-md
                    transition-colors duration-200"
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </button>
                <button
                  onClick={() => setGameState(GAME_STATES.ENDED)}
                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-md
                    transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex justify-center space-x-24">
              {currentCards.map((card, index) => (
                <CardStack
                  key={index}
                  currentCard={card}
                  stackIndex={index}
                  isActive={activeStackIndex === index}
                  onCardClick={handleCardClick}
                />
              ))}
            </div>
          </>
        )}

        {gameState === GAME_STATES.ENDED && (
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold text-white">Game Over!</h2>
            <p className="text-2xl text-white">Final Score: {score}</p>
            <div className="space-x-4">
              <button 
                onClick={startGame}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg
                  transition-colors duration-200 transform hover:scale-105"
              >
                Play Again
              </button>
              <button 
                onClick={() => setGameState(GAME_STATES.INTRO)}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg
                  transition-colors duration-200 transform hover:scale-105"
              >
                Close Game
              </button>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          .perspective-1000 {
            perspective: 1200px;
          }
          
          @keyframes shake {
            10%, 90% { transform: translate3d(-2px, 0, 0); }
            20%, 80% { transform: translate3d(4px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-6px, 0, 0); }
            40%, 60% { transform: translate3d(6px, 0, 0); }
          }
          
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100%) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
          
          .animate-confetti {
            animation: confetti-fall 3s ease-in-out forwards;
          }
          
          .shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
        `}
      </style>
    </div>
  );
};

export default CardGame;