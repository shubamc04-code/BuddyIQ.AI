import maleVideo from "../assets/videos/male-ai.mp4";
import femaleVideo from "../assets/videos/female-ai.mp4";

import Timer from "./Timer";

import { motion } from "motion/react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import { BsArrowRight } from "react-icons/bs";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";
import { ServerUrl } from "../App";

function Step2Interview({ interviewData, onFinish }) {
  const {
    interviewId,
    questions = [],
    userName,
  } = interviewData || {};

  // =====================================================
  // STATES
  // =====================================================

  const [isIntroPhase, setIsIntroPhase] = useState(true);

  const [isMicOn, setIsMicOn] = useState(true);

  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [answer, setAnswer] = useState("");

  const [feedback, setFeedback] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedVoice, setSelectedVoice] = useState(null);

  const [voiceGender, setVoiceGender] = useState("female");

  const [subtitle, setSubtitle] = useState("");

  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  );

  // =====================================================
  // REFS
  // =====================================================

  const videoRef = useRef(null);

  const recognitionRef = useRef(null);

  const isMicOnRef = useRef(isMicOn);

  const isAIPlayingRef = useRef(isAIPlaying);

  const isSubmittingRef = useRef(isSubmitting);

  const answerRef = useRef(answer);

  const currentIndexRef = useRef(currentIndex);

  const speechIdRef = useRef(0);

  // =====================================================
  // KEEP REFS UPDATED
  // =====================================================

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    isAIPlayingRef.current = isAIPlaying;
  }, [isAIPlaying]);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // =====================================================
  // CURRENT QUESTION
  // =====================================================

  const currentQuestion = questions[currentIndex];

  // =====================================================
  // VIDEO SOURCE
  // =====================================================

  const videoSource =
    voiceGender === "male"
      ? maleVideo
      : femaleVideo;

  // =====================================================
  // LOAD SPEECH VOICES
  // =====================================================

  useEffect(() => {
    if (!window.speechSynthesis) return;

    const loadVoices = () => {
      const voices =
        window.speechSynthesis.getVoices();

      if (!voices.length) return;

      // -----------------------------
      // Female voice
      // -----------------------------

      const femaleVoice = voices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("zira") ||
          name.includes("samantha") ||
          name.includes("female") ||
          name.includes("aria") ||
          name.includes("jenny")
        );
      });

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      // -----------------------------
      // Male voice
      // -----------------------------

      const maleVoice = voices.find((voice) => {
        const name = voice.name.toLowerCase();

        return (
          name.includes("david") ||
          name.includes("mark") ||
          name.includes("male") ||
          name.includes("guy")
        );
      });

      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      // -----------------------------
      // Fallback
      // -----------------------------

      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged =
      loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged =
        null;
    };
  }, []);

  // =====================================================
  // STOP MICROPHONE
  // =====================================================

  const stopMic = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) return;
   try {
       recognition.stop();
   } catch (error) {
      console.log(error)
   }
  }, []);

  // =====================================================
  // START MICROPHONE
  // =====================================================

  const startMic = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) return;

    if (!isMicOnRef.current) return;

    if (isAIPlayingRef.current) return;

    if (isSubmittingRef.current) return;

    try {
      recognition.start();
    } catch (error) {
      console.log(error)
    }
  }, []);

  // =====================================================
  // SPEECH SYNTHESIS
  // =====================================================

  const speakText = useCallback(
    (text) => {
      return new Promise((resolve) => {
        if (
          !text ||
          !window.speechSynthesis ||
          !selectedVoice
        ) {
          resolve();
          return;
        }

        const currentSpeechId =
          ++speechIdRef.current;

        // Stop previous speech
        window.speechSynthesis.cancel();

        // Stop user microphone
        stopMic();

        // Natural pauses
        const humanText = text
          .replace(/,/g, ", ...")
          .replace(/\./g, ". ...");

        const utterance =
          new SpeechSynthesisUtterance(humanText);

        utterance.voice = selectedVoice;

        // Speech settings
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        // ----------------------------------
        // SPEECH START
        // ----------------------------------

        utterance.onstart = () => {
          if (
            currentSpeechId !==
            speechIdRef.current
          ) {
            return;
          }

          setIsAIPlaying(true);

          isAIPlayingRef.current = true;

          setSubtitle(text);

          const video = videoRef.current;

          if (video) {
            video.currentTime = 0;

            video
              .play()
              .catch((error) => {
                console.log(
                  "Video play error:",
                  error
                );
              });
          }
        };

        // ----------------------------------
        // SPEECH END
        // ----------------------------------

        utterance.onend = () => {
          if (
            currentSpeechId !==
            speechIdRef.current
          ) {
            resolve();
            return;
          }

          setIsAIPlaying(false);

          isAIPlayingRef.current = false;

          const video = videoRef.current;

          if (video) {
            video.pause();
            video.currentTime = 0;
          }

          setSubtitle("");

          // Start microphone after AI finishes
          setTimeout(() => {
            if (
              isMicOnRef.current &&
              !isSubmittingRef.current
            ) {
              startMic();
            }

            resolve();
          }, 300);
        };

        // ----------------------------------
        // SPEECH ERROR
        // ----------------------------------

        utterance.onerror = (error) => {
          console.log(
            "Speech synthesis error:",
            error
          );

          setIsAIPlaying(false);

          isAIPlayingRef.current = false;

          const video = videoRef.current;

          if (video) {
            video.pause();
            video.currentTime = 0;
          }

          setSubtitle("");

          resolve();
        };

        // ----------------------------------
        // SHOW SUBTITLE
        // ----------------------------------

        setSubtitle(text);

        // ----------------------------------
        // SPEAK
        // ----------------------------------

        window.speechSynthesis.speak(
          utterance
        );
      });
    },
    [selectedVoice, startMic, stopMic]
  );

  // =====================================================
  // SPEECH RECOGNITION SETUP
  // =====================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn(
        "Speech Recognition is not supported in this browser."
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = true;

    recognition.interimResults = false;

    // ----------------------------------
    // RESULT
    // ----------------------------------

    recognition.onresult = (event) => {
      let finalTranscript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        if (
          event.results[i].isFinal
        ) {
          finalTranscript +=
            event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        setAnswer((prev) =>
          `${prev} ${finalTranscript}`.trim()
        );
      }
    };

    // ----------------------------------
    // END
    // ----------------------------------

    recognition.onend = () => {
      // Chrome sometimes automatically
      // stops recognition.
      //
      // Restart only when:
      // Mic ON
      // AI not speaking
      // Not submitting

      if (
        isMicOnRef.current &&
        !isAIPlayingRef.current &&
        !isSubmittingRef.current &&
        !isIntroPhase
      ) {
        setTimeout(() => {
          startMic();
        }, 200);
      }
    };

    // ----------------------------------
    // ERROR
    // ----------------------------------

    recognition.onerror = (event) => {
      console.log(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setIsMicOn(false);
      }
    };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
        recognition.abort();
      } catch (error) {
        console.log(error)
      }

      recognitionRef.current = null;
    };
  }, [isIntroPhase, startMic]);

  // =====================================================
  // INTRO + QUESTION SPEECH
  // =====================================================

  useEffect(() => {
    if (!selectedVoice) return;

    if (!questions.length) return;

    let cancelled = false;

    const runInterview = async () => {
      // ----------------------------------
      // INTRO
      // ----------------------------------

      if (isIntroPhase) {
        stopMic();

        await speakText(
          `Hi ${userName || "there"}, it's great to meet you today. I hope you're feeling confident and ready.`
        );

        if (cancelled) return;

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        );

        if (cancelled) return;

        setIsIntroPhase(false);

        return;
      }

      // ----------------------------------
      // QUESTION
      // ----------------------------------

      if (currentQuestion) {
        stopMic();

        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        if (cancelled) return;

        // Last question special message
        if (
          currentIndex ===
          questions.length - 1
        ) {
          await speakText(
            "Alright, this one might be a bit more challenging."
          );

          if (cancelled) return;
        }

        await speakText(
          currentQuestion.question
        );

        if (cancelled) return;

        // Timer starts automatically
        // after question is spoken.
        if (isMicOnRef.current) {
          startMic();
        }
      }
    };

    runInterview();

    return () => {
      cancelled = true;

      // Stop current speech
      speechIdRef.current++;

      window.speechSynthesis.cancel();

      stopMic();

      const video = videoRef.current;

      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [
    selectedVoice,
    isIntroPhase,
    currentIndex,
    currentQuestion,
    userName,
    questions.length,
    speakText,
    startMic,
    stopMic,
  ]);

  // =====================================================
  // RESET TIMER WHEN QUESTION CHANGES
  // =====================================================

  useEffect(() => {
    if (
      isIntroPhase ||
      !currentQuestion
    ) {
      return;
    }

    setTimeLeft(currentQuestion.timeLimit || 60);
  }, [
    currentIndex,
    isIntroPhase,
    currentQuestion,
  ]);

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {
    if (
      isIntroPhase ||
      !currentQuestion ||
      feedback
    ) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [
    currentIndex,
    isIntroPhase,
    currentQuestion,
    feedback,
  ]);

  // =====================================================
  // TOGGLE MICROPHONE
  // =====================================================

  const toggleMic = () => {
    if (isMicOnRef.current) {
      // Turn OFF
      stopMic();

      setIsMicOn(false);

      isMicOnRef.current = false;
    } else {
      // Turn ON
      setIsMicOn(true);

      isMicOnRef.current = true;

      if (!isAIPlayingRef.current) {
        startMic();
      }
    }
  };

  // =====================================================
  // SUBMIT ANSWER
  // =====================================================

  const submitAnswer = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    if (!currentQuestion) {
      return;
    }

    const finalAnswer =
      answerRef.current.trim();

    if (!finalAnswer) {
      alert(
        "Please provide an answer before submitting."
      );

      return;
    }

    stopMic();

    setIsMicOn(false);

    isMicOnRef.current = false;

    setIsSubmitting(true);

    isSubmittingRef.current = true;

    try {
      const result = await axios.post(
        ServerUrl +
          "/api/interview/submit-answer",
        {
          interviewId,

          questionIndex:
            currentIndex,

          answer: finalAnswer,

          timeTaken:
            (currentQuestion.timeLimit ||
              60) - timeLeft,
        },
        {
          withCredentials: true,
        }
      );

      const feedbackText =
        result.data?.feedback ||
        "Good answer. Let's continue.";

      setFeedback(feedbackText);

      // AI reads feedback
      await speakText(feedbackText);

      setIsSubmitting(false);

      isSubmittingRef.current = false;
    } catch (error) {
      console.log(
        "Submit answer error:",
        error
      );

      setIsSubmitting(false);

      isSubmittingRef.current = false;
    }
  };

  // =====================================================
  // AUTO SUBMIT WHEN TIMER REACHES ZERO
  // =====================================================

  useEffect(() => {
    if (
      isIntroPhase ||
      !currentQuestion
    ) {
      return;
    }

    if (
      timeLeft === 0 &&
      !isSubmittingRef.current &&
      !feedback
    ) {
      submitAnswer();
    }
  }, [
    timeLeft,
    isIntroPhase,
    currentQuestion,
    feedback,
  ]);

  // =====================================================
  // NEXT QUESTION
  // =====================================================

  const handleNext = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    // Clear current data
    setAnswer("");

    answerRef.current = "";

    setFeedback("");

    stopMic();

    // ----------------------------------
    // FINISH INTERVIEW
    // ----------------------------------

    if (
      currentIndex + 1 >=
      questions.length
    ) {
      await finishInterview();

      return;
    }

    // ----------------------------------
    // NEXT QUESTION MESSAGE
    // ----------------------------------

    await speakText(
      "Alright, let's move to the next question."
    );

    // ----------------------------------
    // Move to next question
    // ----------------------------------

    setCurrentIndex(
      (prev) => prev + 1
    );

    setIsMicOn(true);

    isMicOnRef.current = true;
  };

  // =====================================================
  // FINISH INTERVIEW
  // =====================================================

  const finishInterview = async () => {
    stopMic();

    setIsMicOn(false);

    isMicOnRef.current = false;

    window.speechSynthesis.cancel();

    try {
      const result = await axios.post(
        ServerUrl +
          "/api/interview/finish",
        {
          interviewId,
        },
        {
          withCredentials: true,
        }
      );

      console.log(
        "Interview finished:",
        result.data
      );

      onFinish(result.data);
    } catch (error) {
      console.log(
        "Finish interview error:",
        error
      );
    }
  };

  // =====================================================
  // COMPONENT CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      stopMic();

      window.speechSynthesis.cancel();

      const video = videoRef.current;

      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [stopMic]);

  // =====================================================
  // NO QUESTIONS
  // =====================================================

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-semibold">
          No interview questions found.
        </p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-emerald-50
        via-white
        to-teal-100
        flex
        items-center
        justify-center
        p-4
        sm:p-6
      "
    >
      <div
        className="
          w-full
          max-w-[1400px]
          min-h-[80vh]
          bg-white
          rounded-3xl
          shadow-2xl
          border
          border-gray-200
          flex
          flex-col
          lg:flex-row
          overflow-hidden
        "
      >
        {/* =================================================
            VIDEO SECTION
        ================================================= */}

        <div
          className="
            w-full
            lg:w-[35%]
            bg-white
            flex
            flex-col
            items-center
            p-6
            space-y-6
            border-r
            border-gray-200
          "
        >
          {/* VIDEO */}

          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              overflow-hidden
              shadow-xl
            "
          >
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="
                w-full
                h-auto
                object-cover
              "
            />
          </div>

          {/* SUBTITLE */}

          {subtitle && (
            <div
              className="
                w-full
                max-w-md
                bg-gray-50
                border
                border-gray-200
                rounded-xl
                p-4
                shadow-sm
              "
            >
              <p
                className="
                  text-gray-700
                  text-sm
                  sm:text-base
                  font-medium
                  text-center
                  leading-relaxed
                "
              >
                {subtitle}
              </p>
            </div>
          )}

          {/* TIMER CARD */}

          <div
            className="
              w-full
              max-w-md
              bg-white
              border
              border-gray-200
              rounded-2xl
              shadow-md
              p-6
              space-y-5
            "
          >
            <div
              className="
                flex
                justify-between
                items-center
              "
            >
              <span className="text-sm text-gray-500">
                Interview Status
              </span>

              {isAIPlaying && (
                <span
                  className="
                    text-sm
                    font-semibold
                    text-emerald-600
                  "
                >
                  AI Speaking
                </span>
              )}
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex justify-center">
              <Timer
                timeLeft={timeLeft}
                totalTime={
                  currentQuestion?.timeLimit ||
                  60
                }
              />
            </div>

            <div className="h-px bg-gray-200" />

            <div
              className="
                grid
                grid-cols-2
                gap-6
                text-center
              "
            >
              <div>
                <span
                  className="
                    block
                    text-2xl
                    font-bold
                    text-emerald-600
                  "
                >
                  {currentIndex + 1}
                </span>

                <span
                  className="
                    text-xs
                    text-gray-400
                  "
                >
                  Current Question
                </span>
              </div>

              <div>
                <span
                  className="
                    block
                    text-2xl
                    font-bold
                    text-emerald-600
                  "
                >
                  {questions.length}
                </span>

                <span
                  className="
                    text-xs
                    text-gray-400
                  "
                >
                  Total Questions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            INTERVIEW CONTENT
        ================================================= */}

        <div
          className="
            flex-1
            flex
            flex-col
            p-4
            sm:p-6
            md:p-8
          "
        >
          {/* TITLE */}

          <h2
            className="
              text-xl
              sm:text-2xl
              font-bold
              text-emerald-600
              mb-6
            "
          >
            AI Smart Interview
          </h2>

          {/* QUESTION */}

          {!isIntroPhase && (
            <div
              className="
                relative
                mb-6
                bg-gray-50
                p-4
                sm:p-6
                rounded-2xl
                border
                border-gray-200
                shadow-sm
              "
            >
              <p
                className="
                  text-xs
                  sm:text-sm
                  text-gray-400
                  mb-2
                "
              >
                Question {currentIndex + 1} of{" "}
                {questions.length}
              </p>

              <div
                className="
                  text-base
                  sm:text-lg
                  font-semibold
                  text-gray-800
                  leading-relaxed
                  pr-4
                "
              >
                {currentQuestion?.question}
              </div>
            </div>
          )}

          {/* ANSWER */}

          <textarea
            placeholder="Type your answer here..."
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            value={answer}
            disabled={
              isIntroPhase ||
              isSubmitting
            }
            className="
              min-h-[250px]
              lg:flex-1
              bg-gray-100
              p-4
              sm:p-6
              rounded-2xl
              resize-none
              outline-none
              border
              border-gray-200
              focus:ring-2
              focus:ring-emerald-500
              transition
              text-gray-800
              disabled:opacity-60
            "
          />

          {/* =================================================
              CONTROLS
          ================================================= */}

          {!feedback ? (
            <div
              className="
                flex
                items-center
                gap-4
                mt-6
              "
            >
              {/* MIC BUTTON */}

              <motion.button
                whileTap={{
                  scale: 0.9,
                }}
                onClick={toggleMic}
                disabled={
                  isIntroPhase ||
                  isSubmitting
                }
                className="
                  w-12
                  h-12
                  sm:w-14
                  sm:h-14
                  flex
                  items-center
                  justify-center
                  rounded-full
                  bg-black
                  text-white
                  shadow-lg
                  disabled:opacity-50
                "
              >
                {isMicOn ? (
                  <FaMicrophone
                    size={20}
                  />
                ) : (
                  <FaMicrophoneSlash
                    size={20}
                  />
                )}
              </motion.button>

              {/* SUBMIT */}

              <motion.button
                onClick={submitAnswer}
                disabled={
                  isSubmitting ||
                  isIntroPhase
                }
                whileTap={{
                  scale: 0.95,
                }}
                className="
                  flex-1
                  bg-gradient-to-r
                  from-emerald-600
                  to-teal-500
                  text-white
                  py-3
                  sm:py-4
                  rounded-2xl
                  shadow-lg
                  hover:opacity-90
                  transition
                  font-semibold
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Submit Answer"}
              </motion.button>
            </div>
          ) : (
            /* =================================================
               FEEDBACK
            ================================================= */

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="
                mt-6
                bg-emerald-50
                border
                border-emerald-200
                p-5
                rounded-2xl
                shadow-sm
              "
            >
              <p
                className="
                  text-emerald-700
                  font-medium
                  mb-4
                  leading-relaxed
                "
              >
                {feedback}
              </p>

              <button
                onClick={handleNext}
                className="
                  w-full
                  bg-gradient-to-r
                  from-emerald-600
                  to-teal-500
                  text-white
                  py-3
                  rounded-xl
                  shadow-md
                  hover:opacity-90
                  transition
                  flex
                  items-center
                  justify-center
                  gap-2
                  font-semibold
                "
              >
                {currentIndex + 1 >=
                questions.length
                  ? "Finish Interview"
                  : "Next Question"}

                <BsArrowRight
                  size={18}
                />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Step2Interview;