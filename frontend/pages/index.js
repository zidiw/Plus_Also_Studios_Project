import {useState, useRef} from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const REQUEST_TIMEOUT_MS = 30000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ERROR_MESSAGES = {
    MISSING_INPUT: "Please provide a prompt.",
    TIMEOUT: "The server did not respond in time. Please try again.",
    INVALID_FILE_TYPE: "Invalid file type. Please upload a jpeg, png, gif, or webp image.",
    FILE_SIZE_LIMIT: "Image size must be under 10MB.",
    DOWNLOAD_ERROR: "Failed to download image.",
    GENERATE_IMAGE_ERROR: "Failed to generate image.",
    GENERIC_ERROR: (message) => `Error: ${message}`
};

export default function Home() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [prompt, setPrompt] = useState("");
    const [aspect, setAspect] = useState("1:1");
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef(null);

    // Handle file selection and validation
    const handleImageFile = (file) => {
        fileInputRef.current.value = null;
        if (!VALID_IMAGE_TYPES.includes(file.type)) {
            alert(ERROR_MESSAGES.INVALID_FILE_TYPE);
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert(ERROR_MESSAGES.FILE_SIZE_LIMIT);
            return;
        }
        setImage(file);
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setPreview(URL.createObjectURL(file));
        setFileName(file.name);
    };

    // Handle drag-and-drop image upload
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleImageFile(file);
    };

    // Handle file input change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    };

    const handleSubmit = async () => {
        if (!prompt) {
            alert(ERROR_MESSAGES.MISSING_INPUT);
            return;
        }

        setLoading(true);
        setGeneratedImage(null);

        const formData = createFormData();
        const {controller, timeoutId} = setupRequestTimeout();

        try {
            const imageUrl = await sendGenerateRequest(formData, controller);
            setGeneratedImage(imageUrl);
        } catch (err) {
            const message = err.name === "AbortError"
                ? ERROR_MESSAGES.TIMEOUT
                : ERROR_MESSAGES.GENERIC_ERROR(err.message);
            alert(message);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };

    const createFormData = () => {
        const formData = new FormData();
        if (image) {
            formData.append("image", image);
        }
        formData.append("prompt", prompt);
        formData.append("aspect_ratio", aspect);
        return formData;
    };

    const setupRequestTimeout = () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, REQUEST_TIMEOUT_MS);
        return {controller, timeoutId};
    };

    const sendGenerateRequest = async (formData, controller) => {
        const response = await fetch(`${apiUrl}/generate`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
        });

        /** @type {{ generated_image_url?: string; error?: string }} */
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || ERROR_MESSAGES.GENERATE_IMAGE_ERROR);
        }

        return data.generated_image_url;
    };

    const handleDownloadImage = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(ERROR_MESSAGES.DOWNLOAD_ERROR);
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "generated.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert(ERROR_MESSAGES.GENERIC_ERROR(err.message));
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-200 flex flex-col items-center justify-center p-6 space-y-6">
            <h1 className="text-4xl font-extrabold text-slate-800">AI Image Generator</h1>

            <div className="text-sm text-slate-600">Maximum image size: 10MB</div>
            <div className="text-sm text-slate-600">Allowed file types: JPEG, PNG, GIF, WEBP</div>

            {/* Image upload area with drag-and-drop */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="w-full max-w-lg h-52 border-4 border-dashed border-slate-300 flex items-center justify-center rounded-2xl bg-white shadow-inner hover:shadow-lg transition-shadow duration-300"
            >
                {preview && typeof preview === 'string' && preview.length > 0 ? (
                    <img src={preview} alt="preview" className="h-full object-contain rounded-xl"/>
                ) : (
                    <span className="text-slate-400 text-lg">Drag & Drop your image here (optional)</span>
                )}
            </div>

            {/* Button to open file input */}
            <button
                onClick={() => fileInputRef.current.click()}
                className="bg-slate-200 px-6 py-2 rounded-full hover:bg-slate-300 transition"
            >
                Choose an file
            </button>
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            {fileName && <div className="text-sm text-slate-700">Selected file: {fileName}</div>}

            <div className="w-full max-w-lg">
                <label htmlFor="prompt" className="block mb-2 text-slate-700 font-medium">
                    Describe what you want the AI to generate:
                </label>
                <textarea
                    id="prompt"
                    placeholder="Enter a prompt"
                    value={prompt}
                    onChange={(e) => {
                        if (e.target.value.length <= 1000) setPrompt(e.target.value);
                    }}
                    rows={5}
                    className="w-full rounded-2xl px-4 py-3 border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-slate-400 resize-none transition"
                />
                <div className="text-right text-sm text-slate-500 mt-1">{prompt.length}/1000</div>
            </div>

            {/* Dropdown for selecting an aspect ratio */}
            <div className="w-full max-w-lg">
                <label htmlFor="aspect" className="block mb-2 text-slate-700 font-medium">
                    Select aspect ratio:
                </label>
                <select
                    id="aspect"
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-slate-100 transition duration-300 ease-in-out"
                >
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="3:2">3:2</option>
                    <option value="2:3">2:3</option>
                    <option value="4:5">4:5</option>
                    <option value="5:4">5:4</option>
                    <option value="9:16">9:16</option>
                    <option value="3:4">3:4</option>
                    <option value="4:3">4:3</option>
                </select>
            </div>

            {/* Submit button */}
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
            >
                {loading ? "Generating..." : "Submit"}
            </button>

            {/* Display a generated image and download button */}
            {generatedImage && typeof generatedImage === 'string' && generatedImage.length > 0 && (
                <div className="w-full max-w-lg flex flex-col items-center space-y-4">
                    <img src={generatedImage} alt="Generated" className="w-full rounded-xl shadow-lg"/>
                    <button
                        onClick={() => handleDownloadImage(generatedImage)}
                        className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition"
                    >
                        Download Image
                    </button>
                </div>
            )}
        </div>
    );
}