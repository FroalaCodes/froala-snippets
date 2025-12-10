var editor = new FroalaEditor('#editor', {
    pluginsEnabled: ['codeView','codeBeautifier'],
    codeViewKeepActiveButtons: ['selectAll','moreMisc'],
    codeBeautifierOptions:{
        end_with_newline: true,
        indent_inner_html: true,
        extra_liners: "['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'ul', 'ol', 'table', 'dl']",
        brace_style: 'expand',
        indent_char: '\t',
        indent_size: 1,
        wrap_line_length: 0
    },
    heightMin: 450,
    width: 750
});