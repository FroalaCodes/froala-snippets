# Froala Editor: Custom Export to Markdown Button

This repository contains all the code snippets from the Froala blog post that demonstrates how to add a custom "Export to Markdown" button to the Froala WYSIWYG Editor. This feature allows users to easily download their content as a `.md` file directly from the editor's toolbar.

---

## Features

* **Custom Toolbar Button** : Adds a new "Export" button to the Froala toolbar.
* **Context-Aware** : The button is intelligently enabled only when the editor is in Markdown mode and disabled otherwise.
* **One-Click Export** : Allows users to download the editor's content as a `.md` file with a single click.
* **Streamlined Workflow** : Enhances productivity for developers and writers who frequently use Markdown for documentation, notes, and content creation.
* **Custom SVG Icon** : Utilizes Froala's API to define a clean, custom SVG icon for the button.

---

## Prerequisites

To run this example, you will need the following Froala Editor files:

1. **Froala Editor** core CSS and JS.
2. **Froala Markdown Plugin** CSS and JS.

---

## How to Run

### 1. Create the HTML file:

* Set up a basic HTML file and include the necessary Froala Editor and Markdown plugin files as shown below.

<!-- end list -->

**HTML**

```
<!DOCTYPE html>
<html>
<head>
    <title>Froala WYSIWYG Editor - Export to Markdown</title>
    <link href="YOUR_PATH_TO/css/froala_editor.min.css" rel="stylesheet" type="text/css" />
    <link href="YOUR_PATH_TO/css/plugins/markdown.min.css" rel="stylesheet" type="text/css" />
</head>
<body>
    <div id="editor"></div>

    <script type="text/javascript" src="YOUR_PATH_TO/js/froala_editor.min.js"></script>
    <script type="text/javascript" src="YOUR_PATH_TO/js/plugins/markdown.min.js"></script>
  
    <script>
        // All the JavaScript code from the steps below goes here
    </script>
</body>
</html>
```

### 2. Add the JavaScript:

* Place all the JavaScript code for defining the icon, registering the command, and initializing the editor into the empty `<script>` tag in your HTML file.

### 3. Open in Browser:

* Save the HTML file and open it in your browser. Toggle Markdown mode to see the "Export" button become active.

---

### How It Works

The functionality is achieved by leveraging Froala's powerful API to create and manage a custom toolbar button.

1. **Define Icon** : A custom SVG icon is defined and registered with Froala using `FroalaEditor.SVG` and `FroalaEditor.DefineIcon`.

   **JavaScript**

```
   FroalaEditor.SVG.export = "M15.293 5.293L12 8.586V2h-1v6.586L8.707 5.293 7.293 6.707 12 11.414l4.707-4.707zM18 11h-1v4H7v-4H6v5h12v-5z";
   FroalaEditor.DefineIcon("export", { NAME: "Export", SVG_KEY: "export" });
```

1. **Register Command** : The `export` button is registered as a new command using `FroalaEditor.RegisterCommand`. This definition includes several key properties:

* `plugin: "markdown"`: Associates the button with the Markdown plugin.
* `disabled: true`: The button is disabled by default.
* `refresh`: A function that is called to update the button's state. It checks if `this.markdown.isEnabled()` and enables/disables the button accordingly.
* `callback`: The core function that executes when the button is clicked.

1. **Export Logic (Callback)** : The `callback` function performs the following steps:

* It gets the editor's content as plain text, which is the raw Markdown content when in Markdown mode.
* It creates a `Blob` (a file-like object) from the Markdown content with the MIME type `text/markdown`.
* It generates a temporary local URL for the Blob using `URL.createObjectURL()`.
* It programmatically creates an `<a>` tag, sets its `href` to the blob URL, assigns a `download` filename (`markdown.md`), and simulates a click to trigger the browser's download prompt.
* Finally, it cleans up by revoking the object URL to free up memory.

1. **Initialize Editor** : The Froala Editor is initialized on a `div`. The new `export` button is added to the `toolbarButtons` array to make it visible in the toolbar.

   **JavaScript**

```
   new FroalaEditor('#editor', {
     toolbarButtons: ["bold", "italic", "underline", "markdown", "|", "export"],
   });
```

---

### Resources

* Read our full article for a detailed explanation and advanced customization ideas.
* [Froala Markdown Plugin Documentation](https://www.google.com/search?q=https://froala.com/wysiwyg-editor/docs/plugins/markdown/)
* [Froala Custom Button Documentation](https://www.google.com/search?q=https://froala.com/wysiwyg-editor/docs/concepts/custom-buttons/)

---

### License

This project is licensed under the  **MIT License** . You are free to use, modify, and distribute it.
