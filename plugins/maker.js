const { command } = require("../lib")
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fileType = require('file-type');
const FormData = require('form-data');
const fetch = require('node-fetch');

const MAX_FILE_SIZE_MB = 200;

// Upload media to Catbox
async function uploadToCatbox(buffer) {
  try {
    const type = await fileType.fromBuffer(buffer);
    const ext = type ? type.ext : 'bin';
    const bodyForm = new FormData();
    bodyForm.append("fileToUpload", buffer, file.${ext});
    bodyForm.append("reqtype", "fileupload");

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: bodyForm,
    });

    if (!res.ok) {
      throw new Error(Upload to Catbox failed with status ${res.status}: ${res.statusText});
    }

    const data = await res.text();
    return data;
  } catch (error) {
    console.error("Error uploading to Catbox:", error);
    throw new Error("Failed to upload media to Catbox.");
  }
}

// Process the media message
async function processMedia(message, apiUrlBase) {
  try {
    // Ensure media exists
    if (!message || !message.reply_message || !message.reply_message.mimetype) {
      throw new Error("No media found in the reply message.");
    }

    // Download the media as a buffer
    const mediaBuffer = await downloadMediaMessage(message.reply_message, 'buffer');

    if (!mediaBuffer) {
      throw new Error("Failed to download media.");
    }

    const fileSizeMB = mediaBuffer.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return "File size exceeds the limit of 200MB.";
    }

    // Upload the media to Catbox
    const catboxUrl = await uploadToCatbox(mediaBuffer);

    // Construct the API request URL
    const apiUrl = ${apiUrlBase}${encodeURIComponent(catboxUrl)};
    return apiUrl;
  } catch (error) {
    console.error("Error processing media:", error);
    return null;
  }
}

// Command implementation
command(
  {
    pattern: "8sted",
    desc: "Add a 'wasted' filter to your image.",
    fromMe: true,
    type: "image-processing",
  },
  async (message, match) => {
    try {
      // Check if reply contains media (image, sticker, video)
      if (!message.reply_message || !message.reply_message.mimetype) {
        return await message.reply("Please reply to a media message (image, video, or sticker) to process it.");
      }

      const apiUrlBase = "https://nikka-api.us.kg/tools/wasted?apiKey=nikka&url=";
      const apiUrl = await processMedia(message, apiUrlBase);

      if (!apiUrl) {
        return await message.reply("Failed to process the media. Please try again.");
      }

      // Send the processed image from URL
      await message.sendFromUrl(apiUrl);
    } catch (error) {
      console.error("Error in 'wasted' command:", error);
      await message.reply(error);
    }
  }
);
