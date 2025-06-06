// Step 2: Define an Icon for the Button
FroalaEditor.SVG.export = "M15.293 5.293L12 8.586V2h-1v6.586L8.707 5.293 7.293 6.707 12 11.414l4.707-4.707zM18 11h-1v4H7v-4H6v5h12v-5z";
FroalaEditor.DefineIcon("export", { NAME: "Export", SVG_KEY: "export" });

// Step 4: Register the Custom Button
FroalaEditor.RegisterCommand("export", {
  // The title represents the label of the button.
  title: "Export from Markdown",
  // Defines this as a button.
  type: "button",
  // Associate the button with the Markdown plugin.
  plugin: "markdown",
  // This action should not be added to the undo stack.
  undo: false,
  // Make the button visible on mobile devices.
  showOnMobile: true,
  // The button is disabled by default.
  disabled: true,
  // Refresh the toolbar after the callback is executed.
  refreshAfterCallback: true,
  // Ensure the refresh method is always triggered.
  forcedRefresh: true,
  // Defines the function to enable/disable the button based on Markdown mode.
  refresh: function refresh($btn) {
    if (this.markdown.isEnabled()) {
      $btn[0].classList.remove("fr-disabled");
      $btn[0].setAttribute('aria-disabled', 'false');
    } else {
      $btn[0].classList.add("fr-disabled");
      $btn[0].setAttribute('aria-disabled', 'true');
    }
  },
  // Defines the action executed when the button is clicked.
  callback: function () {
    // 1. Retrieve Editor Content
    this.selection.save();
    this.commands.selectAll();
    const markdownContent = this.selection.text();
    this.selection.restore();

    // 2. Create a File with Markdown Content
    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    // 3. Download the File
    const a = document.createElement("a");
    a.href = url;
    a.download = "markdown.md";
    document.body.appendChild(a); // Append to body to ensure visibility
    a.click();
    document.body.removeChild(a); // Clean up
    URL.revokeObjectURL(url); // Release memory
  },
});