// JavaScript for initial example
new FroalaEditor('.froala-editor', {
  toolbarContainer: '#toolbar-container',
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