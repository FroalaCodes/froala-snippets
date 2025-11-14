// custom plugin
FroalaEditor.PLUGINS.autoFormat = function(editor) {
    return {
        run: function () {
            const doc = new DOMParser().parseFromString(editor.html.get(), 'text/html');
            const brandColor = '#01a4f9';

            // 1. typography and style
            const headings = doc.querySelectorAll('h1, h2, h3');
            headings.forEach(h => {
                h.style.fontFamily = 'Inter, sans-serif';
                h.style.fontWeight = '600';
                h.style.color = brandColor;
                if (h.tagName==='h1') {
                    h.style.fontSize = '2em';
                    h.style.marginBottom = '24px';
                }
                else if (h.tagName==='h2') {
                    h.style.fontSize = '1.6em';
                    h.style.marginBottom = '20px';
                }
                else if (h.tagName==='h3') {
                    h.style.fontSize = '1.3em';
                    h.style.marginBottom = '18px';
                }
            });

            const paragraphs = doc.querySelectorAll('p');
            paragraphs.forEach(p => {
                p.style.fontFamily = 'Roboto, sans-serif';
                p.style.fontSize = '16px';
                p.style.lineHeight = '1.6';
                p.style.textAlign = 'justify';
                p.style.marginBottom = '16px';
                p.style.color = '#333';
            });

            const strongs = doc.querySelectorAll('strong, b');
            strongs.forEach(s => {
                s.style.fontWeight = '600';
            });

            const italics = doc.querySelectorAll('em, i');
            italics.forEach(i => {
                i.style.fontStyle = 'italic';
            });

            // 2. alignment and spacing adjustments
            const lists = doc.querySelectorAll('ul, ol');
            lists.forEach(list => {
                list.style.margin = '16px 0 16px 24px';
                list.style.lineHeight = '1.6';
            });

            const blockquotes = doc.querySelectorAll('blockquote');
            blockquotes.forEach(bq => {
                bq.style.margin = '20px 0';
                bq.style.padding = '10px 20px';
                bq.style.borderLeft = `4px solid ${brandColor}`;
                bq.style.color = '#555';
                bq.style.fontStyle = 'italic';
            });

            // 3. color schemes and branding enforcement
            const links = doc.querySelectorAll('a');
            links.forEach(a => {
                a.style.color = brandColor;
                a.style.textDecoration = 'none';
                a.style.fontWeight = '500';
            });

            // Clean up multiple <br> tags or empty elements
            doc.querySelectorAll('br + br, p:empty').forEach(el => el.remove());

            // Update the editor
            editor.html.set(doc.body.innerHTML);
            editor.events.focus();
            editor.html.insert('<p><em>Auto formatting applied using custom branding style.</em></p>');
        }
    };
};

// define and register the button
FroalaEditor.DefineIcon('autoFormat', { NAME: 'star', SVG_KEY: 'star' });
FroalaEditor.RegisterCommand('autoFormat', {
    title: 'Auto Format',
    icon: 'autoFormat',
    plugin: 'autoFormat',
    callback: function () {
        this.autoFormat.run();
    }
});

new FroalaEditor('#editor', {
    toolbarButtons: [
        'bold', 'italic', 'underline', 'paragraphFormat', '|', 'autoFormat'
    ],
    pluginsEnabled: ['paragraphFormat', 'autoFormat'],
    heightMin: 750,
    width: 750
});