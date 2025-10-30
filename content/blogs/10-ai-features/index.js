async function callAI(systemPrompt, userPrompt, opts = {}) {
    // Load your API key
    // Be sure to replace this with your actual key (preferably in a secure directory/file)
    const apiKey = 'YourDeepSeekAPIKey';
    const endpoint = 'https://api.deepseek.com/v1/chat/completions';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {role: 'system', content: systemPrompt},
                    {role: 'user', content: userPrompt}
                ],
                temperature: opts.temperature ?? 0.7,
                max_tokens: opts.max_tokens ?? 600
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '(No response)';
    } catch(e) {
        console.error('DeepSeek error: ', err);
        return 'Failed to contact DeepSeek API.';
    }
}

function showMessage(editor, text) {
    editor.html.insert(`<p><em>${text}</em></p>`);
}

// Smart Text Rewriting
FroalaEditor.PLUGINS.rewrite = function (editor) {
    return {
        run: async function() {
            const selectedText = editor.selection.text();
            if(!selectedText || selectedText.trim().length < 10){
                alert ('Please select a sentence or paragraph to rewrite.');
                return;
            }
            showMessage(editor, 'Finding other ways to write your thoughts...');
            const system = 'Rephrase the following text for clarity, natural flow, and conciseness without changing meaning.';
            const result = await callAI(system, selectedText, {temperature: 0.6});
            editor.selection.restore();
            editor.html.insert(result);
        }
    };
};
FroalaEditor.DefineIcon('rewrite', { NAME: 'edit', SVG_KEY: 'edit' });
FroalaEditor.RegisterCommand('rewrite', {
    title: 'Rewrite',
    icon: 'rewrite',
    plugin: 'rewrite',
    callback: function() {
        this.rewrite.run();
    }
});

// Grammar and Spelling Correction
FroalaEditor.PLUGINS.grammar = function (editor) {
    return {
        run: async function() {
            const selectedText = editor.selection.text();
            if(!selectedText || selectedText.trim().length < 5){
                alert ('Please select the text you want to correct.');
                return;
            }
            showMessage(editor, 'Correcting grammar and spelling (if any)...');
            const system = 'You are a grammar and spelling assistant. Correct errors without changing tone or meaning.';
            const corrected = await callAI(system, selectedText, {temperature: 0});
            editor.selection.restore();
            editor.html.insert(corrected);
        }
    };
};
FroalaEditor.DefineIcon('grammar', { NAME: 'spellcheck', SVG_KEY: 'spellcheck' });
FroalaEditor.RegisterCommand('grammar', {
    title: 'Fix Grammar',
    icon: 'grammar',
    plugin: 'grammar',
    callback: function() {
        this.grammar.run();
    }
});

// Tone and Style Adjustment
FroalaEditor.PLUGINS.tone = function (editor) {
    return {
        run: async function() {
            const selectedText = editor.selection.text();
            if(!selectedText || selectedText.trim().length < 20){
                alert ('Select at least a few sentences.');
                return;
            }
            const tone = prompt('Enter desired tone/style (e.g. friendly, formal, confident, persuasive):', 'friendly');
            if (!tone) return;
            showMessage(editor, `Adjusting tone to ${tone}...`);
            const system = `Rewrite the text in a ${tone} tone. Keep the meaning and key details.`;
            const result = await callAI(system, selectedText, {temperature: 0.7});
            editor.selection.restore();
            editor.html.insert(result);
        }
    };
};
FroalaEditor.DefineIcon('tone', { NAME: 'smile', SVG_KEY: 'smile' });
FroalaEditor.RegisterCommand('tone', {
    title: 'Adjust Tone',
    icon: 'tone',
    plugin: 'tone',
    callback: function() {
        this.tone.run();
    }
});

// Content Summarization
FroalaEditor.PLUGINS.summarize = function (editor) {
    return {
        run: async function() {
            const selectedText = editor.selection.text();
            if(!selectedText || selectedText.trim().length < 30){
                alert ('Please select at least 30 characters of text to summarize.');
                return;
            }
            showMessage(editor, 'Summarizing content. Please wait a bit...');
            const system = 'Summarize the following text in 5 sentences or less.';
            const summary = await callAI(system, selectedText);
            editor.html.insert(`<h3>Summary:</h3><p>${summary}</p>`);
        }
    };
};
FroalaEditor.DefineIcon('summarize', { NAME: 'blockquote', SVG_KEY: 'blockquote' });
FroalaEditor.RegisterCommand('summarize', {
    title: 'Summarize',
    icon: 'summarize',
    plugin: 'summarize',
    callback: function() {
        this.summarize.run();
    }
});

// Headline and Title Generation
FroalaEditor.PLUGINS.headline = function (editor) {
    return {
        run: async function() {
            const content = editor.selection.text() || editor.html.get();
            if (!content || content.trim().length < 30) {
                alert('Please select or provide enough text for headline generation.');
                return;
            }

            showMessage(editor, 'Generating headlines for you...');
            const system = 'Generate 5 creative headlines or titles for the following text. Keep each under 10 words.';
            const result = await callAI(system, content, {temperature: 0.8});
            editor.html.insert(`<h3>Headline Suggestions</h3><p>${result}</p>`);
        }
    };
};
FroalaEditor.DefineIcon('headline', { NAME: 'star', SVG_KEY: 'star' });
FroalaEditor.RegisterCommand('headline', {
    title: 'Generate Headline',
    icon: 'headline',
    plugin: 'headline',
    callback: function() {
        this.headline.run();
    }
});

// Code Refactoring
FroalaEditor.PLUGINS.refactor = function (editor) {
    return {
        run: async function() {
            const selectedText = editor.selection.text() || editor.html.get();
            if(!selectedText || selectedText.trim().length < 10){
                alert ('Select or paste code to refactor.');
                return;
            }
            const language = prompt('Refactor for which language? (e.g., JavaScript, HTML, Python):', 'JavaScript');
            showMessage(editor, 'Refactoring your code...');
            const system = `Refactor the following ${language} code for readability, maintainability, and if possible, efficiency. Remove all comments indicated by double slashes. Return only the refactored code.`;
            const refactored = await callAI(system, selectedText, {temperature: 0.2, max_tokens: 1200});
            editor.html.insert(`<pre><code>${refactored}</code></pre>`);
        }
    };
};
FroalaEditor.DefineIcon('refactor', { NAME: 'codeView', SVG_KEY: 'codeView' });
FroalaEditor.RegisterCommand('refactor', {
    title: 'Refactor Code',
    icon: 'refactor',
    plugin: 'refactor',
    callback: function() {
        this.refactor.run();
    }
});

new FroalaEditor('#editor', {
    filestackOptions: {
        filestackAPI: 'YourFilestackAPIKey',
        pickerOptions: {
            accept: ['image/*'],
            fromSources: ['local_file_system']
        }
    },
    toolbarButtons: [
        'bold', 'italic', 'underline', '|', 'rewrite', 'grammar', 'tone', 'summarize', 'headline', 'refactor', 'openFilePickerImageOnly', '|', 'filestackIcon'
    ],
    pluginsEnabled: ['rewrite', 'grammar', 'tone', 'summarize', 'headline', 'refactor', 'filestack'],
    heightMin: 300,
    width: 750,
    events: {
        'filestack.uploadedToFilestack': function (response) {
            // processes you can do after uploads; uncomment each, play around, or even mix them together through code or Workflows!
            getImageCaption(response.filesUploaded[0].handle, this);
            // performOCR(response.filesUploaded[0].url, this);
            // performAnalysis(response.filesUploaded[0].handle, this);
            // checkSFW(response.filesUploaded[0].url, this);
        },
        'filestack.uploadFailedToFilestack': function (response) {
            console.log(response);
        },
    }
});

// use the generated policy and signature from your Filestack dashboard
const policy = 'YourGeneratedPolicy';
const signature = 'YourGeneratedSignature';

// Image Captioning
async function getImageCaption(fileHandle, editorInstance) {
    const captionURL = `https://cdn.filestackcontent.com/security=p:${policy},s:${signature}/caption/${fileHandle}`;

    // fetch results from the Captions API, then insert the result into the editor
    try {
        const result = await callFilestack(captionURL);
        const caption = result.caption;
        editorInstance.html.insert(`<p>Generated Caption: ${caption}</p>`);
    } catch (error) {
        console.error("Error during image tagging:", error);
    }
}

// Content Safety Checking
async function checkSFW(fileHandle, editorInstance) {
    const sfwURL = `https://cdn.filestackcontent.com/security=policy:${policy},signature:${signature}/sfw/${fileHandle}`;

    try {
        const result = await callFilestack(sfwURL);
        console.log(result);
        if (result.sfw) {
            editorInstance.html.insert('<p>The uploaded file is safe for work!</p>');
        }
        else {
            editorInstance.html.insert('<p>The uploaded file is NOT safe for work!</p>');
        }
    } catch (error) {
        console.error('Error checking SFW status:', error);
    }
}

// OCR
async function performOCR(fileHandle, editorInstance) {
    // Append the OCR transformation to the Filestack URL
    const ocrURL = `https://cdn.filestackcontent.com/security=policy:${policy},signature:${signature}/ocr/${fileHandle}`;

    try {
        // Fetch OCR result from Filestack API
        const ocrResult = await callFilestack(ocrURL);

        // Insert the extracted text into the Froala editor
        editorInstance.html.insert(`<p>${ocrResult.text}</p>`);
    } catch(error) {
        console.error("Error during OCR: ", error);
    }
}

// Image Sentiment
async function performAnalysis(fileHandle, editorInstance) {
    const imageSentimentURL = `https://cdn.filestackcontent.com/security=p:${policy},s:${signature}/image_sentiment/${fileHandle}`;

    // fetch results from the Image Sentiment API, then insert the result into the editor
    try {
        const result = await callFilestack(imageSentimentURL);
        // format the emotions (for display)
        const emotions = formatEmotions(result.emotions);
        editorInstance.html.insert(`<p>Image Sentiment Analysis:</p><ul>${emotions}</ul>`);
    } catch (error) {
        console.error("Error during sentiment analysis:", error);
    }
}

// function for formatting the JSON object of emotions into an HTML list
function formatEmotions(emotions) {
    if (!emotions.hasOwnProperty('HAPPY')) return '<li>No sentiment detected.</li>';

    return Object.entries(emotions)
        .map(([emotion, value]) => `<li>${emotion}: ${(value).toFixed(2)}%</li>`)
        .join('');
}

// function that makes the API call
async function callFilestack(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to fetch results.");
    }

    const data = await response.json();
    return data;
}