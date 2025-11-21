document.addEventListener("DOMContentLoaded", function() {

    // --- Backend URL ---
    const backendUrl = 'http://localhost:5000/api';

    // --- Authentication ---
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // Security Check: Is user logged in?
    if (!token || !user) {
        alert("You must be logged in to take a quiz. Redirecting...");
        window.location.href = 'login.html';
        return;
    }

    // --- Get Quiz ID from URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) {
        alert("Invalid quiz. No ID provided. Redirecting...");
        window.location.href = 'quiz-progress.html';
        return;
    }

    // --- Page Elements ---
    const warningModal = document.getElementById('warning-modal');
    const autoSubmitModal = document.getElementById('auto-submit-modal');
    const finalSubmitModal = document.getElementById('final-submit-modal');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizContainer = document.getElementById('quiz-container');
    const timeLeftDisplay = document.getElementById('time-left');
    const cheatingWarningBanner = document.getElementById('cheating-warning');
    const violationCountDisplay = document.getElementById('violation-count');
    const submitQuizBtn = document.getElementById('submit-btn');

    // --- Quiz Data ---
    let currentQuizData = null; // To store quiz questions
    let currentQuestionIndex = 0;
    let userAnswers = []; // To store user's answers
    let timerInterval = null;
    let timer = 0; // Track remaining time
    let violationCount = 0;
    const maxViolations = 2;

    // ===================================
    // 1. LOAD QUIZ DATA
    // ===================================
    async function loadQuiz() {
        try {
            const response = await fetch(`${backendUrl}/quizzes/${quizId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return; // Silently redirect
                }
                const data = await response.json();
                throw new Error(data.message);
            }

            currentQuizData = await response.json();
            
            // Set up the quiz page
            document.querySelector('.quiz-info h3').textContent = currentQuizData.title;
            timeLeftDisplay.textContent = `${currentQuizData.duration}:00`;
            
            // The modal is shown by default. The user must click start.

        } catch (error) {
            console.error('Error loading quiz:', error);
            alert(`Error: ${error.message}. Redirecting...`);
            window.location.href = 'quiz-progress.html';
        }
    }
    
    // ===================================
    // 2. START QUIZ
    // ===================================
    startQuizBtn.addEventListener('click', function() {
        warningModal.classList.remove('active');
        quizContainer.style.display = 'block';
        startTimer(currentQuizData.duration * 60); // Start timer
        displayQuestion(0); // Show the first question
        addSecurityListeners(); // Activate anti-cheating
    });

    // ===================================
    // 3. DISPLAY & NAVIGATION
    // ===================================
    function displayQuestion(index) {
        if (!currentQuizData || index >= currentQuizData.questions.length) {
            return; // No more questions
        }

        currentQuestionIndex = index;
        const question = currentQuizData.questions[index];

        document.getElementById('question-number').textContent = `Question ${index + 1} of ${currentQuizData.questions.length}`;
        document.querySelector('.question-header h2').textContent = question.questionText;

        const optionsContainer = document.querySelector('.options-container');
        optionsContainer.innerHTML = ''; // Clear old options

        question.options.forEach((option, i) => {
            optionsContainer.innerHTML += `
                <div class="option" data-option-index="${i}">
                    <span>${String.fromCharCode(65 + i)}</span> <p>${option.text}</p>
                </div>
            `;
        });
        
        // Add click listeners to new options
        document.querySelectorAll('.option').forEach(opt => {
            opt.addEventListener('click', selectAnswer);
        });

        // Update navigation buttons (this is a simple version)
        // For a real quiz, you'd have "Next", "Previous" buttons
    }
    
    function selectAnswer(e) {
        const selectedOption = e.currentTarget;
        const selectedAnswerIndex = parseInt(selectedOption.getAttribute('data-option-index'));

        // Remove 'selected' from siblings
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        selectedOption.classList.add('selected');

        // Store the answer
        // Check if answer for this question already exists
        const existingAnswer = userAnswers.find(a => a.questionIndex === currentQuestionIndex);
        if (existingAnswer) {
            existingAnswer.answerIndex = selectedAnswerIndex;
        } else {
            userAnswers.push({
                questionIndex: currentQuestionIndex,
                answerIndex: selectedAnswerIndex
            });
        }
        
        // Simple: Auto-advance to next question (or you can add a "Next" button)
        setTimeout(() => {
            if (currentQuestionIndex < currentQuizData.questions.length - 1) {
                displayQuestion(currentQuestionIndex + 1);
            } else {
                // Last question answered
                alert("You have answered all questions. Click 'Submit Quiz' to finish.");
            }
        }, 300);
    }

    // ===================================
    // 4. TIMER & SUBMISSION
    // ===================================
    function startTimer(duration) {
        timer = duration;
        timerInterval = setInterval(function () {
            let minutes = parseInt(timer / 60, 10);
            let seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            timeLeftDisplay.textContent = `${minutes}:${seconds}`;

            if (--timer < 0) {
                submitQuiz("Time's up!");
            }
        }, 1000);
    }

    submitQuizBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to submit?')) {
            submitQuiz("User submitted");
        }
    });

    async function submitQuiz(reason, wasAutoSubmitted = false) {
        clearInterval(timerInterval); // Stop the clock
        removeSecurityListeners();
        
        console.log(`Submitting quiz. Reason: ${reason}`);
        quizContainer.style.display = 'none';

        // Show the correct modal
        if (wasAutoSubmitted) {
            autoSubmitModal.classList.add('active');
        } else {
            // Show a "submitting" message in the final modal
            finalSubmitModal.classList.add('active');
            finalSubmitModal.querySelector('h2').textContent = "Submitting...";
            finalSubmitModal.querySelector('p').textContent = "Please wait while we save your answers.";
        }

        try {
            // --- BACKEND CALL ---
            const response = await fetch(`${backendUrl}/results/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quizId: quizId,
                    answers: userAnswers
                        .sort((a, b) => a.questionIndex - b.questionIndex)
                        .map(a => ({
                            questionIndex: a.questionIndex,
                            selectedAnswer: a.answerIndex,
                            timeSpent: 0
                        })),
                    timeTaken: currentQuizData.duration * 60 - timer
                })
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return; // Silently redirect
                }
                throw new Error('Failed to submit quiz.');
            }

            const data = await response.json();
            
            // Update the modal with the correct message
            finalSubmitModal.querySelector('h2').textContent = "Quiz Submitted!";
            if (data.result.status === 'pending') {
                finalSubmitModal.querySelector('p').textContent = "Your responses are saved. Results will be available in 1-2 days.";
            } else {
                finalSubmitModal.querySelector('p').textContent = `Your score: ${data.result.score} / ${data.result.totalQuestions}`;
            }

        } catch (error) {
            console.error('Submit Error:', error);
            finalSubmitModal.querySelector('h2').textContent = "Submission Failed!";
            finalSubmitModal.querySelector('p').textContent = "There was an error saving your results. Please contact support.";
        }
    }

    // ===================================
    // 5. ANTI-CHEATING SECURITY
    // ===================================
    function addSecurityListeners() {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.body.addEventListener('copy', disableEvent);
        document.body.addEventListener('paste', disableEvent);
    }

    function removeSecurityListeners() {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.body.removeEventListener('copy', disableEvent);
        document.body.removeEventListener('paste', disableEvent);
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            violationCount++;
            cheatingWarningBanner.style.display = 'flex';
            violationCountDisplay.textContent = violationCount;

            if (violationCount > maxViolations) {
                submitQuiz("Cheating violation", true);
            }
        }
    }

    function disableEvent(e) {
        e.preventDefault();
        alert("This action is disabled during the quiz.");
        return false;
    }
    
    // --- Initial Load ---
    loadQuiz();
});