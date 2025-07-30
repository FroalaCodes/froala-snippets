Readme Creator

Custom Gem

**Show thinking**

Of course! Here is a README file in Markdown format for your project.

# Froala Find & Replace Plugin Demo

This repository contains a self-contained, interactive demo for the  **Froala WYSIWYG Editor's Find & Replace plugin** . It allows you to explore the plugin's methods, events, and configuration options in a live environment without any setup.

This repository contains all the code snippets from our video post, [How to Use The Froala Find and Replace Plugin](https://www.youtube.com/watch?v=P2dQIVmDOAY).

---

## Features ✨

* **Interactive Method Testing** : Use dedicated controls to call plugin methods like `findMatches()`, `replaceMatch()`, and `showPopup()`.
* **Dynamic Configuration** : Apply and test configuration options such as `enableMatchCase` and `enableMatchWholeWord` by re-initializing the editor on the fly.
* **Live Event Logging** : An event console logs plugin events (`onReplace`, `beforeClose`, etc.) in real-time as you interact with the editor.
* **Comprehensive Test Cases** : The editor is pre-loaded with text designed to test various search scenarios, including case-sensitive and whole-word matching.
* **Zero Setup Required** : Runs directly in any modern browser from a single HTML file with no need for a local server or build process.

---

## How to Run 🚀

Getting started is simple:

1. **Clone the Repository** :
   **Bash**

```
   git clone <repository-url>
```

   Alternatively, you can download the ZIP file and extract it.

1. **Open the HTML File** :
   Navigate to the project folder and open the `index.html` file in your web browser (e.g., Chrome, Firefox, Safari).

That's it! The interactive demo is now ready to use.

---

### How It Works 🛠️

The user interface is divided into two main panels:

1. **Controls Section (Left)** : This panel contains all the interactive elements to control the plugin.

* **Configuration Options** : Toggle settings and re-launch the editor to see their effect.
* **Search & Replace Methods** : Input text and use buttons to trigger find/replace actions.
* **Popup Controls** : Programmatically show or hide the Find & Replace popup.
* **Event Log** : See a real-time log of events triggered by the plugin.

1. **Editor Section (Right)** : This panel contains the Froala editor instance, pre-filled with sample text to test the plugin's functionality against different edge cases.

---

### Resources 📚

* [Froala Find &amp; Replace Plugin Documentation](https://froala.com/find-replace-plugin/)
* [Froala Editor Main Website](https://froala.com/)
