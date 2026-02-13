import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { quizService } from '@/services/quizService';
import {
  OfflineHotseatAnswer,
  OfflineHotseatPlayer,
  OfflineHotseatSession,
  QuizSessionSnapshot,
  quizSessionService,
} from '@/services/quizSessionService';
import { useAppSelector } from '@/store/hooks';

type OnlineState = {
  kind: 'online';
  snapshot: QuizSessionSnapshot;
  questions: Awaited<ReturnType<typeof quizService.getQuestionsByIds>>;
};

type HotseatState = {
  kind: 'hotseat';
  session: OfflineHotseatSession;
};

type GameState = OnlineState | HotseatState;

export default function QuizGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const { sessionId, localSessionId, mode } = useLocalSearchParams<{
    sessionId?: string;
    localSessionId?: string;
    mode?: string;
  }>();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUsingLifeline, setIsUsingLifeline] = useState(false);
  const [clockTick, setClockTick] = useState(Date.now());
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [revealCorrectOption, setRevealCorrectOption] = useState(false);
  const [jokerUsedOnCurrentQuestion, setJokerUsedOnCurrentQuestion] = useState(false);
  const [helpUsedOnCurrentQuestion, setHelpUsedOnCurrentQuestion] = useState(false);
  const [hotseatFeedbackPending, setHotseatFeedbackPending] = useState(false);
  const [hotseatHandoffPlayerName, setHotseatHandoffPlayerName] = useState<string | null>(null);

  const unsubscribeRef = useRef<null | (() => Promise<void>)>(null);
  const hostAdvanceLockRef = useRef<string | null>(null);
  const hotseatTimeoutLockRef = useRef<string | null>(null);

  const tr = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  useEffect(() => {
    const timer = setInterval(() => setClockTick(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadOnlineSession = async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const snapshot = await quizSessionService.getSessionSnapshot(id);
        const questions = await quizService.getQuestionsByIds({
          questionIds: snapshot.session.question_ids,
          language: currentLanguage,
        });

        if (!isMounted) return;

        setHotseatHandoffPlayerName(null);
        setGameState({
          kind: 'online',
          snapshot,
          questions,
        });

        unsubscribeRef.current = quizSessionService.subscribeSession(id, {
          onSessionChange: (session) => {
            setGameState((prev) => {
              if (!prev || prev.kind !== 'online') return prev;
              return {
                ...prev,
                snapshot: {
                  ...prev.snapshot,
                  session,
                },
              };
            });
          },
          onPlayersChange: (players) => {
            setGameState((prev) => {
              if (!prev || prev.kind !== 'online') return prev;
              return {
                ...prev,
                snapshot: {
                  ...prev.snapshot,
                  players,
                },
              };
            });
          },
          onAnswersChange: (answers) => {
            setGameState((prev) => {
              if (!prev || prev.kind !== 'online') return prev;
              return {
                ...prev,
                snapshot: {
                  ...prev.snapshot,
                  answers,
                },
              };
            });
          },
          onError: (subError) => {
            console.error('Quiz realtime error:', subError);
          },
        });
      } catch (loadError) {
        console.error('Failed to load session', loadError);
        if (isMounted) {
          setError(tr('quiz.v2.load_error', 'Unable to load this quiz session.'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const loadHotseatSession = async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const session = await quizSessionService.loadOfflineSession(id);
        if (!session) {
          throw new Error('Hot-seat session not found');
        }

        if (!isMounted) return;
        setHotseatHandoffPlayerName(null);
        setGameState({
          kind: 'hotseat',
          session,
        });
      } catch (loadError) {
        console.error('Failed to load hot-seat session', loadError);
        if (isMounted) {
          setError(tr('quiz.v2.load_error', 'Unable to load this quiz session.'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (sessionId) {
      void loadOnlineSession(sessionId);
    } else if (mode === 'hotseat' && localSessionId) {
      void loadHotseatSession(localSessionId);
    } else {
      setIsLoading(false);
      setHotseatHandoffPlayerName(null);
      setError(tr('quiz.v2.missing_session', 'Missing session details.'));
    }

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        void unsubscribeRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, localSessionId, mode, currentLanguage]);

  useEffect(() => {
    if (!gameState || gameState.kind !== 'online') return;

    if (gameState.snapshot.session.state === 'finished') {
      router.replace({
        pathname: '/quiz/results',
        params: { sessionId: gameState.snapshot.session.id },
      });
    }
  }, [gameState, router]);

  const activePlayers = useMemo(() => {
    if (!gameState || gameState.kind !== 'online') return [];
    return gameState.snapshot.players.filter((player) => player.status !== 'left');
  }, [gameState]);

  const currentQuestionIndex = useMemo(() => {
    if (!gameState) return 0;
    if (gameState.kind === 'online') return gameState.snapshot.session.current_question_index;
    return gameState.session.currentQuestionIndex;
  }, [gameState]);

  const currentQuestion = useMemo(() => {
    if (!gameState) return null;

    if (gameState.kind === 'online') {
      return gameState.questions[currentQuestionIndex] || null;
    }

    return gameState.session.questions[currentQuestionIndex] || null;
  }, [gameState, currentQuestionIndex]);

  const totalQuestions = useMemo(() => {
    if (!gameState) return 0;
    if (gameState.kind === 'online') return gameState.questions.length;
    return gameState.session.questions.length;
  }, [gameState]);

  useEffect(() => {
    setEliminatedOptions([]);
    setRevealCorrectOption(false);
    setJokerUsedOnCurrentQuestion(false);
    setHelpUsedOnCurrentQuestion(false);
  }, [currentQuestion?.id]);

  const currentOnlinePlayer = useMemo(() => {
    if (!gameState || gameState.kind !== 'online') return null;
    return gameState.snapshot.players.find((player) => player.user_id === currentUser.id) || null;
  }, [gameState, currentUser.id]);

  const currentOnlineAnswer = useMemo(() => {
    if (!gameState || gameState.kind !== 'online' || !currentOnlinePlayer) return null;

    return (
      gameState.snapshot.answers.find(
        (answer) =>
          answer.player_id === currentOnlinePlayer.id &&
          answer.question_index === currentQuestionIndex
      ) || null
    );
  }, [gameState, currentOnlinePlayer, currentQuestionIndex]);

  const currentHotseatPlayer = useMemo(() => {
    if (!gameState || gameState.kind !== 'hotseat') return null;
    return (
      gameState.session.players.find(
        (player) => player.seatOrder === gameState.session.currentSeatOrder
      ) || null
    );
  }, [gameState]);

  const currentHotseatAnswer = useMemo(() => {
    if (!gameState || gameState.kind !== 'hotseat' || !currentHotseatPlayer) return null;

    return (
      gameState.session.answers.find(
        (answer) =>
          answer.playerId === currentHotseatPlayer.id &&
          answer.questionIndex === gameState.session.currentQuestionIndex
      ) || null
    );
  }, [gameState, currentHotseatPlayer]);

  const isHost = useMemo(() => {
    if (!gameState || gameState.kind !== 'online') return false;
    return gameState.snapshot.session.host_user_id === currentUser.id;
  }, [gameState, currentUser.id]);

  const responseSeconds = useMemo(() => {
    if (!gameState) return 30;
    if (gameState.kind === 'online') return gameState.snapshot.session.settings.response_time;
    return gameState.session.settings.response_time;
  }, [gameState]);

  const questionStartedAtIso = useMemo(() => {
    if (!gameState) return null;
    if (gameState.kind === 'online') return gameState.snapshot.session.question_started_at;
    return gameState.session.questionStartedAt;
  }, [gameState]);

  const timeLeft = useMemo(() => {
    if (gameState?.kind === 'hotseat' && hotseatHandoffPlayerName) {
      return responseSeconds;
    }

    if (!questionStartedAtIso) return responseSeconds;

    const elapsedMs = clockTick - new Date(questionStartedAtIso).getTime();
    const elapsedSec = Math.floor(Math.max(0, elapsedMs) / 1000);
    return Math.max(0, responseSeconds - elapsedSec);
  }, [clockTick, gameState, hotseatHandoffPlayerName, questionStartedAtIso, responseSeconds]);

  const answeredPlayersForCurrentQuestion = useMemo(() => {
    if (!gameState || gameState.kind !== 'online') return 0;

    const activePlayerIds = new Set(activePlayers.map((player) => player.id));
    const answers = gameState.snapshot.answers.filter(
      (answer) =>
        answer.question_index === currentQuestionIndex && activePlayerIds.has(answer.player_id)
    );

    return new Set(answers.map((answer) => answer.player_id)).size;
  }, [gameState, activePlayers, currentQuestionIndex]);

  const allPlayersAnswered = useMemo(() => {
    if (!gameState || gameState.kind !== 'online') return false;
    return activePlayers.length > 0 && answeredPlayersForCurrentQuestion >= activePlayers.length;
  }, [gameState, activePlayers, answeredPlayersForCurrentQuestion]);

  const canAnswer = useMemo(() => {
    if (!gameState || !currentQuestion) return false;

    if (gameState.kind === 'online') {
      return (
        gameState.snapshot.session.state === 'in_progress' &&
        Boolean(currentOnlinePlayer) &&
        !currentOnlineAnswer &&
        timeLeft > 0
      );
    }

    return (
      gameState.session.state === 'in_progress' &&
      !currentHotseatAnswer &&
      !hotseatHandoffPlayerName &&
      timeLeft > 0
    );
  }, [
    gameState,
    currentQuestion,
    currentOnlinePlayer,
    currentOnlineAnswer,
    currentHotseatAnswer,
    hotseatHandoffPlayerName,
    timeLeft,
  ]);

  const isSoloOnline = useMemo(() => {
    return gameState?.kind === 'online' && gameState.snapshot.session.mode === 'solo';
  }, [gameState]);

  const jokersLeft = useMemo(() => {
    if (!isSoloOnline || !currentOnlinePlayer) return 0;
    return Math.max(0, Number(currentOnlinePlayer.jokers_left || 0));
  }, [isSoloOnline, currentOnlinePlayer]);

  const helpsLeft = useMemo(() => {
    if (!isSoloOnline || !currentOnlinePlayer) return 0;
    return Math.max(0, Number(currentOnlinePlayer.helps_left || 0));
  }, [isSoloOnline, currentOnlinePlayer]);

  const canUseLifelines = useMemo(() => {
    return (
      isSoloOnline &&
      Boolean(currentOnlinePlayer) &&
      Boolean(sessionId) &&
      canAnswer &&
      !isSubmitting &&
      !isUsingLifeline
    );
  }, [isSoloOnline, currentOnlinePlayer, sessionId, canAnswer, isSubmitting, isUsingLifeline]);

  const scoreBoard = useMemo(() => {
    if (!gameState) return [];

    if (gameState.kind === 'online') {
      return [...gameState.snapshot.players]
        .filter((player) => player.status !== 'left')
        .sort((a, b) => b.score - a.score || a.seat_order - b.seat_order)
        .map((player) => ({
          id: player.id,
          name: player.display_name,
          score: player.score,
          isCurrent: player.user_id === currentUser.id,
        }));
    }

    return [...gameState.session.players]
      .sort((a, b) => b.score - a.score || a.seatOrder - b.seatOrder)
      .map((player) => ({
        id: player.id,
        name: player.displayName,
        score: player.score,
        isCurrent: gameState.session.currentSeatOrder === player.seatOrder,
      }));
  }, [gameState, currentUser.id]);

  const getAnswerStatus = (option: string) => {
    if (!currentQuestion) {
      return {
        selected: false,
        correct: false,
      };
    }

    if (gameState?.kind === 'online') {
      const selectedAnswer = currentOnlineAnswer?.selected_answer;
      return {
        selected: selectedAnswer === option,
        correct: currentQuestion.correctAnswer === option,
      };
    }

    const selectedAnswer = currentHotseatAnswer?.selectedAnswer;
    return {
      selected: selectedAnswer === option,
      correct: currentQuestion.correctAnswer === option,
    };
  };

  const persistHotseatSession = async (nextSession: OfflineHotseatSession) => {
    await quizSessionService.saveOfflineSession(nextSession);
    setGameState({ kind: 'hotseat', session: nextSession });
  };

  const applyLocalOnlineAnswer = (input: {
    sessionId: string;
    playerId: string;
    questionIndex: number;
    questionId: string;
    selectedAnswer: string;
    responseMs: number;
    isCorrect: boolean;
    score: number;
  }) => {
    setGameState((prev) => {
      if (!prev || prev.kind !== 'online') return prev;
      if (prev.snapshot.session.id !== input.sessionId) return prev;

      const hasAnswer = prev.snapshot.answers.some(
        (answer) =>
          answer.player_id === input.playerId && answer.question_index === input.questionIndex
      );

      const nextAnswers = hasAnswer
        ? prev.snapshot.answers
        : [
            ...prev.snapshot.answers,
            {
              id: `local-${input.sessionId}-${input.playerId}-${input.questionIndex}`,
              session_id: input.sessionId,
              player_id: input.playerId,
              question_id: input.questionId,
              question_index: input.questionIndex,
              selected_answer: input.selectedAnswer,
              is_correct: input.isCorrect,
              response_ms: input.responseMs,
              answered_at: new Date().toISOString(),
            },
          ];

      const nextPlayers = prev.snapshot.players.map((player) =>
        player.id === input.playerId ? { ...player, score: input.score } : player
      );

      return {
        ...prev,
        snapshot: {
          ...prev.snapshot,
          players: nextPlayers,
          answers: nextAnswers,
        },
      };
    });
  };

  const applyLocalOnlineLifelines = (input: {
    sessionId: string;
    playerId: string;
    jokersLeft: number;
    helpsLeft: number;
  }) => {
    setGameState((prev) => {
      if (!prev || prev.kind !== 'online') return prev;
      if (prev.snapshot.session.id !== input.sessionId) return prev;

      return {
        ...prev,
        snapshot: {
          ...prev.snapshot,
          players: prev.snapshot.players.map((player) =>
            player.id === input.playerId
              ? {
                  ...player,
                  jokers_left: input.jokersLeft,
                  helps_left: input.helpsLeft,
                }
              : player
          ),
        },
      };
    });
  };

  const consumeSoloLifeline = async (type: 'joker' | 'help'): Promise<boolean> => {
    if (!canUseLifelines || !sessionId || !currentOnlinePlayer) return false;

    try {
      setIsUsingLifeline(true);
      const result = await quizSessionService.consumeLifeline({
        sessionId,
        playerId: currentOnlinePlayer.id,
        type,
      });

      applyLocalOnlineLifelines({
        sessionId,
        playerId: result.playerId,
        jokersLeft: result.jokersLeft,
        helpsLeft: result.helpsLeft,
      });

      return true;
    } catch (lifelineError: any) {
      console.error('Failed to consume lifeline', lifelineError);
      Alert.alert('Error', lifelineError?.message || 'Unable to use this helper.');
      return false;
    } finally {
      setIsUsingLifeline(false);
    }
  };

  const handleUseJoker = async () => {
    if (!currentQuestion || jokerUsedOnCurrentQuestion || jokersLeft <= 0) return;

    const wrongOptions = currentQuestion.options.filter(
      (option) => option !== currentQuestion.correctAnswer && !eliminatedOptions.includes(option)
    );
    const removableCount = Math.max(0, Math.min(2, wrongOptions.length - 1));
    if (removableCount <= 0) return;

    const consumed = await consumeSoloLifeline('joker');
    if (!consumed) return;

    const shuffledWrong = [...wrongOptions].sort(() => Math.random() - 0.5);
    const removed = shuffledWrong.slice(0, removableCount);

    setEliminatedOptions((prev) => [...new Set([...prev, ...removed])]);
    setJokerUsedOnCurrentQuestion(true);
  };

  const handleUseHelp = async () => {
    if (helpUsedOnCurrentQuestion || helpsLeft <= 0) return;

    const consumed = await consumeSoloLifeline('help');
    if (!consumed) return;

    setRevealCorrectOption(true);
    setHelpUsedOnCurrentQuestion(true);
  };

  const finishHotseatSession = async (finalSession: OfflineHotseatSession) => {
    setHotseatHandoffPlayerName(null);
    const sessionDurationSec = Math.max(
      1,
      Math.floor(
        (new Date(finalSession.finishedAt || new Date().toISOString()).getTime() -
          new Date(finalSession.startedAt).getTime()) /
          1000
      )
    );

    const scoreOwner =
      finalSession.players.find(
        (player) => player.displayName.toLowerCase() === (currentUser.name || '').toLowerCase()
      ) || finalSession.players[0];

    const totalQuestionsCount = finalSession.questions.length;
    const accuracy = totalQuestionsCount > 0 ? (scoreOwner.score * 100) / totalQuestionsCount : 0;

    if (currentUser.id) {
      await quizSessionService.enqueueOfflineAttempt({
        localSessionId: finalSession.id,
        mode: 'hotseat',
        categoryId: finalSession.categoryId,
        score: scoreOwner.score,
        totalQuestions: totalQuestionsCount,
        accuracy: Number(accuracy.toFixed(2)),
        durationSec: sessionDurationSec,
        completedAt: finalSession.finishedAt || new Date().toISOString(),
        source: 'offline_sync',
      });

      void quizSessionService.syncOfflineQueue();
    }

    const summary = {
      mode: 'hotseat',
      totalQuestions: totalQuestionsCount,
      players: finalSession.players.map((player) => ({
        id: player.id,
        displayName: player.displayName,
        score: player.score,
      })),
      winner:
        [...finalSession.players].sort((a, b) => b.score - a.score || a.seatOrder - b.seatOrder)[0]
          ?.displayName || '',
    };

    await quizSessionService.removeOfflineSession(finalSession.id);

    router.replace({
      pathname: '/quiz/results',
      params: {
        mode: 'hotseat',
        summary: encodeURIComponent(JSON.stringify(summary)),
      },
    });
  };

  const advanceHotseatTurn = async (session: OfflineHotseatSession) => {
    const totalPlayers = session.players.length;
    const total = session.questions.length;

    let nextQuestionIndex = session.currentQuestionIndex;
    let nextSeatOrder = session.currentSeatOrder;

    if (session.currentSeatOrder < totalPlayers) {
      nextSeatOrder += 1;
    } else {
      nextSeatOrder = 1;
      nextQuestionIndex += 1;
    }

    if (nextQuestionIndex >= total) {
      const finishedSession: OfflineHotseatSession = {
        ...session,
        state: 'finished',
        finishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await persistHotseatSession(finishedSession);
      await finishHotseatSession(finishedSession);
      return;
    }

    const nextSession: OfflineHotseatSession = {
      ...session,
      currentQuestionIndex: nextQuestionIndex,
      currentSeatOrder: nextSeatOrder,
      questionStartedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await persistHotseatSession(nextSession);
    hotseatTimeoutLockRef.current = null;
    const nextPlayer =
      nextSession.players.find((player) => player.seatOrder === nextSession.currentSeatOrder) ||
      null;
    setHotseatHandoffPlayerName(nextPlayer?.displayName || null);
  };

  const handleContinueHotseatTurn = async () => {
    if (!gameState || gameState.kind !== 'hotseat' || !hotseatHandoffPlayerName || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      const resumedSession: OfflineHotseatSession = {
        ...gameState.session,
        questionStartedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await persistHotseatSession(resumedSession);
      hotseatTimeoutLockRef.current = null;
      setHotseatHandoffPlayerName(null);
    } catch (handoffError) {
      console.error('Failed to continue hot-seat turn', handoffError);
      Alert.alert('Error', 'Could not continue to the next turn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitHotseatAnswer = async (selectedAnswer: string) => {
    if (
      !gameState ||
      gameState.kind !== 'hotseat' ||
      !currentQuestion ||
      !currentHotseatPlayer ||
      isSubmitting
    )
      return;

    try {
      setIsSubmitting(true);

      const responseMs = Math.max(
        0,
        Date.now() - new Date(gameState.session.questionStartedAt).getTime()
      );
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

      const answer: OfflineHotseatAnswer = {
        playerId: currentHotseatPlayer.id,
        questionIndex: gameState.session.currentQuestionIndex,
        questionId: currentQuestion.id,
        selectedAnswer,
        isCorrect,
        responseMs,
        answeredAt: new Date().toISOString(),
      };

      const nextPlayers: OfflineHotseatPlayer[] = gameState.session.players.map((player) => {
        if (player.id !== currentHotseatPlayer.id) return player;
        return {
          ...player,
          score: isCorrect ? player.score + 1 : player.score,
        };
      });

      const nextSession: OfflineHotseatSession = {
        ...gameState.session,
        players: nextPlayers,
        answers: [...gameState.session.answers, answer],
        updatedAt: new Date().toISOString(),
      };

      await persistHotseatSession(nextSession);

      // Show answer feedback for 1.5 seconds before advancing
      setHotseatFeedbackPending(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setHotseatFeedbackPending(false);

      await advanceHotseatTurn(nextSession);
    } catch (submitError) {
      console.error('Failed to submit hot-seat answer', submitError);
      Alert.alert('Error', 'Could not save this hot-seat answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOnlineAnswer = async (selectedAnswer: string) => {
    if (
      !gameState ||
      gameState.kind !== 'online' ||
      !sessionId ||
      !currentQuestion ||
      !currentOnlinePlayer ||
      currentOnlineAnswer ||
      isSubmitting
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const questionIndex = gameState.snapshot.session.current_question_index;
      const questionId = currentQuestion.id;
      const responseMs = Math.max(
        0,
        Date.now() -
          new Date(
            gameState.snapshot.session.question_started_at || new Date().toISOString()
          ).getTime()
      );

      const result = await quizSessionService.submitAnswer(
        sessionId,
        questionIndex,
        selectedAnswer,
        responseMs
      );

      if (result.already_answered) {
        try {
          const snapshot = await quizSessionService.getSessionSnapshot(sessionId);
          setGameState((prev) => {
            if (!prev || prev.kind !== 'online') return prev;
            return {
              ...prev,
              snapshot,
            };
          });
        } catch (refreshError) {
          console.error('Failed to refresh snapshot after already_answered', refreshError);
        }
      } else {
        applyLocalOnlineAnswer({
          sessionId,
          playerId: result.player_id,
          questionIndex,
          questionId,
          selectedAnswer,
          responseMs,
          isCorrect: result.is_correct,
          score: result.score,
        });
      }
    } catch (submitError: any) {
      console.error('Failed to submit answer', submitError);
      Alert.alert('Error', submitError?.message || 'Unable to submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = async (option: string) => {
    if (!canAnswer || isSubmitting) return;

    if (gameState?.kind === 'online') {
      await submitOnlineAnswer(option);
    } else if (gameState?.kind === 'hotseat') {
      await submitHotseatAnswer(option);
    }
  };

  const handleAdvanceOnline = async () => {
    if (!gameState || gameState.kind !== 'online' || !sessionId || !isHost || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const nextSession = await quizSessionService.advanceQuestion(sessionId);
      setGameState((prev) => {
        if (!prev || prev.kind !== 'online') return prev;
        return {
          ...prev,
          snapshot: {
            ...prev.snapshot,
            session: nextSession,
          },
        };
      });
    } catch (advanceError: any) {
      console.error('Failed to advance question', advanceError);
      hostAdvanceLockRef.current = null;
      Alert.alert('Error', advanceError?.message || 'Unable to advance question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!gameState || gameState.kind !== 'online' || !sessionId || !isHost) return;
    if (gameState.snapshot.session.state !== 'in_progress') return;

    const autoAdvanceKey = `${sessionId}:${gameState.snapshot.session.current_question_index}`;
    const shouldAutoAdvance =
      timeLeft <= 0 || (allPlayersAnswered && gameState.snapshot.session.mode !== 'solo');

    if (shouldAutoAdvance && hostAdvanceLockRef.current !== autoAdvanceKey) {
      hostAdvanceLockRef.current = autoAdvanceKey;
      void handleAdvanceOnline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, sessionId, isHost, allPlayersAnswered, timeLeft]);

  useEffect(() => {
    if (
      !gameState ||
      gameState.kind !== 'hotseat' ||
      hotseatHandoffPlayerName ||
      !currentHotseatPlayer ||
      currentHotseatAnswer ||
      timeLeft > 0
    )
      return;

    const timeoutKey = `${gameState.session.id}:${gameState.session.currentQuestionIndex}:${currentHotseatPlayer.seatOrder}`;
    if (hotseatTimeoutLockRef.current === timeoutKey) return;

    hotseatTimeoutLockRef.current = timeoutKey;
    void submitHotseatAnswer('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, currentHotseatPlayer, currentHotseatAnswer, hotseatHandoffPlayerName, timeLeft]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.palette.purple.primary} />
      </View>
    );
  }

  if (error || !gameState || !currentQuestion) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.background, paddingHorizontal: 20 }]}
      >
        <Text style={[styles.errorTitle, { color: colors.text.primary, fontFamily: fontBold }]}>
          {tr('errors.somethingWentWrong', 'Something went wrong')}
        </Text>
        <Text style={[styles.errorBody, { color: colors.text.secondary, fontFamily: fontRegular }]}>
          {error || tr('quiz.v2.load_error', 'Unable to load this quiz session.')}
        </Text>
        <Pressable
          style={[styles.errorButton, { backgroundColor: Colors.palette.purple.primary }]}
          onPress={() => router.replace('/(tabs)/quizz')}
        >
          <Text style={[styles.errorButtonText, { fontFamily: fontMedium }]}>
            {tr('quiz.results.back_to_menu', 'Back to quiz menu')}
          </Text>
        </Pressable>
      </View>
    );
  }

  const showCorrectHighlights =
    gameState.kind === 'online'
      ? Boolean(currentOnlineAnswer || timeLeft <= 0 || revealCorrectOption)
      : Boolean(currentHotseatAnswer || timeLeft <= 0 || hotseatFeedbackPending);

  const modeLabel =
    gameState.kind === 'online'
      ? gameState.snapshot.session.mode === 'solo'
        ? tr('quiz.v2.solo_title', 'Solo Online')
        : gameState.snapshot.session.mode === 'duo'
          ? tr('quiz.v2.duo_title', 'Duo Online')
          : tr('quiz.v2.group_title', 'Group Online')
      : tr('quiz.v2.hotseat_title', 'Offline Hot-seat');

  const turnLabel =
    gameState.kind === 'hotseat' && currentHotseatPlayer
      ? `${tr('quiz.v2.turn', 'Turn')}: ${currentHotseatPlayer.displayName}`
      : null;

  const manualAdvanceEnabled =
    gameState.kind === 'online' &&
    isHost &&
    gameState.snapshot.session.state === 'in_progress' &&
    (allPlayersAnswered || timeLeft <= 0);

  const jokerSubtitle = jokerUsedOnCurrentQuestion
    ? tr('quiz.v2.used_this_question', 'Used this question')
    : `${jokersLeft} ${tr('quiz.v2.left', 'left')}`;

  const helpSubtitle = helpUsedOnCurrentQuestion
    ? tr('quiz.v2.used_this_question', 'Used this question')
    : `${helpsLeft} ${tr('quiz.v2.left', 'left')}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.replace('/(tabs)/quizz')} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={[styles.modeLabel, { color: colors.text.secondary, fontFamily: fontRegular }]}
          >
            {modeLabel}
          </Text>
          <Text
            style={[styles.questionCounter, { color: colors.text.primary, fontFamily: fontBold }]}
          >
            {tr('quiz.game.question_label', 'Question')} {currentQuestionIndex + 1}/{totalQuestions}
          </Text>
          {turnLabel ? (
            <Text
              style={[
                styles.turnLabel,
                { color: Colors.palette.purple.primary, fontFamily: fontMedium },
              ]}
            >
              {turnLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.closeButton} />
      </View>

      <View style={styles.scoreBoardContainer}>
        {scoreBoard.slice(0, 4).map((item) => (
          <View
            key={item.id}
            style={[
              styles.scorePill,
              {
                backgroundColor: item.isCurrent ? 'rgba(103,15,164,0.15)' : colors.surface,
                borderColor: item.isCurrent ? Colors.palette.purple.primary : colors.border,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: fontMedium,
                color: item.isCurrent ? Colors.palette.purple.primary : colors.text.secondary,
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontFamily: fontBold,
                color: item.isCurrent ? Colors.palette.purple.primary : colors.text.primary,
              }}
            >
              {item.score}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.questionSection}>
        <Text
          style={[styles.questionText, { fontFamily: fontRegular, color: colors.text.primary }]}
        >
          {currentQuestion.question}
        </Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const status = getAnswerStatus(option);
            const isEliminated = eliminatedOptions.includes(option) && !status.correct;

            let borderColor = colors.border;
            let backgroundColor = colors.surface;

            const correctBg = isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7';
            const incorrectBg = isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2';

            if (status.selected) {
              if (status.correct) {
                borderColor = '#10B981';
                backgroundColor = correctBg;
              } else {
                borderColor = '#EF4444';
                backgroundColor = incorrectBg;
              }
            } else if (showCorrectHighlights && status.correct) {
              borderColor = '#10B981';
              backgroundColor = correctBg;
            } else if (isEliminated) {
              borderColor = colors.border;
              backgroundColor = colors.surfaceHighlight || '#F3F4F6';
            }

            return (
              <Pressable
                key={`${currentQuestion.id}-option-${index}`}
                style={[
                  styles.option,
                  {
                    borderColor,
                    backgroundColor,
                    opacity: isEliminated ? 0.45 : canAnswer ? 1 : 0.96,
                  },
                ]}
                onPress={() => void handleSelectOption(option)}
                disabled={!canAnswer || isSubmitting || isEliminated}
              >
                <View
                  style={[
                    styles.optionLetter,
                    { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetterText,
                      { color: colors.text.secondary, fontFamily: fontMedium },
                    ]}
                  >
                    {letter}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: colors.text.primary,
                      fontFamily: fontRegular,
                      textDecorationLine: isEliminated ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {option || '(No answer)'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isSoloOnline ? (
        <View style={styles.helpersRow}>
          <Pressable
            style={[
              styles.helperCard,
              {
                backgroundColor: colors.surface,
                borderColor:
                  canUseLifelines && jokersLeft > 0 && !jokerUsedOnCurrentQuestion
                    ? Colors.palette.purple.primary
                    : colors.border,
                opacity: canUseLifelines && jokersLeft > 0 && !jokerUsedOnCurrentQuestion ? 1 : 0.6,
              },
            ]}
            onPress={() => void handleUseJoker()}
            disabled={!canUseLifelines || jokersLeft <= 0 || jokerUsedOnCurrentQuestion}
          >
            <View
              style={[styles.helperIcon, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}
            >
              <Ionicons name="happy-outline" size={18} color={Colors.palette.purple.primary} />
            </View>
            <View style={styles.helperTextWrap}>
              <Text
                style={[styles.helperTitle, { color: colors.text.primary, fontFamily: fontMedium }]}
              >
                {tr('quiz.settings.jokers_count', 'Jokers')}
              </Text>
              <Text
                style={[
                  styles.helperSubtitle,
                  { color: colors.text.secondary, fontFamily: fontRegular },
                ]}
              >
                {jokerSubtitle}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.helperCard,
              {
                backgroundColor: colors.surface,
                borderColor:
                  canUseLifelines && helpsLeft > 0 && !helpUsedOnCurrentQuestion
                    ? Colors.palette.purple.primary
                    : colors.border,
                opacity: canUseLifelines && helpsLeft > 0 && !helpUsedOnCurrentQuestion ? 1 : 0.6,
              },
            ]}
            onPress={() => void handleUseHelp()}
            disabled={!canUseLifelines || helpsLeft <= 0 || helpUsedOnCurrentQuestion}
          >
            <View
              style={[styles.helperIcon, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}
            >
              <Ionicons name="bulb-outline" size={18} color={Colors.palette.purple.primary} />
            </View>
            <View style={styles.helperTextWrap}>
              <Text
                style={[styles.helperTitle, { color: colors.text.primary, fontFamily: fontMedium }]}
              >
                {tr('quiz.settings.helps_count', 'Helps')}
              </Text>
              <Text
                style={[
                  styles.helperSubtitle,
                  { color: colors.text.secondary, fontFamily: fontRegular },
                ]}
              >
                {helpSubtitle}
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.footerItem}>
          <Text
            style={[styles.footerLabel, { color: colors.text.secondary, fontFamily: fontRegular }]}
          >
            {tr('quiz.game.time', 'Time')}
          </Text>
          <Text
            style={[
              styles.footerValue,
              { color: Colors.palette.purple.primary, fontFamily: fontBold },
            ]}
          >
            {timeLeft}s
          </Text>
        </View>

        {gameState.kind === 'online' ? (
          <View style={styles.footerItem}>
            <Text
              style={[
                styles.footerLabel,
                { color: colors.text.secondary, fontFamily: fontRegular },
              ]}
            >
              {tr('quiz.game.answered', 'Answered')}
            </Text>
            <Text
              style={[styles.footerValue, { color: colors.text.primary, fontFamily: fontBold }]}
            >
              {answeredPlayersForCurrentQuestion}/{activePlayers.length}
            </Text>
          </View>
        ) : (
          <View style={styles.footerItem}>
            <Text
              style={[
                styles.footerLabel,
                { color: colors.text.secondary, fontFamily: fontRegular },
              ]}
            >
              {tr('quiz.game.seat', 'Seat')}
            </Text>
            <Text
              style={[styles.footerValue, { color: colors.text.primary, fontFamily: fontBold }]}
            >
              {gameState.session.currentSeatOrder}/{gameState.session.players.length}
            </Text>
          </View>
        )}

        {gameState.kind === 'online' ? (
          <Pressable
            style={[
              styles.nextButton,
              {
                backgroundColor: manualAdvanceEnabled
                  ? Colors.palette.purple.primary
                  : colors.text.disabled,
                opacity: isSubmitting ? 0.75 : 1,
              },
            ]}
            onPress={() => void handleAdvanceOnline()}
            disabled={!manualAdvanceEnabled || isSubmitting}
          >
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </Pressable>
        ) : (
          <View
            style={[styles.waitingPill, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}
          >
            <Text style={{ color: colors.text.secondary, fontFamily: fontRegular, fontSize: 12 }}>
              {tr('quiz.v2.auto_next', 'Auto next turn')}
            </Text>
          </View>
        )}
      </View>

      {gameState.kind === 'hotseat' && hotseatHandoffPlayerName ? (
        <View
          style={[
            styles.handoffOverlay,
            { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.9)' : 'rgba(15, 23, 42, 0.82)' },
          ]}
        >
          <View
            style={[
              styles.handoffCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.handoffTitle, { color: colors.text.primary, fontFamily: fontBold }]}
            >
              {tr('quiz.v2.player_switch', 'Player switch')}
            </Text>
            <View style={[styles.handoffDivider, { backgroundColor: colors.border }]} />
            <Text
              style={[
                styles.handoffMessage,
                { color: colors.text.secondary, fontFamily: fontRegular },
              ]}
            >
              {`${tr('quiz.v2.pass_phone_to', 'Pass the phone to')} ${hotseatHandoffPlayerName}`}
            </Text>
            <Pressable
              style={[
                styles.handoffButton,
                {
                  backgroundColor: Colors.palette.purple.primary,
                  opacity: isSubmitting ? 0.75 : 1,
                },
              ]}
              onPress={() => void handleContinueHotseatTurn()}
              disabled={isSubmitting}
            >
              <Text style={[styles.handoffButtonText, { fontFamily: fontMedium }]}>
                {tr('quiz.v2.handoff_continue', 'Continue')}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  errorButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  questionCounter: {
    fontSize: 17,
  },
  turnLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreBoardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  scorePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 6,
  },
  questionSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionLetterText: {
    fontSize: 13,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  helpersRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  helperCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperTextWrap: {
    flex: 1,
  },
  helperTitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  helperSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  footer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: 11,
  },
  footerValue: {
    fontSize: 17,
  },
  nextButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  handoffOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  handoffCard: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
  },
  handoffTitle: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  handoffDivider: {
    width: '100%',
    height: 1,
    marginVertical: 16,
  },
  handoffMessage: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 18,
  },
  handoffButton: {
    minWidth: 170,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  handoffButtonText: {
    color: '#fff',
    fontSize: 15,
  },
});
