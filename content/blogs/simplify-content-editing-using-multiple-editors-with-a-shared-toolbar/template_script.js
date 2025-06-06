let editor = new FroalaEditor(".editable-section", {
  toolbarContainer: "#toolbar-container",
  toolbarInline: true,
  charCounterCount: false,
  wordCounterCount: false,
  toolbarVisibleWithoutSelection: true,
  toolbarButtons: [
    "bold",
    "italic",
    "underline",
    "strikeThrough",
    "|",
    "fontFamily",
    "fontSize",
    "color",
    "|",
    "paragraphFormat",
    "align",
    "formatOL",
    "formatUL",
    "outdent",
    "indent" // Added missing button from context
  ]
});