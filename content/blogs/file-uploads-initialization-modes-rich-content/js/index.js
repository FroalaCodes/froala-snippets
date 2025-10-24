new FroalaEditor('#froala-editor',{
    // Uncomment the line below to enable document-ready mode
    // documentReady: true,
    filestackOptions: {
        filestackAPI: 'YourAPIKey', // Replace with your own API key
        uploadToFilestackOnly: true,
        pickerOptions: {
            accept: ['image/*'],
            fromSources: ['local_file_system']
        }
    },
    // Comment the toolbarButtons lines when enabling document-ready mode to see the document-optimal features
    toolbarButtons: {
        'moreRich': {
            'buttons': ['openFilePickerImageOnly', 'openFilePickerVideoOnly', 'openFilePicker', 'insertLink', 'insertTable', 'emoticons', 'specialCharacters', 'insertHR'],
            'buttonsVisible': 3
        },

        'moreText': {
            'buttons': ['bold', 'italic', 'underline', 'fontFamily', 'fontSize', 'textColor', 'backgroundColor', 'clearFormatting']
        },

        'moreParagraph': {
            'buttons': ['alignLeft', 'alignCenter', 'formatOLSimple', 'alignRight', 'alignJustify', 'formatOL', 'formatUL', 'paragraphFormat', 'paragraphStyle', 'lineHeight', 'outdent', 'indent', 'quote']
        },
        'moreMisc': {
            'buttons': ['undo', 'redo', 'fullscreen', 'selectAll', 'html', 'help'],
            'align': 'right',
            'buttonsVisible': 2
        }
    },
    events: {
        'filestack.uploadedToFilestack': function (response) {
            // For further file processing, use this event
            console.log("Callback is triggered for upload to Filestack ",);
        },
        'filestack.filestackPickerOpened': function (response) {
            console.log("Callback is triggered for picker opened ",)
        },
        'filestack.filestackPickerClosed': function (response) {
            console.log("Callback is triggered for picker closed ",)
        },
        'filestack.uploadFailedToFilestack': function (response) {
            console.log(response);
        },
    },
    heightMin: 500,
    heightMax: 1000
});