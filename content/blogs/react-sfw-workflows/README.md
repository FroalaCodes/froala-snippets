# React SFW Checker Using Filestack Workflows

This demonstrates how to use Froala, Filestack Workflows, and React to detect unsafe content in images. It works in conjunction with the Filestack Dashboard, where you'll create your workflow and create a webhook to your own endpoint (PHP, Node.js, etc.). In this case, Beeceptor was used as a mockup webhook endpoint.

---

## Features

- **Image Upload**: Upload images using the integrated Filestack API in the Froala WYSIWYG editor.
- **SFW Checker**: Automatically scan images for unsafe content.
- **Filestack Workflow**: Automate and chain tasks for an easier development time.

---

## Prerequisites

To run this example, you will need:

1. A valid **Filestack API Key**.
2. A Filestack account with Filestack Intelligence, webhooks, and Workflows enabled.
3. A webhook endpoint.

---

## How to Run

### 1. Create a React application:   

- Install Froala using: `npm install react-froala-wysiwyg`
 
### 2. Download the necessary files

- Paste the "components" folder and the "App.js" file into your "src" folder.
- Replace the placeholders for the Filestack API key and the Workflow ID.

### 3. Run the application

Type in `npm start` in your CLI.

---

### How It Works

1. Click the **"Filestack icon"**.
2. Select an image to upload.
3. Upload the image and wait for the image to be placed in the editor.
4. Proceed to your webhook endpoint and get the JSON payload from the uploaded image from Filestack. From there, you should be able to see whether the image is safe for work or not (sfw: true).

---

### Notes

- Ensure your Filestack **API Key** is valid.
- For production, review security settings, keep keys private and on your server, and ensure proper optimization.

---

### Resources

- [Filestack Workflows Reference](https://www.filestack.com/docs/workflows/overview/)
- [Filestack Webhooks Reference](https://www.filestack.com/docs/api/webhooks/)
- [Filestack SFW Checker API Reference](https://www.filestack.com/docs/transformations/intelligence/sfw/)

---

### License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute it.
