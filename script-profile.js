document.addEventListener("DOMContentLoaded", function() {

    // --- SETUP ---
    const backendUrl = 'http://localhost:5000/api';
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // Security Check: Must be logged in
    // This check fails if 'user' or 'token' is null in localStorage
    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    // --- ELEMENTS ---
    const containerDiv = document.getElementById('container-div');
    const sidebarContainer = document.getElementById('sidebar-container');
    const head = document.head;

    // Profile display
    const profilePreview = document.getElementById('profile-preview');
    const profileNameDisplay = document.getElementById('profile-name-display');
    const profileEmailDisplay = document.getElementById('profile-email-display');
    const profileUploadInput = document.getElementById('profile-upload');

    // Edit Profile Form
    const profileForm = document.getElementById('profile-form');
    const fullNameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email');

    // Admin Fields
    const adminInstituteInput = document.getElementById('admin-institute');
    const adminAgeInput = document.getElementById('admin-age');
    const adminMobileInput = document.getElementById('admin-mobile');
    const adminStateInput = document.getElementById('admin-state');
    const adminCityInput = document.getElementById('admin-city');
    const adminCurrentAddressInput = document.getElementById('admin-current-address');

    // User Fields
    const userAgeInput = document.getElementById('user-age');
    const userInstituteInput = document.getElementById('user-institute');
    const userCourseInput = document.getElementById('user-course');
    const userYearInput = document.getElementById('user-year');
    const userStateInput = document.getElementById('user-state');
    const userCityInput = document.getElementById('user-city');
    const userMobileInput = document.getElementById('user-mobile');

    // Change Password Form
    const passwordForm = document.getElementById('password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');

    // Tabs
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Header profile elements
    const headerProfileImg = document.getElementById('header-profile-img');
    const headerProfileName = document.getElementById('header-profile-name');

    // --- FIX: Get role from the TRUSTED user object in localStorage ---
    const userRole = user.role || 'user'; 

    let profileImageBase64 = null;

    // --- 0. Dynamic Page Setup based on Role ---
    function setupPageForRole() {
        let sidebarHTML = '';
        let stylesheet = '';

        if (userRole === 'superadmin') {
            containerDiv.className = 'admin-container';
            stylesheet = 'style-admin.css';
            sidebarHTML = `
                <div class="sidebar-header">
                    <a href="dashboard-superadmin.html" class="logo">OSIAN</a>
                    <span class="logo-tag">Super Admin</span>
                </div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard-superadmin.html"><i class='bx bxs-dashboard'></i><span>Dashboard</span></a></li>
                    <li><a href="user-management.html"><i class='bx bxs-user-detail'></i><span>User Management</span></a></li>
                    <li><a href="admin-management.html"><i class='bx bxs-user-account'></i><span>Admin Management</span></a></li>
                    <li><a href="quiz-management-list.html"><i class='bx bxs-file-blank'></i><span>Quiz Management</span></a></li>
                    <li><a href="create-notification.html"><i class='bx bxs-bell'></i><span>Notifications</span></a></li>
                    <li><a href="mentorship.html"><i class='bx bxs-video'></i><span>Mentorship Videos</span></a></li>
                    <li><a href="contact-us-admin.html"><i class='bx bxs-contact'></i><span>Contact Us Page</span></a></li>
                    <li><a href="site-analytics.html"><i class='bx bxs-bar-chart-alt-2'></i><span>Site Analytics</span></a></li>
                    <li class="active"><a href="profile.html" class="active"><i class='bx bxs-user'></i><span>My Profile</span></a></li>
                </ul>
                <div class="sidebar-footer">
                    <a href="login.html" class="logout-btn"><i class='bx bx-log-out'></i><span>Log Out</span></a>
                </div>
            `;
        } else if (userRole === 'admin') {
            containerDiv.className = 'admin-container';
            stylesheet = 'style-admin.css';
            sidebarHTML = `
                <div class="sidebar-header">
                    <a href="dashboard-admin.html" class="logo">OSIAN</a>
                    <span class="logo-tag">Admin Panel</span>
                </div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard-admin.html"><i class='bx bxs-dashboard'></i><span>Dashboard</span></a></li>
                    <li><a href="create-quiz.html"><i class='bx bxs-file-plus'></i><span>Create New Quiz</span></a></li>
                    <li><a href="quiz-management-list.html"><i class='bx bxs-file-blank'></i><span>My Quizzes</span></a></li>
                    <li><a href="#"><i class='bx bxs-bar-chart-alt-2'></i><span>Quiz Results</span></a></li>
                    <li class="active"><a href="profile.html" class="active"><i class='bx bxs-user'></i><span>My Profile</span></a></li>
                </ul>
                <div class="sidebar-footer">
                    <a href="login.html" class="logout-btn"><i class='bx bx-log-out'></i><span>Log Out</span></a>
                </div>
            `;
        } else { // 'user' role
            containerDiv.className = 'dashboard-container';
            stylesheet = 'style-dashboard.css';
            sidebarHTML = `
                <div class="sidebar-header">
                    <a href="dashboard-user.html" class="logo">OSIAN</a>
                </div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard-user.html"><i class='bx bxs-dashboard'></i><span>Dashboard</span></a></li>
                    <li><a href="live-quizzes.html"><i class='bx bx-book-content'></i><span>Live Quizzes</span></a></li>
                    <li><a href="#"><i class='bx bx-calendar-event'></i><span>Upcoming Quizzes</span></a></li>
                    <li><a href="quiz-progress.html"><i class='bx bx-file-blank'></i><span>My Quizzes</span></a></li>
                    <li><a href="notifications.html"><i class='bx bx-bell'></i><span>Notifications</span></a></li>
                    <li><a href="quiz-progress.html"><i class='bx bx-line-chart'></i><span>Quiz Progress</span></a></li>
                    <li><a href="mentorship-user.html"><i class='bx bx-video'></i><span>Mentorship</span></a></li>
                    <li><a href="contact.html"><i class='bx bx-support'></i><span>Contact & Support</span></a></li>
                    <li class="active"><a href="profile.html" class="active"><i class='bx bxs-user'></i><span>Profile</span></a></li>
                </ul>
                <div class="sidebar-footer">
                    <a href="login.html" class="logout-btn"><i class='bx bx-log-out'></i><span>Log Out</span></a>
                </div>
            `;
        }

        // Inject stylesheet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylesheet;
        head.appendChild(link);

        // Inject sidebar
        sidebarContainer.innerHTML = sidebarHTML;

        // Logout functionality for dynamically added button
        const logoutBtn = sidebarContainer.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            });
        }
    }

    // --- 1. Fetch and Populate Profile Data ---
    async function fetchProfile() {
        try {
            const response = await fetch(`${backendUrl}/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Handle 401/403 errors by redirecting to login
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return; // Stop execution after redirecting
                }
                const data = await response.json();
                throw new Error(data.message || 'Failed to fetch profile.');
            }

            let responseData = await response.json();
            // The backend returns the user object nested under a 'user' key.
            if (!responseData.user) {
                throw new Error("User data not found in response.");
            }
            let profileData = responseData.user;

            // --- FIX: This prevents a TypeError if a new user has a `null` profile object.
            profileData.profile = profileData.profile || {};

            // Populate display elements
            const imgSrc = profileData.profile.avatar || 'https://placehold.co/120';
            profilePreview.src = imgSrc;
            // Safely generate header image source
            if (imgSrc.startsWith('https://via.placeholder.com/')) {
                headerProfileImg.src = imgSrc.replace('/120', '/40'); 
            } else {
                headerProfileImg.src = imgSrc; 
            }
            profileNameDisplay.textContent = profileData.name;
            profileEmailDisplay.textContent = profileData.email;
            headerProfileName.textContent = profileData.name;

            // Populate form fields
            emailInput.value = profileData.email || ''; 
            fullNameInput.value = profileData.name || '';

            // Populate role-specific fields
            if (userRole === 'admin') {
                adminInstituteInput.value = profileData.profile.college || '';
                adminAgeInput.value = profileData.profile.age || '';
                adminMobileInput.value = profileData.profile.phone || '';
                adminStateInput.value = profileData.profile.state || '';
                adminCityInput.value = profileData.profile.city || '';
                adminCurrentAddressInput.value = profileData.profile.currentAddress || '';
            } else if (userRole === 'user') {
                userAgeInput.value = profileData.profile.age || '';
                userInstituteInput.value = profileData.profile.college || '';
                userCourseInput.value = profileData.profile.course || '';
                userYearInput.value = profileData.profile.year || '';
                userStateInput.value = profileData.profile.state || '';
                userCityInput.value = profileData.profile.city || '';
                userMobileInput.value = profileData.profile.phone || '';
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.message.includes('401') || error.message.includes('403')) {
                 return;
            }
            alert(`Error: ${error.message}`);
        }
    }

    // --- 2. Handle Profile Form Submission ---
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitButton = profileForm.querySelector('.btn-save');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        const updatedData = {
            profilePicture: profileImageBase64, // Will be null if not changed
            profile: {}
        };

        updatedData.name = fullNameInput.value;

        // Add role-specific fields
        if (userRole === 'admin') {
            updatedData.profile.college = adminInstituteInput.value;
            updatedData.profile.age = adminAgeInput.value;
            updatedData.profile.phone = adminMobileInput.value;
            updatedData.profile.state = adminStateInput.value;
            updatedData.profile.city = adminCityInput.value;
            updatedData.profile.currentAddress = adminCurrentAddressInput.value;
        } else if (userRole === 'user') {
            updatedData.profile.age = userAgeInput.value;
            updatedData.profile.college = userInstituteInput.value;
            updatedData.profile.course = userCourseInput.value;
            updatedData.profile.year = userYearInput.value;
            updatedData.profile.state = userStateInput.value;
            updatedData.profile.city = userCityInput.value;
            updatedData.profile.phone = userMobileInput.value;
        }


        try {
            const response = await fetch(`${backendUrl}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return; 
                }
                const errorText = await response.text();
                try {
                    const data = JSON.parse(errorText);
                    throw new Error(data.message || 'Failed to update profile.');
                } catch (jsonError) {
                    throw new Error(errorText || 'An unknown server error occurred.');
                }
            }

            const responseData = await response.json();
            alert('Profile updated successfully!');

            // CRITICAL: Update localStorage with the new user object from the server
            if (responseData.user) {
                localStorage.setItem('user', JSON.stringify(responseData.user));
            }
            fetchProfile(); // Refresh data on page

        } catch (error) {
            if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
                console.error('Profile update error: Invalid server response (possibly large payload).', error);
            }
            alert(`Error: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Changes';
        }
    });

    // --- 3. Handle Password Change Submission ---
    passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitButton = passwordForm.querySelector('.btn-save');
        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';

        const passwordData = {
            currentPassword: currentPasswordInput.value,
            newPassword: newPasswordInput.value,
            confirmNewPassword: confirmNewPasswordInput.value
        };

        try {
            const response = await fetch(`${backendUrl}/auth/change-password`, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return; 
                }
                const data = await response.json();
                throw new Error(data.message || 'Failed to change password.');
            }

            alert('Password changed successfully!');
            passwordForm.reset();

        } catch (error) {
            console.error('Password change error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Update Password';
        }
    });

    // --- 4. Handle Profile Picture Upload ---
    profileUploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profileImageBase64 = event.target.result;
                profilePreview.src = profileImageBase64; // Show preview
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 5. Show/hide fields based on role ---
    if (userRole === 'superadmin') {
        document.querySelectorAll('.superadmin-only-field').forEach(field => {
            field.style.display = 'block';
        });
        document.querySelectorAll('.admin-only-field, .user-only-field').forEach(field => {
            field.style.display = 'none';
        });
    } else if (userRole === 'admin') {
        document.querySelectorAll('.admin-only-field').forEach(field => {
            field.style.display = 'block';
        });
        document.querySelectorAll('.superadmin-only-field, .user-only-field').forEach(field => {
            field.style.display = 'none';
        });
    } else { // user
        document.querySelectorAll('.user-only-field').forEach(field => {
            field.style.display = 'block';
        });
        document.querySelectorAll('.superadmin-only-field, .admin-only-field').forEach(field => {
            field.style.display = 'none';
        });
    }


    // --- 6. Tab Switching Logic ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate clicked tab and content
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // --- Initial Load ---
    setupPageForRole();
    fetchProfile();
});