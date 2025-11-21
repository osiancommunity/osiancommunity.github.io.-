document.addEventListener("DOMContentLoaded", function() {

    // Define the location of your backend
    const backendUrl = 'http://localhost:5000/api';

    // --- User & Logout Logic ---
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // Check if user is logged in
    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    // Handle Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // --- Elements ---
    const searchInput = document.getElementById('search-input');
    const quizFilter = document.getElementById('quiz-filter');
    const resultsTableBody = document.querySelector('#results-table tbody');
    const resultsSummary = document.getElementById('results-summary');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    let currentPage = 1;
    let totalPages = 1;
    let allResults = [];
    let filteredResults = [];
    let allQuizzes = [];

    // Get quiz ID from URL if specified
    const urlParams = new URLSearchParams(window.location.search);
    const selectedQuizId = urlParams.get('quizId');

    // --- Fetch Admin's Quizzes ---
    async function fetchMyQuizzes() {
        try {
            const response = await fetch(`${backendUrl}/quizzes/admin`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to fetch quizzes');
            }

            const data = await response.json();
            allQuizzes = data.quizzes || [];

            // Populate quiz filter dropdown
            populateQuizFilter();

            // Fetch results based on selected quiz or all results
            if (selectedQuizId) {
                quizFilter.value = selectedQuizId;
                fetchQuizResults(selectedQuizId);
            } else {
                fetchAllResults();
            }
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            alert('Failed to load quizzes. Please try again.');
        }
    }

    // --- Populate Quiz Filter ---
    function populateQuizFilter() {
        quizFilter.innerHTML = '<option value="all">All Quizzes</option>';
        allQuizzes.forEach(quiz => {
            const option = document.createElement('option');
            option.value = quiz._id;
            option.textContent = quiz.title;
            quizFilter.appendChild(option);
        });
    }

    // --- Fetch Results for All Quizzes ---
    async function fetchAllResults() {
        try {
            const response = await fetch(`${backendUrl}/results/admin`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to fetch results');
            }

            const data = await response.json();
            allResults = data.results || [];
            filteredResults = [...allResults];
            renderResults();
            renderSummary();
        } catch (error) {
            console.error('Error fetching results:', error);
            resultsTableBody.innerHTML = '<tr><td colspan="7">Error loading results. Please try again.</td></tr>';
        }
    }

    // --- Fetch Results for Specific Quiz ---
    async function fetchQuizResults(quizId) {
        try {
            const response = await fetch(`${backendUrl}/results/quiz/${quizId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Failed to fetch quiz results');
            }

            const data = await response.json();
            allResults = data.results || [];
            filteredResults = [...allResults];
            renderResults();
            renderSummary();
        } catch (error) {
            console.error('Error fetching quiz results:', error);
            resultsTableBody.innerHTML = '<tr><td colspan="7">Error loading quiz results. Please try again.</td></tr>';
        }
    }

    // --- Render Results ---
    function renderResults() {
        const startIndex = (currentPage - 1) * 10;
        const endIndex = startIndex + 10;
        const resultsToShow = filteredResults.slice(startIndex, endIndex);

        resultsTableBody.innerHTML = '';
 
        if (resultsToShow.length === 0) {
            resultsTableBody.innerHTML = '<tr><td colspan="7">No results found.</td></tr>';
            updatePagination(); // Still update pagination to show "Page 0 of 0" or similar
            return;
        }

        resultsToShow.forEach(result => {
            const row = document.createElement('tr');

            // FIX: Safely access nested properties that might not exist.
            const score = result.score ?? 0;
            const totalQuestions = result.totalQuestions ?? 1;
            const percentage = ((score / totalQuestions) * 100).toFixed(1);
            const status = result.status === 'completed' ? 'Completed' : (result.status || 'In Progress');
            const completedAt = result.completedAt ? new Date(result.completedAt).toLocaleDateString() : '--';

            row.innerHTML = `
                <td>${result.userId ? result.userId.name : 'Unknown'}</td>
                <td>${result.userId ? result.userId.email : 'Unknown'}</td>
                <td>${score} / ${totalQuestions}</td>
                <td>${percentage}%</td>
                <td><span class="status-tag ${result.status === 'completed' ? 'active' : 'inactive'}">${status}</span></td>
                <td>${completedAt}</td>
                <td>
                    <button class="btn-edit" onclick="viewDetailedResult(\`${result._id}\`)">View Details</button>
                </td>
            `;

            resultsTableBody.appendChild(row);
        });

        updatePagination();
    }

    // --- Render Summary Stats ---
    function renderSummary() {
        const totalParticipants = filteredResults.length;
        const completedResults = filteredResults.filter(r => r.status === 'completed');
        const averageScore = completedResults.length > 0 
            ? (completedResults.reduce((acc, r) => acc + ((r.score / r.totalQuestions) * 100), 0) / completedResults.length).toFixed(1)
            : 0;
        const passRate = completedResults.length > 0 
            ? ((completedResults.filter(r => r.totalQuestions > 0 && (r.score / r.totalQuestions) >= 0.5).length / completedResults.length) * 100).toFixed(1)
            : 0;
 
        resultsSummary.innerHTML = `
            <div class="kpi-card">
                <div class="card-icon blue">
                    <i class='bx bx-user-check'></i>
                </div>
                <div class="card-info">
                    <h2>${totalParticipants}</h2>
                    <p>Total Participants</p>
                </div>
            </div>
            <div class="kpi-card">
                <div class="card-icon green">
                    <i class='bx bx-check-double'></i>
                </div>
                <div class="card-info">
                    <h2>${completedResults.length}</h2>
                    <p>Completed Attempts</p>
                </div>
            </div>
            <div class="kpi-card">
                <div class="card-icon purple">
                    <i class='bx bx-bar-chart-alt-2'></i>
                </div>
                <div class="card-info">
                    <h2>${averageScore}%</h2>
                    <p>Average Score</p>
                </div>
            </div>
            <div class="kpi-card">
                <div class="card-icon orange">
                    <i class='bx bx-trending-up'></i>
                </div>
                <div class="card-info">
                    <h2>${passRate}%</h2>
                    <p>Pass Rate</p>
                </div>
            </div>
        `;
    }

    // --- Helper Functions ---
    function updatePagination() {
        totalPages = Math.ceil(filteredResults.length / 10);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
 
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    // --- Event Listeners ---
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filteredResults = allResults.filter(result =>
            (result.userId && result.userId.name.toLowerCase().includes(searchTerm)) ||
            (result.userId && result.userId.email.toLowerCase().includes(searchTerm))
        );
        currentPage = 1;
        renderResults();
        renderSummary();
    });

    quizFilter.addEventListener('change', function() {
        const quizId = this.value;
        if (quizId === 'all') {
            fetchAllResults();
        } else {
            fetchQuizResults(quizId);
        }
    });

    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderResults();
        }
    });

    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderResults();
        }
    });

    // --- Global Functions for Buttons ---
    window.viewDetailedResult = function(resultId) {
        // Implement detailed result view
        alert('Detailed result view functionality to be implemented');
    };

    // --- Initial Load ---
    fetchMyQuizzes();
});
