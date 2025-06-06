# Effortless Control Over Multiple Editors with a Shared Toolbar

This repository contains the code examples from the Froala blog post, "[Effortless Control Over Multiple Editors with Shared Toolbar](https://www.google.com/search?q=https://froala.com/blog/editor/effortless-control-over-multiple-editors-with-shared-toolbar)". It demonstrates how to use a single, centralized toolbar to manage multiple Froala WYSIWYG editor instances on a single page, creating a streamlined and consistent user experience.

---

## Features

* **Centralized Toolbar** : Control multiple editor instances from a single toolbar.
* **Consistent User Experience** : Ensures a uniform and predictable editing interface across all content sections.
* **Resource Efficiency** : Reduces DOM complexity and improves performance by using only one toolbar instance.
* **Simplified Maintenance** : Update the toolbar in one place to apply changes to all associated editors.
* **Templated Documents** : Create documents with both locked (non-editable) and editable sections for controlled content creation.

---

## Prerequisites

To run this example, you will need to include the Froala Editor in your project. You can do this by downloading it from the official website or using a CDN.

---

## How to Run

### 1. Create an HTML file:

* Set up the basic HTML structure and include the necessary Froala Editor CSS and JavaScript files.

### 2. Add the Code:

* Copy the HTML, JavaScript, and CSS snippets from this repository into your project. These snippets are taken directly from the accompanying [blog post](https://www.google.com/search?q=https://froala.com/blog/editor/effortless-control-over-multiple-editors-with-shared-toolbar).

### 3. Open in Browser:

* Open the HTML file in your web browser to see the shared toolbar in action.

---

### How It Works

The core of this functionality lies in the `toolbarContainer` option in the Froala Editor's configuration.

1. An empty `div` is created to serve as the container for the shared toolbar (e.g., `<div id="toolbar-container"></div>`).
2. Multiple `div` elements are designated as editable areas.
3. The Froala Editor is initialized on these editable elements, and the `toolbarContainer` option is set to the ID of the toolbar `div`.

This instructs all editor instances to use the same toolbar. When a user clicks into an editable area, the shared toolbar will control that specific editor.

---

### Code Example

Here is a basic implementation from the blog post:

#### HTML

**HTML**

```
<div id="toolbar-container"></div>

<div id="editor1" class="froala-editor"></div>
<div id="editor2" class="froala-editor"></div>
```

#### JavaScript

**JavaScript**

```
new FroalaEditor('.froala-editor', {
  // Set the toolbar container
  toolbarContainer: '#toolbar-container',
  
  // Define the toolbar buttons
  toolbarButtons: [
    'fullscreen', 'bold', 'italic', 'underline', 'strikeThrough',
    'subscript', 'superscript', '|', 'fontFamily', 'fontSize', 'color',
    'inlineStyle', 'paragraphStyle', '|', 'paragraphFormat', 'align',
    'formatOL', 'formatUL', 'outdent', 'indent', 'quote', '-',
    'insertLink', 'insertImage', 'insertVideo', 'insertFile',
    'insertTable', '|', 'emoticons', 'specialCharacters', 'insertHR',
    'selectAll', 'clearFormatting', '|', 'print', 'help', 'html', '|',
    'undo', 'redo', 'trackChanges', 'markdown'
  ]
});
```

---

### Resources

* Read our full article, [Effortless Control Over Multiple Editors with Shared Toolbar](https://www.google.com/search?q=https://froala.com/blog/editor/effortless-control-over-multiple-editors-with-shared-toolbar), for a detailed explanation and more advanced use cases.
* [Froala Editor Documentation](https://froala.com/wysiwyg-editor/docs/)
* [MDN Guide on Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/Performance)
