// --- This is the main function that will be called after fetching languages ---
function initFroala(supportedLanguages) {

  // --- Step 4.1: Define the Translation toolbar button icon ---
  // Set Font Awesome 5 as the default toolbar icon library.
  FroalaEditor.ICON_DEFAULT_TEMPLATE = "font_awesome_5";

  // Set the Font Awesome's language symbol as icon for the "translate" button
  FroalaEditor.DefineIcon("translate", { NAME: "language" });

  // --- Step 4.2: Craft the Translation Toolbar Button ---
  FroalaEditor.RegisterCommand('translate', {
    // Button title.
    title: "Translate",
    // Set the button type to a dropdown.
    type: "dropdown",
    // Add the supported languages to the options.
    options: supportedLanguages,
    // Dropdown HTML.
    html: function html() {
      var c = '<ul class="fr-dropdown-list" role="presentation">';
      var options = FroalaEditor.COMMANDS.translate.options;
      for (var val in options) {
        if (options.hasOwnProperty(val) && val !== "Auto Detect") {
          c += `<li role="presentation"><a class="fr-command fr-title" tabIndex="-1" role="option" data-cmd="translate" data-param1="${options[val]}" title="${val}"> ${val} <span class="fr-sr-only">${val}</span></a></li>`;
        }
      }
      c += "</ul>";
      return c;
    },
    // Callback function.
    callback: async function callback(cmd, param1) {
      if (this.core.isEmpty()) return;

      this.commands.selectAll();
      const text = this.selection.text();
      const result = await translate(text, param1);
      
      // Check for successful translation
      if(result && result.translations && result.translations.translation) {
         this.html.insert(result.translations.translation, true);
      } else {
         console.error("Translation failed:", result);
         // Optionally, deselect text or show an error to the user
         this.selection.clear();
      }
    },
  });

  // --- Step 5: Initialize The Froala Editor ---
  new FroalaEditor("#editor", {
    wordCounterCount: false,
    charCounterMax: 5000,
    toolbarBottom: true,
    toolbarButtons: ["bold", "italic", "underline", "strikeThrough", "|", "formatOL", "formatUL", "|", "textColor", "backgroundColor", "fontSize", "|", "insertLink", "translate"],
  });
}