# HTML to WYSIWYG Example

This repository uses Froala's Code View feature to allow for HTML editing and to facilitate the migration of legacy HTML content.

---

## Features

- **Code View**: Shift between HTML and WYSIWYG modes. See how your code will look after writing or editing HTML by switching to WYSIWYG mode.
- **Table and Content Formatting**: Easily alter the look of various HTML content by leveraging the buttons on the toolbar instead of typing everything.
- **File Uploads**: Include images from legacy HTML content naturally using a robust file picker.

---

## Prerequisites

To run this example, you will need:

1. A React application.
2. Froala Editor.
3. CodeMirror (version 5)
4. A Filestack API key (optional for file uploads).

---

## How to Run

### 1. Create your application directory or use an existing React project

 
### 2. Use the FroalaComponent in your app

1. Install all necessary CodeView files by typing the following into your CMD/PowerShell:
   ```
   npm install codemirror@5
   ```
2. Clone the repository files into your project.

### 3. Run the application

---

### How It Works

1. Click the code view button on the editor.
2. Copy and paste HTML code onto the editor's code view editor.
3. Switch back to WYSIWYG mode to see the rendered output.
4. If your code uses legacy tags like <center>, the editor will automatically remove them. To apply the modern syntax, use the WYSIWYG view (i.e., highlight the content and click the "center" alignment icon.).


---

### Resources

- [Froala CodeView Reference](https://froala.com/wysiwyg-editor/docs/plugins/code-view-plugin/)

---

### License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute it.
