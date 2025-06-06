# Froala Editor with Multilingual Translation using Translate Plus API

This repository contains all the code snippets from the Froala blog post, "[Add Multilingual Translation to Froala with Translate Plus API from APILayer](https://www.google.com/search?q=https://froala.com/blog/editor/add-multilingual-translation-to-froala-with-translate-plus-api-from-apilayer)". This example demonstrates how to integrate the Translate Plus API from APILayer into the Froala WYSIWYG Editor to create a powerful, seamless translation feature for a global audience.

---

## Features

* **Seamless Translation** : Translate editor content into over 100 languages directly within the Froala interface.
* **Custom Toolbar Button** : A dedicated "Translate" button on the toolbar provides easy access to the feature.
* **Dynamic Language Dropdown** : The button reveals a dropdown menu populated dynamically with all languages supported by the Translate Plus API.
* **Automatic Language Detection** : The API automatically detects the source language of the content, simplifying the user workflow.
* **User-Friendly Interface** : An intuitive and clean integration that enhances the user experience without cluttering the editor.

---

## Prerequisites

To run this example, you will need:

1. A valid **Translate Plus API Key** from [APILayer](https://www.google.com/search?q=https://apilayer.com/marketplace/translate-plus-api).
2. The **Froala Editor** library files (CSS and JS).
3. **Font Awesome 5** for the custom button icon.

---

## How to Run

### 1. Create the HTML file:

* Set up an HTML file and include the CSS and JS files for Froala Editor and Font Awesome.

<!-- end list -->

**HTML**

```
<!DOCTYPE html>
<html>
<head>
    <title>Froala WYSIWYG Editor with Translation</title>
    <linkhref="YOUR_PATH_TO/css/froala_editor.pkgd.min.css"rel="stylesheet" type="text/css" />
  
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.5.0/css/all.min.css" rel="stylesheet" type="text/css" />
</head>
<body>

    <div id="editor">
        <p>Hello world! Type or paste your text here to translate.</p>
    </div>

    <script type="text/javascript" src="YOUR_PATH_TO/js/froala_editor.pkgd.min.js"></script>
    <script>
        // All the JavaScript code from the steps below goes here
    </script>
</body>
</html>
```

### 2. Add the JavaScript:

* Place the JavaScript code from the blog post inside a `<script>` tag in your HTML file.
* Replace the placeholder for the API key with your actual key from APILayer.

### 3. Open in Browser:

* Save the file and open it in your web browser to see the translation feature in action.

---

### How It Works

1. **Fetch Languages** : A `GET` request is sent to the Translate Plus API's `/supported-languages` endpoint to retrieve a list of all available languages.
2. **Define Custom Button** : A new custom button named `translate` is defined for the Froala toolbar. It uses a Font Awesome icon and is configured as a dropdown.
3. **Populate Dropdown** : The `html` property of the custom button dynamically generates a dropdown list (`<ul>`) using the languages fetched in the first step.
4. **Handle Translation** : The button's `callback` function is triggered when a user selects a language. It gets the current text from the editor.
5. **Call Translate API** : An asynchronous `translate()` function sends a `POST` request to the `/v1/translate` endpoint with the editor's text and the target language. The `source` language is set to `"auto"` for automatic detection.
6. **Update Editor** : The API's JSON response contains the translated text, which is then inserted back into the editor, replacing the original content.
7. **Initialize Editor** : Finally, the Froala Editor is initialized on the `#editor` div with the new `translate` button added to the `toolbarButtons` array.

---

### Resources

* Read our article, [Add Multilingual Translation to Froala with Translate Plus API from APILayer](https://www.google.com/search?q=https://froala.com/blog/editor/add-multilingual-translation-to-froala-with-translate-plus-api-from-apilayer), for a full walkthrough.
* [Translate Plus API on APILayer](https://www.google.com/search?q=https://apilayer.com/marketplace/translate-plus-api)
* [Froala Editor Documentation](https://froala.com/wysiwyg-editor/docs/)

---

### License

This project is licensed under the  **MIT License** . You are free to use, modify, and distribute it.
