FroalaEditor.PLUGINS.summarize = function (editor) {
    return {
        summarizeText: function() {
            const selectedText = editor.selection.text();

            if(!selectedText || selectedText.trim().length < 30){
                alert ('Please select at least 30 characters of text to summarize.');
                return;
            }

            // Load your API key
            // Be sure to replace this with your actual key (preferably in a secure directory/file)
            const apiKey = 'YourAPIKey';
            const endpoint = 'https://api.deepseek.com/v1/chat/completions';

            // Add a bit of text to inform the user about the process
            editor.html.insert('<p><em>Summarizing content. Please wait a bit...</em></p>');

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        // Here's where your prompt should be
                        {role: 'system', content: 'Summarize the following content in 5 sentences or less.'},
                        {role: 'user', content: selectedText}
                    ],
                    // Customize the temperature and max tokens
                    temperature: 0.75,
                    max_tokens: 500
                })
            }).then(response => response.json())
            .then(data => {
                // Replace the editor's content with the summary
                const summary = data.choices?.[0]?.message?.content || 'No summary returned.';
                editor.html.set('');
                editor.html.insert(`<p><h2>Summary:</h2> ${summary}</p>`);
            }).catch(error => {
                console.error('DeepSeek API Error: ', error);
                editor.html.insert('<p style="color:red;">Summary failed. Please try again.</p>');
            });
        }
    };
};

FroalaEditor.DefineIcon('summarize', { NAME: 'book-open', SVG_KEY: 'insert' });

FroalaEditor.RegisterCommand('summarize', {
    title: 'Summarize Text',
    icon: 'summarize',
    undo: true,
    focus: true,
    plugin: 'summarize',
    callback: function() {
        this.summarize.summarizeText();
    }
});

new FroalaEditor('#editor', {
    toolbarButtons: ['bold', 'italic', 'underline', '|', 'summarize'],
    pluginsEnabled: ['summarize'],
    heightMin: 300
});