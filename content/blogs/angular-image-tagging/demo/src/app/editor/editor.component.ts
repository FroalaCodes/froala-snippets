import { Component } from '@angular/core';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import 'froala-editor/js/plugins.pkgd.min.js';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FroalaEditorModule, FroalaViewModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent{
  private froalaEditor: any;
  public editorContent = "Filestack is a simple file uploader & powerful APIs to upload, transform & deliver any file into your app.";
  public options: Object = {
    heightMin: 300,
    filestackOptions: {
      uploadToFilestackOnly: true,
      filestackAPI: "YourFilestackAPIKey",
      pickerOptions: {
        accept: ['image/*'],
        fromSources: ['local_file_system']
      }
    },
    events: {
      'filestack.uploadedToFilestack': (event: any) => {
        const fileHandle = event.filesUploaded[0].handle;
        this.performImageTagging(fileHandle);
        console.log("Callback is triggered for upload event",)
      },
      'filestack.filestackPickerOpened': () => {
        console.log("Callback is triggered for open picker event",)
      },
      'filestack.filestackPickerClosed': () => {
        console.log("Callback is triggered for close picker event",)
      },
      'filestack.uploadFailedToFilestack': () => {
        console.log("Callback is triggered for upload failure",)
      },
    },
  };

  // Perform image tagging after file upload
  async performImageTagging(fileHandle: string) {
    const policy = 'YourPolicy'; 
    const signature = 'YourSignature'; 
    const imageTaggingURL = `https://cdn.filestackcontent.com/security=p:${policy},s:${signature}/tags/${fileHandle}`;

    try {
      const result = await this.scanImage(imageTaggingURL);
      const tags = result?.tags?.auto;
  
      if (tags) {
        // Loop through the keys and values of tags dynamically
        let tagsList = '';
        for (const [key, value] of Object.entries(tags)) {
          // Create a displayable list item for each tag
          tagsList += `<li>${key}: ${value}</li>`;
        }
        
        console.log("Image tagging result:", result);
        const resultElement = document.getElementById('image-tagging-results');
        if (resultElement) {
          resultElement.innerHTML = `<p>Image Tagging Analysis:</p><ul>${tagsList}</ul>`;
        }
        else {
          console.error("Element for displaying tags not found.");
        }
      }
      else {
        console.error("Empty tags.");
      }
    }
    catch (error) {
        console.error("Error during image tagging:", error);
    }
  }

  // Function to call the Filestack Image Tagging API
  async scanImage(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch image tagging results.");
    }
    const data = await response.json();
    return data;
  }
}