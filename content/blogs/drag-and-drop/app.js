var dragCallback = function(e) {
    e.dataTransfer.setData('Text', this.id);
};

// For Firefox to work.
document.querySelector('#drag-signature').addEventListener('dragstart', dragCallback);
document.querySelector('#drag-footer').addEventListener('dragstart', dragCallback);

new FroalaEditor('div#froala-editor', {
    events: {
        initialized: function() {
            var editor = this;

            editor.events.on('drop', function(dropEvent) {
            // Focus at the current posisiton.
            editor.markers.insertAtPoint(dropEvent.originalEvent);
            var $marker = editor.$el.find('.fr-marker');
            $marker.replaceWith(FroalaEditor.MARKERS);
            editor.selection.restore();

            // Save the current position into the undo stack.
            if (!editor.undo.canDo()) editor.undo.saveStep();

            // Insert HTML.
            if(dropEvent.originalEvent.dataTransfer.getData('Text') == 'drag-signature') {
                const signature = `
                    <table style="font-family:Inter, Arial, sans-serif; font-size:14px; line-height:1.4; color:#333;">
                        <tr>
                            <td style="vertical-align:middle;">
                                <img src="sample-logo.jpeg" alt="Company Logo" width="200" style="border-radius:8px;">
                            </td>
                        </tr>
                        <tr>
                            <td style="vertical-align:middle; padding-left:20px; padding-top: 20px; padding-bottom: 20px; ">
                                <p style="margin:0; font-weight:bold; font-size:16px;">John Doe</p>
                                <p style="margin:0; color:#555;">Full-stack Developer</p>
                                <p style="margin:0; color:#777;">+1 (555) 123-4567</p>
                            </td>
                        </tr>
                    </table>
                `;
                editor.html.insert(signature);
            }
            else {
                const footer = `
                    <hr style="margin:30px 0; border:none; border-top:1px solid #ddd;">

                    <p style="font-size:13px; color:#555; line-height:1.6; text-align:center;">
                        You’re receiving this email because you signed up for updates from <strong>Example Company</strong>.
                        <br>
                        If you’d like to stop receiving these messages, you can 
                        <a href="#" style="color:#dd5526; text-decoration:none;">unsubscribe here</a>.
                    </p>

                    <p style="font-size:12px; color:#777; text-align:center; margin-top:10px;">
                        © 2025 Example Company, 123 Business Street, Metro City, Country.<br>
                        All rights reserved.
                    </p>
                `;
                editor.html.insert(footer);
            }

            // Save the changes into the undo stack.
            editor.undo.saveStep();

            // Stop event propagation.
            dropEvent.preventDefault();
            dropEvent.stopPropagation();

            // Firefox show cursor.
            if(editor.core.hasFocus() && editor.browser.mozilla) {
                editor.events.disableBlur();
                setTimeout(function() {
                    editor.$el.blur().focus();
                    editor.events.enableBlur();
                }, 0);
            }

            return false;
            }, true);
        }
    },
    height: 500
})