document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/data')
        .then(response => response.json())
        .then(data => renderPortfolio(data))
        .catch(err => console.error('Error loading portfolio:', err));
});

function convertDriveLink(url) {
    if (!url) return '';
    // Check if it's a google drive link
    if (url.includes('drive.google.com')) {
        // Extract ID
        let id = '';
        const parts = url.split('/');

        // Pattern 1: /file/d/ID/view
        const dIndex = parts.indexOf('d');
        if (dIndex !== -1 && parts.length > dIndex + 1) {
            id = parts[dIndex + 1];
        }
        // Pattern 2: id=ID
        else if (url.includes('id=')) {
            const match = url.match(/id=([^&]+)/);
            if (match) id = match[1];
        }

        if (id) {
            // Using the thumbnail API is often more reliable for direct embedding than uc?export=view
            return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
        }
    }
    return url;
}

function renderPortfolio(data) {
    const nav = document.getElementById('main-nav');
    const content = document.getElementById('content');

    if (!data || data.length === 0) {
        content.innerHTML = '<p style="text-align:center; color:#888;">No content found.</p>';
        return;
    }

    const ul = document.createElement('ul');

    data.forEach((section, index) => {
        // Nav Link
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = section.title;
        a.href = '#';
        if (index === 0) a.classList.add('active');

        a.addEventListener('click', (e) => {
            e.preventDefault();
            // Update Nav
            document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
            a.classList.add('active');

            // Update Content
            document.querySelectorAll('.section-content').forEach(div => div.classList.remove('active'));
            const target = document.getElementById(`section-${section.id}`);
            if (target) {
                target.classList.add('active');
            }
        });

        li.appendChild(a);
        ul.appendChild(li);

        // Section Container
        const sectionDiv = document.createElement('div');
        sectionDiv.id = `section-${section.id}`;
        sectionDiv.className = 'section-content';
        if (index === 0) sectionDiv.classList.add('active');

        // Render Subsections
        if (section.subsections && section.subsections.length > 0) {
            section.subsections.forEach(sub => {
                const subDiv = document.createElement('div');
                subDiv.className = 'subsection';

                const h2 = document.createElement('h2');
                h2.textContent = sub.title;
                subDiv.appendChild(h2);

                // Render Items
                if (sub.items && sub.items.length > 0) {
                    const grid = document.createElement('div');
                    grid.className = 'items-grid';

                    sub.items.forEach(item => {
                        const itemCard = document.createElement('div');
                        itemCard.className = 'item-card';

                        // Image
                        if (item.image_url) {
                            const imgDiv = document.createElement('div');
                            imgDiv.className = 'item-image';
                            const img = document.createElement('img');
                            img.src = convertDriveLink(item.image_url);
                            img.alt = item.title;
                            img.loading = 'lazy';
                            imgDiv.appendChild(img);
                            itemCard.appendChild(imgDiv);
                        }

                        // Content
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'item-content';

                        const h3 = document.createElement('h3');
                        h3.textContent = item.title;
                        contentDiv.appendChild(h3);

                        if (item.description) {
                            const p = document.createElement('p');
                            p.textContent = item.description;
                            contentDiv.appendChild(p);
                        }

                        if (item.link_url && item.link_url !== '#' && item.link_url !== '') {
                            const link = document.createElement('a');
                            link.href = item.link_url;
                            link.className = 'btn-link';
                            link.target = '_blank';
                            link.textContent = 'View Project';
                            contentDiv.appendChild(link);
                        }

                        itemCard.appendChild(contentDiv);
                        grid.appendChild(itemCard);
                    });
                    subDiv.appendChild(grid);
                } else {
                    const p = document.createElement('p');
                    p.textContent = 'No items in this subsection.';
                    p.style.color = '#ccc';
                    subDiv.appendChild(p);
                }
                sectionDiv.appendChild(subDiv);
            });
        } else {
             const p = document.createElement('p');
             p.textContent = 'No content available in this section.';
             p.style.textAlign = 'center';
             p.style.color = '#ccc';
             p.style.marginTop = '2rem';
             sectionDiv.appendChild(p);
        }

        content.appendChild(sectionDiv);
    });

    nav.appendChild(ul);
}
