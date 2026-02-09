document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Login Form Handler
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                checkAuth();
            } else {
                errorEl.textContent = data.error || 'Login failed';
                errorEl.style.display = 'block';
            }
        } catch (err) {
            errorEl.textContent = 'Network error';
            errorEl.style.display = 'block';
        }
    });

    // Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST' });
        window.location.reload();
    });

    // Modal Form Handler
    document.getElementById('modal-form').addEventListener('submit', handleFormSubmit);
});

async function checkAuth() {
    const res = await fetch('/api/auth-status');
    const data = await res.json();

    if (data.isAuthenticated) {
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('dashboard-view').style.display = 'block';
        loadDashboardData();
    } else {
        document.getElementById('login-view').style.display = 'block';
        document.getElementById('dashboard-view').style.display = 'none';
    }
}

async function loadDashboardData() {
    const container = document.getElementById('admin-content');
    container.innerHTML = '<p>Loading...</p>';

    try {
        const res = await fetch('/api/data');
        const data = await res.json();
        renderAdminTree(data);
    } catch (err) {
        container.innerHTML = '<p>Error loading data.</p>';
        console.error(err);
    }
}

function renderAdminTree(data) {
    const container = document.getElementById('admin-content');
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No sections found. Add one!</p>';
        return;
    }

    data.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'admin-section';

        // Section Header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <div class="section-title">${section.title} <span style="font-size:0.8rem; color:#aaa;">(Order: ${section.display_order})</span></div>
            <div class="btn-group">
                <button class="btn-sm btn-edit" onclick="openModal('section', 'update', ${section.id}, '${section.title}', '', '', '', ${section.display_order})">Edit</button>
                <button class="btn-sm btn-delete" onclick="deleteItem('sections', ${section.id})">Delete</button>
            </div>
        `;
        sectionDiv.appendChild(header);

        // Subsections Container
        const subContainer = document.createElement('div');

        // Add Subsection Button
        const addSubBtn = document.createElement('button');
        addSubBtn.className = 'btn-sm btn-add';
        addSubBtn.textContent = '+ Add Subsection';
        addSubBtn.onclick = () => openModal('subsection', 'create', null, '', '', '', '', 0, section.id);
        subContainer.appendChild(addSubBtn);

        if (section.subsections && section.subsections.length > 0) {
            section.subsections.forEach(sub => {
                const subDiv = document.createElement('div');
                subDiv.className = 'admin-subsection';

                // Subsection Header
                const subHeader = document.createElement('div');
                subHeader.className = 'subsection-header';
                subHeader.innerHTML = `
                    <div class="subsection-title">${sub.title} <span style="font-size:0.8rem; color:#aaa;">(Order: ${sub.display_order})</span></div>
                    <div class="btn-group">
                        <button class="btn-sm btn-edit" onclick="openModal('subsection', 'update', ${sub.id}, '${sub.title}', '', '', '', ${sub.display_order}, ${section.id})">Edit</button>
                        <button class="btn-sm btn-delete" onclick="deleteItem('subsections', ${sub.id})">Delete</button>
                    </div>
                `;
                subDiv.appendChild(subHeader);

                // Add Item Button
                const addItemBtn = document.createElement('button');
                addItemBtn.className = 'btn-sm btn-add';
                addItemBtn.textContent = '+ Add Item';
                addItemBtn.onclick = () => openModal('item', 'create', null, '', '', '', '', 0, sub.id);
                subDiv.appendChild(addItemBtn);

                // Items List
                if (sub.items && sub.items.length > 0) {
                    sub.items.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'admin-item';

                        // Handle potential undefined values safely for onclick
                        const safeTitle = item.title.replace(/'/g, "\\'");
                        const safeDesc = (item.description || '').replace(/'/g, "\\'").replace(/\n/g, "\\n");
                        const safeImg = (item.image_url || '');
                        const safeLink = (item.link_url || '');

                        itemDiv.innerHTML = `
                            <div class="item-info">
                                ${safeImg ? `<img src="${convertDriveLink(safeImg)}" class="item-thumb" onerror="this.style.display='none'">` : ''}
                                <div>
                                    <strong>${item.title}</strong>
                                    <div style="font-size: 0.8rem; color: #666;">${item.description ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') : ''}</div>
                                </div>
                            </div>
                            <div class="btn-group">
                                <button class="btn-sm btn-edit" onclick="openModal('item', 'update', ${item.id}, '${safeTitle}', '${safeDesc}', '${safeImg}', '${safeLink}', ${item.display_order}, ${sub.id})">Edit</button>
                                <button class="btn-sm btn-delete" onclick="deleteItem('items', ${item.id})">Delete</button>
                            </div>
                        `;
                        subDiv.appendChild(itemDiv);
                    });
                }

                subContainer.appendChild(subDiv);
            });
        }

        sectionDiv.appendChild(subContainer);
        container.appendChild(sectionDiv);
    });
}

// Modal Logic
function openModal(type, mode, id = null, title = '', description = '', image = '', link = '', order = 0, parentId = null) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('modal-form');

    // Set hidden fields
    document.getElementById('edit-type').value = type;
    document.getElementById('edit-mode').value = mode;
    document.getElementById('edit-id').value = id || '';
    document.getElementById('parent-id').value = parentId || '';

    // Set visible fields
    document.getElementById('modal-title').textContent = `${mode === 'create' ? 'Add' : 'Edit'} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-order').value = order;

    // Toggle fields based on type
    const descGroup = document.getElementById('group-description');
    const imgGroup = document.getElementById('group-image');
    const linkGroup = document.getElementById('group-link');

    if (type === 'item') {
        descGroup.style.display = 'block';
        imgGroup.style.display = 'block';
        linkGroup.style.display = 'block';
        document.getElementById('edit-description').value = description;
        document.getElementById('edit-image').value = image;
        document.getElementById('edit-link').value = link;
    } else {
        descGroup.style.display = 'none';
        imgGroup.style.display = 'none';
        linkGroup.style.display = 'none';
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        closeModal();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const type = document.getElementById('edit-type').value; // section, subsection, item
    const mode = document.getElementById('edit-mode').value; // create, update
    const id = document.getElementById('edit-id').value;
    const parentId = document.getElementById('parent-id').value;

    const payload = {
        title: document.getElementById('edit-title').value,
        display_order: parseInt(document.getElementById('edit-order').value) || 0
    };

    if (type === 'subsection') {
        if (mode === 'create') payload.section_id = parentId;
    } else if (type === 'item') {
        if (mode === 'create') payload.subsection_id = parentId;
        payload.description = document.getElementById('edit-description').value;
        payload.image_url = document.getElementById('edit-image').value;
        payload.link_url = document.getElementById('edit-link').value;
    }

    // Determine URL and Method
    let url = `/api/${type}s`; // Pluralize: sections, subsections, items
    let method = 'POST';

    if (mode === 'update') {
        url += `/${id}`;
        method = 'PUT';
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal();
            loadDashboardData();
        } else {
            const err = await res.json();
            alert('Error: ' + (err.error || 'Failed to save'));
        }
    } catch (err) {
        console.error(err);
        alert('Network error');
    }
}

async function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this? This cannot be undone.')) return;

    try {
        const res = await fetch(`/api/${type}/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            loadDashboardData();
        } else {
            alert('Failed to delete');
        }
    } catch (err) {
        console.error(err);
        alert('Network error');
    }
}

// Helper (Duplicated from main.js for preview)
function convertDriveLink(url) {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        let id = '';
        const parts = url.split('/');
        const dIndex = parts.indexOf('d');
        if (dIndex !== -1 && parts.length > dIndex + 1) {
            id = parts[dIndex + 1];
        } else if (url.includes('id=')) {
            const match = url.match(/id=([^&]+)/);
            if (match) id = match[1];
        }
        if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w100`;
    }
    return url;
}
