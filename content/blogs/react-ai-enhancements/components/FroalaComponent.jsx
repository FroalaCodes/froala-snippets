import React, { useEffect, useState } from 'react';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import FroalaEditorComponent from 'react-froala-wysiwyg';
import 'froala-editor/js/plugins.pkgd.min.js';
import configData from './config.js';

function FroalaComponent() {
    const [tags, setTags] = useState([]);
    const config = {
        filestackOptions: {
            uploadToFilestackOnly: true,
            filestackAPI: configData.filestackAPI,
            pickerOptions: {
              accept: ["image/*"],
              fromSources: ["local_file_system"],
            },
        },
        events: {
            'filestack.uploadedToFilestack': function (response) {
                if(response && response.filesUploaded[0].handle){
                    const fileHandle = response.filesUploaded[0].handle;
                    performEnhancements(fileHandle, this);
                }
                else{
                    console.error("Image upload failed, no URL found in response", response);
                }
            }
        },
        heightMin: 500,
        width: 1000
    };

    useEffect(() => {
        const filestackScript1 = document.createElement('script');
        filestackScript1.src = 'https://static.filestackapi.com/filestack-js/3.32.0/filestack.min.js';
        filestackScript1.async = true;
        document.body.appendChild(filestackScript1);

        const filestackScript2 = document.createElement('script');
        filestackScript2.src = 'https://static.filestackapi.com/filestack-drag-and-drop-js/1.1.1/filestack-drag-and-drop.min.js';
        filestackScript2.async = true;
        document.body.appendChild(filestackScript2);

        const filestackScript3 = document.createElement('script');
        filestackScript3.src = 'https://static.filestackapi.com/transforms-ui/2.x.x/transforms.umd.min.js';
        filestackScript3.async = true;
        document.body.appendChild(filestackScript3);

        const filestackStylesheet = document.createElement('link');
        filestackStylesheet.rel = 'stylesheet';
        filestackStylesheet.href = 'https://static.filestackapi.com/transforms-ui/2.x.x/transforms.css';
        document.head.appendChild(filestackStylesheet);

        return () => {
            document.body.removeChild(filestackScript1);
            document.body.removeChild(filestackScript2);
            document.body.removeChild(filestackScript3);
            document.head.removeChild(filestackStylesheet);
        };
    }, []);

    async function performEnhancements(fileHandle, editorInstance) {
        const policy = configData.policy;
        const signature = configData.signature;
        const autoTagURL = `https://cdn.filestackcontent.com/security=p:${policy},s:${signature}/tags/${fileHandle}`;
        const redEyeURL = `https://cdn.filestackcontent.com/redeye/${fileHandle}`;

        try {
            editorInstance.html.insert(
                `<img src="${redEyeURL}" alt="Enhanced Image" style="display: block; margin: 20px auto; width: 302px; height: 190.23px;" />`
            );

            const autoTagResult = await fetch(autoTagURL);
            const tagData = await autoTagResult.json();
            const tags = tagData?.tags?.auto;
            if(tags) {
                setTags(Object.entries(tags));
            }
            else {
                console.error("No tags found in response.");
            }
        }
        catch(error) {
            console.error("Error during enhancements:", error);
        }
    }

    return (
        <div>
            <div className="editor">
                <FroalaEditorComponent tag='textarea' config={config} />
            </div>
            <div id="image-tagging-results">
                <h3>Image Tagging Analysis:</h3>
                <ul>
                    {tags.map(([key, value], index) => (
                        <li key={index}>
                            {key}: {value}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default FroalaComponent;