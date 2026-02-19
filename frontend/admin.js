const API_URL = "http://localhost:8080";

// Auth Check
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'login.html';
}

function getHeaders() {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Load Admin Profile
async function loadAdminProfile() {
    try {
        const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
        if (res.ok) {
            const user = await res.json();

            // Security Check: Redirect if not admin
            if (user.role !== 'admin' && user.username !== 'Admin') {
                alert("Access Denied: Admins Only");
                window.location.href = 'dashboard.html';
                return;
            }

            document.getElementById('user-display-name').textContent = user.username;

            const img = document.getElementById('user-profile-img');
            const placeholder = document.getElementById('user-icon-placeholder');

            if (user.image_url) {
                img.src = user.image_url;
                img.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                img.classList.add('hidden');
                placeholder.classList.remove('hidden');
                placeholder.classList.remove('material-symbols-outlined');
                placeholder.classList.add('font-bold', 'text-xl', 'uppercase');
                placeholder.innerText = user.username.charAt(0);
            }
        } else {
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error("Error loading profile:", err);
    }
}

// Load Users List
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
        if (!res.ok) throw new Error("Failed to fetch users");

        const users = await res.json();
        const tbody = document.getElementById('user-list');

        tbody.innerHTML = users.map(user => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            ${user.image_url ? `<img src="${user.image_url}" class="w-full h-full rounded-full object-cover">` : user.username.charAt(0)}
                        </div>
                        <span class="font-bold text-sm text-slate-900 dark:text-white">${user.username}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${user.email}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${(user.role === 'admin' || user.username === 'Admin') ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}">
                        ${user.role || (user.username === 'Admin' ? 'admin' : 'staff')}
                    </span>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="deleteUser('${user._id}')" class="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-all" title="Delete User">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error("Error loading users:", err);
        // If API doesn't exist yet, show temporary mock expectation
        // document.getElementById('user-list').innerHTML = `<tr><td colspan="4" class="text-center p-4">API Endpoint Not Ready</td></tr>`;
    }
}

// Add User Logic
const userModal = document.getElementById('user-modal');
const addUserBtn = document.getElementById('add-user-btn');
const closeUserModal = document.getElementById('close-user-modal');
const addUserForm = document.getElementById('add-user-form');

if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
        userModal.classList.remove('hidden');
    });
}

if (closeUserModal) {
    closeUserModal.addEventListener('click', () => {
        userModal.classList.add('hidden');
    });
}

if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('new-username').value;
        const email = document.getElementById('new-email').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;

        try {
            const res = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    username, email, password, confirm_password: password, role
                })
            });

            if (res.ok) {
                alert("User created successfully");
                userModal.classList.add('hidden');
                addUserForm.reset();
                loadUsers();
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to create user");
            }
        } catch (err) {
            console.error("Error creating user:", err);
            alert("Server Error");
        }
    });
}

// Delete User
async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (res.ok) {
            loadUsers();
        } else {
            alert("Failed to delete user");
        }
    } catch (err) {
        console.error("Error deleting user:", err);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Sidebar Toggle (Mobile)
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
        } else {
            sidebar.classList.add('-translate-x-full');
        }
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProfile();
    loadUsers();
});
