new FroalaEditor('#froala-editor',{
    toolbarButtons: ['wirisEditor', 'wirisChemistry'],
    quickInsertButtons: ['image', 'table', 'wirisEditor', 'wirisChemistry'],
    htmlAllowedTags: ['.*'],
    htmlAllowedAttrs: ['.*'],
    htmlAllowedEmptyTags: ['mprescripts', 'none', 'textarea', 'a', 'iframe', 'object', 'video', 'style', 'script', '.fa', '.fr-emoticon', '.fr-inner', 'path', 'line', 'hr'],
    heightMin: 500,
    heightMax: 1000
});