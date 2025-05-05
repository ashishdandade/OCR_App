import React, { useState, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import "./OCRApp.css";

const OCRApp = () => {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState("English");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    setFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const base64 = await convertToBase64(file);
      const systemPrompt = `convert the provided image into Markdown format in ${language}. Ensure that all content from the page is included, such as headers, footers, subtexts, images (with alt text if possible), tables, and any other elements.

  Requirements:

  - Output Only Markdown: Return solely the Markdown content without any additional explanations or comments.
  - No Delimiters: Do not use code fences or delimiters like \`\`\`markdown.
  - Complete Content: Do not omit any part of the page, including headers, footers, and subtext.
   `;
      const response = await axios.post(
        "https://api.together.xyz/v1/chat/completions",
        {
          model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: systemPrompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMarkdown(response.data.choices[0].message.content);
    } catch (error) {
      console.error("OCR failed:", error);
      setMarkdown("Something went wrong.");
    }

    setLoading(false);
  };
  console.log(markdown);
  return (
    <div className="ocr-container">
      <h1 className="ocr-title">OCR: Document to Markdown</h1>

      <div className="ocr-grid">
        <div className="ocr-left">
          <div
            {...getRootProps()}
            className={`ocr-dropzone ${isDragActive ? "active" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="ocr-dropzone-text">
              <p className="ocr-upload-text">Upload an image</p>
              <p>or drag and drop</p>
            </div>
          </div>

          <div className="ocr-note">
            <p>PDF support coming soon!</p>
            <p>
              Need an example image?{" "}
              <a href="#" className="ocr-link">
                Try ours
              </a>
            </p>
          </div>

          {preview && (
            <div className="ocr-preview">
              <h2>Image Preview:</h2>
              <img src={preview} alt="Preview" className="ocr-image" />
            </div>
          )}
        </div>

        <div className="ocr-right">
          <div className="ocr-language-selector">
            <label>Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="ocr-button"
          >
            {loading ? "Processing..." : "Convert"}
          </button>
          {markdown && (
            <div className="ocr-markdown">
              <h2>Markdown:</h2>
              <div className="ocr-markdown-box">{markdown}</div>
              {/* console.log({markdown}); */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRApp;
