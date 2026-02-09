const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key-portfolio-jouhar', // In a real app, this should be an env var
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Authentication Middleware
const requireAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'Jogger123' && password === 'Jogger123@kandi') {
        req.session.isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check Auth Status
app.get('/api/auth-status', (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAuthenticated });
});

// Public Data Endpoint
app.get('/api/data', (req, res) => {
    try {
        const sections = db.prepare('SELECT * FROM sections ORDER BY display_order, id').all();
        const subsections = db.prepare('SELECT * FROM subsections ORDER BY display_order, id').all();
        const items = db.prepare('SELECT * FROM items ORDER BY display_order, id').all();

        // Nest data
        const data = sections.map(section => {
            const sectionSubs = subsections.filter(sub => sub.section_id === section.id);
            const subsWithItems = sectionSubs.map(sub => {
                const subItems = items.filter(item => item.subsection_id === sub.id);
                return { ...sub, items: subItems };
            });
            return { ...section, subsections: subsWithItems };
        });

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Admin Routes (Protected) ---

// Sections
app.post('/api/sections', requireAuth, (req, res) => {
    try {
        const { title, display_order } = req.body;
        const stmt = db.prepare('INSERT INTO sections (title, display_order) VALUES (?, ?)');
        const info = stmt.run(title, display_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/sections/:id', requireAuth, (req, res) => {
    try {
        const { title, display_order } = req.body;
        const stmt = db.prepare('UPDATE sections SET title = ?, display_order = ? WHERE id = ?');
        stmt.run(title, display_order, req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/sections/:id', requireAuth, (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM sections WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Subsections
app.post('/api/subsections', requireAuth, (req, res) => {
    try {
        const { title, section_id, display_order } = req.body;
        const stmt = db.prepare('INSERT INTO subsections (title, section_id, display_order) VALUES (?, ?, ?)');
        const info = stmt.run(title, section_id, display_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/subsections/:id', requireAuth, (req, res) => {
    try {
        const { title, display_order } = req.body;
        const stmt = db.prepare('UPDATE subsections SET title = ?, display_order = ? WHERE id = ?');
        stmt.run(title, display_order, req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/subsections/:id', requireAuth, (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM subsections WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Items
app.post('/api/items', requireAuth, (req, res) => {
    try {
        const { title, description, image_url, link_url, subsection_id, display_order } = req.body;
        const stmt = db.prepare('INSERT INTO items (title, description, image_url, link_url, subsection_id, display_order) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(title, description, image_url, link_url, subsection_id, display_order || 0);
        res.json({ id: info.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/items/:id', requireAuth, (req, res) => {
    try {
        const { title, description, image_url, link_url, display_order } = req.body;
        const stmt = db.prepare('UPDATE items SET title = ?, description = ?, image_url = ?, link_url = ?, display_order = ? WHERE id = ?');
        stmt.run(title, description, image_url, link_url, display_order, req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/items/:id', requireAuth, (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM items WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
