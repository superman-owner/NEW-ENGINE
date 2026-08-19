import React, { useState, useEffect } from 'react';

export type RobotMood = 'idle' | 'happy' | 'thinking' | 'wink' | 'surprised' | 'listening';

interface RobotAvatarProps {
  mood?: RobotMood;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isSpeaking?: boolean;
  isThinking?: boolean;
  className?: string;
  onClick?: () => void;
  autoEmotion?: boolean;
  showHoverQuestion?: boolean;
  showSpeechBubble?: boolean;
  enthusiastic?: boolean;
}

const QUANT_SPEECH_QUOTES: string[] = [
  'Need help with your RL Policy?',
  'Ready to optimize Gold M15',
  'Click to open AI Copilot',
  'I can formulate Reward Functions',
  'ONNX Neural Bridge is standby',
  '21 Flow Nodes synchronized',
  'Press Ctrl + K anytime',
  'Actor-Critic weights ready',
  'Deep Quant Studio online',
];

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  mood: explicitMood,
  size = 'md',
  isSpeaking = false,
  isThinking = false,
  className = '',
  onClick,
  autoEmotion = true,
  showHoverQuestion = true,
  showSpeechBubble = true,
  enthusiastic = false,
}) => {
  const [internalMood, setInternalMood] = useState<RobotMood>('idle');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  // Random Speech Bubble State
  const [currentSpeech, setCurrentSpeech] = useState<string | null>(null);

  // Determine current active emotion
  let currentMood: RobotMood = explicitMood || internalMood;
  if (isSpeaking) currentMood = 'listening';
  else if (isThinking) currentMood = 'thinking';
  else if (isHovered || enthusiastic) currentMood = 'happy';

  // Periodic Cute Jump / Hop Animation with ^^ smiling eyes (Every 9.5s)
  useEffect(() => {
    if (!autoEmotion || enthusiastic) return;

    const jumpInterval = setInterval(() => {
      if (!isSpeaking && !isThinking) {
        setIsJumping(true);
        setInternalMood('happy'); // 🌟 Smile ^^ during hop!
        setTimeout(() => {
          setIsJumping(false);
          setInternalMood('idle');
        }, 850);
      }
    }, 9500);

    return () => clearInterval(jumpInterval);
  }, [autoEmotion, enthusiastic, isSpeaking, isThinking]);

  // Natural idle emotion cycle: frequent ^^ smiling eyes and playful expressions
  useEffect(() => {
    // Eye Blink Timer
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3200);

    // Natural Mood Cycle (Frequently alternates into charming ^^ smiling eyes)
    let moodInterval: any;
    if (autoEmotion && !isSpeaking && !isThinking && !isHovered && !enthusiastic) {
      moodInterval = setInterval(() => {
        const rand = Math.random();
        if (rand < 0.48) {
          //  Frequent cute ^^ smiling eyes in normal idle!
          setInternalMood('happy');
          setTimeout(() => setInternalMood('idle'), 3000);
        } else if (rand < 0.72) {
          setInternalMood('wink');
          setTimeout(() => setInternalMood('idle'), 2000);
        } else if (rand < 0.88) {
          setInternalMood('idle');
        } else {
          setInternalMood('surprised');
          setTimeout(() => setInternalMood('idle'), 1800);
        }
      }, 4800);
    }

    return () => {
      clearInterval(blinkInterval);
      if (moodInterval) clearInterval(moodInterval);
    };
  }, [autoEmotion, isSpeaking, isThinking, isHovered, enthusiastic]);

  // Periodic Random Speech Bubble (Smiles ^^ when delivering quotes)
  useEffect(() => {
    if (!showSpeechBubble || isSpeaking || isThinking || enthusiastic) return;

    const showRandomSpeech = () => {
      const randomQuote =
        QUANT_SPEECH_QUOTES[Math.floor(Math.random() * QUANT_SPEECH_QUOTES.length)];
      setCurrentSpeech(randomQuote);
      setInternalMood('happy'); // 🌟 Smile ^^ when talking
      setTimeout(() => {
        setCurrentSpeech(null);
        setInternalMood('idle');
      }, 4500);
    };

    // First appearance after 2.5 seconds
    const initialTimer = setTimeout(showRandomSpeech, 2500);

    // Recurring speech interval
    const speechInterval = setInterval(showRandomSpeech, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(speechInterval);
    };
  }, [showSpeechBubble, isSpeaking, isThinking, enthusiastic]);

  // Dimensions based on size
  const scale = size === 'xs' ? 0.44 : size === 'sm' ? 0.75 : size === 'lg' ? 1.4 : 1.0;
  const containerW = Math.round(92 * scale);
  const containerH = Math.round(76 * scale);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: `${containerW}px`,
        height: `${containerH}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transform: isJumping ? 'translateY(-16px) scale(1.05, 0.95)' : 'translateY(0) scale(1, 1)',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`group ${enthusiastic ? 'animate-bounce duration-700' : ''} ${className}`}
    >
      {/*  1. Hover Question Mark floating above head (Frameless Pure Glowing Symbol in Robot Theme) */}
      {!enthusiastic && showHoverQuestion && isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-2px)',
            fontSize: `${Math.round(26 * scale)}px`,
            fontWeight: 900,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            color: '#c084fc',
            textShadow: '0 0 16px #a855f7, 0 0 30px #7c3aed, 0 0 45px rgba(124, 58, 237, 0.8)',
            animation: 'bounce 0.85s infinite',
            pointerEvents: 'none',
            zIndex: 60,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ?
        </div>
      )}

      {/*  2. Idle Random Speech Bubble (Emerges on the LEFT of the Robot with Pure Clean Typography) */}
      {!enthusiastic && showSpeechBubble && !isHovered && currentSpeech && (
        <div
          style={{
            position: 'absolute',
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: '14px',
            background: 'linear-gradient(135deg, rgba(16, 15, 28, 0.96), rgba(6, 6, 12, 0.98))',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.9), 0 0 20px rgba(124, 58, 237, 0.35)',
            borderRadius: '14px',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 55,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            animation: 'pulse 3s infinite',
          }}
        >
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-apple-text)',
            }}
          >
            {currentSpeech}
          </span>

          {/* Triangular Pointer Pointing Right toward the Robot */}
          <div
            style={{
              position: 'absolute',
              left: '100%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '8px solid rgba(168, 85, 247, 0.65)',
            }}
          />
        </div>
      )}

      {/* Headphone & Head Wrapper */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* 1. Purple Curved Headband Arc */}
        <div
          style={{
            position: 'absolute',
            top: `${Math.round(2 * scale)}px`,
            width: `${Math.round(72 * scale)}px`,
            height: `${Math.round(48 * scale)}px`,
            borderRadius: '9999px 9999px 0 0',
            border: `${Math.round(5 * scale)}px solid #7c3aed`,
            boxShadow:
              currentMood === 'happy'
                ? `0 0 ${Math.round(10 * scale)}px rgba(168, 85, 247, 0.5)`
                : currentMood === 'thinking'
                ? `0 0 ${Math.round(10 * scale)}px rgba(6, 182, 212, 0.5)`
                : `0 0 ${Math.round(6 * scale)}px rgba(124, 58, 237, 0.4)`,
            transition: 'all 0.3s ease',
          }}
        />

        {/* 2. Left Ear Cup */}
        <div
          style={{
            position: 'absolute',
            left: `${Math.round(4 * scale)}px`,
            top: `${Math.round(20 * scale)}px`,
            width: `${Math.round(15 * scale)}px`,
            height: `${Math.round(38 * scale)}px`,
            borderRadius: `${Math.round(10 * scale)}px`,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed, #3b0764)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(216, 180, 254, 0.3)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: `${Math.round(4 * scale)}px`,
              height: `${Math.round(16 * scale)}px`,
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
            }}
          />
        </div>

        {/* 3. Right Ear Cup */}
        <div
          style={{
            position: 'absolute',
            right: `${Math.round(4 * scale)}px`,
            top: `${Math.round(20 * scale)}px`,
            width: `${Math.round(15 * scale)}px`,
            height: `${Math.round(38 * scale)}px`,
            borderRadius: `${Math.round(10 * scale)}px`,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed, #3b0764)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(216, 180, 254, 0.3)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: `${Math.round(4 * scale)}px`,
              height: `${Math.round(16 * scale)}px`,
              borderRadius: '9999px',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
            }}
          />
        </div>

        {/* 4. OLED Monitor Face Screen */}
        <div
          style={{
            position: 'relative',
            width: `${Math.round(68 * scale)}px`,
            height: `${Math.round(52 * scale)}px`,
            borderRadius: `${Math.round(18 * scale)}px`,
            backgroundColor: '#000000',
            border: `${Math.round(2.5 * scale)}px solid ${
              currentMood === 'happy'
                ? '#a855f7'
                : currentMood === 'thinking'
                ? '#06b6d4'
                : currentMood === 'surprised'
                ? '#f59e0b'
                : '#322b4d'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              currentMood === 'happy'
                ? `0 0 ${Math.round(12 * scale)}px rgba(168, 85, 247, 0.3)`
                : currentMood === 'thinking'
                ? `0 0 ${Math.round(12 * scale)}px rgba(6, 182, 212, 0.3)`
                : '0 0 10px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          {/* Glass Specular Top Highlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.18), transparent)',
              pointerEvents: 'none',
              borderRadius: `${Math.round(18 * scale)}px`,
            }}
          />

          {/* 5. Dynamic Multi-Emotion LED Eyes */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: `${Math.round(8 * scale)}px`,
              zIndex: 5,
            }}
          >
            {/* --- MOOD: BLINKING (Eyes close as flat lines) --- */}
            {isBlinking ? (
              <>
                <div
                  style={{
                    width: `${Math.round(11 * scale)}px`,
                    height: `${Math.round(2 * scale)}px`,
                    borderRadius: '2px',
                    backgroundColor: '#c084fc',
                    boxShadow: `0 0 ${Math.round(4 * scale)}px #d8b4fe`,
                  }}
                />
                <div
                  style={{
                    width: `${Math.round(16 * scale)}px`,
                    height: `${Math.round(2 * scale)}px`,
                    borderRadius: '2px',
                    backgroundColor: '#c084fc',
                    boxShadow: `0 0 ${Math.round(4 * scale)}px #d8b4fe`,
                  }}
                />
              </>
            ) : currentMood === 'happy' ? (
              /* --- MOOD: HAPPY (^ ^ Crisp Symmetrical Crescent Smiling Eyes) --- */
              <>
                <svg
                  width={Math.max(10, Math.round(14 * scale))}
                  height={Math.max(8, Math.round(10 * scale))}
                  viewBox="0 0 16 12"
                  fill="none"
                >
                  <path
                    d="M2 9C2 4.5 5 2 8 2C11 2 14 4.5 14 9"
                    stroke="#c084fc"
                    strokeWidth={Math.max(2.2, 2.8 * scale)}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 ${Math.max(2, Math.round(3 * scale))}px #d8b4fe)` }}
                  />
                </svg>
                <svg
                  width={Math.max(10, Math.round(14 * scale))}
                  height={Math.max(8, Math.round(10 * scale))}
                  viewBox="0 0 16 12"
                  fill="none"
                >
                  <path
                    d="M2 9C2 4.5 5 2 8 2C11 2 14 4.5 14 9"
                    stroke="#c084fc"
                    strokeWidth={Math.max(2.2, 2.8 * scale)}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 ${Math.max(2, Math.round(3 * scale))}px #d8b4fe)` }}
                  />
                </svg>
              </>
            ) : currentMood === 'wink' ? (
              /* --- MOOD: WINK (- O Playful Wink Eye) --- */
              <>
                {/* Left Eye: Closed Wink Line */}
                <div
                  style={{
                    width: `${Math.round(12 * scale)}px`,
                    height: `${Math.round(3 * scale)}px`,
                    borderRadius: '3px',
                    backgroundColor: '#c084fc',
                    boxShadow: '0 0 8px #d8b4fe',
                  }}
                />
                {/* Right Eye: Big Sparkle Open Circle */}
                <div
                  style={{
                    width: `${Math.round(16 * scale)}px`,
                    height: `${Math.round(14 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#c084fc',
                    boxShadow: '0 0 12px #d8b4fe',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                    }}
                  />
                </div>
              </>
            ) : currentMood === 'surprised' ? (
              /* --- MOOD: SURPRISED (O O Big Round Golden Eyes) --- */
              <>
                <div
                  style={{
                    width: `${Math.round(14 * scale)}px`,
                    height: `${Math.round(14 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#fbbf24',
                    boxShadow: '0 0 14px #fde047',
                  }}
                />
                <div
                  style={{
                    width: `${Math.round(14 * scale)}px`,
                    height: `${Math.round(14 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#fbbf24',
                    boxShadow: '0 0 14px #fde047',
                  }}
                />
              </>
            ) : currentMood === 'thinking' ? (
              /* --- MOOD: THINKING (Cyan Rotating Pulse Dots) --- */
              <div style={{ display: 'flex', alignItems: 'center', gap: `${Math.round(4 * scale)}px` }}>
                <div
                  style={{
                    width: `${Math.round(6 * scale)}px`,
                    height: `${Math.round(6 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#06b6d4',
                    boxShadow: '0 0 8px #22d3ee',
                  }}
                  className="animate-bounce"
                />
                <div
                  style={{
                    width: `${Math.round(8 * scale)}px`,
                    height: `${Math.round(8 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#06b6d4',
                    boxShadow: '0 0 8px #22d3ee',
                  }}
                  className="animate-bounce delay-150"
                />
                <div
                  style={{
                    width: `${Math.round(6 * scale)}px`,
                    height: `${Math.round(6 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#06b6d4',
                    boxShadow: '0 0 8px #22d3ee',
                  }}
                  className="animate-bounce delay-300"
                />
              </div>
            ) : currentMood === 'listening' ? (
              /* --- MOOD: LISTENING (Soundwave Equalizer LED Bars) --- */
              <div style={{ display: 'flex', alignItems: 'center', gap: `${Math.round(3 * scale)}px` }}>
                <div
                  style={{
                    width: `${Math.round(3 * scale)}px`,
                    height: `${Math.round(10 * scale)}px`,
                    borderRadius: '2px',
                    backgroundColor: '#a855f7',
                    boxShadow: '0 0 8px #c084fc',
                  }}
                  className="animate-pulse"
                />
                <div
                  style={{
                    width: `${Math.round(3 * scale)}px`,
                    height: `${Math.round(18 * scale)}px`,
                    borderRadius: '2px',
                    backgroundColor: '#06b6d4',
                    boxShadow: '0 0 8px #22d3ee',
                  }}
                  className="animate-pulse delay-100"
                />
                <div
                  style={{
                    width: `${Math.round(3 * scale)}px`,
                    height: `${Math.round(12 * scale)}px`,
                    borderRadius: '2px',
                    backgroundColor: '#a855f7',
                    boxShadow: '0 0 8px #c084fc',
                  }}
                  className="animate-pulse delay-200"
                />
              </div>
            ) : (
              /* --- MOOD: IDLE / DEFAULT (Cute Left Circle + Right Oval Capsule) --- */
              <>
                <div
                  style={{
                    width: `${Math.round(11 * scale)}px`,
                    height: `${Math.round(11 * scale)}px`,
                    borderRadius: '50%',
                    backgroundColor: '#c084fc',
                    boxShadow: '0 0 10px #d8b4fe',
                  }}
                />
                <div
                  style={{
                    width: `${Math.round(18 * scale)}px`,
                    height: `${Math.round(11 * scale)}px`,
                    borderRadius: '9999px',
                    backgroundColor: '#c084fc',
                    boxShadow: '0 0 10px #d8b4fe',
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RobotAvatar;
