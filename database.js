const Database = require('better-sqlite3');
const db = new Database('portfolio.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS subsections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    section_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    subsection_id INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY(subsection_id) REFERENCES subsections(id) ON DELETE CASCADE
  );
`);

// Seed data if empty
const sectionCount = db.prepare('SELECT count(*) as count FROM sections').get();

if (sectionCount.count === 0) {
  const insertSection = db.prepare('INSERT INTO sections (title, display_order) VALUES (?, ?)');
  const insertSubsection = db.prepare('INSERT INTO subsections (title, section_id, display_order) VALUES (?, ?, ?)');
  const insertItem = db.prepare('INSERT INTO items (title, description, image_url, link_url, subsection_id, display_order) VALUES (?, ?, ?, ?, ?, ?)');

  const sections = ['Work', 'Products', 'Assets'];

  const seedTransaction = db.transaction(() => {
    sections.forEach((title, index) => {
      const sectionInfo = insertSection.run(title, index);

      // Add dummy subsection and item to demonstrate structure
      const subInfo = insertSubsection.run(`Featured ${title}`, sectionInfo.lastInsertRowid, 0);
      insertItem.run(`Sample Item for ${title}`, `This is a sample description for an item in ${title}. You can edit this in the admin panel.`, 'https://via.placeholder.com/150', '#', subInfo.lastInsertRowid, 0);
    });
  });

  seedTransaction();
  console.log('Database seeded with initial sections: Work, Products, Assets.');
}

module.exports = db;
