import React, { useState, useEffect, useCallback } from 'react';
import { X, Pause, Play } from 'lucide-react';
import { intro } from '../tools/LoadImg';

const GAME_STATES = {
  INTRO: 'intro',
  PLAYING: 'playing',
  ENDED: 'ended'
};

const GAME_DURATION = 180; // 3 minutes in seconds
const CARD_FLIP_INTERVAL = 3000; // 3 seconds
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
      <div className="relative w-24 h-36">
        {/* Background cards in stack */}
        <div className="absolute inset-0 transform translate-y-2">
          <div className="w-24 h-36 bg-blue-500 rounded-lg shadow-lg">
            <div className="h-full w-full bg-white bg-opacity-20 rounded-lg"></div>
          </div>
        </div>
        <div className="absolute inset-0 transform translate-y-1">
          <div className="w-24 h-36 bg-blue-500 rounded-lg shadow-lg">
            <div className="h-full w-full bg-white bg-opacity-20 rounded-lg"></div>
          </div>
        </div>
        {/* Top card that flips */}
        <div 
          onClick={() => onCardClick(currentCard, stackIndex)}
          className={`w-24 h-36 cursor-pointer absolute inset-0 transform transition-all duration-500 
            shadow-xl hover:shadow-2xl
            ${isActive ? 'rotate-0' : 'rotate-y-180'}`}
        >
          {isActive && currentCard ? (
            <div className={`flex flex-col items-center justify-center h-full bg-white rounded-lg 
              ${currentCard.color === 'red' ? 'text-red-500' : 'text-gray-900'}`}>
              <div className="text-2xl">{currentCard.value}</div>
              <div className="text-2xl">{currentCard.suit}</div>
            </div>
          ) : (
            <div className="h-full w-full bg-blue-500 rounded-lg">
              <div className="h-full w-full bg-white bg-opacity-20 rounded-lg"></div>
            </div>
          )}
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

  // Create a standard deck of cards
  const createDeck = useCallback(() => {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const newDeck = [];

    for (const suit of suits) {
      for (const value of values) {
        const numericValue = 
          value === 'A' ? 1 :
          value === 'J' ? 11 :
          value === 'Q' ? 12 :
          value === 'K' ? 13 :
          parseInt(value);

        newDeck.push({
          suit,
          value,
          numericValue,
          color: suit === '♥' || suit === '♦' ? 'red' : 'black'
        });
      }
    }
    return shuffleDeck(newDeck);
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

    if (card.numericValue > 6) {
      setScore(prev => prev + 5);
      triggerConfetti();
    } else {
      showWrongAnswer();
    }
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

  // Card flip effect
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING || isPaused) return;

    let flipTimeout;
    let resetTimeout;

    const flipCard = () => {
      if (activeStackIndex !== null) {
        setActiveStackIndex(null);
        setCurrentCards(prev => {
          const newCards = [...prev];
          newCards[activeStackIndex] = null;
          return newCards;
        });
        
        resetTimeout = setTimeout(() => {
          const newStackIndex = Math.floor(Math.random() * STACKS_COUNT);
          const newCard = getRandomCard();
          setCurrentCards(prev => {
            const newCards = [...prev];
            newCards[newStackIndex] = newCard;
            return newCards;
          });
          setActiveStackIndex(newStackIndex);
          flipTimeout = setTimeout(flipCard, CARD_FLIP_INTERVAL);
        }, 500);
      } else {
        const newStackIndex = Math.floor(Math.random() * STACKS_COUNT);
        const newCard = getRandomCard();
        setCurrentCards(prev => {
          const newCards = [...prev];
          newCards[newStackIndex] = newCard;
          return newCards;
        });
        setActiveStackIndex(newStackIndex);
        flipTimeout = setTimeout(flipCard, CARD_FLIP_INTERVAL);
      }
    };

    flipTimeout = setTimeout(flipCard, 1000);

    return () => {
      clearTimeout(flipTimeout);
      clearTimeout(resetTimeout);
    };
  }, [gameState, isPaused, activeStackIndex, getRandomCard]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto" id="game-container">
      {showConfetti && <Confetti />}

      {gameState === GAME_STATES.INTRO && (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Card Flip Challenge</h1>
          <div className="p-4">
            <img 
              src={intro["gif"]} 
              alt="How to play" 
              className="mx-auto rounded-lg"
            />
          </div>
          <p className="text-lg">
            Watch for cards greater than 6 and click them quickly! 
            Each correct pick earns you 5 points. Cards will randomly appear
            every 3 seconds.
          </p>
          <button 
            onClick={startGame}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg
              transition-colors duration-200"
          >
            Play Now
          </button>
        </div>
      )}

      {gameState === GAME_STATES.PLAYING && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="text-xl font-bold">Score: {score}</div>
            <div className={`text-xl font-bold ${timeLeft <= WARNING_TIME ? 'text-red-500' : ''}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="space-x-2">
              <button
                onClick={() => setIsPaused(prev => !prev)}
                className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md
                  transition-colors duration-200"
              >
                {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
              </button>
              <button
                onClick={() => setGameState(GAME_STATES.ENDED)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md
                  transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex justify-center space-x-16">
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
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Game Over!</h2>
          <p className="text-xl">Final Score: {score}</p>
          <div className="space-x-4">
            <button 
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg
                transition-colors duration-200"
            >
              Play Again
            </button>
            <button 
              onClick={() => setGameState(GAME_STATES.INTRO)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg
                transition-colors duration-200"
            >
              Close Game
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
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
      `}</style>
    </div>
  );
};

export default CardGame;